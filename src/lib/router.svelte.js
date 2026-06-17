// Tiny hash router exposing reactive route state via Svelte 5 runes.
const parse = () => {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, queryString] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryString || ''));
  return { name: parts[0] || 'home', params: parts.slice(1), query };
};

export const route = $state(parse());

function update() {
  const next = parse();
  route.name = next.name;
  route.params = next.params;
  route.query = next.query;
}

window.addEventListener('hashchange', update);

export function go(hash) {
  location.hash = hash;
}

export const href = (hash) => `#${hash}`;
