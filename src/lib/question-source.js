// Printed attribution is optional; extraction evidence remains outside the question.
const fields = ['provider', 'paper', 'year', 'label', 'origin'];
export function normaliseQuestionSource(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = Object.fromEntries(fields.filter(key => value[key] != null && String(value[key]).trim()).map(key => [key, String(value[key]).trim()]));
  return Object.keys(source).length ? source : null;
}
export function isQuestionSource(value) {
  return !!normaliseQuestionSource(value) && Object.keys(value).every(key => fields.includes(key) && ['string', 'number'].includes(typeof value[key]));
}
export const printedQuestionSource = question => normaliseQuestionSource(question?.source)?.label ?? '';

// Deliberately narrow whitelist. Unknown HSC/PLC codes are held for mapping.
export function mathsBaseSource(code) {
  const parts = String(code ?? '').trim().split(/\s+/)[0].split('.');
  const yearIndex = parts.findIndex(part => /^(?:19|20)\d{2}$/.test(part));
  const year = parts[yearIndex];
  if (parts.some(part => /^(?:CAIE|MB|GEN|LBNZ|AU|AMC|SM|SmarterMaths)$/i.test(part))) return null;
  if (!year || !['HSC', 'PLC'].includes(parts[0])) return null;
  let label, provider, paper;
  if (parts[0] === 'PLC') {
    provider = 'PLC'; paper = [...parts.slice(1,yearIndex),...parts.slice(yearIndex+1).filter(part=>!/^Q\d/i.test(part))].join(' ');
    if (!/^Y\d{1,2}(?: (?:S[12]|X[12]|ADV|STN|T[1-4]))*$/.test(paper)) return null;
    label = `PLC ${paper} ${year}`;
  } else if (['ADV', 'X1', 'X2', 'EXT1', 'EXT2', 'STN', 'STD', 'STD1', 'STD2'].includes(parts[1])) {
    provider = 'HSC';
    paper = {ADV:'Advanced', X1:'Extension 1',X2:'Extension 2',EXT1:'Extension 1', EXT2:'Extension 2', STN:'Standard',STD:'Standard', STD1:'Standard 1', STD2:'Standard 2'}[parts[1]];
    label = `HSC ${paper} ${year}`;
  } else {
    // School names require explicit approval in the export mapping, including BHHS.
    return {provider:'HSC-trial', schoolCode:parts[1], schoolYear:parts.slice(2,yearIndex).find(part=>/^Y\d{1,2}$/.test(part)), paper:parts.slice(2,yearIndex).join(' '), year, origin:'MathsBase', needsSchoolMapping:true};
  }
  return {provider, paper, year, label, origin:'MathsBase'};
}
