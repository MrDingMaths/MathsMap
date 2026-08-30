// Turns a recipe plus a variant into the flat document model the HTML builder renders:
// ordered sections, each an ordered list of blocks and numbered questions, already filtered
// to the variant's tiers and already numbered.
//
// This is where a class variant actually happens: "top" drops the foundation tier, "support"
// drops mastery, and the same recipe produces both. Question numbering is computed HERE
// rather than in CSS so it is unit-testable and cannot be disturbed by pagination.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const TIERS = ['foundation', 'development', 'mastery'];
const TIER_LABEL = { foundation: 'Foundation', development: 'Development', mastery: 'Mastery' };

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
}

export function slugify(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// --- loaders (injectable, so the resolver is testable without the real repo) ----

export function makeLoaders({ rootDir = ROOT } = {}) {
  const bankCache = new Map();
  return {
    loadBank(bankSlug) {
      if (bankCache.has(bankSlug)) return bankCache.get(bankSlug);
      const dir = join(rootDir, 'booklets', 'bank', bankSlug);
      const header = readJson(join(dir, 'bank.json'));
      const cards = new Map();
      const blocks = new Map();
      const sections = new Map();
      for (const slug of header.sections || []) {
        const cardsPath = join(dir, 'cards', `${slug}.json`);
        const list = existsSync(cardsPath) ? (readJson(cardsPath).cards || []) : [];
        sections.set(slug, list.map((c) => c.id));
        for (const card of list) cards.set(card.id, card);
        const blocksPath = join(dir, 'blocks', `${slug}.json`);
        if (existsSync(blocksPath)) for (const block of readJson(blocksPath).blocks || []) blocks.set(block.id, block);
      }
      const bank = { slug: bankSlug, dir, header, cards, blocks, sections };
      bankCache.set(bankSlug, bank);
      return bank;
    },
    loadAtoms(skillId) {
      const path = join(rootDir, 'public', 'content', `${skillId}.json`);
      return existsSync(path) ? readJson(path) : null;
    },
  };
}

// --- atoms ---------------------------------------------------------------------

// A MathsMap atom has no printed short answer, but the house style guarantees the final
// line of a worked solution states the answer — so a booklet's "short answers" column can
// be derived rather than re-authored.
export function answerFromSolution(solutionText) {
  const lines = String(solutionText || '').split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1] : null;
}

function atomToCard(atom, skillId, tier, index) {
  return {
    id: `atom:${skillId}:${tier}:${index}`,
    tier,
    skills: [skillId],
    primarySkill: skillId,
    structure: atom.structure,
    question_text: atom.question_text,
    solution_text: atom.solution_text,
    answer: answerFromSolution(atom.solution_text),
    fromAtom: true,
  };
}

// --- columns -------------------------------------------------------------------

const WIDE_CM = 5.5;

/**
 * How many lettered cells sit side by side. The booklet varies this by content: three
 * short equations across, two when each cell carries a diagram, one when the parts are
 * prose. An explicit `columns` always wins.
 */
export function autoColumns(parts) {
  if (!parts || !parts.length) return 1;
  const widths = parts.map((p) => (p.figure && p.figure.widthCm) || 0);
  const longest = Math.max(...parts.map((p) => (p.question_text || '').length));
  const multiline = parts.some((p) => (p.question_text || '').includes('\n'));
  if (Math.max(...widths) >= WIDE_CM || multiline || longest > 90) return Math.min(2, parts.length);
  if (longest <= 45) return Math.min(3, parts.length);
  return Math.min(2, parts.length);
}

// --- resolution ----------------------------------------------------------------

function tierFilter(variantTiers) {
  const allowed = new Set(variantTiers);
  return (tier) => !tier || allowed.has(tier);
}

/**
 * @param {object} recipe parsed booklets/recipes/<slug>.json
 * @param {string} variantName a key of recipe.variants, or 'standard'
 * @param {object} options `{ loaders, overrides }` — overrides are the CLI output flags
 * @returns {{ meta, variant, output, sections, expectedCards, warnings }}
 */
export function resolveBooklet(recipe, variantName, { loaders = makeLoaders(), overrides = {} } = {}) {
  const warnings = [];
  const variant = (recipe.variants && recipe.variants[variantName]) || {};
  if (recipe.variants && !recipe.variants[variantName]) {
    throw new Error(`unknown variant "${variantName}" — recipe defines ${Object.keys(recipe.variants || {}).join(', ') || 'none'}`);
  }
  const tiers = variant.tiers || (recipe.defaults && recipe.defaults.tiers) || TIERS;
  const output = {
    spaces: false,
    solutions: false,
    shortAnswers: false,
    ...(recipe.defaults && recipe.defaults.output),
    ...variant.output,
    ...overrides,
  };
  const keep = tierFilter(tiers);

  const banks = new Map();
  for (const [alias, bankSlug] of Object.entries(recipe.banks || {})) {
    banks.set(alias, loaders.loadBank(bankSlug));
  }
  const refOf = (ref) => {
    const cut = String(ref).indexOf('/');
    if (cut < 0) throw new Error(`bad reference "${ref}": expected "<bankAlias>/<id>"`);
    const alias = ref.slice(0, cut);
    const bank = banks.get(alias);
    if (!bank) throw new Error(`unknown bank alias "${alias}" in "${ref}"`);
    return { bank, id: ref.slice(cut + 1) };
  };

  const sections = [];
  let expectedCards = 0;

  for (const section of recipe.sections || []) {
    const items = [];
    // The booklet numbers questions continuously through a section, across tier headings,
    // and restarts at each section.
    let number = 0;
    let lastTier = null;

    const pushCard = (card, itemColumns) => {
      if (!keep(card.tier)) return;
      number++;
      expectedCards++;
      const parts = card.parts || [];
      items.push({
        kind: 'card',
        number,
        card,
        columns: itemColumns || card.columns || autoColumns(parts),
        tierHeading: card.tier !== lastTier ? TIER_LABEL[card.tier] : null,
      });
      lastTier = card.tier;
    };

    for (const item of section.items || []) {
      if (item.block !== undefined) {
        const { bank, id } = refOf(item.block);
        const block = bank.blocks.get(id);
        if (!block) throw new Error(`block "${item.block}" not found`);
        // A block may itself be tiered (a Proof box is mastery), so a variant drops it too.
        if (!keep(block.tier)) continue;
        items.push({ kind: 'block', block, columns: item.columns || block.columns || null });
      } else if (Array.isArray(item.cards)) {
        for (const ref of item.cards) {
          const { bank, id } = refOf(ref);
          const card = bank.cards.get(id);
          if (!card) throw new Error(`card "${ref}" not found`);
          pushCard(card, item.columns);
        }
      } else if (item.cards && typeof item.cards === 'object') {
        const bank = banks.get(item.cards.bank);
        if (!bank) throw new Error(`unknown bank alias "${item.cards.bank}"`);
        const ids = bank.sections.get(item.cards.section);
        if (!ids) throw new Error(`section "${item.cards.section}" not in bank "${item.cards.bank}"`);
        const selTiers = item.cards.tiers ? new Set(item.cards.tiers) : null;
        const selTags = item.cards.tags ? new Set(item.cards.tags) : null;
        for (const id of ids) {
          const card = bank.cards.get(id);
          if (selTiers && !selTiers.has(card.tier)) continue;
          if (selTags && !(card.tags || []).some((t) => selTags.has(t))) continue;
          pushCard(card, item.columns);
        }
      } else if (item.atoms) {
        const { skill, tiers: atomTiers = TIERS, structures, limit, exclude } = item.atoms;
        const content = loaders.loadAtoms(skill);
        if (!content) {
          warnings.push(`atoms: skill "${skill}" has no content file — the pull is empty`);
          continue;
        }
        const wanted = new Set(structures || []);
        const skip = new Set(exclude || []);
        let taken = 0;
        for (const tier of atomTiers) {
          if (!keep(tier)) continue;
          const list = (content.practice && content.practice[tier]) || [];
          for (let i = 0; i < list.length; i++) {
            if (limit && taken >= limit) break;
            if (skip.has(i)) continue;
            const atom = list[i];
            if (wanted.size && !wanted.has(atom.structure)) continue;
            pushCard(atomToCard(atom, skill, tier, i), item.columns);
            taken++;
          }
        }
        if (!taken) warnings.push(`atoms: "${skill}" matched nothing (tiers ${atomTiers.join('/')}${structures ? `, structures ${structures.join('/')}` : ''})`);
      }
    }

    sections.push({
      title: section.title,
      slug: section.slug || slugify(section.title),
      items,
    });
  }

  return {
    meta: recipe.meta || {},
    slug: recipe.slug,
    variant: variantName,
    tiers,
    output,
    sections,
    expectedCards,
    warnings,
  };
}

export function loadRecipe(path) {
  return readJson(resolve(ROOT, path));
}
