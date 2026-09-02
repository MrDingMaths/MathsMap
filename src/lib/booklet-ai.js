// The dev-only AI seam intentionally accepts one selected node at a time.
// Nothing in this module can submit a whole project or publish a proposal.

import { deepCopy, normalizeBlock } from './booklet-model.js';

export const AI_PROPOSAL_FORMAT = 'mathsmap-booklet-ai-proposal-v1';

export function buildAiEditRequest(node, { previous = null, next = null } = {}) {
  return {
    format: AI_PROPOSAL_FORMAT,
    action: 'replace-selected-node',
    selectedNode: deepCopy(node),
    context: {
      previous: previous ? deepCopy(previous) : null,
      next: next ? deepCopy(next) : null,
    },
    schema: {
      type: 'object',
      required: ['before', 'after', 'reason'],
      properties: { before: { type: 'object' }, after: { type: 'object' }, reason: { type: 'string' } },
    },
  };
}

export function validateAiProposal(proposal, selectedNode) {
  const errors = [];
  if (!proposal || typeof proposal !== 'object') return { errors: ['AI proposal must be an object'], proposal: null };
  if (!proposal.before || !proposal.after) errors.push('AI proposal needs before and after nodes');
  if (proposal.before?.id !== selectedNode?.id || proposal.after?.id !== selectedNode?.id) errors.push('AI proposal must target the selected node only');
  if (proposal.scope && proposal.scope !== 'selected-node') errors.push('AI proposal scope must be selected-node');
  if (proposal.after?.type && proposal.after.type !== selectedNode?.type) errors.push('AI proposal cannot change the selected node type');
  return { errors, proposal: errors.length ? null : { ...deepCopy(proposal), format: AI_PROPOSAL_FORMAT, scope: 'selected-node' } };
}

export async function requestAiProposal(node, context = {}, { fetchImpl = globalThis.fetch, endpoint = '/__codex/booklet-edit' } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Local Codex endpoint is unavailable');
  const response = await fetchImpl(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(buildAiEditRequest(node, context)) });
  if (!response.ok) throw new Error(`AI edit request failed (${response.status})`);
  const checked = validateAiProposal(await response.json(), node);
  if (checked.errors.length) throw new Error(checked.errors.join('; '));
  return checked.proposal;
}

export function applyAiProposal(project, proposal) {
  const value = deepCopy(project);
  const section = value.sections?.find((item) => item.blocks?.some((block) => block.id === proposal?.after?.id));
  if (!section) throw new Error('Selected AI node is no longer in the project');
  const index = section.blocks.findIndex((block) => block.id === proposal.after.id);
  if (index < 0) throw new Error('Selected AI node is no longer in the project');
  section.blocks[index] = normalizeBlock(proposal.after, index);
  return value;
}
