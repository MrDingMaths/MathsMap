// Writes sitemap.xml for the public site from data/*.json.
// Runs after `vite build` (package.json "postbuild"): node seo/build-sitemap.mjs [outDir]
// Lists the home page, the map, every course and topic, and every skill that has
// published content (public/content/{id}.json); skills without content show only
// a placeholder, so they are left out until they have something to index.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE_URL = 'https://mathsmap.mrdingmaths.com';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readList = (name, key) => {
  const value = JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
  return Array.isArray(value) ? value : value[key];
};

export function sitemapUrls() {
  const courses = readList('courses.json', 'courses');
  const topics = readList('topics.json', 'topics');
  const skills = readList('skills.json', 'skills');
  const contentDir = path.join(root, 'public', 'content');
  const withContent = new Set(fs.readdirSync(contentDir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
  return [
    '/',
    '/map',
    ...courses.map((c) => `/course/${c.id}`),
    ...topics.map((t) => `/topic/${t.id}`),
    ...skills.filter((s) => withContent.has(s.id)).map((s) => `/skill/${s.id}`),
  ];
}

const escapeXml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function sitemapXml(urls) {
  const body = urls.map((url) => `  <url><loc>${escapeXml(`${SITE_URL}${url}`)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = path.resolve(process.argv[2] ?? path.join(root, 'dist'));
  if (!fs.existsSync(outDir)) throw new Error(`Output folder not found: ${outDir}`);
  const urls = sitemapUrls();
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml(urls));
  console.log(`sitemap.xml: ${urls.length} URLs -> ${outDir}`);
}
