# SEO investigation (14 November 2026)

> **Status, 14 November 2026:** finding 1 is done. Public pages now use real paths (`/skill/{id}`, `/topic/{id}`, `/course/{id}`, `/map`, `/quiz`, `/learning`) through `src/lib/router.svelte.js`. Booklet Studio and the TikZ check stay at `/#/booklet` and `/#/tikz-check`. An old `#/skill/…` link is rewritten to its path on load. Links in MathsDatabase and MrDingMaths were updated to match. Phase 1 is complete:
>
> - **Page metadata:** each page sets its own title, description, canonical, robots and og tags in the browser (`src/lib/page-meta.js`, called from `App.svelte`). LaTeX in titles is turned into plain text.
> - **Excluded pages:** the learning, quiz and unknown-id pages are `noindex`.
> - **`public/robots.txt`:** blocks the personal pages and the Studio folders.
> - **Sitemap:** `npm run build` now runs `seo/build-sitemap.mjs`, which writes `dist/sitemap.xml` (1,195 URLs: home, the map, every course and topic, and every skill that has content).
>
> Next is phase 2 (prerendered HTML).

This is a report only. Nothing here has been built, except the social-share tags and `public/og-image.png`, which were added to `index.html` on the same day. Production is `https://mathsmap.mrdingmaths.com`, served from `dist/` as Cloudflare Workers static assets (`wrangler.jsonc`).

## Summary

Search engines can index one page of MathsMap today: the home shell. Every course, topic and skill lives behind a `#` URL. Crawlers drop the fragment, so the roughly 1,330 content pages are invisible to them: 11 courses, 125 topics and 1,194 skills, each with its own title and blurb in `data/*.json`. Each skill also has theory, worked examples and practice in `public/content/{id}.json`. That is a lot of unique, well-structured text that search can't reach.

The fix has two parts:

1. Move to real paths, so `/skill/absolute-error` replaces `/#/skill/absolute-error`.
2. Write static HTML for each page at build time, with its own title, description, canonical link and readable content.

The basics then follow cheaply: `robots.txt`, `sitemap.xml` and structured data. Recommended order and estimates are at the end.

## Findings

### 1. Hash routing hides every content page (blocking)

- **Evidence:** `src/lib/router.svelte.js` parses `location.hash`, `href()` returns `#…`, and `App.svelte` routes on it. Links look like `#/course/s4`, `#/topic/t-s3-rn-a` and `#/skill/name-millions-place-value`.
- **Why it matters:** Google treats `/#/skill/x` and `/#/skill/y` as the same URL, `/`. It can't index them separately and can't rank them for "absolute error Stage 5" or similar searches.
- **Fix:** route on `location.pathname` with the History API.
  - `wrangler.jsonc` already has `not_found_handling: "single-page-application"`, so deep links return the app shell with no server change.
  - Keep a small shim that rewrites `#/…` to the matching path on load, so bookmarks, shared links and links from MathsBase keep working.
  - The router change itself is small: `parse`, `go`, `href`, and a click handler for in-app links.
  - The cost is in the edges. Query-string routes (`/map?skill=…`, `/quiz?…`), `vite.config.js` dev routes, and tests that assert `#` hrefs (`tests/map-view.test.js` and others) all need checking.
- **Effort:** about 1 day including tests.

### 2. No per-page HTML: titles, descriptions and content come from JavaScript

- **Evidence:**
  - `index.html` has one `<title>MathsMap</title>` and nothing sets `document.title` (searched `src/`).
  - Content arrives through `fetch()` of `public/content/{id}.json` after the app boots.
  - The main bundle is a single 1.49 MB script (`dist/assets/index-*.js`, build of 6 November).
- **Why it matters:**
  - Google does render JavaScript, but in a deferred second pass with a budget. On a 1,300-page client-rendered site, pages get indexed slowly and partially.
  - Bing, DuckDuckGo and social and AI crawlers mostly don't run JavaScript at all.
- **Options:**

| Option | What it is | Pros | Cons |
| --- | --- | --- | --- |
| **A. Build-time prerender (recommended)** | A post-build Node script reads `data/*.json` and `public/content/*.json`. It renders each route's page content with `svelte/server` `render()`, or a lean static template, plus KaTeX `renderToString`. It writes `dist/skill/{id}/index.html` and similar, with the full head. The SPA then mounts over it. | Full content in the HTML, per-page head, no hosting change, keeps the current app | New build step (about 1,330 files; KaTeX makes it seconds, not minutes). TikZ diagrams need the cached SVGs from the diagram cache or an `<img>` fallback. |
| B. Head-only shells | Same script, but writes only `<title>`, description, canonical and og tags into copies of `index.html` | Small (half a day), fixes titles and snippets | Body is still empty, so ranking still depends on Google's JavaScript rendering |
| C. Migrate to SvelteKit with `adapter-static` | Framework-level prerendering | Standard tooling | Large rewrite of routing, data loading and the Studio dev plugins in `vite.config.js`. Not justified for this site. |

  - **Recommendation:** start with B as part of step 1, then grow it into A.
  - For A, a lean static template per page type is enough: h1, blurb, theory, worked examples, practice questions with solutions collapsed, and prerequisite links. It is safer than server-rendering the live components, which import browser-only code (`tikz.js`, IndexedDB).
- **Effort:** B takes about 0.5 day. A takes about 2–3 days, including diagram handling and a check that the client mount replaces the static markup cleanly.

### 3. Missing basics

| Item | Today | Recommendation |
| --- | --- | --- |
| Per-page `<title>` | "MathsMap" everywhere | `{Skill title} · Stage {n} {strand} · MathsMap`, for example "Find the absolute error of a measurement · Stage 5 Measurement · MathsMap". Set it at runtime in each view and in prerendered HTML. |
| Meta description | Site-wide only, added 14 Nov | The skill or topic `blurb`, cut to about 155 characters |
| Canonical | None | Absolute path URL. Drop `?course=` from canonicals, because the same skill shows under several courses. |
| `robots.txt` | None | Allow all and point to the sitemap. Disallow `/booklet`, `/tikz-check`, `/quiz-history/` and the Studio-only folders (see 3a). |
| `sitemap.xml` | None | Generate at build time from `data/courses.json`, `topics.json` and `skills.json`. Use `lastmod` from the content file's git date or mtime. |
| `noindex` | None | Quiz-history, the map with a focus query, and dev routes. Or simply leave them out of the sitemap and point their canonicals at the parent page. |
| 404 handling | The SPA shell returns 200 for any path | Prerendered pages exist only for real ids, so an unknown `/skill/x` should render a "not found" view with `noindex`. Cloudflare can't return a real 404 under SPA fallback without a Worker; this is acceptable. |

#### 3a. Studio files ship in the public build

`dist/` (6 November) contains `booklet-assets/` (36 MB), `.audit-input/` (2 MB), `__booklet/` and `booklets/`. These come from `public/`.

- If they are deployed, crawlers can find and index booklet internals, and they cost upload time.
- Check whether the deploy excludes them. If not, move them out of `public/` or exclude them with a build step.
- This is a security and housekeeping item more than an SEO one, but `robots.txt` alone is not access control.

### 4. Structured data (JSON-LD)

Add JSON-LD in the prerendered head of each page type:

- **Skill page:** `LearningResource` with:
  - `name` and `description`
  - `educationalLevel` (for example "Stage 5")
  - `teaches` (the skill title)
  - `educationalAlignment` (`AlignmentObject` with `alignmentType: "teaches"`, `educationalFramework: "NSW Mathematics K–10 Syllabus (2022)"`, and the outcome code already shown on the page, for example `MA5-MAG-C-01`)
  - `isPartOf` (the topic)
  - `competencyRequired` (prerequisite skill URLs)
- **Topic and course pages:** `Course` (or `LearningResource` with `hasPart`), with `provider` set to MrDingMaths.
- **Every page:** `BreadcrumbList` matching the on-page crumbs (Browse / Topic / Skill).
- **Quiz:** `Quiz` is supported by Google's education rich results only for practice problems in specific formats. Skip it until the quiz pages are crawlable.

**Effort:** about 0.5 day once prerendering exists.

### 5. Page speed (Core Web Vitals)

| Area | Observation | Suggestion |
| --- | --- | --- |
| JavaScript | One 1.49 MB bundle (uncompressed) for every route, including Studio-only modules that only dev builds should reach | Split by route with dynamic `import()`. Make sure Studio code is tree-shaken from production (`VITE_BOOKLET_STUDIO` gates the route, but check whether it gates the import). |
| CSS | One 186 KB stylesheet | Will shrink naturally once Studio styles are split out |
| Maths fonts | KaTeX ships woff2, woff and ttf. Only woff2 is fetched, so this is fine. | No change |
| Diagrams | TikZJax (`public/libs/tikzjax`, 10 MB folder) loads on the first uncached diagram. Visitors without a warm IndexedDB cache compile diagrams in the browser, which hurts LCP and INP. | Pre-compile skill-page diagrams to static SVG at build time (the diagram cache already stores SVGs) and serve them as files. This also covers diagrams in prerendered HTML (finding 2A). |
| Content | `public/content` is 21 MB across 1,057 JSON files, fetched one at a time per page | Fine as is. Prerendered HTML removes the fetch from first paint. |
| Fonts | Nunito latin is preloaded | Already good |

Measure with PageSpeed Insights on a skill page after step 1. There is no field data yet.

### 6. Off-page and housekeeping

- **Search consoles:**
  - Verify the domain in Google Search Console with a DNS TXT record on Cloudflare, then submit the sitemap.
  - Do the same in Bing Webmaster Tools, which also feeds DuckDuckGo and many AI search tools.
- **Internal and external links:** link MathsMap from mrdingmaths.com and MathsBase (the footer already links the other way). Point the links at path URLs once step 1 lands.
- **Social cards:**
  - The site-wide image is done (`public/og-image.png`, source `branding/og-image.html`).
  - Later, per-skill cards with the skill title rendered on the image could be generated in the prerender step.
- **Content signals:**
  - Skill titles are already task-shaped ("Find the absolute error of a measurement"), which suits search.
  - Visible syllabus outcome codes and stage labels help match teacher searches.
  - Keep worked solutions in the HTML (collapsed is fine). Hidden-until-click content is indexed when it is in the DOM.

## Recommended plan

| Phase | Work | Effort | Result |
| --- | --- | --- | --- |
| 1 | History routing with the `#/` redirect shim, runtime `document.title` and description per view, canonical, `robots.txt`, build-time `sitemap.xml` | 1.5 days | Every page has its own URL and is discoverable |
| 2 | Head-only prerendered shells (option B), then full static content (option A) with pre-compiled diagram SVGs | 0.5 day + 2–3 days | Content readable without JavaScript, fast first paint |
| 3 | JSON-LD (LearningResource, Course, BreadcrumbList) | 0.5 day | Eligible for rich results; clearer syllabus alignment |
| 4 | Bundle splitting and checking that Studio assets stay out of the production build | 1 day | Better Core Web Vitals; nothing internal published |
| 5 | Search Console and Bing verification, sitemap submission, links from sister sites | 1 hour (user, DNS access) | Indexing starts and can be monitored |

Phase 1 is the one that unlocks everything else. Phases 2 and 3 share the same build step, so plan them together.
