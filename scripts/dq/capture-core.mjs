import { createHash } from 'node:crypto';

export const DEFAULT_LIMIT_PER_SORT = 100;
export const DEFAULT_TOP_PER_LEAF = 10;
export const DEFAULT_ADAPTIVE_LIMITS = Object.freeze([30, 60, 100]);
export const TAXONOMY_PROGRESS_VERSION = 2;
export const LIKED_WEIGHT = 0.55;
export const MISCONCEPTION_WEIGHT = 0.45;
export const DEFAULT_INTERSECTION_BONUS = 0.1;

export function normalizeWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function normalizeCategoryName(value = '') {
  return normalizeWhitespace(value)
    .replace(/^\d[\d,]*\s+/, '')
    .replace(/\s+\d[\d,]*\s*$/, '')
    .trim();
}

export function isExcludedCategoryName(value, exclusions = []) {
  const normalized = normalizeCategoryName(value).toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith('random question on ')) return true;
  return exclusions.some((excluded) => normalizeCategoryName(excluded).toLowerCase() === normalized);
}

export function slugify(value = '') {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'root';
}

export function pathKey(path = []) {
  return path.map(slugify).join('/') || 'root';
}

export function categoryIdentityKey(category) {
  if (Array.isArray(category)) return `path:${pathKey(category)}`;
  const subjectId = normalizeWhitespace(category?.subjectId || '');
  if (subjectId) return `subject:${subjectId}`;
  const url = normalizeWhitespace(category?.url || '');
  if (url) return `url:${sha256(url).slice(0, 20)}`;
  return `path:${pathKey(category?.categoryPath || [])}`;
}

export function subjectIdFromUrl(value) {
  if (!value) return null;
  const url = value instanceof URL ? value : new URL(value, 'https://invalid.local/');
  for (const [key, subjectId] of url.searchParams) {
    if (key.toLowerCase() === 'currentsubjectid') return normalizeWhitespace(subjectId) || null;
  }
  return null;
}

export function resolveRequestedLeaf(leafNodes, requestedPath) {
  const matches = (leafNodes || []).filter((node) =>
    pathKey(node.categoryPath) === pathKey(requestedPath)
  );
  if (matches.length > 1) {
    throw new Error(`Ambiguous --leaf-path matches ${matches.length} category IDs: ${requestedPath.join(' > ')}`);
  }
  return matches[0] || requestedPath;
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function stableQuestionId(question) {
  const explicit = normalizeWhitespace(question?.sourceId || question?.id || '');
  if (explicit) return explicit;
  const material = [question?.imageUrl, question?.questionUrl, question?.text]
    .map(normalizeWhitespace)
    .filter(Boolean)
    .join('\n');
  if (!material) throw new Error('Question has neither a source ID nor stable identifying content');
  return `anon-${sha256(material).slice(0, 20)}`;
}

function rankValue(rank, limit) {
  if (!Number.isInteger(rank) || rank < 1 || rank > limit) return 0;
  if (limit === 1) return 1;
  return (limit - rank) / (limit - 1);
}

function mergeDefined(base, incoming) {
  const result = { ...base };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (value !== undefined && value !== null && value !== '') result[key] = value;
  }
  return result;
}

/**
 * Fuse two ordered result sets. Input array order is authoritative; any supplied
 * `rank` is retained only as source metadata.
 */
export function fuseRankedQuestions({
  liked = [],
  misconceptions = [],
  limitPerSort = DEFAULT_LIMIT_PER_SORT,
  top = DEFAULT_TOP_PER_LEAF,
  intersectionBonus = DEFAULT_INTERSECTION_BONUS
} = {}) {
  const merged = new Map();

  function ingest(items, sort) {
    items.slice(0, limitPerSort).forEach((raw, index) => {
      const sourceId = stableQuestionId(raw);
      const previous = merged.get(sourceId) || { sourceId };
      const question = mergeDefined(previous, raw);
      question.sourceId = sourceId;
      question.ranks = {
        ...(previous.ranks || {}),
        [sort]: index + 1
      };
      merged.set(sourceId, question);
    });
  }

  ingest(liked, 'liked');
  ingest(misconceptions, 'misconceptions');

  return [...merged.values()]
    .map((question) => {
      const likedScore = rankValue(question.ranks?.liked, limitPerSort);
      const misconceptionScore = rankValue(question.ranks?.misconceptions, limitPerSort);
      const appearsInBoth = Boolean(question.ranks?.liked && question.ranks?.misconceptions);
      // The bonus is strongest when the question is near the top of both lists.
      const bonus = appearsInBoth
        ? intersectionBonus * Math.min(likedScore, misconceptionScore)
        : 0;
      return {
        ...question,
        ranking: {
          likedScore,
          misconceptionScore,
          intersectionBonus: bonus,
          fusedScore: LIKED_WEIGHT * likedScore + MISCONCEPTION_WEIGHT * misconceptionScore + bonus
        }
      };
    })
    .sort((a, b) =>
      b.ranking.fusedScore - a.ranking.fusedScore ||
      (a.ranks?.liked ?? Number.POSITIVE_INFINITY) - (b.ranks?.liked ?? Number.POSITIVE_INFINITY) ||
      (a.ranks?.misconceptions ?? Number.POSITIVE_INFINITY) - (b.ranks?.misconceptions ?? Number.POSITIVE_INFINITY) ||
      a.sourceId.localeCompare(b.sourceId)
    )
    .slice(0, top);
}

function sameCandidateMembership(left, right) {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right.map((candidate) => candidate.sourceId));
  return left.every((candidate) => rightIds.has(candidate.sourceId));
}

/**
 * Decide whether a leaf needs a deeper retrieval pass. Stability is based on
 * shortlist membership rather than exact fused order: a later worker can use
 * the scores for ordering, while capture only needs a dependable candidate set.
 */
export function assessAdaptiveShortlist({
  liked = [],
  misconceptions = [],
  limitPerSort,
  comparisonLimit,
  top = DEFAULT_TOP_PER_LEAF
} = {}) {
  if (!Number.isInteger(limitPerSort) || limitPerSort < 1) {
    throw new Error('limitPerSort must be a positive integer');
  }
  const effectiveComparisonLimit = Math.min(
    limitPerSort,
    comparisonLimit ?? Math.max(top, Math.floor(limitPerSort / 2))
  );
  const candidates = fuseRankedQuestions({ liked, misconceptions, limitPerSort, top });
  const comparisonCandidates = fuseRankedQuestions({
    liked,
    misconceptions,
    limitPerSort: effectiveComparisonLimit,
    top
  });
  const filled = candidates.length >= top;
  const stable = filled && comparisonCandidates.length >= top &&
    sameCandidateMembership(candidates, comparisonCandidates);
  return {
    candidates,
    comparisonLimit: effectiveComparisonLimit,
    filled,
    stable,
    shouldExpand: !filled || !stable,
    reason: !filled ? 'underfilled' : stable ? 'stable' : 'unstable'
  };
}

export function createRetrievalPolicy({ limitPerSort, top = DEFAULT_TOP_PER_LEAF } = {}) {
  if (limitPerSort !== undefined) {
    if (!Number.isInteger(limitPerSort) || limitPerSort < 1) {
      throw new Error('limitPerSort must be a positive integer');
    }
    return {
      version: 1,
      mode: 'fixed',
      limits: [limitPerSort],
      top,
      stability: null
    };
  }
  return {
    version: 1,
    mode: 'adaptive',
    limits: [...DEFAULT_ADAPTIVE_LIMITS],
    top,
    stability: 'shortlist-membership'
  };
}

export function retrievalPoliciesEqual(left, right) {
  return Boolean(left && right) && JSON.stringify(left) === JSON.stringify(right);
}

export function retrievalPolicyFingerprint(policy) {
  return sha256(JSON.stringify(policy));
}

export function recordTaxonomy(state, {
  leaves,
  leafNodes,
  nodes,
  edges,
  aliases,
  requestedLeaf,
  requestedNode,
  recordedAt = new Date().toISOString()
} = {}) {
  if (requestedLeaf) {
    const priorScopedRuns = state.taxonomy?.scopedRuns || [];
    state.taxonomy = {
      ...(state.taxonomy || { leaves: [] }),
      scopedRuns: [
        ...priorScopedRuns.filter((entry) => pathKey(entry.categoryPath) !== pathKey(requestedLeaf)),
        {
          categoryPath: [...requestedLeaf],
          ...(requestedNode ? {
            label: requestedNode.label,
            url: requestedNode.url,
            subjectId: requestedNode.subjectId
          } : {}),
          recordedAt
        }
      ]
    };
  } else {
    state.taxonomy = {
      ...(state.taxonomy || {}),
      leaves: (leaves || leafNodes?.map((node) => node.categoryPath) || [])
        .map((categoryPath) => [...categoryPath]),
      leafNodes: (leafNodes || []).map((node) => ({ ...node, categoryPath: [...node.categoryPath] })),
      nodes: (nodes || []).map((node) => ({ ...node, categoryPath: [...node.categoryPath] })),
      edges: (edges || []).map((edge) => ({ ...edge })),
      aliases: (aliases || []).map((alias) => ({ ...alias, categoryPath: [...alias.categoryPath] })),
      discoveredAt: recordedAt
    };
  }
  return state.taxonomy;
}

/** Traverse URL/ID-backed taxonomy nodes without conflating duplicate labels. */
export async function enumerateLeafCategories(adapter, {
  root = { label: 'Maths', categoryPath: [] },
  maxDepth = 12
} = {}) {
  const leaves = [];
  const nodes = [];
  const visited = new Set();

  async function visit(rawNode) {
    const node = {
      ...rawNode,
      label: normalizeCategoryName(rawNode.label || rawNode.categoryPath?.at(-1) || ''),
      categoryPath: [...(rawNode.categoryPath || [])]
    };
    if (node.categoryPath.length > maxDepth) {
      throw new Error(`Taxonomy exceeded max depth ${maxDepth} at ${node.categoryPath.join(' > ')}`);
    }
    const identity = categoryIdentityKey(node);
    if (visited.has(identity)) return;
    visited.add(identity);
    nodes.push(node);

    const rawChildren = await adapter.listChildren(node);
    const children = [];
    const childIdentities = new Set();
    for (const rawChild of rawChildren || []) {
      const label = normalizeCategoryName(rawChild?.label || rawChild?.name || rawChild);
      if (!label) continue;
      const child = typeof rawChild === 'string'
        ? { label, categoryPath: [...node.categoryPath, label] }
        : { ...rawChild, label, categoryPath: [...node.categoryPath, label] };
      const childIdentity = categoryIdentityKey(child);
      if (childIdentities.has(childIdentity)) continue;
      childIdentities.add(childIdentity);
      children.push(child);
    }
    if (children.length === 0) {
      if (node.categoryPath.length) leaves.push(node);
      return;
    }
    for (const child of children) await visit(child);
  }

  await visit(root);
  return { nodes, leaves };
}

function normalizeTaxonomyChildren(node, rawChildren) {
  const children = [];
  const childIdentities = new Set();
  for (const rawChild of rawChildren || []) {
    const label = normalizeCategoryName(rawChild?.label || rawChild?.name || rawChild);
    if (!label) continue;
    const child = typeof rawChild === 'string'
      ? { label, categoryPath: [...node.categoryPath, label] }
      : { ...rawChild, label, categoryPath: [...node.categoryPath, label] };
    const childIdentity = categoryIdentityKey(child);
    if (childIdentities.has(childIdentity)) continue;
    childIdentities.add(childIdentity);
    children.push(child);
  }
  return children;
}

function taxonomySourceIdentity(sourceUrl, root) {
  const url = new URL(sourceUrl);
  return sha256(`${url.origin.toLowerCase()}${url.pathname}|${categoryIdentityKey(root)}`);
}

export function createTaxonomyProgress(sourceUrl, root, recordedAt = new Date().toISOString(), maxDepth = 12) {
  const normalizedRoot = {
    ...root,
    label: normalizeCategoryName(root.label || 'Maths'),
    categoryPath: [...(root.categoryPath || [])]
  };
  return {
    version: TAXONOMY_PROGRESS_VERSION,
    sourceUrl,
    sourceIdentity: taxonomySourceIdentity(sourceUrl, normalizedRoot),
    rootIdentity: categoryIdentityKey(normalizedRoot),
    maxDepth,
    root: normalizedRoot,
    status: 'in_progress',
    createdAt: recordedAt,
    updatedAt: recordedAt,
    queue: [normalizedRoot],
    visitedIdentities: [],
    visitedSubjectIds: [],
    nodes: [],
    leaves: [],
    edges: [],
    aliases: [{
      identity: categoryIdentityKey(normalizedRoot),
      categoryPath: [...normalizedRoot.categoryPath],
      label: normalizedRoot.label,
      url: normalizedRoot.url || null,
      subjectId: normalizedRoot.subjectId || null,
      parentIdentity: null
    }]
  };
}

export function validateTaxonomyProgress(progress, { sourceUrl, root, maxDepth = 12 }) {
  if (progress?.version !== TAXONOMY_PROGRESS_VERSION) {
    throw new Error(`Unsupported taxonomy progress version: ${progress?.version}`);
  }
  if (progress.sourceIdentity !== taxonomySourceIdentity(sourceUrl, root)) {
    throw new Error(`Taxonomy progress belongs to a different source/root: ${progress.sourceUrl}`);
  }
  const expectedRootIdentity = categoryIdentityKey(root);
  if (progress.rootIdentity !== expectedRootIdentity) {
    throw new Error(`Taxonomy progress belongs to a different root: ${progress.rootIdentity}`);
  }
  if (progress.maxDepth !== maxDepth) {
    throw new Error(`Taxonomy progress used max depth ${progress.maxDepth}; requested ${maxDepth}`);
  }
  for (const key of ['queue', 'visitedIdentities', 'nodes', 'leaves', 'edges', 'aliases']) {
    if (!Array.isArray(progress[key])) throw new Error(`Taxonomy progress is missing array: ${key}`);
  }
  return progress;
}

export function validateCompletedTaxonomyProgress(progress) {
  if (progress.status !== 'complete' || progress.queue.length !== 0) {
    throw new Error('Taxonomy graph is not closed: pending nodes remain');
  }
  const nodeIds = progress.nodes.map(categoryIdentityKey);
  if (new Set(nodeIds).size !== nodeIds.length) throw new Error('Taxonomy graph contains duplicate node identities');
  if (new Set(progress.visitedIdentities).size !== progress.visitedIdentities.length ||
      progress.visitedIdentities.some((identity) => !nodeIds.includes(identity)) ||
      nodeIds.some((identity) => !progress.visitedIdentities.includes(identity))) {
    throw new Error('Taxonomy visited identities do not match completed nodes');
  }
  const outgoing = new Set();
  const incoming = new Set();
  for (const edge of progress.edges) {
    if (!nodeIds.includes(edge.parentIdentity) || !nodeIds.includes(edge.childIdentity)) {
      throw new Error('Taxonomy edge references an incomplete node');
    }
    outgoing.add(edge.parentIdentity);
    incoming.add(edge.childIdentity);
  }
  const rootIdentity = progress.rootIdentity;
  if (nodeIds.some((identity) => identity !== rootIdentity && !incoming.has(identity))) {
    throw new Error('Taxonomy graph contains a node with no completed parent edge');
  }
  const expectedLeaves = new Set(nodeIds.filter((identity) => identity !== rootIdentity && !outgoing.has(identity)));
  const actualLeaves = new Set(progress.leaves.map(categoryIdentityKey));
  if (expectedLeaves.size !== actualLeaves.size || [...expectedLeaves].some((identity) => !actualLeaves.has(identity))) {
    throw new Error('Taxonomy leaf set does not match the closed graph');
  }
  return progress;
}

/**
 * Breadth-first, checkpointable taxonomy traversal. A node remains pending until
 * its children have been listed successfully, so an interruption only replays
 * the one incomplete node and never revisits completed subject IDs.
 */
export async function enumerateLeafCategoriesResumable(adapter, {
  sourceUrl,
  root,
  maxDepth = 12,
  progress,
  checkpoint = async () => {},
  onProgress = () => {},
  progressEvery = 10,
  now = () => new Date().toISOString()
} = {}) {
  const state = progress
    ? validateTaxonomyProgress(progress, { sourceUrl, root, maxDepth })
    : createTaxonomyProgress(sourceUrl, root, now(), maxDepth);
  if (state.status === 'complete') {
    validateCompletedTaxonomyProgress(state);
    return { nodes: state.nodes, leaves: state.leaves, progress: state };
  }

  const visited = new Set(state.visitedIdentities);
  const queued = new Set(state.queue.map(categoryIdentityKey));
  const edgeKeys = new Set(state.edges.map((edge) => `${edge.parentIdentity}>${edge.childIdentity}`));
  const aliasKeys = new Set(state.aliases.map((alias) => `${alias.identity}|${pathKey(alias.categoryPath)}`));
  while (state.queue.length) {
    const rawNode = state.queue[0];
    const node = {
      ...rawNode,
      label: normalizeCategoryName(rawNode.label || rawNode.categoryPath?.at(-1) || ''),
      categoryPath: [...(rawNode.categoryPath || [])]
    };
    if (node.categoryPath.length > maxDepth) {
      throw new Error(`Taxonomy exceeded max depth ${maxDepth} at ${node.categoryPath.join(' > ')}`);
    }
    const identity = categoryIdentityKey(node);
    if (visited.has(identity)) {
      state.queue.shift();
      queued.delete(identity);
      continue;
    }

    const children = normalizeTaxonomyChildren(node, await adapter.listChildren(node));
    state.queue.shift();
    queued.delete(identity);
    state.nodes.push(node);
    if (children.length === 0 && node.categoryPath.length) state.leaves.push(node);
    visited.add(identity);
    state.visitedIdentities.push(identity);
    if (node.subjectId && !state.visitedSubjectIds.includes(String(node.subjectId))) {
      state.visitedSubjectIds.push(String(node.subjectId));
    }
    for (const child of children) {
      const childIdentity = categoryIdentityKey(child);
      const edgeKey = `${identity}>${childIdentity}`;
      if (!edgeKeys.has(edgeKey)) {
        state.edges.push({ parentIdentity: identity, childIdentity });
        edgeKeys.add(edgeKey);
      }
      const aliasKey = `${childIdentity}|${pathKey(child.categoryPath)}`;
      if (!aliasKeys.has(aliasKey)) {
        state.aliases.push({
          identity: childIdentity,
          categoryPath: [...child.categoryPath],
          label: child.label,
          url: child.url || null,
          subjectId: child.subjectId || null,
          parentIdentity: identity
        });
        aliasKeys.add(aliasKey);
      }
      if (visited.has(childIdentity) || queued.has(childIdentity)) continue;
      state.queue.push(child);
      queued.add(childIdentity);
    }
    state.updatedAt = now();
    state.status = state.queue.length ? 'in_progress' : 'complete';
    await checkpoint(state);
    const visitedCount = state.visitedIdentities.length;
    if (visitedCount % progressEvery === 0 || state.status === 'complete') {
      onProgress({
        visited: visitedCount,
        pending: state.queue.length,
        leaves: state.leaves.length,
        status: state.status
      });
    }
  }
  validateCompletedTaxonomyProgress(state);
  return { nodes: state.nodes, leaves: state.leaves, progress: state };
}

/** Walk an arbitrary category adapter without relying on the live DOM. */
export async function enumerateLeafPaths(adapter, {
  rootPath = [],
  maxDepth = 12
} = {}) {
  const leaves = [];
  const visited = new Set();

  async function visit(path) {
    if (path.length > maxDepth) {
      throw new Error(`Taxonomy exceeded max depth ${maxDepth} at ${path.join(' > ')}`);
    }
    const key = pathKey(path);
    if (visited.has(key)) throw new Error(`Taxonomy cycle or duplicate path detected at ${key}`);
    visited.add(key);

    const children = (await adapter.listChildren(path))
      .map(normalizeCategoryName)
      .filter(Boolean);
    const uniqueChildren = [...new Set(children)];
    if (uniqueChildren.length === 0) {
      leaves.push([...path]);
      return;
    }
    for (const child of uniqueChildren) await visit([...path, child]);
  }

  await visit([...rootPath]);
  return leaves;
}

export function createEmptyCaptureState(sourceUrl) {
  return {
    version: 1,
    sourceUrl,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    taxonomy: { leaves: [] },
    leafRuns: {},
    candidates: {}
  };
}

export function mergeCandidateState(state, candidate) {
  const sourceId = stableQuestionId(candidate);
  const previous = state.candidates[sourceId] || {};
  const sourcePaths = [
    ...(previous.sourcePaths || []),
    ...(candidate.sourcePaths || (candidate.categoryPath ? [candidate.categoryPath] : []))
  ];
  const uniquePaths = [...new Map(sourcePaths.map((path) => [pathKey(path), [...path]])).values()];
  const sourceCategories = [
    ...(previous.sourceCategories || []),
    ...(candidate.sourceCategories || (candidate.sourceCategory ? [candidate.sourceCategory] : []))
  ];
  const uniqueCategories = [...new Map(sourceCategories.map((category) =>
    [categoryIdentityKey(category), { ...category }]
  )).values()];
  state.candidates[sourceId] = {
    ...previous,
    ...candidate,
    sourceId,
    sourcePaths: uniquePaths,
    sourceCategories: uniqueCategories,
    firstSeenAt: previous.firstSeenAt || candidate.firstSeenAt || new Date().toISOString(),
    updatedAt: candidate.updatedAt || new Date().toISOString()
  };
  return state.candidates[sourceId];
}

export function shouldCaptureCandidate(existing, { pngChecksum, pngPath } = {}) {
  if (!existing?.capture?.pngChecksum || !existing?.capture?.pngPath) return true;
  if (pngChecksum && existing.capture.pngChecksum !== pngChecksum) return true;
  if (pngPath && existing.capture.pngPath !== pngPath) return true;
  return false;
}

export async function retryWithBackoff(operation, {
  attempts = 4,
  baseDelayMs = 750,
  maxDelayMs = 8_000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  onRetry = () => {}
} = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delayMs = Math.min(maxDelayMs, baseDelayMs * (2 ** (attempt - 1)));
      onRetry({ attempt, delayMs, error });
      await sleep(delayMs);
    }
  }
  throw lastError;
}

export function parseEmbeddedFixtureHtml(html) {
  const match = String(html).match(
    /<script\b[^>]*\bid=["']dq-fixture["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match) throw new Error('Fixture HTML does not contain <script id="dq-fixture">');
  return JSON.parse(match[1]);
}

export function fixtureAdapter(catalog) {
  const nodes = new Map();
  function index(node, path = []) {
    nodes.set(pathKey(path), node);
    for (const child of node.children || []) index(child, [...path, child.name]);
  }
  index(catalog);
  return {
    async listChildren(path) {
      const node = nodes.get(pathKey(path));
      if (!node) throw new Error(`Missing fixture taxonomy node: ${path.join(' > ')}`);
      return (node.children || []).map((child) => child.name);
    },
    results(path, sort) {
      const node = nodes.get(pathKey(path));
      if (!node) throw new Error(`Missing fixture taxonomy node: ${path.join(' > ')}`);
      return node.results?.[sort] || [];
    }
  };
}

export async function rankFixtureCatalog(catalog, options = {}) {
  const adapter = fixtureAdapter(catalog);
  const leaves = await enumerateLeafPaths(adapter, options);
  return leaves.map((categoryPath) => ({
    categoryPath,
    candidates: fuseRankedQuestions({
      liked: adapter.results(categoryPath, 'liked'),
      misconceptions: adapter.results(categoryPath, 'misconceptions'),
      limitPerSort: options.limitPerSort,
      top: options.top
    })
  }));
}
