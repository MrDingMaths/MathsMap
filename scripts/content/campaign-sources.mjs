import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { currentBookletSourcePath, MATHSMAP_SOURCE_ROOT } from '../booklet/source-paths.mjs';
import { sourceMarkdownImages } from './source-markdown-images.mjs';

export const hashValue = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
export const relative = (root, file) => path.relative(root, file).replaceAll('\\', '/');
export function inside(root, name) {
  const file = path.resolve(root, name), rel = path.relative(root, file);
  if (rel.startsWith('..' + path.sep) || rel === '..' || path.isAbsolute(rel)) throw new Error('Path outside campaign root: ' + name);
  return file;
}
export function unavailableImageDecisionHash(gap) {
  return hashValue({ path: gap.path, nonessential: gap.nonessential, reason: gap.reason, textAlternative: gap.textAlternative, textAlternativeLocator: gap.textAlternativeLocator, matchingBookletStyle: gap.matchingBookletStyle, ...(gap.profile !== undefined ? { profile: gap.profile } : {}) });
}
export const SOURCE_LONG_DESCRIPTION_PROFILE = 'source-authored-long-description-v1';
function validateSourceLongDescription(root, ref, gap, sourcePath) {
  const locator = gap.textAlternativeLocator, bytes = fs.readFileSync(inside(root, sourcePath));
  const fail = () => { throw new Error('Missing syllabus illustration needs its complete source-authored long description in the same selected box: ' + gap.path); };
  if (!locator || typeof locator !== 'object' || Array.isArray(locator) || locator.path !== ref.path || locator.sourceHash !== ref.hash || ref.hash !== hashValue(bytes)) fail();
  const lines = bytes.toString('utf8').split('\n');
  const { startLine, endLine, imageLine, boxStartLine, boxEndLine } = locator;
  if (![ref.startLine, ref.endLine, startLine, endLine, imageLine, boxStartLine, boxEndLine].every(n => Number.isInteger(n) && n >= 1 && n <= lines.length)) fail();
  if (!(ref.startLine <= boxStartLine && boxStartLine < imageLine && imageLine < startLine && startLine <= endLine && endLine < boxEndLine && boxEndLine <= ref.endLine)) fail();
  const border = line => /^\s*\+-{3,}\+\s*$/.test(line);
  if (!border(lines[boxStartLine - 1]) || !border(lines[boxEndLine - 1])) fail();
  const rows = lines.slice(boxStartLine, boxEndLine - 1);
  if (rows.some(line => !/^\s*\|[^|]*\|\s*$/.test(line))) fail();
  const cells = rows.map(line => line.trim().slice(1, -1).trim());
  if (sourceMarkdownImages(rows.join('\n')).length !== 1) fail();
  const marker = '*Image long description*:';
  const markers = cells.flatMap((cell, i) => cell.startsWith(marker) ? [boxStartLine + i + 1] : []);
  if (markers.length !== 1 || markers[0] !== startLine) fail();
  if (!/^\s*\|\s*!\[/.test(lines[imageLine - 1])) fail();
  const before = lines.slice(boxStartLine, startLine - 1).join('\n');
  const images = sourceMarkdownImages(before);
  if (images.length !== 1 || /^https?:/i.test(images[0])) fail();
  const actualImage = relative(root, inside(root, path.resolve(path.dirname(inside(root, ref.path)), decodeURIComponent(images[0]))));
  if (actualImage !== relative(root, inside(root, gap.path))) fail();
  // The image starts at the exact bound row, rather than a copied description
  // being attached to another image elsewhere in the selected source.
  if (sourceMarkdownImages(lines.slice(boxStartLine, imageLine - 1).join('\n')).length || sourceMarkdownImages(lines.slice(imageLine - 1, startLine - 1).join('\n')).length !== 1) fail();
  const body = lines.slice(startLine - 1, endLine).map(line => line.trim().slice(1, -1).trim());
  if (!body.at(-1) || lines.slice(endLine, boxEndLine - 1).some(line => line.trim().slice(1, -1).trim())) fail();
  body[0] = body[0].slice(marker.length).trim();
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  if (!normalize(body.join(' ')) || normalize(body.join(' ')) !== normalize(gap.textAlternative)) fail();
}
function linkedSourceImages(root, ref) {
  const file = inside(root, ref.path);
  if (path.extname(file).toLowerCase() !== '.md') return [];
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const excerpt = lines.slice((ref.startLine || 1) - 1, ref.endLine || lines.length).join('\n');
  return sourceMarkdownImages(excerpt).filter(name => !/^https?:/i.test(name)).map(name => ({ path: relative(root, inside(root, path.resolve(path.dirname(file), decodeURIComponent(name)))) }));
}
export function validateUnavailableImages(root, ref, { requireAccepted = false } = {}) {
  const gaps = ref.unavailableImages || [];
  if (!Array.isArray(gaps)) throw new Error('Unavailable source images must be an array');
  if (!gaps.length) return gaps;
  const sourcePath = relative(root, inside(root, ref.path));
  const legacyStage3 = sourcePath.toLowerCase() === 'syllabus/stage 3 content.md';
  const longDescriptionSyllabus = /^syllabus\/stage [456] content\.md$/i.test(sourcePath);
  if (!legacyStage3 && !longDescriptionSyllabus) throw new Error('Missing original booklet or required source figures cannot use the syllabus illustration exception');
  const linked = new Set(linkedSourceImages(root, ref).map(image => image.path));
  const seen = new Set();
  for (const gap of gaps) {
    if (typeof gap?.path !== 'string' || gap.nonessential !== true || typeof gap.reason !== 'string' || !gap.reason.trim() || typeof gap.textAlternative !== 'string' || !gap.textAlternative.trim()) throw new Error('Missing illustration needs an explicit nonessential reason and textual alternative');
    const imagePath = relative(root, inside(root, gap.path));
    if (!linked.has(imagePath) || !imagePath.toLowerCase().startsWith('syllabus/')) throw new Error('Unavailable illustration is not referenced by the selected syllabus section: ' + gap.path);
    if (seen.has(imagePath)) throw new Error('Duplicate unavailable source illustration: ' + gap.path); seen.add(imagePath);
    if (fs.existsSync(inside(root, gap.path))) throw new Error('Previously unavailable source image now exists; reconcile actual image evidence: ' + gap.path);
    if (!legacyStage3 || gap.profile !== undefined) {
      if (!longDescriptionSyllabus || gap.profile !== SOURCE_LONG_DESCRIPTION_PROFILE) throw new Error('Missing syllabus illustration requires the source-authored long-description profile: ' + gap.path);
      validateSourceLongDescription(root, ref, gap, sourcePath);
    }
    if (requireAccepted && (gap.accepted !== true || typeof gap.observation !== 'string' || !gap.observation.trim())) throw new Error('Author must explicitly accept each unavailable illustration using its textual alternative: ' + gap.path);
  }
  return gaps;
}
export function validateSourceImages(root, ref, { requireAccepted = false, requireBound = false } = {}) {
  const gaps = validateUnavailableImages(root, ref, { requireAccepted });
  if (ref.images !== undefined && !Array.isArray(ref.images)) throw new Error('Source images must be an array');
  const declared = (ref.images || []).map(image => typeof image === 'string' ? { path: image } : image);
  const images = new Map();
  for (const image of [...declared, ...linkedSourceImages(root, ref)]) {
    const file = inside(root, image.path), imagePath = relative(root, file);
    if (!fs.existsSync(file)) {
      if (gaps.some(gap => relative(root, inside(root, gap.path)) === imagePath)) continue;
      throw new Error('Relevant source image missing: ' + image.path);
    }
    const actual = hashValue(fs.readFileSync(file));
    if (image.hash && image.hash !== actual) throw new Error('Stale source image: ' + image.path);
    if (requireBound && !declared.some(bound => relative(root, inside(root, bound.path)) === imagePath && bound.hash === actual)) throw new Error('Linked source image lacks a current staged hash: ' + image.path);
    if (!images.has(imagePath)) images.set(imagePath, { ...image, path: imagePath, hash: actual });
  }
  return [...images.values()];
}
export function preservePreparedSourceImages(root, ref, preparedSources) {
  if (ref.images !== undefined && !Array.isArray(ref.images)) throw new Error('Source images must be an array');
  const sourcePath = relative(root, inside(root, ref.path));
  const fullEnd = path.extname(sourcePath).toLowerCase() === '.md' ? fs.readFileSync(inside(root, ref.path), 'utf8').split('\n').length : 0;
  const start = ref.startLine || 1, end = ref.endLine || fullEnd;
  const images = preparedSources.filter(prepared => relative(root, inside(root, prepared.path)) === sourcePath && (prepared.startLine || 1) === start && (prepared.endLine || fullEnd) === end).flatMap(prepared => prepared.images || []);
  return { ...ref, images: [...(ref.images || []), ...images] };
}
function filesBelow(dir, suffix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? filesBelow(path.join(dir, entry.name), suffix) : entry.name.endsWith(suffix) ? [path.join(dir, entry.name)] : []);
}
export function sourceCatalog(root) {
  const bySkill = new Map(), byTopic = new Map();
  const add = (map, id, ref) => {
    if (!map.has(id)) map.set(id, []);
    if (!map.get(id).some(old => old.path === ref.path && old.mapping === ref.mapping)) map.get(id).push(ref);
  };
  const originals = filesBelow(path.join(root, MATHSMAP_SOURCE_ROOT), '.md').sort().map(file => relative(root, file));
  const normalize = name => {
    const mapped = currentBookletSourcePath(name);
    if (fs.existsSync(inside(root, mapped))) return mapped;
    const matches = originals.filter(file => path.basename(file) === path.basename(mapped));
    return matches.length === 1 ? matches[0] : null;
  };
  for (const file of filesBelow(path.join(root, 'scripts/agy/batches/done'), '.json')) {
    let config; try { config = readJson(file); } catch { continue; }
    for (const section of config.sections || []) {
      for (const name of section.bookletPaths || []) {
        const source = normalize(name); if (!source) continue;
        const ref = { path: source, mapping: relative(root, file), section: section.name || null, support: 'candidate' };
        for (const id of section.skillIds || []) add(bySkill, id, ref);
        for (const id of [section.topicId, ...(config.topicIds || [])].filter(Boolean)) add(byTopic, id, ref);
      }
    }
  }
  const queue = path.join(root, 'docs/content-queue.md');
  if (fs.existsSync(queue)) for (const line of fs.readFileSync(queue, 'utf8').split('\n').filter(line => line.startsWith('|'))) {
    const topics = [...new Set(line.match(/\bt-s[3-6][\w-]+/g) || [])];
    for (const match of line.matchAll(/`([^`]+\.md)`/g)) {
      const source = normalize(match[1]); if (!source) continue;
      for (const id of topics) add(byTopic, id, { path: source, mapping: 'docs/content-queue.md', support: 'candidate' });
    }
  }
  return { bySkill, byTopic, originals };
}
const words = value => new Set((String(value).toLowerCase().match(/[a-z]{4,}/g) || []).filter(word => !['with', 'from', 'using', 'solve', 'find', 'problems', 'stage'].includes(word)));
export function governingScope(skill, taxonomy, recorded = null) {
  const topics = new Map(taxonomy.topics.map(topic => [topic.id, topic]));
  const courses = new Map(taxonomy.courses.map(course => [course.id, course]));
  const candidates = taxonomy.dotpoints.filter(dp => skill.dotPointIds?.includes(dp.id));
  const ranked = candidates.filter(dp => topics.get(dp.topicId)?.stage === skill.stage).sort((a, b) => {
    const rank = dp => Math.min(...(topics.get(dp.topicId)?.courses || []).map(id => courses.get(id)?.order ?? 999), 999);
    return rank(a) - rank(b) || (topics.get(a.topicId)?.order ?? 999) - (topics.get(b.topicId)?.order ?? 999) || (a.order ?? 999) - (b.order ?? 999);
  });
  const chosen = recorded ? candidates.find(dp => dp.id === recorded.dotPointId && (!recorded.topicId || dp.topicId === recorded.topicId)) : ranked[0];
  if (!chosen || topics.get(chosen.topicId)?.stage !== skill.stage) return { stage: skill.stage, pending: 'No valid governing dot point in skill.stage; consequential scope review required', candidates };
  const topic = topics.get(chosen.topicId);
  return { stage: skill.stage, topicId: topic.id, dotPointId: chosen.id, governingDotPoints: candidates.filter(dp => dp.topicId === topic.id), topic, decision: recorded ? 'preserved documented governing decision' : 'earliest applicable course/topic in skill.stage; confirm against title, blurb and prerequisites', laterMembershipsAreReuse: true, stage3Borrowing: skill.stage === 3 ? 'Later-stage booklet wording/presentation only; mathematics, assumed knowledge and terminology remain Stage 3' : null };
}
export function mappedSources(skill, scope, catalog, root) {
  const direct = [...(catalog.bySkill.get(skill.id) || []), ...(catalog.byTopic.get(scope.topicId) || [])];
  let refs = [...new Map(direct.map(ref => [ref.path, ref])).values()];
  if (skill.stage === 3) refs = refs.map(ref => ({ ...ref, support: 'indirect-candidate' }));
  if (!refs.length) {
    const target = words(`${skill.title} ${skill.blurb || ''} ${scope.topic?.title || ''}`);
    const stage = file => Number(file.match(/Stage ([3-6])/)?.[1] || 9);
    const ranked = catalog.originals.map(file => ({ file, score: [...words(path.basename(file))].filter(word => target.has(word)).length })).filter(row => row.score >= 1).sort((a, b) => b.score - a.score || stage(a.file) - stage(b.file) || a.file.localeCompare(b.file)).slice(0, 3);
    refs = ranked.map(row => ({ path: row.file, mapping: 'closest-topic suggestion, must confirm relevant section', support: 'indirect-candidate' }));
  }
  return refs.map(ref => ({ ...ref, hash: hashValue(fs.readFileSync(inside(root, ref.path))), locator: null, accepted: false }));
}
export function taxonomyAt(root) {
  return Object.fromEntries(['skills', 'topics', 'courses', 'dotpoints'].map(name => [name, readJson(path.join(root, 'data', `${name}.json`))]));
}
export function scopeDependencies(root, skillId, scope, sourceRefs = [], cache = {}) {
  const taxonomy = cache.taxonomy || taxonomyAt(root), skill = taxonomy.skills.find(skill => skill.id === skillId);
  if (!skill) throw new Error('Unknown skill ' + skillId);
  const prereqs = taxonomy.skills.filter(row => skill.prereqs?.includes(row.id));
  const siblings = taxonomy.skills.filter(row => row.id !== skillId && row.dotPointIds?.some(id => scope.governingDotPoints?.some(dp => dp.id === id)));
  const dependents = taxonomy.skills.filter(row => row.prereqs?.includes(skillId));
  const fileHash = name => { const file = inside(root, name); if (cache.fileHashes?.has(file)) return cache.fileHashes.get(file); const hash = fs.existsSync(file) ? hashValue(fs.readFileSync(file)) : null; cache.fileHashes?.set(file, hash); return hash; };
  const paths = sourceRefs.flatMap(ref => [ref, ...(ref.images || []).map(image => typeof image === 'string' ? { path: image } : image), ...(ref.unavailableImages || []).map(image => ({ path: image.path }))]).map(ref => ({ path: ref.path, hash: fileHash(ref.path) }));
  const unavailableImages = sourceRefs.flatMap(ref => (ref.unavailableImages || []).map(gap => ({ sourcePath: ref.path, decisionHash: unavailableImageDecisionHash(gap) })));
  const prerequisiteTheory = prereqs.map(row => {
    const file = path.join(root, 'public/content', row.id + '.json');
    return { id: row.id, theory: fs.existsSync(file) ? readJson(file).theory : null };
  });
  const governing = taxonomy.dotpoints.filter(dp => scope.governingDotPoints?.some(old => old.id === dp.id));
  const topic = taxonomy.topics.find(topic => topic.id === scope.topicId);
  const context = { skill, prereqs, siblings: siblings.map(({ id, title, blurb, stage }) => ({ id, title, blurb, stage })), dependents: dependents.map(({ id, title, blurb, stage }) => ({ id, title, blurb, stage })), prerequisiteTheory, governing, topic };
  return { hash: hashValue({ context, paths, ...(unavailableImages.length ? { unavailableImages } : {}) }), context, paths };
}
