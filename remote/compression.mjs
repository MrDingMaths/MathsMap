// Compresses text responses for remote (tunnelled) requests only. The tunnel
// carries every byte over this PC's upload link; JSON, scripts and styles shrink
// four to five times. Local requests pass unchanged, so exports and checks see
// exactly what they did before. See docs/studio-remote-access.md.
import zlib from 'node:zlib';
import { isLoopbackHost } from './access-guard.mjs';

const COMPRESSIBLE = /^(?:text\/|application\/(?:json|javascript|xml|manifest\+json)|image\/svg\+xml)/i;

export function chooseEncoding(header = '') {
  const value = String(header);
  return /\bbr\b/.test(value) ? 'br' : /\bgzip\b/.test(value) ? 'gzip' : null;
}

export function createRemoteCompression() {
  return (req, res, next) => {
    const encoding = chooseEncoding(req.headers['accept-encoding']);
    if (isLoopbackHost(req.headers.host) || !encoding || req.method === 'HEAD') return next();
    const write = res.write.bind(res), end = res.end.bind(res), writeHead = res.writeHead.bind(res);
    let stream = null, decided = false;
    const decide = () => {
      if (decided) return;
      decided = true;
      const type = String(res.getHeader('content-type') ?? '');
      if (res.headersSent || res.getHeader('content-encoding') || !COMPRESSIBLE.test(type) || [204, 206, 304].includes(res.statusCode)) return;
      stream = encoding === 'br'
        ? zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } })
        : zlib.createGzip({ level: 6 });
      res.setHeader('Content-Encoding', encoding);
      res.removeHeader('Content-Length');
      res.setHeader('Vary', 'Accept-Encoding');
      stream.on('data', chunk => write(chunk));
      stream.on('end', () => end());
      // Piped static files wait for 'drain' once write() returns false; the
      // compressor drains, not the response, so pass its signal on or they stall.
      stream.on('drain', () => res.emit('drain'));
    };
    // Defer explicit headers until the first body write so the encoding can still be set.
    // Node's own implicit headers also call writeHead, after the decision.
    res.writeHead = (status, reason, headers) => {
      if (decided) return writeHead(status, reason, headers);
      if (typeof reason === 'object' && reason) { headers = reason; reason = undefined; }
      res.statusCode = status;
      if (reason) res.statusMessage = reason;
      if (Array.isArray(headers)) for (let i = 0; i < headers.length; i += 2) res.setHeader(headers[i], headers[i + 1]);
      else for (const [key, value] of Object.entries(headers ?? {})) res.setHeader(key, value);
      return res;
    };
    res.write = (chunk, enc, callback) => {
      decide();
      return stream ? stream.write(chunk, enc, callback) : write(chunk, enc, callback);
    };
    res.end = (chunk, enc, callback) => {
      decide();
      if (!stream) return end(chunk, enc, callback);
      if (typeof chunk === 'function') { callback = chunk; chunk = undefined; }
      if (typeof enc === 'function') { callback = enc; enc = undefined; }
      if (callback) res.once('finish', callback);
      if (chunk != null) stream.end(chunk, enc); else stream.end();
      return res;
    };
    next();
  };
}

export function remoteCompressionPlugin() {
  return { name: 'remote-compression', configureServer(server) { server.middlewares.use(createRemoteCompression()); } };
}
