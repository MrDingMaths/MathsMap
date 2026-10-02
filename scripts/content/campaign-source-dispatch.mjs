import fs from 'node:fs';
import path from 'node:path';
import { createSourceSelectionContext, selectSourceEvidence, readSelectedEvidence } from './campaign-source-selection.mjs';
import { hashValue, inside, readJson, relative, validateSourceImages } from './campaign-sources.mjs';

/** Candidate selection supplies evidence to authoring; it supplies no review credit. */
export function createSourcePreparer({ root, campaignId, budgetChars = 10000, context = null } = {}) {
  let catalogContext = context;
  const preview = ({ state, assignment }) => {
    const skillId = state.skillId || assignment?.skillId;
    if (!skillId) throw new Error('Source preview skill required');
    const overridePath = inside(root, `.agywork/content-campaign/${campaignId}/source-overrides/${skillId}.json`);
    let selection;
    if (fs.existsSync(overridePath)) {
      const override = readJson(overridePath);
      if (override.skillId !== skillId || !Array.isArray(override.sources)) throw new Error('Source override must identify the current skill and exact sources');
      const sources = override.sources.map(ref => ({ ...ref, support: state.scope.stage === 3 && /Stage [4-6]/.test(ref.path) ? 'indirect' : ref.support === 'indirect' ? 'indirect' : 'candidate' }));
      const read = readSelectedEvidence(root, sources, { budgetChars });
      selection = { ...override, accepted: false, evidenceStatus: 'candidate-only', origin: 'semantic-source-candidate-override', sources, gaps: read.gaps, normalizedChars: read.normalizedChars, scope: state.scope, override: { path: relative(root, overridePath), hash: hashValue(fs.readFileSync(overridePath)) } };
      selection.dispatchReady = selection.sources.length > 0 && !selection.gaps.length;
      if (state.scope.pending) { selection.gaps.push({ kind: 'governing-scope-gap', reason: state.scope.pending }); selection.dispatchReady = false; }
    } else {
      catalogContext ||= createSourceSelectionContext(root);
      selection = selectSourceEvidence({ root, skillId, campaignId, budgetChars, context: catalogContext, state });
    }
    for (const ref of selection.sources) {
      try { ref.images = validateSourceImages(root, ref); }
      catch (error) { selection.gaps.push({ kind: 'source-image-gap', path: ref.path, reason: error.message }); selection.dispatchReady = false; }
    }
    return selection;
  };
  const prepare = ({ assignment, state }) => {
    if (state.skillId && assignment.skillId !== state.skillId) throw new Error('Source preparation skill mismatch');
    const selection = preview({ state, assignment });
    const output = inside(root, `.agywork/content-campaign/${campaignId}/${assignment.skillId}/${assignment.assignmentId}/source-selection.json`);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const bytes = JSON.stringify(selection, null, 2) + '\n';
    if (fs.existsSync(output) && fs.readFileSync(output, 'utf8') !== bytes) throw new Error('Existing assignment source selection changed; preserve it and reconcile before dispatch');
    if (!fs.existsSync(output)) fs.writeFileSync(output, bytes, { flag: 'wx' });
    if (!selection.dispatchReady) {
      const error = new Error('Source selection requires reconciliation before dispatch: ' + selection.gaps.map(gap => gap.kind).join(', '));
      error.code = 'SOURCE_PREPARATION_GAP'; error.gaps = selection.gaps; throw error;
    }
    const hints = selection.curatedNotes || selection.notes || null;
    return { sources: selection.sources.map((ref, index) => index ? ref : { ...ref, selection: { path: relative(root, output), hash: hashValue(bytes), status: 'candidate-only', hints } }) };
  };
  // Readiness supplies no acceptance and writes no assignment receipt. The real
  // assignment repeats source/hash validation before saving its immutable record.
  prepare.preview = preview;
  return prepare;
}
