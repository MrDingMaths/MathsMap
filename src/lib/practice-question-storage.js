import { makeBankManifest, normaliseQuestion } from './practice-question-model.js';

export const WORKSHEET_DRAFT_KEY = 'mathsmap.practice-studio.worksheet.v3';

function jsonResponse(response) {
  if (!response?.ok) throw new Error('Booklet Studio request failed (' + (response?.status ?? 'offline') + ')');
  return response.json();
}

export async function loadPracticeBank(fetchImpl = globalThis.fetch) {
  const manifest = await jsonResponse(await fetchImpl('/__booklet/bank/manifest'));
  const records = await Promise.all((manifest.questions ?? []).map(async (entry) => {
    const response = await fetchImpl('/__booklet/bank/questions/' + encodeURIComponent(entry.id));
    return normaliseQuestion(await jsonResponse(response));
  }));
  return { manifest, records };
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
