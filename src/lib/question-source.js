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

// Exact reviewed Exam sources; neighbouring questions retain their existing
// holds. All school/provider identities below already have approved mappings.
const approvedExamQuestionCodes = new Set([
  'HSC.CSSA.STN.2023 Q20',
  'HSC.SGG.Y12.STN.2020 Q20',
  'HSC.CSSA.STN.2023 Q28',
  'HSC.NEAP.Y12.STN.2024 Q18',
  'HSC.SYDGR.Y11.ADV.2019 Q9g',
  'HSC.NORM.Y11.ADV.2019 Q14b',
  'HSC.SYDGR.Y11.X1.2019 Q8',
  'HSC.NEAP.Y12.STN.2023 Q14',
  'HSC.SYDGR.Y11.STN.2019 Q23d',
  'HSC.NSG.Y11.ADV.2019 Q17c',
  'HSC.ABBOT.Y12.X2.2023 Q12c',
  'HSC.NORM.Y11.X1.2019 Q15d',
  'HSC.NORM.Y12.X2.2022 Q15b',
  'HSC.NORM.Y12.X2.2024 Q12b',
  'HSC.SGG.Y12.X2.2023 Q8',
  'HSC.NORM.Y11.ADV.2020 Q6c',
  "HSC.NEAP.Y12.STN.2020 Q21",
  "HSC.NEAP.Y12.STN.2024 Q31",
  "HSC.NEAP.Y12.STN.2022 Q34",
  "HSC.NEAP.Y12.STN.2025 Q30",
  "HSC.NSG.Y11.ADV.2019 Q16c",
  "HSC.SYDGR.Y12.STN.2024 Q26",
  'HSC.SYDGR.Y11.ADV.2019 Q9e', 'HSC.NORM.Y11.ADV.2020 Q8a',
  'HSC.NSB.Y11.ADV.2024 Q10', 'HSC.NSB.Y11.ADV.2024 Q26',
  'HSC.NEAP.Y11.X1.2023 Q11e', 'HSC.SYDG.Y11.X1.2019 Q2d',
  'HSC.KNOX.Y11.ADV.2020 Q12c', 'HSC.SYDGR.Y11.ADV.2019 Q11a',
  'HSC.NEAP.Y12.STN.2023 Q24', 'HSC.SYDGR.Y12.STN.2020 Q25',
  'HSC.SYDGR.Y12.STN.2021 Q26',
  'HSC.NEAP.Y11.X1.2021 Q12b',
  'HSC.NORM.Y12.X2.2024 Q4',
]);
// Approved 28 October source-label calibration. Keep the explicit year/course/
// term tokens; an unrecognised school or token still needs a mapping decision.
export function approvedMathsBaseSource(code) {
  const source = mathsBaseSource(code);
  if (!source?.needsSchoolMapping) return source;
  const parts = String(code).trim().split(/\s+/)[0].split('.');
  const yearIndex = parts.findIndex(part => /^(19|20)\d{2}$/.test(part));
  const tokens = parts.slice(2, yearIndex);
  // Exact retained 2024 paper cover identifies Hornsby Girls; no other
  // HORNSG course/year/question is admitted by this source-backed exception.
  if (String(code).trim() === 'HSC.HORNSG.Y12.STN.2024 Q34') return {
    provider:'HSC-school',paper:'Y12 Standard',year:'2024',
    label:'Hornsby Girls High School Y12 Standard 2024',origin:'MathsBase',
  };
  if (String(code).trim() === 'HSC.HORNSG.Y12.STN.2024 Q17') return {
    provider:'HSC-school',paper:'Y12 Standard',year:'2024',
    label:'HORNSG Y12 Standard 2024',origin:'MathsBase',
  };
  // Preserve the literal unverified school token for this exact source.
  if (['HSC.HORNSG.Y12.X1.2023 Q12b','HSC.HORNSG.Y12.X1.2023 Q13c','HSC.HORNSG.Y12.X1.2023 Q14d'].includes(String(code).trim())) return {
    provider:'HSC-school',paper:'Y12 Extension 1',year:'2023',
    label:'HORNSG Y12 Extension 1 2023',origin:'MathsBase',
  };
  // Source-backed programme reconciliation, 31 October 2026. These identities
  // are not a blanket eligibility decision or a claim that every paper is a
  // trial. In particular Sydney Girls 2021 Alternate Task 4 is an internal task.
  const resolved = {
    CSSA: {provider:'HSC-provider', name:'CSSA'},
    NEAP: {provider:'HSC-provider', name:'Neap Education'},
    SGG: {provider:'HSC-school', name:'St George Girls High School'},
    SYDG: {provider:'HSC-school', name:'Sydney Girls High School'},
    SYDGR: {provider:'HSC-school', name:'Sydney Grammar School'},
    JRUSE: {provider:'HSC-school', name:'James Ruse Agricultural High School'},
    NSB: {provider:'HSC-school', name:'North Sydney Boys High School'},
    NSG: {provider:'HSC-school', name:'North Sydney Girls High School'},
    SYDB: {provider:'HSC-school', name:'Sydney Boys High School'},
    NORM: {provider:'HSC-school', name:'Normanhurst Boys'},
    ABBOT: {provider:'HSC-school', name:'Abbotsleigh'},
    MER: {provider:'HSC-school', name:'Meriden'},
    KNOX: {provider:'HSC-school', name:'Knox Grammar'},
  }[source.schoolCode];
  if (resolved) {
    const after = parts.slice(yearIndex + 1).filter(token => !/^Q\d/i.test(token));
    const paperTokens = tokens.join(' ');
    const year = Number(source.year);
    const retained2019Paper = year === 2019 && (
      approvedExamQuestionCodes.has(String(code).trim())
      || source.schoolCode === 'SGG' && paperTokens === 'Y11 ADV'
      || source.schoolCode === 'CSSA' && paperTokens === 'STN'
      || String(code).trim() === 'HSC.NORM.Y11.X1.2019 Q12b'
      || ['HSC.NSG.Y11.ADV.2019 Q14b', 'HSC.SYDGR.Y11.ADV.2019 Q12b'].includes(String(code).trim())
      || String(code).trim() === 'HSC.SYDGR.Y12.STN.2019 Q20'
      || source.schoolCode === 'KNOX' && paperTokens === 'Y11 ADV'
    );
    const recognised = /^Y12 (?:ADV|X1)$/.test(paperTokens)
      || approvedExamQuestionCodes.has(String(code).trim())
      || ['NEAP', 'SYDGR', 'NSG', 'SYDG', 'SGG'].includes(source.schoolCode) && paperTokens === 'Y11 ADV'
      || source.schoolCode === 'SYDGR' && paperTokens === 'Y11 STN'
      || source.schoolCode === 'NSG' && paperTokens === 'Y12 X2' && year === 2022
      || String(code).trim() === 'HSC.NSB.Y12.X2.2022 Q13e'
      || ['HSC.JRUSE.Y12.X2.2022 Q13c', 'HSC.NORM.Y11.X1.2019 Q12b'].includes(String(code).trim())
      || ['HSC.CSSA.STN.2020 Q14', 'HSC.SGG.Y12.STN.2020 Q17'].includes(String(code).trim())
      || String(code).trim() === 'HSC.SGG.Y12.STN.2025 Q38'
      || String(code).trim() === 'HSC.SYDGR.Y12.STN.2024 Q27'
      || String(code).trim() === 'HSC.SYDGR.Y12.STN.2019 Q20'
      || String(code).trim() === 'HSC.SYDGR.Y12.STN.2020 Q42'
      || ['HSC.ABBOT.Y12.X2.2023 Q15c', 'HSC.NSB.Y12.X2.2020 Q13c'].includes(String(code).trim())
      || String(code).trim() === 'HSC.NSB.Y11.X1.2023 QE3'
      || ['HSC.NORM.Y12.X2.2024 Q16b', 'HSC.NSG.Y12.X2.2024 Q15a', 'HSC.JRUSE.Y12.X2.2020 Q9'].includes(String(code).trim())
      || String(code).trim() === 'HSC.NEAP.Y11.X1.2022 Q12a'
      || String(code).trim() === 'HSC.NORM.Y12.X2.2024 Q13a'
      || source.schoolCode === 'NORM' && paperTokens === 'Y11 X1' && year === 2020
      || source.schoolCode === 'KNOX' && paperTokens === 'Y11 ADV' && [2019, 2022].includes(year)
      || String(code).trim() === 'HSC.KNOX.Y11.ADV.2023 Q27b'
      || ['HSC.KNOX.Y11.ADV.2020 Q14a', 'HSC.KNOX.Y11.ADV.2020 Q16d'].includes(String(code).trim())
      || source.schoolCode === 'CSSA' && (paperTokens === 'X1' || retained2019Paper);
    if (!recognised || after.length || year < 2020 && !retained2019Paper || year > 2026) return source;
    const course = {ADV:'Advanced', X1:'Extension 1', X2:'Extension 2', STN:'Standard'}[tokens.at(-1)];
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
