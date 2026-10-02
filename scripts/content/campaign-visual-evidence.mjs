import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { hashValue, inside, readJson, relative } from './campaign-sources.mjs';
import { campaignRendererSignature, campaignRendererDependencyManifest, CAMPAIGN_RENDER_DEPENDENCY_PROFILE } from './campaign-render-dependencies.mjs';
export { campaignRendererSignature, campaignRendererDependencyManifest } from './campaign-render-dependencies.mjs';

const activeRendererContexts = new WeakSet();
// Operation-scoped only: no process-global signature cache. Recheck actual bytes
// before returning, and refuse use after the synchronous validation completes.
export function withCampaignRendererContext(root, validate) {
  const context = Object.freeze({ root: path.resolve(root), signature: campaignRendererSignature(root) });
  activeRendererContexts.add(context);
  try {
    const result = validate(context);
    if (result?.then) throw new Error('Renderer validation context must be synchronous');
    if (campaignRendererSignature(root) !== context.signature) throw new Error('Renderer changed during scoped validation');
    return result;
  } finally { activeRendererContexts.delete(context); }
}

export function pngCrc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
export function pngDimensions(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Visual artifact is not a decodable PNG');
  let at = 8, width, height, channels, depth, palette = false, ended = false; const data = [];
  while (at < bytes.length) {
    if (at + 12 > bytes.length) throw new Error('Truncated PNG');
    const size = bytes.readUInt32BE(at), end = at + 12 + size;
    if (end > bytes.length) throw new Error('Truncated PNG chunk');
    const type = bytes.toString('ascii', at + 4, at + 8), body = bytes.subarray(at + 8, at + 8 + size);
    if (pngCrc32(bytes.subarray(at + 4, at + 8 + size)) !== bytes.readUInt32BE(at + 8 + size)) throw new Error('Invalid PNG chunk CRC');
    if (type === 'IHDR') {
      if (at !== 8 || size !== 13) throw new Error('Invalid PNG header');
      width = body.readUInt32BE(0); height = body.readUInt32BE(4); depth = body[8]; channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[body[9]];
      if (!width || !height || width > 30000 || height > 30000 || !channels || ![1, 2, 4, 8, 16].includes(depth) || body[10] || body[11] || body[12]) throw new Error('Unsupported/empty PNG dimensions or encoding');
      if (![0, 3].includes(body[9]) && depth < 8) throw new Error('Invalid PNG colour depth');
      palette = body[9] !== 3;
    } else if (type === 'PLTE') palette = body.length > 0 && body.length % 3 === 0;
    else if (type === 'IDAT') data.push(body);
    else if (type === 'IEND') { if (size || end !== bytes.length) throw new Error('Invalid PNG end'); ended = true; }
    at = end;
  }
  if (!width || !ended || !palette || !data.length) throw new Error('Incomplete PNG image');
  const stride = Math.ceil(width * channels * depth / 8) + 1, expected = stride * height;
  if (expected > 256 * 1024 * 1024) throw new Error('PNG exceeds bounded decode size');
  const raw = inflateSync(Buffer.concat(data), { maxOutputLength: expected });
  if (raw.length !== expected) throw new Error('PNG pixels do not match dimensions');
  for (let y = 0; y < height; y++) if (raw[y * stride] > 4) throw new Error('Invalid PNG row filter');
  return { width, height };
}
export function verifyCampaignRenderReceipt(root, candidateHash, field, reference, context = null) {
  if (!reference?.path || !reference.hash) throw new Error('Canonical render receipt reference required');
  const receiptPath = inside(root, reference.path), bytes = fs.readFileSync(receiptPath);
  if (hashValue(bytes) !== reference.hash) throw new Error('Render receipt missing or stale');
  const receipt = JSON.parse(bytes);
  if (context && (!activeRendererContexts.has(context) || context.root !== path.resolve(root))) throw new Error('Expired/foreign renderer validation context');
  if (receipt.format !== 'content-campaign-render-v1' || receipt.producer !== 'scripts/shoot-tikz.mjs' || receipt.candidateHash !== candidateHash || receipt.rendererSignature !== (context?.signature || campaignRendererSignature(root))) throw new Error('Render receipt candidate/producer/renderer mismatch');
  if (receipt.rendererDependencyProfile !== CAMPAIGN_RENDER_DEPENDENCY_PROFILE || !receipt.rendererDependencies?.path || !receipt.rendererDependencies?.hash) throw new Error('Complete renderer dependency binding required; historical partial signatures remain unverified');
  const dependencyBytes = fs.readFileSync(inside(root, receipt.rendererDependencies.path));
  if (hashValue(dependencyBytes) !== receipt.rendererDependencies.hash || hashValue(JSON.parse(dependencyBytes)) !== receipt.rendererSignature) throw new Error('Renderer dependency manifest changed');
  if (!receipt.renderEnvironment?.path || !receipt.renderEnvironment?.hash || hashValue(fs.readFileSync(inside(root, receipt.renderEnvironment.path))) !== receipt.renderEnvironment.hash) throw new Error('Render environment evidence missing or changed');
  const inputBytes = fs.readFileSync(inside(root, receipt.input.path)), manifestBytes = fs.readFileSync(inside(root, receipt.manifest.path));
  if (hashValue(inputBytes) !== receipt.input.hash || hashValue(manifestBytes) !== receipt.manifest.hash) throw new Error('Canonical render input/manifest changed');
  const input = JSON.parse(inputBytes).items, manifest = JSON.parse(manifestBytes), captured = receipt.fields.find(row => row.where === field.where);
  if (!captured || captured.fieldHash !== field.hash || JSON.stringify(captured.blockHashes) !== JSON.stringify(field.diagramHashes) || captured.artifacts.length !== field.diagramHashes.length) throw new Error('Render receipt does not cover every current block');
  captured.artifacts.forEach((artifact, index) => {
    if (artifact.blockIndex !== index || artifact.blockHash !== field.diagramHashes[index] || artifact.status !== 'pass') throw new Error('Render block receipt mismatch');
    const item = input.find(item => item.auditId === artifact.auditId), row = manifest.find(row => row.auditId === artifact.auditId);
    if (!item || hashValue('[tikz]' + item.code + '[/tikz]') !== artifact.blockHash || item.field !== `${field.where}[${index}]` || !row || row.status !== 'pass') throw new Error('Actual rendered input/manifest lacks this block');
    if (path.basename(artifact.path) !== row.png) throw new Error('Render artifact differs from capture manifest');
    const bytes = fs.readFileSync(inside(root, artifact.path));
    if (hashValue(bytes) !== artifact.hash) throw new Error('Rendered artifact missing or changed');
    const dimensions = pngDimensions(bytes);
    if (dimensions.width !== artifact.width || dimensions.height !== artifact.height) throw new Error('Rendered artifact dimensions changed');
  });
  return captured;
}
export function rebindCampaignRenderReceipt(root, { reference, candidateHash, fields, out }) {
  const bytes = fs.readFileSync(inside(root, reference.path));
  if (hashValue(bytes) !== reference.hash) throw new Error('Stale original render receipt');
  const original = JSON.parse(bytes);
  for (const field of fields) {
    if (hashValue(field.value) !== field.hash) throw new Error('Stale rebound field');
    verifyCampaignRenderReceipt(root, original.candidateHash, field, reference);
  }
  const file = inside(root, out);
  if (!relative(root, file).startsWith('.agywork/content-campaign/')) throw new Error('Rebound receipts must stay in ignored campaign directories');
  const receipt = { ...original, candidateHash, fields: original.fields.filter(field => fields.some(current => current.where === field.where)), reusedFrom: reference, reboundAt: new Date().toISOString() };
  if (fs.existsSync(file)) {
    const existing = { path: relative(root, file), hash: hashValue(fs.readFileSync(file)) };
    for (const field of fields) verifyCampaignRenderReceipt(root, candidateHash, field, existing);
    return existing;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(receipt, null, 2), { flag: 'wx' });
  return { path: relative(root, file), hash: hashValue(fs.readFileSync(file)) };
}
// Canonical producer: render actual staged blocks, never screenshots of currently
// published content that differ from the candidate. No visual verdict is generated.
export function captureCampaignDiagrams(root, { skillId, candidateHash, fields, out, base, batchSize = 12 }, { capture = null } = {}) {
  const directory = inside(root, out);
  if (!relative(root, directory).startsWith('.agywork/content-campaign/')) throw new Error('Campaign captures must use a fresh ignored campaign directory');
  if (fs.existsSync(directory)) throw new Error('Capture directory already exists; preserve prior evidence');
  if (!base) throw new Error('Explicit current dev-server base required');
  const items = [];
  for (const field of fields) {
    if (hashValue(field.value) !== field.hash) throw new Error('Stale staged field');
    [...field.value.matchAll(/\[tikz\]([\s\S]*?)\[\/tikz\]/g)].forEach((match, index) => {
      if (hashValue(match[0]) !== field.diagramHashes[index]) throw new Error('Stale diagram block');
      items.push({ skillId, auditId: `${field.where}:${index}`, field: `${field.where}[${index}]`, kind: 'campaign', q: field.value.replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '').trim(), a: '', code: match[1] });
    });
  }
  if (!items.length) throw new Error('No diagram blocks to capture');
  fs.mkdirSync(directory, { recursive: true });
  const rendererSignature = campaignRendererSignature(root);
  const dependencyPath = path.join(directory, 'renderer-dependencies.json');
  fs.writeFileSync(dependencyPath, JSON.stringify(campaignRendererDependencyManifest(root), null, 2), { flag: 'wx' });
  const input = { items }, inputPath = path.join(directory, 'input.json'), captures = path.join(directory, 'captures');
  fs.writeFileSync(inputPath, JSON.stringify(input));
  fs.writeFileSync(path.join(directory, 'capture-request.json'), JSON.stringify({ skillId, candidateHash, fields, base, rendererSignature, requestedAt: new Date().toISOString() }));
  const publicInput = path.join(root, 'public/.audit-input', 'campaign-' + randomUUID() + '.json');
  fs.mkdirSync(path.dirname(publicInput), { recursive: true }); fs.copyFileSync(inputPath, publicInput);
  try {
    if (capture) capture({ root, inputPath: publicInput, out: captures, base, items });
    else execFileSync(process.execPath, [path.join(root, 'scripts/shoot-tikz.mjs'), '--input', publicInput, '--out', captures, '--base', base, '--batch-size', String(batchSize)], { cwd: root, stdio: 'inherit', windowsHide: true });
  } finally { fs.unlinkSync(publicInput); }
  return finalizeCampaignDiagrams(root, { skillId, candidateHash, fields, directory, base, rendererSignature });
}
// Receipt assembly can resume after a bookkeeping failure without compiling
// unchanged diagrams again. Callers retain the original requested signature.
export function finalizeCampaignDiagrams(root, { candidateHash, fields, directory, base, rendererSignature }) {
  directory = inside(root, directory);
  if (!relative(root, directory).startsWith('.agywork/content-campaign/')) throw new Error('Campaign captures must stay in ignored campaign directories');
  for (const field of fields) if (hashValue(field.value) !== field.hash || JSON.stringify([...field.value.matchAll(/\[tikz\][\s\S]*?\[\/tikz\]/g)].map(match => hashValue(match[0]))) !== JSON.stringify(field.diagramHashes)) throw new Error('Stale captured field');
  const receiptPath = path.join(directory, 'render-receipt.json');
  if (fs.existsSync(receiptPath)) {
    const reference = { path: relative(root, receiptPath), hash: hashValue(fs.readFileSync(receiptPath)) };
    for (const field of fields) verifyCampaignRenderReceipt(root, candidateHash, field, reference);
    return reference;
  }
  const inputPath = path.join(directory, 'input.json'), captures = path.join(directory, 'captures');
  const input = readJson(inputPath), manifestPath = path.join(captures, 'manifest.json'), manifest = readJson(manifestPath);
  if (rendererSignature !== campaignRendererSignature(root)) throw new Error('Renderer changed during capture; current rendering is unverified');
  const dependencyPath = path.join(directory, 'renderer-dependencies.json');
  if (!fs.existsSync(dependencyPath) || hashValue(readJson(dependencyPath)) !== rendererSignature) throw new Error('Missing/stale complete renderer dependencies captured before pixels');
  const environmentPath = path.join(captures, 'render-environment.json');
  if (!fs.existsSync(environmentPath)) throw new Error('Actual browser/font render environment required');
  const environment = readJson(environmentPath);
  if (environment.format !== 'tikz-capture-environment-v1' || typeof environment.browserVersion !== 'string' || !environment.browserVersion || !Array.isArray(environment.viewports) || !environment.viewports.length || environment.viewports.some(row => !row.userAgent || !(row.devicePixelRatio > 0) || !(row.viewport?.width > 0) || !(row.viewport?.height > 0) || row.fontStatus !== 'loaded' || !Array.isArray(row.fonts))) throw new Error('Invalid browser/font render environment');
  const renderEnvironment = { path: relative(root, environmentPath), hash: hashValue(fs.readFileSync(environmentPath)) };
  const receipt = { format: 'content-campaign-render-v1', producer: 'scripts/shoot-tikz.mjs', candidateHash, rendererSignature, rendererDependencyProfile: CAMPAIGN_RENDER_DEPENDENCY_PROFILE, rendererDependencies: { path: relative(root, dependencyPath), hash: hashValue(fs.readFileSync(dependencyPath)) }, renderEnvironment, capturedAt: new Date().toISOString(), base, input: { path: relative(root, inputPath), hash: hashValue(fs.readFileSync(inputPath)) }, manifest: { path: relative(root, manifestPath), hash: hashValue(fs.readFileSync(manifestPath)) }, fields: fields.map(field => ({ where: field.where, fieldHash: field.hash, blockHashes: field.diagramHashes, artifacts: field.diagramHashes.map((blockHash, index) => {
    const auditId = `${field.where}:${index}`, row = manifest.find(row => row.auditId === auditId);
    const actualInput = input.items.find(item => item.auditId === auditId);
    if (!actualInput || hashValue('[tikz]' + actualInput.code + '[/tikz]') !== blockHash || actualInput.field !== `${field.where}[${index}]` || !row || row.status !== 'pass') throw new Error('Capture missing/failed block ' + auditId);
    const artifactPath = inside(root, relative(root, path.join(captures, row.png))), bytes = fs.readFileSync(artifactPath), dimensions = pngDimensions(bytes);
    return { auditId, path: relative(root, artifactPath), hash: hashValue(bytes), blockIndex: index, blockHash, status: 'pass', ...dimensions };
  }) })) };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  return { path: relative(root, receiptPath), hash: hashValue(fs.readFileSync(receiptPath)) };
}
