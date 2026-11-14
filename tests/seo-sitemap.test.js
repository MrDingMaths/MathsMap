import test from 'node:test';
import assert from 'node:assert/strict';
import { sitemapUrls, sitemapXml, SITE_URL } from '../seo/build-sitemap.mjs';

test('sitemap lists public pages only, as absolute path URLs', () => {
  const urls = sitemapUrls();
  assert.ok(urls.includes('/') && urls.includes('/map'));
  assert.ok(urls.some((u) => u.startsWith('/course/')) && urls.some((u) => u.startsWith('/topic/')) && urls.some((u) => u.startsWith('/skill/')));
  assert.equal(urls.some((u) => /#|learning|quiz|booklet/.test(u)), false);
  assert.equal(new Set(urls).size, urls.length);
  const xml = sitemapXml(urls.slice(0, 2));
  assert.match(xml, new RegExp(`<loc>${SITE_URL}/</loc>`));
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
});
