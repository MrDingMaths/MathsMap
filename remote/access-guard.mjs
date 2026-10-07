// Guards the dev server when it is published through a Cloudflare Tunnel.
// Local requests pass unchanged. Any other host must carry a Cloudflare Access
// token that verifies against the team's signing keys; a missing or incomplete
// configuration refuses every non-local request. See docs/studio-remote-access.md.
import { createPublicKey, createVerify } from 'node:crypto';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);
const KEY_REFRESH_MS = 60_000;

export function hostName(header = '') {
  const value = String(header).trim().toLowerCase();
  if (value.startsWith('[')) return value.slice(0, value.indexOf(']') + 1);
  return value.split(':')[0];
}

export const isLoopbackHost = header => LOOPBACK.has(hostName(header));

export const normaliseTeamDomain = value => String(value ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');

const decode = part => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

export async function verifyAccessToken(token, { teamDomain, audience, getKey, now = Date.now() }) {
  const parts = String(token ?? '').split('.');
  if (parts.length !== 3 || parts.some(part => !part)) throw Error('Access token missing or malformed');
  let header, payload;
  try { header = decode(parts[0]); payload = decode(parts[1]); } catch { throw Error('Access token malformed'); }
  if (header.alg !== 'RS256' || !header.kid) throw Error('Access token algorithm not accepted');
  const key = await getKey(header.kid);
  if (!key) throw Error('Access token signing key unknown');
  if (!createVerify('RSA-SHA256').update(parts[0] + '.' + parts[1]).verify(key, Buffer.from(parts[2], 'base64url'))) throw Error('Access token signature invalid');
  if (payload.iss !== 'https://' + normaliseTeamDomain(teamDomain)) throw Error('Access token issuer mismatch');
  if (![payload.aud].flat().includes(audience)) throw Error('Access token audience mismatch');
  const seconds = now / 1000;
  if (typeof payload.exp !== 'number' || payload.exp <= seconds) throw Error('Access token expired');
  if (typeof payload.nbf === 'number' && payload.nbf > seconds + 60) throw Error('Access token not yet valid');
  return payload;
}

// Signing keys rotate. An unknown key id triggers one refetch per minute at most.
export function createAccessKeyFetcher(teamDomain, { fetchImpl = fetch, now = Date.now } = {}) {
  const keys = new Map();
  let fetchedAt = -Infinity, loading = null;
  const load = async () => {
    const response = await fetchImpl('https://' + normaliseTeamDomain(teamDomain) + '/cdn-cgi/access/certs');
    if (!response.ok) throw Error('Access signing keys unavailable: ' + response.status);
    const body = await response.json();
    keys.clear();
    for (const jwk of body.keys ?? []) if (jwk.kid) keys.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
    fetchedAt = now();
  };
  return async kid => {
    if (!keys.has(kid) && now() - fetchedAt >= KEY_REFRESH_MS) {
      loading ??= load().finally(() => { loading = null; });
      await loading;
    }
    return keys.get(kid) ?? null;
  };
}

export function createAccessGuard({ publicHost, teamDomain, audience, getKey } = {}) {
  const host = hostName(publicHost), team = normaliseTeamDomain(teamDomain);
  const configured = Boolean(host && team && audience);
  const keyFor = configured ? getKey ?? createAccessKeyFetcher(team) : null;
  return async (req, res, next) => {
    if (isLoopbackHost(req.headers.host)) return next();
    const refuse = () => { res.statusCode = 403; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end('Forbidden'); };
    if (!configured || hostName(req.headers.host) !== host) return refuse();
    try { await verifyAccessToken(req.headers['cf-access-jwt-assertion'], { teamDomain: team, audience, getKey: keyFor }); }
    catch { return refuse(); }
    next();
  };
}

export function remoteAccessGuardPlugin(options) {
  return { name: 'remote-access-guard', configureServer(server) { server.middlewares.use(createAccessGuard(options)); } };
}
