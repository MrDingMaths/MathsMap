// Printed attribution is optional; extraction evidence remains outside the question.
import {hasVisibleContent} from './document-content.js';
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
// A multipart question can have no shared stem. Its first actual prompt is the
// attribution's print slot, so native/custom arrangements keep it in their flow.
export function sourceAttributionPromptId(question) {
  const first=node=>!node?null:hasVisibleContent(node.prompt)?node.id??null:(node.children??[]).map(first).find(Boolean)??null;
  return first(question?.content);
}

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
    if (!/^Y\d{1,2}(?: (?:S[12]|X[12]|ADV|STN|COM|ADD|FUN|T[1-4]))*$/.test(paper)) return null;
    label = `PLC ${paper} ${year}`;
  } else if (['ADV', 'X1', 'X2', 'EXT1', 'EXT2', 'STN', 'STN1', 'STD', 'STD1', 'STD2'].includes(parts[1])) {
    provider = 'HSC';
    paper = {ADV:'Advanced', X1:'Extension 1',X2:'Extension 2',EXT1:'Extension 1', EXT2:'Extension 2', STN:'Standard',STN1:'Standard 1',STD:'Standard', STD1:'Standard 1', STD2:'Standard 2'}[parts[1]];
    label = `HSC ${paper} ${year}`;
  } else {
    // School names require explicit approval in the export mapping, including BHHS.
    return {provider:'HSC-trial', schoolCode:parts[1], schoolYear:parts.slice(2,yearIndex).find(part=>/^Y\d{1,2}$/.test(part)), paper:parts.slice(2,yearIndex).join(' '), year, origin:'MathsBase', needsSchoolMapping:true};
  }
  return {provider, paper, year, label, origin:'MathsBase'};
}

// Approved 28 October source-label calibration. Keep the explicit year/course/
// term tokens; an unrecognised school or token still needs a mapping decision.
export function approvedMathsBaseSource(code) {
  const source = mathsBaseSource(code);
  if (!source?.needsSchoolMapping) return source;
  const parts = String(code).trim().split(/\s+/)[0].split('.');
  const yearIndex = parts.findIndex(part => /^(19|20)\d{2}$/.test(part));
  const tokens = parts.slice(2, yearIndex);
  // Source-backed programme reconciliation, 31 October 2026. These identities
  // are not a blanket eligibility decision or a claim that every paper is a
  // trial. In particular Sydney Girls 2021 Alternate Task 4 is an internal task.
  const resolved = {
    CSSA: {provider:'HSC-provider', name:'CSSA'},
    NEAP: {provider:'HSC-provider', name:'Neap Education'},
    SGG: {provider:'HSC-school', name:'St George Girls High School'},
    SYDG: {provider:'HSC-school', name:'Sydney Girls High School'},
    SYDGR: {provider:'HSC-school', name:'Sydney Grammar School'},
  }[source.schoolCode];
  if (resolved) {
    const after = parts.slice(yearIndex + 1).filter(token => !/^Q\d/i.test(token));
    const paperTokens = tokens.join(' ');
    const recognised = /^Y12 (?:ADV|X1)$/.test(paperTokens)
      || source.schoolCode === 'CSSA' && paperTokens === 'X1';
    if (!recognised || after.length || Number(source.year) < 2020 || Number(source.year) > 2026) return source;
    const course = {ADV:'Advanced', X1:'Extension 1'}[tokens.at(-1)];
    const paper = [...tokens.slice(0,-1), course].join(' ');
    return {provider:resolved.provider, paper, year:source.year,
      label:`${resolved.name} ${paper} ${source.year}`, origin:'MathsBase'};
  }
  if (!['BHHS', 'PLC'].includes(source.schoolCode) || !tokens.some(token => /^Y\d{1,2}$/.test(token))) return source;
  const after = parts.slice(yearIndex + 1).filter(token => !/^Q\d/i.test(token));
  if ([...tokens, ...after].some(token => !/^Y\d{1,2}$|^(?:ADV|STN|STD[12]?|X[12]|T[1-4]|S[12])$/.test(token))) return source;
  return {
    provider: source.schoolCode === 'PLC' ? 'PLC' : 'HSC-trial',
    paper: [source.schoolCode, ...tokens, ...after].join(' '),
    year: source.year,
    label: [source.schoolCode, ...tokens, ...after, source.year].join(' '),
    origin: 'MathsBase',
  };
}
