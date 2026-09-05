import { promises as fs } from 'node:fs';
import path from 'node:path';
import { reconcileApprovals, publicationBlockers, studioProject, reviewTargets } from '../../src/lib/booklet-review-model.js';
import { createStudioProposal, createGapProposal } from './studio-proposals.mjs';
import { mathsMapCandidates } from './assembly-bank.mjs';
import { createHash, randomUUID } from 'node:crypto';
import {
  WORK_ROOT, REPO_ROOT, applyContentOverrides, hashFile, loadRun, validateRun,
} from './transcription.mjs';
import {
  approvalCheck, makeBankManifest, markApproved, normaliseForDuplicate,
  normaliseQuestion, questionSearchText,
} from '../../src/lib/practice-question-model.js';
import {
  approveTeachingModule, normalizeTeachingModule, validateTeachingModule,
} from '../../src/lib/teaching-module-model.js';
import {
  createEditableProject, materializeAcceptedImport,
  materializeLegacyProject, normalizeEditableProject, snapshotBankQuestion,
  validateEditableProject,
} from '../../src/lib/editable-booklet-model.js';

const MAX_BODY = 64 * 1024 * 1024;
const PROJECT_ROOT = path.join(REPO_ROOT, 'booklets', 'projects');
const BANK_ROOT = path.join(REPO_ROOT, 'booklets', 'question-bank');
const MODULE_ROOT = path.join(REPO_ROOT, 'booklets', 'module-bank');
const PROJECT_ASSET_ROOT = path.join(REPO_ROOT, 'public', 'booklet-assets', 'projects');

const safeId = (value) => String(value ?? '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const send = (res, code, value) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); };
const readBody = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; if (raw.length > MAX_BODY) { reject(new Error('request body too large')); req.destroy(); } });
  req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('invalid JSON')); } });
  req.on('error', reject);
});

async function readJson(file, fallback = null) {
  try { return JSON.parse(String(await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, '')); } catch { return fallback; }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, json(value), 'utf8');
}

function contained(root, value) {
  const base = path.resolve(root);
  const target = path.resolve(value);
  return target === base || target.startsWith(base + path.sep);
}

function fileFor(root, id) {
  const file = path.join(root, `${safeId(id)}.json`);
  if (!contained(root, file)) throw new Error('bad record id');
  return file;
}

function revisionOf(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function readRecords(root) {
  const names = await fs.readdir(root).catch(() => []);
  const records = [];
  for (const name of names.filter((item) => item.endsWith('.json') && item !== 'manifest.json')) {
    const record = await readJson(path.join(root, name));
    if (record) records.push(record);
  }
  return records;
}

async function projectLibraries({ bankRoot = BANK_ROOT, moduleRoot = MODULE_ROOT } = {}) {
  return { bank: await readRecords(bankRoot), modules: await readRecords(moduleRoot) };
}

export async function listBookletProjects({ projectRoot = PROJECT_ROOT } = {}) {
  const records = await readRecords(projectRoot);
  return records.map((raw) => ({
    id: raw.id,
    title: raw.title ?? 'Untitled booklet',
    subtitle: raw.subtitle ?? '',
    format: raw.format,
    version: raw.version,
    status: raw.status ?? 'draft',
    revision: Number(raw.revision) || 0,
    sections: raw.sections?.length ?? 0,
    updatedAt: raw.updatedAt ?? null,
    source: raw.source ?? null,
  })).sort((left, right) => String(right.updatedAt ?? '').localeCompare(String(left.updatedAt ?? '')) || left.title.localeCompare(right.title));
}

export async function loadBookletProject(id, options = {}) {
  const projectRoot = options.projectRoot ?? PROJECT_ROOT;
  const raw = await readJson(fileFor(projectRoot, id));
  if (!raw) throw Object.assign(new Error('Booklet project not found'), { statusCode: 404 });
  if (Number(raw.version) === 4) return normalizeEditableProject(raw);
  const libraries = await projectLibraries(options);
  return materializeLegacyProject(raw, libraries);
}

async function hydrateBankRevisions(project, bankRoot) {
  const refs = [];
  walk(project.sections, (node) => { if (node?.type === 'question' && node.bankRef?.id && !node.bankRef.revision) refs.push(node); });
  for (const block of refs) {
    const question = await readJson(fileFor(bankRoot, block.bankRef.id));
    if (question) block.bankRef.revision = revisionOf(question);
  }
}

export async function saveBookletProject(raw, { projectRoot = PROJECT_ROOT, bankRoot = BANK_ROOT, expectedRevision = null, create = false } = {}) {
  const checked = validateEditableProject(raw);
  if (!checked.valid) throw Object.assign(new Error(checked.errors.join('; ')), { statusCode: 400 });
  const file = fileFor(projectRoot, checked.project.id);
  const previous = await readJson(file);
  if (create && previous) throw Object.assign(new Error('A project with this id already exists'), { statusCode: 409 });
  if (!create && !previous) throw Object.assign(new Error('Booklet project not found'), { statusCode: 404 });
  if (expectedRevision != null && previous && Number(previous.revision) !== Number(expectedRevision)) {
    throw Object.assign(new Error('Project changed in another session; reload before saving'), { statusCode: 409 });
  }
  const now = new Date().toISOString();
  const project = normalizeEditableProject({
    ...(previous && (previous.studio || checked.project.studio) ? reconcileApprovals(previous, checked.project) : checked.project),
    revision: Math.max(0, Number(previous?.revision) || 0) + 1,
    createdAt: previous?.createdAt ?? checked.project.createdAt ?? now,
    updatedAt: now,
  });
  await hydrateBankRevisions(project, bankRoot);
  if (previous) await writeJson(path.join(projectRoot, '.revisions', safeId(project.id), `${previous.revision ?? 0}.json`), previous);
  await writeJson(file, project);
  return project;
}

export async function createBookletProject(raw = {}, options = {}) {
  const project = raw.format || raw.sections
    ? normalizeEditableProject(raw)
    : createEditableProject({ title: raw.title ?? 'Untitled booklet', subtitle: raw.subtitle ?? '' });
  return saveBookletProject(project, { ...options, create: true });
}

export async function duplicateBookletProject(id, { projectRoot = PROJECT_ROOT, title = null, ...options } = {}) {
  const source = await loadBookletProject(id, { projectRoot, ...options });
  const copy = normalizeEditableProject({
    ...source,
    id: `project-${randomUUID()}`,
    title: title ?? `${source.title} copy`,
    revision: 0,
    status: 'draft',
    source: { type: 'project-copy', projectId: source.id, revision: source.revision },
    createdAt: null,
    updatedAt: null,
  });
  return saveBookletProject(copy, { projectRoot, bankRoot: options.bankRoot, create: true });
}

export async function deleteBookletProject(id, confirmId, { projectRoot = PROJECT_ROOT } = {}) {
  if (!id || confirmId !== id) throw Object.assign(new Error('Exact project id confirmation is required'), { statusCode: 400 });
  const file = fileFor(projectRoot, id);
  await fs.unlink(file).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  return { deleted: id };
}

function walk(value, visit, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  visit(value);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach((item) => walk(item, visit, seen));
    else if (child && typeof child === 'object') walk(child, visit, seen);
  }
}

async function materializeAssets(project, runDir, { assetRoot = PROJECT_ASSET_ROOT } = {}) {
  const copied = new Map();
  const destinations = [];
  walk(project, (node) => {
    if (typeof node?.src === 'string' && node.src.startsWith('evidence/')) destinations.push(node);
  });
  for (const node of destinations) {
    if (!copied.has(node.src)) {
      const source = path.resolve(runDir, 'lanes', 'exact', node.src);
      if (!contained(path.join(runDir, 'lanes', 'exact'), source)) throw new Error(`Bad import asset path: ${node.src}`);
      const digest = hashFile(source).slice(0, 12);
      const name = `${digest}-${safeId(path.basename(source))}`;
      const target = path.join(assetRoot, safeId(project.id), name);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(source, target);
      copied.set(node.src, `/booklet-assets/projects/${safeId(project.id)}/${name}`);
    }
    node.src = copied.get(node.src);
  }
  return [...copied.values()];
}

export async function materializeRunAsProject(runId, {
  projectRoot = PROJECT_ROOT, workRoot = WORK_ROOT, assetRoot = PROJECT_ASSET_ROOT,
  requireAccepted = true,
} = {}) {
  const { runDir, manifest } = loadRun(runId, workRoot);
  if (requireAccepted) {
    const validation = validateRun(runDir, { forPublish: true, workRoot });
    if (!validation.valid) throw Object.assign(new Error(`Import is not ready to materialise: ${validation.errors.join('; ')}`), { statusCode: 409 });
  }
  const raw = await readJson(path.join(runDir, 'merged', 'transcription.json'));
  const review = await readJson(path.join(runDir, 'review.json'), {});
  if (!raw) throw Object.assign(new Error('Merged transcription is missing'), { statusCode: 409 });
  const transcription = applyContentOverrides(raw, review);
  const preferredId = `project-${safeId(manifest.id)}`;
  const existing = await readJson(fileFor(projectRoot, preferredId));
  if (existing?.source?.runId === manifest.id) return normalizeEditableProject(existing);
  const project = studioProject(materializeAcceptedImport(transcription, review, { projectId: existing ? `project-${safeId(manifest.id)}-${randomUUID().slice(0, 8)}` : preferredId }));
  project.studio.evidence={runId:manifest.id,answerEvidence:transcription.pages.flatMap(page=>(page.answerEvidence??[]).map(e=>({...e,studentPage:page.pageNumber}))),sourceReview:review};
  const targets=reviewTargets(project),known=new Set(targets.map(t=>t.id));
  for(const page of transcription.pages){
    const flags=[...(page.reviewFlags??[]).map(note=>({note})),...(review.flags??[]).filter(f=>!f.resolved&&(f.pageNumber===page.pageNumber||f.rootId===page.id||page.blocks.some(b=>b.id===f.rootId)))];
    for(const e of page.answerEvidence??[])if(e.conflict)flags.push({rootId:e.questionId,note:'Student/teacher disagreement: '+e.conflict});
    if(manifest.source?.teacherPdf)for(const block of page.blocks.filter(b=>b.type==='question')){const evidence=(page.answerEvidence??[]).find(e=>e.questionId===block.id);if(!evidence?.teacherReference||evidence.missing||evidence.status==='missing')flags.push({rootId:block.id,note:'Teacher answer alignment is missing or ambiguous; compare by question content before approval.'});}
    for(const f of flags)for(const targetId of known.has(f.rootId)?[f.rootId]:page.blocks.map(b=>b.id))project.studio.flags.push({id:randomUUID(),targetId,note:f.note??f.message??f.code??String(f),sourcePage:page.pageNumber,resolved:false});
  }
  project.source = {
    ...project.source,
    exactResultFormat: manifest.exactResultFormat,
    sourceHashes: { pdf: manifest.source?.pdfHash ?? null, docx: manifest.source?.docxHash ?? null },
    ...(manifest.source?.teacherPdf?{teacherSource:manifest.source.teacherPdf,teacherHashes:{pdf:manifest.pins?.files?.['source/teacher.pdf'],docx:manifest.pins?.files?.['source/teacher.docx']}}:{}),
    materializedAt: new Date().toISOString(),
  };
  project.assets = await materializeAssets(project, runDir, { assetRoot });
  return saveBookletProject(project, { projectRoot, create: true });
}

function tokenSimilarity(left, right) {
  const a = new Set(normaliseForDuplicate(left).split(' ').filter(Boolean));
  const b = new Set(normaliseForDuplicate(right).split(' ').filter(Boolean));
  if (!a.size && !b.size) return 1;
  const overlap = [...a].filter((word) => b.has(word)).length;
  return overlap / new Set([...a, ...b]).size;
}

function canonicalFromProjectBlock(block, id) {
  const question = normaliseQuestion({
    id,
    status: 'draft',
    title: block.title ?? '',
    classification: block.classification ?? {},
    content: block.content,
    review: block.review ?? { flags: [], history: [] },
  });
  const ready = approvalCheck(question);
  if (!ready.ready) throw Object.assign(new Error(`Question cannot be promoted: ${ready.blockers.join('; ')}`), { statusCode: 409 });
  return markApproved(question, { approvedBy: 'Booklet Studio project editor' });
}

async function duplicateCandidates(block, bankRoot) {
  const local = normaliseQuestion({ ...block, id: block.canonicalId ?? block.id, content: block.content });
  const localContent = revisionOf(local.content);
  const records = await readRecords(bankRoot);
  return records.map((question) => ({
    id: question.id,
    title: question.title,
    revision: revisionOf(question),
    exact: revisionOf(normaliseQuestion(question).content) === localContent,
    score: tokenSimilarity(questionSearchText(local), questionSearchText(question)),
  })).filter((item) => item.exact || item.score >= 0.72).sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score);
}

async function writeBankManifest(bankRoot) {
  const approved = (await readRecords(bankRoot)).filter((question) => question.status === 'approved').sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(path.join(bankRoot, 'manifest.json'), makeBankManifest(approved));
}

function topLevelQuestion(project, blockId) {
  for (const section of project.sections) {
    const index = section.blocks.findIndex((block) => block.id === blockId && block.type === 'question');
    if (index >= 0) return { section, index, block: section.blocks[index] };
  }
  return null;
}

export async function promoteProjectQuestion(projectId, body = {}, {
  projectRoot = PROJECT_ROOT, bankRoot = BANK_ROOT, moduleRoot = MODULE_ROOT,
} = {}) {
  const project = await loadBookletProject(projectId, { projectRoot, bankRoot, moduleRoot });
  const placement = topLevelQuestion(project, body.blockId);
  if (!placement) throw Object.assign(new Error('Select a top-level project question to promote'), { statusCode: 404 });
  const candidates = await duplicateCandidates(placement.block, bankRoot);
  if (!body.mode || body.mode === 'inspect') return { project, candidates };
  const blockers=publicationBlockers(project,[placement.block.id]);
  if(blockers.length)throw Object.assign(new Error('Complete the block and part reviews before bank publication: '+blockers.join('; ')),{statusCode:409});

  if (body.mode === 'link-existing') {
    const target = await readJson(fileFor(bankRoot, body.targetId));
    if (!target) throw Object.assign(new Error('The selected bank question no longer exists'), { statusCode: 404 });
    placement.section.blocks[placement.index] = snapshotBankQuestion(target, { placementId: placement.block.id });
    const saved = await saveBookletProject(project, { projectRoot, bankRoot, expectedRevision: project.revision });
    return { project: saved, question: target, candidates };
  }

  const targetId = body.mode === 'update'
    ? String(placement.block.bankRef?.id ?? body.targetId ?? '')
    : `q-${randomUUID()}`;
  if (!targetId) throw Object.assign(new Error('Updating the bank requires an existing bank reference'), { statusCode: 400 });
  const file = fileFor(bankRoot, targetId);
  const previous = await readJson(file);
  if (body.mode === 'create' && previous) throw Object.assign(new Error('Question id already exists'), { statusCode: 409 });
  if (body.mode === 'update' && !previous) throw Object.assign(new Error('Referenced bank question no longer exists'), { statusCode: 404 });
  const reviewedBlock=JSON.parse(JSON.stringify(placement.block));
  const mapping=project.studio?.atoms?.[placement.block.id];
  if(mapping?.skillIds?.length)reviewedBlock.classification={...reviewedBlock.classification,primarySkillId:mapping.skillIds[0],secondarySkillIds:mapping.skillIds.slice(1),archetype:mapping.archetype};
  const attach=node=>{if(!node)return;const atom=project.studio?.atoms?.[node.id];if(atom)node.teachingMapping=atom;(node.children??[]).forEach(attach);};attach(reviewedBlock.content);
  const approved = canonicalFromProjectBlock(reviewedBlock, targetId);
  if (previous) await writeJson(path.join(bankRoot, '.revisions', safeId(targetId), `${revisionOf(previous)}.json`), previous);
  await writeJson(file, approved);
  await writeBankManifest(bankRoot);
  placement.block.bankRef = { id: approved.id, revision: revisionOf(approved) };
  placement.block.canonicalId = approved.id;
  placement.block.snapshotKind = 'bank';
  const saved = await saveBookletProject(project, { projectRoot, bankRoot, expectedRevision: project.revision });
  return { project: saved, question: approved, candidates };
}

export async function promoteProjectModule(projectId, body = {}, {
  projectRoot = PROJECT_ROOT, bankRoot = BANK_ROOT, moduleRoot = MODULE_ROOT,
} = {}) {
  const project = await loadBookletProject(projectId, { projectRoot, bankRoot, moduleRoot });
  const section = project.sections.find((item) => item.id === body.sectionId);
  if (!section) throw Object.assign(new Error('Project section not found'), { statusCode: 404 });
  const wanted = new Set(body.blockIds?.length ? body.blockIds : section.blocks.map((block) => block.id));
  const selected = section.blocks.filter((block) => wanted.has(block.id));
  if (!selected.length) throw Object.assign(new Error('Select at least one block for the teaching module'), { statusCode: 400 });
  const blockers=publicationBlockers(project,selected.map(b=>b.id));
  if(blockers.length)throw Object.assign(new Error('Complete all selected block and part reviews before module publication: '+blockers.join('; ')),{statusCode:409});
  const sequence = selected.map((block) => {
    if (block.type !== 'question') return { type: 'content-block', id: `module-item-${block.id}`, pedagogyRole: block.pedagogyRole ?? (block.type === 'worked-example' ? 'worked-example' : 'theory'), block };
    if (!block.bankRef?.id) throw Object.assign(new Error(`Question ${block.id} must be promoted before it can enter a reusable module`), { statusCode: 409 });
    return { type: 'question-ref', id: `module-ref-${block.id}`, questionId: block.bankRef.id, questionRevision: block.bankRef.revision, snapshot: normaliseQuestion({...block,id:block.bankRef.id}), pedagogyRole: block.pedagogyRole ?? 'guided-practice', order: 'fixed' };
  });
  const module = approveTeachingModule(normalizeTeachingModule({
    id: body.id ?? `module-${randomUUID()}`,
    title: body.title ?? section.title,
    classification: body.classification ?? { mappingStatus: 'unmapped' },
    sequence,
    review: { flags: [], history: [] },
  }));
  const checked = validateTeachingModule(module);
  if (!checked.valid) throw Object.assign(new Error(checked.errors.join('; ')), { statusCode: 400 });
  await writeJson(fileFor(moduleRoot, module.id), module);
  return { module };
}

export function projectStudioPlugin() {
  return {
    name: 'booklet-project-studio',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
        if (!pathname.startsWith('/__booklet/projects')) return next();
        try {
          if (pathname === '/__booklet/projects/assembly-bank' && req.method === 'GET') return send(res, 200, { candidates: await mathsMapCandidates((new URL(req.url,'http://localhost').searchParams.get('skills') ?? '').split(',').filter(Boolean)) });
          if (pathname === '/__booklet/projects' && req.method === 'GET') return send(res, 200, await listBookletProjects());
          if (pathname === '/__booklet/projects' && req.method === 'POST') return send(res, 201, await createBookletProject(await readBody(req)));
          if (pathname === '/__booklet/projects/materialize' && req.method === 'POST') {
            const body = await readBody(req);
            return send(res, 201, await materializeRunAsProject(body.runId, { requireAccepted: body.draftReview !== true }));
          }
          const duplicateMatch = pathname.match(/^\/__booklet\/projects\/([^/]+)\/duplicate$/);
          const proposalMatch = pathname.match(/^\/__booklet\/projects\/([^/]+)\/propose$/);
          if (proposalMatch && req.method === 'POST') {
            const body = await readBody(req);
            if (body.project?.id !== decodeURIComponent(proposalMatch[1])) throw new Error('Proposal project identity mismatch');
            return send(res, 200, await (body.kind==='generate-gap'?createGapProposal(body):createStudioProposal(body)));
          }
          if (duplicateMatch && req.method === 'POST') return send(res, 201, await duplicateBookletProject(decodeURIComponent(duplicateMatch[1]), await readBody(req)));
          const promoteMatch = pathname.match(/^\/__booklet\/projects\/([^/]+)\/promote-question$/);
          if (promoteMatch && req.method === 'POST') return send(res, 200, await promoteProjectQuestion(decodeURIComponent(promoteMatch[1]), await readBody(req)));
          const moduleMatch = pathname.match(/^\/__booklet\/projects\/([^/]+)\/promote-module$/);
          if (moduleMatch && req.method === 'POST') return send(res, 200, await promoteProjectModule(decodeURIComponent(moduleMatch[1]), await readBody(req)));
          const projectMatch = pathname.match(/^\/__booklet\/projects\/([^/]+)$/);
          if (projectMatch && req.method === 'GET') return send(res, 200, await loadBookletProject(decodeURIComponent(projectMatch[1])));
          if (projectMatch && req.method === 'PUT') {
            const body = await readBody(req);
            return send(res, 200, await saveBookletProject(body.project ?? body, { expectedRevision: body.expectedRevision ?? body.project?.revision }));
          }
          if (projectMatch && req.method === 'DELETE') {
            const body = await readBody(req);
            return send(res, 200, await deleteBookletProject(decodeURIComponent(projectMatch[1]), body.confirmId));
          }
          return send(res, 404, { error: 'Booklet project endpoint not found.' });
        } catch (error) { return send(res, error.statusCode ?? 500, { error: error.message }); }
      });
    },
  };
}
