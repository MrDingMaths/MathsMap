// Dev-server config for remote Studio access. It wraps the main config without
// editing it, because vite.config.js is hash-bound by booklet export evidence.
// Settings come from .env.local (ignored by Git); see docs/studio-remote-access.md.
import { defineConfig, loadEnv } from 'vite';
import base from '../vite.config.js';
import { remoteAccessGuardPlugin } from './access-guard.mjs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['STUDIO_', 'CF_ACCESS_']);
  const publicHost = env.STUDIO_PUBLIC_HOST?.trim();
  return {
    ...base,
    plugins: [remoteAccessGuardPlugin({ publicHost, teamDomain: env.CF_ACCESS_TEAM_DOMAIN, audience: env.CF_ACCESS_AUD?.trim() }), ...base.plugins],
    server: { ...base.server, ...(publicHost ? { allowedHosts: [publicHost] } : {}) },
  };
});
