import { makeBankManifest, normaliseQuestion } from './practice-question-model.js';

export const WORKSHEET_DRAFT_KEY = 'mathsmap.practice-studio.worksheet.v3';

function jsonResponse(response) {
  if (!response?.ok) throw new Error('Booklet Studio request failed (' + (response?.status ?? 'offline') + ')');
  return response.json();
}

export async function loadPracticeBank(fetchImpl = globalThis.fetch) {
  const manifest = await jsonResponse(await fetchImpl('/__booklet/bank/manifest'));
  const entries = manifest.questions ?? [];
  // One response for the whole bank when the server offers it; thousands of
  // per-question requests made the picker take seconds to minutes.
  if (manifest.records) {
    try {
      const response = await fetchImpl(manifest.records);
      if (response?.ok) {
        const all = await response.json();
        if (Array.isArray(all) && all.length === entries.length && all.every((q, i) => q?.id === entries[i].id)) return { manifest, records: manifest.recordsNormalised ? all : all.map(normaliseQuestion) };
      }
    } catch { /* Fall back to individual questions. */ }
  }
  const records = new Array(entries.length);
  let next = 0, failed = false, failure;
  // Bound requests through body parsing too, and drain active workers before retry.
  async function worker() {
    while (!failed && next < entries.length) {
      const index = next++;
      try {
        const response = await fetchImpl('/__booklet/bank/questions/' + encodeURIComponent(entries[index].id));
        records[index] = normaliseQuestion(await jsonResponse(response));
      } catch (error) {
        if (!failed) { failed = true; failure = error; }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, entries.length) }, worker));
  if (failed) throw failure;
  return { manifest, records };
}

// The picker's light index: one row per question with its title, skill,
// difficulty, source, excerpt and search text, but no question body.
export async function loadBankIndex(fetchImpl = globalThis.fetch) {
  return jsonResponse(await fetchImpl('/__booklet/bank/index'));
}

// Full records by id, 40 to a request, kept for the session. A question that
// is no longer in the bank resolves to null.
const recordCache = new Map();
export async function loadBankRecords(ids, fetchImpl = globalThis.fetch) {
  const missing = [...new Set(ids)].filter(id => !recordCache.has(id));
  for (let i = 0; i < missing.length; i += 40) {
    const batch = missing.slice(i, i + 40);
    const records = await jsonResponse(await fetchImpl('/__booklet/bank/records?ids=' + batch.map(encodeURIComponent).join(',')));
    batch.forEach((id, j) => { if (records[j]) recordCache.set(id, records[j]); });
  }
  return ids.map(id => recordCache.get(id) ?? null);
}

export async function saveQuestion(question, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl('/__booklet/bank/questions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normaliseQuestion(question)),
  });
  return normaliseQuestion(await jsonResponse(response));
}

export async function updateQuestion(question, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl('/__booklet/bank/questions/' + encodeURIComponent(question.id), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normaliseQuestion(question)),
  });
  return normaliseQuestion(await jsonResponse(response));
}

export async function deleteQuestion(id, confirmId, fetchImpl = globalThis.fetch) {
  if (!id || confirmId !== id) throw new Error('Type the question id exactly to permanently delete it.');
  return jsonResponse(await fetchImpl('/__booklet/bank/questions/' + encodeURIComponent(id), {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ confirmId }),
  }));
}

export function readWorksheetDraft(storage = null) {
  const target = storage ?? (() => { try { return globalThis.localStorage; } catch { return null; } })();
  if (!target) return null;
  try { return JSON.parse(target.getItem(WORKSHEET_DRAFT_KEY) ?? 'null'); } catch { return null; }
}

export function writeWorksheetDraft(value, storage = null) {
  const target = storage ?? (() => { try { return globalThis.localStorage; } catch { return null; } })();
  if (!target) return;
  try { target.setItem(WORKSHEET_DRAFT_KEY, JSON.stringify(value)); } catch { /* private browsing/quota */ }
}

export function clearWorksheetDraft(storage = null) {
  const target = storage ?? (() => { try { return globalThis.localStorage; } catch { return null; } })();
  try { target?.removeItem(WORKSHEET_DRAFT_KEY); } catch { /* private browsing */ }
}

export { makeBankManifest };
