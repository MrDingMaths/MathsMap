import fs from 'node:fs';
import path from 'node:path';
import { hashValue, inside, readJson, relative, scopeDependencies, taxonomyAt } from './campaign-sources.mjs';
import { assignmentExecutionProfile } from './campaign-execution-profile.mjs';

export const PREREQUISITE_CONTEXT_PROFILE = 'native-prerequisite-context-ref-v1';
export const NATIVE_PREREQUISITE_READ_CONTRACT = 'Before authoring or reviewing, personally read EVERY complete prerequisite evidence pack in the guarded manifest. Keep the full parent Theory, including every example and figure. Explicitly record each pack hash/literalHash, read:true and its own reading observation, plus every full parent Theory/content hash, using recordPrerequisiteContextRead for this owned native assignment. File existence or a preparation does not establish reading. External/no-tools workers cannot use this profile.';
const fail = message => { throw new Error('Prerequisite context: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const bytesFor = value => JSON.stringify(value, null, 2) + '\n';
const artifact = (root, dir, name, value) => {
  const bytes = bytesFor(value), file = path.join(dir, name);
  return { file, value, bytes, ref: { path: relative(root, file), hash: hashValue(value), literalHash: hashValue(bytes) } };
};
function bindingFor(root, state, sources, dependencies) {
  check(state.owner?.workerLineage?.kind === 'native' && state.owner.workerLineage.actorId, 'profile requires an owned native actor');
  return {
    profile: PREREQUISITE_CONTEXT_PROFILE,
    skillId: state.skillId, assignmentId: state.owner.assignmentId, workerId: state.owner.workerId,
    role: state.owner.role, workerLineage: state.owner.workerLineage,
    executionProfile: assignmentExecutionProfile(state), scopeHash: hashValue(state.scope),
    taxonomyHash: hashValue(taxonomyAt(root)), sourceReferencesHash: hashValue(sources),
    dependencyHash: dependencies.hash, contextHash: hashValue(dependencies.context)
  };
}
function parentRecords(root, dependencies) {
  return dependencies.context.prerequisiteTheory.map(({ id, theory }) => {
    check(theory && typeof theory === 'object' && !Array.isArray(theory), 'complete current Theory missing for ' + id);
    const contentPath = `public/content/${id}.json`, content = readJson(inside(root, contentPath));
    check(hashValue(content.theory) === hashValue(theory), 'parent Theory changed: ' + id);
    return { id, contentPath, contentHash: hashValue(fs.readFileSync(inside(root, contentPath))),
      theoryHash: hashValue(theory), skillHash: hashValue(dependencies.context.prereqs.find(row => row.id === id)),
      keyOrder: Object.keys(theory), exampleCount: Array.isArray(theory.workedExamples) ? theory.workedExamples.length : null };
  });
}
/** Plans serialization only. Full dependency/context hashes keep complete parent teaching. */
export function planPrerequisiteContext(root, state, dir, sources, dependencies, { maxVariableChars = 24000 } = {}) {
  check(maxVariableChars <= 24000, 'native evidence cannot raise the 24000 character cap');
  const binding = bindingFor(root, state, sources, dependencies), identityHash = hashValue(binding), parents = parentRecords(root, dependencies);
  const units = [], packet = rows => ({ format: PREREQUISITE_CONTEXT_PROFILE, identityHash, units: rows });
  for (const { id, theory } of dependencies.context.prerequisiteTheory) {
    const full = { parentId: id, where: 'theory', hash: hashValue(theory), value: theory };
    if (JSON.stringify(packet([full])).length <= maxVariableChars) { units.push(full); continue; }
    const base = structuredClone(theory); delete base.workedExample; delete base.workedExamples;
    units.push({ parentId: id, where: 'base', hash: hashValue(base), value: base });
    if (Object.hasOwn(theory, 'workedExample')) units.push({ parentId: id, where: 'workedExample', hash: hashValue(theory.workedExample), value: theory.workedExample });
    if (Object.hasOwn(theory, 'workedExamples')) {
      check(Array.isArray(theory.workedExamples), 'workedExamples must remain a complete array');
      theory.workedExamples.forEach((value, i) => units.push({ parentId: id, where: `workedExamples[${i}]`, hash: hashValue(value), value }));
    }
  }
  const groups = []; let current = [];
  for (const unit of units) {
    check(JSON.stringify(packet([unit])).length <= maxVariableChars, 'indivisible complete teaching unit exceeds bound: ' + unit.parentId + '.' + unit.where);
    if (current.length && JSON.stringify(packet([...current, unit])).length > maxVariableChars) { groups.push(current); current = []; }
    current.push(unit);
  }
  if (current.length) groups.push(current);
  const packs = groups.map(rows => { const value = packet(rows); return artifact(root, dir, `prerequisite-pack-${identityHash}-${hashValue(value)}.json`, value); });
  const packRefs = packs.map(a => ({ ...a.ref, variableChars: JSON.stringify(a.value).length, units: a.value.units.map(({ value, ...unit }) => unit) }));
  const manifestValue = { format: PREREQUISITE_CONTEXT_PROFILE, identityHash, binding, parents, packs: packRefs };
  check(JSON.stringify(manifestValue).length <= maxVariableChars, 'complete prerequisite manifest exceeds bound');
  const manifest = artifact(root, dir, `prerequisite-context-${identityHash}-${hashValue(manifestValue)}.json`, manifestValue);
  const reference = { profile: PREREQUISITE_CONTEXT_PROFILE, identityHash, manifest: manifest.ref };
  const context = structuredClone(dependencies.context);
  context.prerequisiteTheory = parents.map(p => ({ id: p.id, theoryHash: p.theoryHash, contentHash: p.contentHash, prerequisiteContextReference: reference }));
  return { reference, context, artifacts: [...packs, manifest] };
}
export function savePrerequisiteContext(plan) {
  for (const a of plan.artifacts) {
    if (fs.existsSync(a.file)) check(fs.readFileSync(a.file, 'utf8') === a.bytes, 'immutable evidence changed: ' + a.ref.path);
    else fs.writeFileSync(a.file, a.bytes, { flag: 'wx' });
  }
}
function readArtifact(root, ref) {
  check(ref && typeof ref.path === 'string' && /^[a-f0-9]{64}$/.test(ref.hash || '') && /^[a-f0-9]{64}$/.test(ref.literalHash || ''), 'missing/malformed artifact reference');
  const file = inside(root, ref.path); check(fs.existsSync(file), 'missing evidence artifact: ' + ref.path);
  const bytes = fs.readFileSync(file); check(hashValue(bytes) === ref.literalHash, 'altered literal evidence: ' + ref.path);
  let value; try { value = JSON.parse(bytes); } catch { fail('malformed evidence JSON'); }
  check(hashValue(value) === ref.hash, 'altered evidence value: ' + ref.path); return value;
}
export function validatePrerequisiteContext(root, state, { requireRead = true } = {}) {
  const prepared = state.owner?.prepared, reference = prepared?.prerequisiteContextReference;
  check(reference?.profile === PREREQUISITE_CONTEXT_PROFILE && prepared.prerequisiteContextProfile === PREREQUISITE_CONTEXT_PROFILE, 'missing/unknown captured profile/reference');
  const deps = scopeDependencies(root, state.skillId, state.scope, prepared.sources), binding = bindingFor(root, state, prepared.sources, deps);
  check(deps.hash === prepared.dependencyHash, 'stale source/scope/prerequisite dependencies');
  const manifest = readArtifact(root, reference.manifest);
  const directory = path.dirname(inside(root, prepared.snapshotPath));
  const ownedArtifact = (ref, name) => check(path.dirname(inside(root, ref.path)) === directory && path.basename(ref.path) === name, 'foreign artifact owner/path');
  ownedArtifact(reference.manifest, `prerequisite-context-${reference.identityHash}-${reference.manifest.hash}.json`);
  check(manifest.format === PREREQUISITE_CONTEXT_PROFILE && hashValue(manifest.binding) === hashValue(binding) && reference.identityHash === hashValue(binding) && manifest.identityHash === reference.identityHash, 'stale/foreign assignment, profile or context identity');
  const parents = parentRecords(root, deps); check(hashValue(manifest.parents) === hashValue(parents), 'stale parent content/Theory/taxonomy');
  check(Array.isArray(manifest.packs), 'missing complete teaching packs');
  const units = [];
  for (const ref of manifest.packs) {
    ownedArtifact(ref, `prerequisite-pack-${reference.identityHash}-${ref.hash}.json`);
    const value = readArtifact(root, ref);
    check(value.format === PREREQUISITE_CONTEXT_PROFILE && value.identityHash === reference.identityHash && Array.isArray(value.units), 'foreign/malformed teaching pack');
    check(JSON.stringify(value).length <= 24000 && ref.variableChars === JSON.stringify(value).length, 'teaching pack exceeds bound or has stale size');
    check(hashValue(value.units.map(({ value, ...u }) => u)) === hashValue(ref.units), 'changed unit descriptors');
    value.units.forEach(u => { check(u.hash === hashValue(u.value), 'changed teaching unit'); units.push(u); });
  }
  check(new Set(units.map(u => `${u.parentId}:${u.where}`)).size === units.length, 'duplicate teaching unit');
  for (const p of parents) {
    const rows = units.filter(u => u.parentId === p.id), full = rows.find(u => u.where === 'theory'); let theory;
    if (full) { check(rows.length === 1, 'mixed full and split Theory'); theory = full.value; }
    else {
      const base = rows.find(u => u.where === 'base'); check(base, 'missing complete base teaching'); const values = { ...base.value };
      check(!Object.hasOwn(values, 'workedExample') && !Object.hasOwn(values, 'workedExamples'), 'split base includes examples');
      const singular = rows.find(u => u.where === 'workedExample');
      if (p.keyOrder.includes('workedExample')) { check(singular, 'missing singular worked example'); values.workedExample = singular.value; }
      const examples = rows.filter(u => /^workedExamples\[\d+\]$/.test(u.where));
      if (p.keyOrder.includes('workedExamples')) { check(examples.length === p.exampleCount, 'missing complete worked examples'); values.workedExamples = Array.from({ length: p.exampleCount }, (_, i) => { const u = examples.find(e => e.where === `workedExamples[${i}]`); check(u, 'missing ordered worked example'); return u.value; }); }
      check(rows.length === 1 + Number(!!singular) + examples.length, 'foreign semantic teaching unit');
      theory = Object.fromEntries(p.keyOrder.map(k => [k, values[k]]));
      check(Object.keys(values).length === p.keyOrder.length, 'altered base teaching fields');
    }
    check(hashValue(theory) === p.theoryHash, 'incomplete/reordered parent Theory');
  }
  check(units.every(u => parents.some(p => p.id === u.parentId)), 'foreign parent teaching');
  for (const packetRef of prepared.packets || []) {
    const packet = readJson(inside(root, packetRef.path));
    check(path.dirname(inside(root, packetRef.path)) === directory && path.basename(packetRef.path) === `packet-${packet.part}-${hashValue(packet)}.json`, 'altered/foreign whole-question packet');
    check(JSON.stringify(packet).length === packetRef.variableChars && packetRef.variableChars <= 24000, 'question packet budget changed');
    check(hashValue(packet.prerequisiteContextReference) === hashValue(reference) && packet.prerequisiteContextProfile === PREREQUISITE_CONTEXT_PROFILE, 'question packet reference missing/altered');
    const expected = parents.map(p => ({ id:p.id, theoryHash:p.theoryHash, contentHash:p.contentHash, prerequisiteContextReference:reference }));
    check(hashValue(packet.context.prerequisiteTheory) === hashValue(expected), 'question packet parent context altered');
    const context = structuredClone(deps.context); context.prerequisiteTheory = expected;
    check(hashValue(packet.context) === hashValue(context) && hashValue(packet.scope) === hashValue(state.scope) && hashValue(packet.profile) === hashValue(assignmentExecutionProfile(state)), 'question packet source/scope/profile context altered');
    check(packet.nativePrerequisiteInstruction === NATIVE_PREREQUISITE_READ_CONTRACT, 'native reading instruction missing/altered');
  }
  if (requireRead) {
    check(prepared.prerequisiteReadReceipt, 'complete current parent teaching has not been acknowledged read');
    ownedArtifact(prepared.prerequisiteReadReceipt, `prerequisite-read-${prepared.prerequisiteReadReceipt.hash}.json`);
    const receipt = readArtifact(root, prepared.prerequisiteReadReceipt);
    check(hashValue(receipt.reference) === hashValue(reference) && hashValue(receipt.binding) === hashValue(binding), 'foreign/stale read receipt');
    validateReadAcknowledgment(manifest, receipt.acknowledgment);
  }
  return manifest;
}
export function validateReadAcknowledgment(manifest, acknowledgment) {
  check(acknowledgment?.complete === true && typeof acknowledgment.observation === 'string' && acknowledgment.observation.trim(), 'explicit complete reading observation required');
  check(hashValue(acknowledgment.parents) === hashValue(manifest.parents.map(({ id, theoryHash, contentHash }) => ({ id, theoryHash, contentHash }))), 'read acknowledgment missing/stale parent Theory');
  check(Array.isArray(acknowledgment.packs) && acknowledgment.packs.every(p => p.read === true && typeof p.observation === 'string' && p.observation.trim()), 'explicit per-pack reading observations required');
  check(hashValue(acknowledgment.packs.map(({ path, hash, literalHash }) => ({ path, hash, literalHash }))) === hashValue(manifest.packs.map(({ path, hash, literalHash }) => ({ path, hash, literalHash }))), 'read acknowledgment missing/stale/foreign pack');
}
export function rejectPrerequisiteReferencesForExternal(prepared, state, root) {
  const captured = state?.owner?.prepared;
  check(!prepared?.prerequisiteContextProfile && !prepared?.prerequisiteContextReference && !captured?.prerequisiteContextProfile && !captured?.prerequisiteContextReference && !(root && (hasPrerequisiteContext(root, prepared || {}) || hasPrerequisiteContext(root, captured || {}))), 'native-only prerequisite references cannot be sent to external/no-tools workers');
}
export function hasPrerequisiteContext(root, prepared) {
  if (prepared.prerequisiteContextProfile || prepared.prerequisiteContextReference) return true;
  // Detect a missing captured descriptor on an otherwise intact new-profile
  // packet. Legacy packets are neither rewritten nor given a new read gate.
  return (prepared.packets || []).some(ref => {
    const file = inside(root, ref.path); if (!fs.existsSync(file)) return false;
    const packet = readJson(file);
    return !!(packet.prerequisiteContextProfile || packet.prerequisiteContextReference || packet.context?.prerequisiteTheory?.some(p => p.prerequisiteContextReference));
  });
}
export function prerequisitePacketContext(root, state, dependencies) {
  const manifest = validatePrerequisiteContext(root, state, { requireRead: false }), reference = state.owner.prepared.prerequisiteContextReference;
  const context = structuredClone(dependencies.context);
  context.prerequisiteTheory = manifest.parents.map(p => ({ id:p.id, theoryHash:p.theoryHash, contentHash:p.contentHash, prerequisiteContextReference:reference }));
  return context;
}
