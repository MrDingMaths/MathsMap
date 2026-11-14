// Tiny path router (History API) exposing reactive route state via Svelte 5 runes.
//
// Public pages live at real paths (/skill/absolute-error) so search engines can
// index them; Cloudflare's single-page-application fallback (wrangler.jsonc) and
// Vite's dev server both serve index.html for these paths.
//
// Booklet Studio and the TikZ check stay on hash URLs (/#/booklet, /#/tikz-check):
// scripts, remote tooling and browser tests open them that way, and Studio reads
// location.hash itself (BookletStudio.svelte).

const HASH_ROUTES = new Set(['booklet', 'tikz-check']);
// First path segments the app owns. Clicks on links to anything else (content
// JSON, images, downloads) are left to the browser.
const APP_ROUTES = new Set(['', 'course', 'topic', 'skill', 'learning', 'map', 'quiz', 'quiz-history', 'booklet', 'tikz-check']);

const split = (raw) => {
  const [path, queryString] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryString || ''));
  return { name: parts[0] || 'home', params: parts.slice(1), query };
};

const parse = () => {
  if (location.hash.startsWith('#/')) {
    const raw = location.hash.slice(2);
    const hashed = split(raw);
    if (HASH_ROUTES.has(hashed.name)) return hashed;
    // An old #/skill/… link: move it to its path so the address bar is shareable.
    history.replaceState(history.state, '', `/${raw}`);
    return hashed;
  }
  return split(`${location.pathname.slice(1)}${location.search}`);
};

export const route = $state(parse());

function update() {
  const next = parse();
  route.name = next.name;
  route.params = next.params;
  route.query = next.query;
}

window.addEventListener('popstate', update);
// Studio changes its own hash (and BookletProjects dispatches hashchange).
window.addEventListener('hashchange', update);

const isHashRoute = (path) => HASH_ROUTES.has(path.replace(/^\/+/, '').split(/[/?#]/)[0]);

export function go(path) {
  if (isHashRoute(path)) {
    location.hash = path;
    return;
  }
  const [withoutHash, anchor] = path.split('#');
  const onHashRoute = location.hash.startsWith('#/');
  if (!onHashRoute && `${location.pathname}${location.search}` === withoutHash && !anchor) return;
  history.pushState(null, '', path);
  update();
  if (!anchor) window.scrollTo(0, 0);
}

export const href = (path) => (isHashRoute(path) ? `/#${path}` : path);

// In-app navigation for ordinary <a href="/skill/…"> links.
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;
  // Same-page anchors (#theory, #practice) scroll as usual.
  if (url.pathname === location.pathname && url.search === location.search && url.hash && !url.hash.startsWith('#/')) return;
  if (!APP_ROUTES.has(url.pathname.split('/')[1] ?? '')) return;
  if (url.pathname === '/' && url.hash.startsWith('#/')) return;
  event.preventDefault();
  go(`${url.pathname}${url.search}${url.hash}`);
});
