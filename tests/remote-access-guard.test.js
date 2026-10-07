import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { hostName, isLoopbackHost, verifyAccessToken, createAccessKeyFetcher, createAccessGuard } from '../remote/access-guard.mjs';

const TEAM = 'example-team.cloudflareaccess.com', AUD = 'audience-tag', HOST = 'studio.example.test';
const pair = generateKeyPairSync('rsa', { modulusLength: 2048 }), other = generateKeyPairSync('rsa', { modulusLength: 2048 });
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Date.UTC(2026, 9, 8), seconds = now / 1000;
function token({ header = {}, payload = {}, key = pair.privateKey } = {}) {
  const body = encode({ alg: 'RS256', kid: 'k1', ...header }) + '.' + encode({ iss: 'https://' + TEAM, aud: [AUD], exp: seconds + 600, ...payload });
  return body + '.' + createSign('RSA-SHA256').update(body).sign(key).toString('base64url');
}
const getKey = async kid => kid === 'k1' ? pair.publicKey : null;
const verify = value => verifyAccessToken(value, { teamDomain: TEAM, audience: AUD, getKey, now });

test('host names ignore ports and recognise loopback only', () => {
  assert.equal(hostName('Studio.Example.test:443'), 'studio.example.test');
  assert.equal(hostName('[::1]:5173'), '[::1]');
  for (const host of ['localhost:5173', '127.0.0.1:5173', '[::1]:5173']) assert.equal(isLoopbackHost(host), true);
  for (const host of ['studio.example.test', 'localhost.example.test', '127.0.0.1.example.test', '', undefined]) assert.equal(isLoopbackHost(host), false);
});

test('a valid Access token passes and a string audience is accepted', async () => {
  assert.equal((await verify(token())).iss, 'https://' + TEAM);
  await verify(token({ payload: { aud: AUD } }));
});

test('invalid Access tokens are refused', async () => {
  const cases = {
    missing: undefined,
    malformed: 'a.b',
    'wrong audience': token({ payload: { aud: ['someone-else'] } }),
    'wrong issuer': token({ payload: { iss: 'https://attacker.cloudflareaccess.com' } }),
    expired: token({ payload: { exp: seconds - 1 } }),
    'no expiry': token({ payload: { exp: undefined } }),
    'not yet valid': token({ payload: { nbf: seconds + 3600 } }),
    'other signer': token({ key: other.privateKey }),
    'unknown key': token({ header: { kid: 'k2' } }),
    'unsigned algorithm': token({ header: { alg: 'none' } }),
    'symmetric algorithm': token({ header: { alg: 'HS256' } }),
  };
  const tampered = token().split('.'); tampered[1] = encode({ iss: 'https://' + TEAM, aud: [AUD], exp: seconds + 99999 });
  cases['tampered payload'] = tampered.join('.');
  for (const [name, value] of Object.entries(cases)) await assert.rejects(verify(value), undefined, name);
});

test('signing keys are fetched once, and unknown ids refetch at most once a minute', async () => {
  let calls = 0, clock = 0;
  const fetchImpl = async url => { calls++; assert.equal(url, 'https://' + TEAM + '/cdn-cgi/access/certs'); return { ok: true, json: async () => ({ keys: [{ ...pair.publicKey.export({ format: 'jwk' }), kid: 'k1' }] }) }; };
  const fetcher = createAccessKeyFetcher('https://' + TEAM + '/', { fetchImpl, now: () => clock });
  assert.ok(await fetcher('k1')); assert.ok(await fetcher('k1')); assert.equal(calls, 1);
  assert.equal(await fetcher('k2'), null); assert.equal(calls, 1);
  clock = 61_000; assert.equal(await fetcher('k2'), null); assert.equal(calls, 2);
});

async function request(guard, headers) {
  const res = { statusCode: 200, setHeader() {}, end() { this.ended = true; } }; let passed = false;
  await guard({ headers }, res, () => { passed = true; });
  return passed ? 'next' : res.statusCode;
}

test('the guard passes local requests and requires a token for the public host', async () => {
  const guard = createAccessGuard({ publicHost: HOST, teamDomain: TEAM, audience: AUD, getKey });
  // Token expiry uses the real clock inside the guard.
  const live = token({ payload: { exp: Date.now() / 1000 + 600 } });
  assert.equal(await request(guard, { host: '127.0.0.1:5173' }), 'next');
  assert.equal(await request(guard, { host: HOST, 'cf-access-jwt-assertion': live }), 'next');
  assert.equal(await request(guard, { host: HOST }), 403);
  assert.equal(await request(guard, { host: HOST, 'cf-access-jwt-assertion': token({ key: other.privateKey }) }), 403);
  assert.equal(await request(guard, { host: 'other.example.test', 'cf-access-jwt-assertion': live }), 403);
  assert.equal(await request(guard, {}), 403);
});

test('an unconfigured guard refuses every non-local request', async () => {
  for (const options of [undefined, { publicHost: HOST }, { publicHost: HOST, teamDomain: TEAM }, { teamDomain: TEAM, audience: AUD }]) {
    const guard = createAccessGuard(options);
    assert.equal(await request(guard, { host: 'localhost:5173' }), 'next');
    assert.equal(await request(guard, { host: HOST, 'cf-access-jwt-assertion': token() }), 403);
  }
});
