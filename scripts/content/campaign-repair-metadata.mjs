import fs from 'node:fs';
import path from 'node:path';
import { hashValue, inside, relative, scopeDependencies } from './campaign-sources.mjs';
import { assignmentExecutionProfile } from './campaign-execution-profile.mjs';

export const REPAIR_METADATA_PROFILE = 'native-repair-metadata-ref-v1';
export const REPAIR_METADATA_READ_CONTRACT = 'Personally read the complete guarded repair metadata artifact, including every prior finding, repair target and previous-review outcome, before editing. Record its exact reference and an explicit complete reading observation with recordRepairMetadataRead. A reference or file existence is not reading; external workers cannot use this profile.';
const check = (ok, message) => { if (!ok) throw Error('Repair metadata: ' + message); };
const bytesFor = value => JSON.stringify(value, null, 2) + '\n';
function bindingFor(root, state, snapshot, sources, dependencies) {
  check(state.owner?.workerLineage?.kind === 'native' && state.owner.workerLineage.actorId, 'owned native actor required');
  return { skillId: state.skillId, assignmentId: state.owner.assignmentId, workerId: state.owner.workerId,
    workerLineage: state.owner.workerLineage, role: state.owner.role, executionProfile: assignmentExecutionProfile(state),
    stageHash: state.stage?.hash, candidateHash: state.stage?.candidateHash,
    snapshotHash: hashValue({ content: snapshot.content, quiz: snapshot.quiz }), reviewHash: hashValue(state.review),
    scopeHash: hashValue(state.scope), sourceReferencesHash: hashValue(sources), dependencyHash: dependencies.hash };
}
export function planRepairMetadata(root, state, directory, snapshot, sources, dependencies, metadata) {
  check(state.status === 'repair-needed' && state.stage && state.review, 'current reviewed repair required');
  const binding = bindingFor(root, state, snapshot, sources, dependencies);
  const value = { format: REPAIR_METADATA_PROFILE, binding, metadata: structuredClone(metadata) }, bytes = bytesFor(value);
  const reference = { profile: REPAIR_METADATA_PROFILE, path: relative(root, path.join(directory, `repair-metadata-${hashValue(value)}.json`)), hash: hashValue(value), literalHash: hashValue(bytes) };
  return { reference, value, bytes, file: inside(root, reference.path) };
}
export function saveRepairMetadata(plan) {
  if (fs.existsSync(plan.file)) check(fs.readFileSync(plan.file, 'utf8') === plan.bytes, 'immutable artifact changed');
  else fs.writeFileSync(plan.file, plan.bytes, { flag: 'wx' });
}
export function hasRepairMetadata(root, prepared) {
  if (prepared.repairMetadataProfile || prepared.repairMetadataReference || prepared.repairMetadataReadReceipt) return true;
  return (prepared.packets || []).some(row => {
    const packet = JSON.parse(fs.readFileSync(inside(root, row.path)));
    return packet.repairMetadataProfile || packet.repairMetadataReference || packet.priorFindings?.reference;
  });
}
function readArtifact(root, ref, directory, prefix) {
  check(ref && typeof ref.path === 'string' && /^[a-f0-9]{64}$/.test(ref.hash || '') && /^[a-f0-9]{64}$/.test(ref.literalHash || ''), 'missing/malformed reference');
  const file = inside(root, ref.path);
  check(path.dirname(file) === directory && path.basename(file) === `${prefix}-${ref.hash}.json`, 'foreign artifact owner/path');
  check(fs.existsSync(file), 'missing artifact');
  const bytes = fs.readFileSync(file); check(hashValue(bytes) === ref.literalHash, 'altered literal artifact');
  let value; try { value = JSON.parse(bytes); } catch { throw Error('Repair metadata: malformed artifact JSON'); }
  check(hashValue(value) === ref.hash, 'altered artifact value'); return value;
}
export function validateRepairMetadata(root, state, metadata, { requireRead = true, packets = null } = {}) {
  const prepared = state.owner?.prepared, ref = prepared?.repairMetadataReference;
  check(prepared?.repairMetadataProfile === REPAIR_METADATA_PROFILE && ref?.profile === REPAIR_METADATA_PROFILE, 'missing/unknown captured profile');
  const directory = path.dirname(inside(root, prepared.snapshotPath));
  const snapshot = JSON.parse(fs.readFileSync(inside(root, prepared.snapshotPath)));
  const deps = scopeDependencies(root, state.skillId, state.scope, prepared.sources);
  check(deps.hash === prepared.dependencyHash, 'stale source/scope/teaching');
  const value = readArtifact(root, ref, directory, 'repair-metadata');
  check(value.format === REPAIR_METADATA_PROFILE && hashValue(value.binding) === hashValue(bindingFor(root, state, snapshot, prepared.sources, deps)), 'stale/foreign assignment, stage, candidate, snapshot or source binding');
  check(hashValue(value.metadata) === hashValue(metadata), 'changed/incomplete findings, targets or previous review');
  for (const packet of packets || prepared.packets.map(row => JSON.parse(fs.readFileSync(inside(root, row.path))))) {
    check(packet.repairMetadataProfile === REPAIR_METADATA_PROFILE && hashValue(packet.repairMetadataReference ?? null) === hashValue(ref) && packet.nativeRepairMetadataInstruction === REPAIR_METADATA_READ_CONTRACT, 'missing/changed packet reference or reading instruction');
    check(hashValue(packet.priorFindings ?? null) === hashValue({ reference: ref }) && hashValue(packet.previousReview ?? null) === hashValue({ reference: ref }) && hashValue(packet.repairTargets ?? null) === hashValue({ reference: ref }), 'packet metadata reference altered');
    check(JSON.stringify(packet).length <= 24000, 'native question packet exceeds bound');
  }
  if (requireRead) {
    check(prepared.repairMetadataReadReceipt, 'complete metadata has not been acknowledged read');
    const receipt = readArtifact(root, prepared.repairMetadataReadReceipt, directory, 'repair-metadata-read');
    check(receipt.format === REPAIR_METADATA_PROFILE && hashValue(receipt.reference) === hashValue(ref) && hashValue(receipt.binding) === hashValue(value.binding), 'foreign/stale read receipt');
    check(receipt.acknowledgment?.complete === true && receipt.acknowledgment.observation?.trim() && hashValue(receipt.acknowledgment.reference ?? null) === hashValue(ref), 'explicit complete exact-reference reading required');
  }
  return value;
}
export function saveRepairMetadataRead(root, state, value, acknowledgment) {
  const prepared = state.owner.prepared;
  check(!prepared.repairMetadataReadReceipt, 'reading already recorded; retain immutable receipt');
  check(acknowledgment?.complete === true && acknowledgment.observation?.trim() && hashValue(acknowledgment.reference ?? null) === hashValue(prepared.repairMetadataReference), 'explicit complete exact-reference reading required');
  const receipt = { format: REPAIR_METADATA_PROFILE, reference: prepared.repairMetadataReference, binding: value.binding, acknowledgment: structuredClone(acknowledgment), readAt: new Date().toISOString() };
  const bytes = bytesFor(receipt), file = path.join(path.dirname(inside(root, prepared.snapshotPath)), `repair-metadata-read-${hashValue(receipt)}.json`);
  fs.writeFileSync(file, bytes, { flag: 'wx' });
  return { path: relative(root, file), hash: hashValue(receipt), literalHash: hashValue(bytes) };
}
