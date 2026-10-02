import { captureSnapshot, publishSkill } from './publication.mjs';
import { buildManifest } from '../build-manifest.mjs';

export function contentWritePlugin({ root = process.cwd(), rebuildManifest = () => buildManifest({ rootDir: root }) } = {}) {
  return { name: 'content-write', configureServer(server) { server.middlewares.use(createContentMiddleware({ root, rebuildManifest })); } };
}
export function createContentMiddleware({ root, rebuildManifest = () => buildManifest({ rootDir: root }) }) {
  return async (req, res, next) => {
    const match = req.url && /^\/_admin\/(snapshot|content|quizzes)\/([^/?]+)(?:\?.*)?$/.exec(req.url);
    if (!match) return next();
    const reply = (status, value) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(value)); };
    try {
      const skillId = decodeURIComponent(match[2]);
      if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(skillId)) return reply(400, { error: 'Invalid skill ID' });
      if (match[1] === 'snapshot' && req.method === 'GET') {
        const { content, quiz, expected } = await captureSnapshot(root, skillId);
        return reply(200, { content, quiz, expected });
      }
      if (req.method !== 'PUT' || match[1] === 'snapshot') return reply(405, { error: 'Method not allowed' });
      const chunks = [];
      let byteLength = 0;
      for await (const chunk of req) {
        byteLength += chunk.length;
        if (byteLength > 4 * 1024 * 1024) return reply(413, { error: 'Content exceeds the save size limit' });
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reply(400, { error: 'Invalid JSON' }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400, { error: 'Invalid save envelope' });
      const options = { expected: body.expected };
      if (!Object.hasOwn(body, 'value')) return reply(428, { error: 'Reload this skill before saving: a revision envelope is required' });
      // Missing revisions are rejected, including older clients. Reading the current
      // revision at save time would incorrectly authorize overwriting newer edits.
      options[match[1] === 'content' ? 'candidateContent' : 'candidateQuiz'] = body.value;
      const { expected } = await publishSkill(root, skillId, options);
      let manifestWarning;
      try { await rebuildManifest(); } catch (error) { manifestWarning = 'Saved, but manifest refresh failed: ' + error.message; console.error('[content-write]', manifestWarning); }
      reply(200, { ok: true, expected, ...(manifestWarning ? { manifestWarning } : {}) });
    } catch (error) { reply(error.status ?? 500, { error: error.message }); }
  };
}
