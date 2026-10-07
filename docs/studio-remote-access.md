# Remote access to Booklet Studio

Set up 8 October 2026 (user requested). Studio still runs only on this PC; other devices reach it at `https://studio.mrdingmaths.com` through a Cloudflare Tunnel, behind a Cloudflare Access email login. Every device edits the same files under `booklets/`, so there is nothing to sync.

## How it fits together

- The dev server listens on `127.0.0.1:5173` only. Nothing is opened on the home network.
- `cloudflared` (tunnel `mathsmap-studio`, config in `C:\Users\Admin\.cloudflared\config.yml`) connects out to Cloudflare and forwards `studio.mrdingmaths.com` to that port.
- Cloudflare Access asks for an allowed email address before any request reaches this PC.
- [`remote/access-guard.mjs`](../remote/access-guard.mjs) checks again on this PC: a request for any non-local host must carry a valid Access token (signature, issuer, audience, expiry) or it gets 403. Missing settings refuse every remote request.

The guard is loaded by [`remote/vite.remote.config.js`](../remote/vite.remote.config.js), which wraps `vite.config.js` without editing it. Keep it that way: `vite.config.js` and `scripts/` are hash-bound by booklet export and campaign render evidence, so remote-access code stays in `remote/`. Local requests behave exactly as under the plain config.

Settings live in `.env.local` (ignored by Git):

```text
STUDIO_PUBLIC_HOST=studio.mrdingmaths.com
CF_ACCESS_TEAM_DOMAIN=<team>.cloudflareaccess.com
CF_ACCESS_AUD=<Application Audience tag from the Access application>
```

## Start and stop

Double-click `remote/start-remote-studio.cmd`. It starts the dev server with the remote config if port 5173 is free, then runs the tunnel. Close the window to take Studio offline. The PC must be on and awake.

A dev server started with the plain config (`npm run dev`) refuses the remote address with "Blocked request"; restart it through the script or the `mathsmap-dev` launch configuration.

## Who can sign in

Cloudflare dashboard → Zero Trust → Access → Applications → the Studio application → Policies. Add or remove email addresses there. Never remove the Access application while the DNS record for `studio.mrdingmaths.com` exists.

## Limits

- One device per booklet at a time. A stale tab's save is rejected by the revision check; reload it.
- First load is slower than at home: the dev server sends many small files and projects are 9–28 MB.
- The remote page reloads if source files change on this PC.
- The guard covers HTTP requests. The dev server's live-reload socket relies on Cloudflare Access alone; it carries file-change notices, not booklet data.
- Touch-screen editing is untested.
