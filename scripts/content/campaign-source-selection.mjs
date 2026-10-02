import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { sourceCatalog, taxonomyAt, governingScope, hashValue, inside, readJson, relative } from './campaign-sources.mjs';
import { sourceMarkdownImages } from './source-markdown-images.mjs';

// These are suggestions, never source/teaching review or acceptance evidence.
export const SOURCE_SELECTION_VERSION = 'mathsmap-source-selection-v1';
export const DEFAULT_SOURCE_BUDGET = 10000;
const stop = new Set('a an the to of and or in on by for with from using use find solve calculate determine identify explain describe recognise recognize apply establish develop given when which that this these those then each following example examples practice key ideas review number numbers mathematical mathematics maths problems problem stage up as is are be it its into have has how all any classify interpret convert define evaluate count analyse analyze relate choose prove estimate verify construct draw partition represent express sketch distinguish size objects object'.split(' '));
const aliases = new Map(Object.entries({ rounding:'round', rounded:'round', approximating:'round', approximate:'round', approximation:'round', addition:'add', adding:'add', added:'add', subtraction:'subtract', subtracting:'subtract', multiplication:'multiply', multiplying:'multiply', division:'divide', dividing:'divide', equations:'equation', solving:'solve', functions:'function', fractions:'fraction', decimals:'decimal', percentages:'percent', percentage:'percent', percentiles:'percentile', quadrilaterals:'quadrilateral', triangles:'triangle', grouping:'group', grouped:'group', brackets:'bracket', inverse:'inverse', differentiating:'differentiate', differentiation:'differentiate', derivative:'differentiate', derivatives:'differentiate', integrating:'integrate', integration:'integrate', integral:'integrate', integrals:'integrate', logarithms:'logarithm', logarithmic:'logarithm', vectors:'vector', graphs:'graph', graphing:'graph', graphical:'graph', inequalities:'inequality', indices:'index', powers:'power', coefficients:'coefficient', series:'series', sequences:'sequence', probability:'probability', probabilities:'probability', geometrical:'geometry', labelling:'label', labeling:'label', naming:'name', properties:'property', symmetrical:'symmetry' }));
function tokens(value) {
  return [...new Set((String(value).toLowerCase().replace(/\bdes?\b/g,'differential equation').replace(/\\[a-z]+/g,' ').match(/[a-z]+|\d+/g) || []).filter(word => !stop.has(word) && (word.length > 2 || /\d/.test(word))).map(word => aliases.get(word) || (word.endsWith('s') && !word.endsWith('ss') ? word.slice(0,-1) : word)))];
}
function heading(line) { const m=line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*$/); return m && {level:m[1].length,title:m[2].replace(/[*`]/g,'').trim()}; }
const instructional = /\b(?:example|key ideas|guided practice|your turn|investigation|review of prior|syllabus|overview|summary|contents)\b/i;
const tier = line => /^\s*(?:\*\*)?(?:Foundation|Development|Mastery|Challenge(?: Exercise)?)(?:\*\*)?\s*$/.test(line);
const numbered = line => /^\s{0,3}\d+\.\s+\S/.test(line);
const tableStart = line => /^\s*(?:\+[-=+]{3}|\||[-]{5,})/.test(line);
export function normalizeSourceExcerpt(text) {
  // Exact prepareAssignment normalization: never rewrite TeX spacing, prose,
  // grid-table borders, diagram coordinates or mathematical alignment.
  return text.split('\n').map(line => line.trimStart().startsWith('|') ? line.split('|').map(cell => cell.trim().replace(/^(:?)-{3,}(:?)$/, '$1---$2')).join('|') : line).join('\n');
}

/** Preserve exact source line spans. Tables, ordered practice questions and fences are indivisible. */
export function inventorySourceText({ path: sourcePath = '', text }) {
  const lines=String(text).split('\n'), starts=[];
  for(let i=0;i<lines.length;i++) {const h=heading(lines[i]); if(h && h.level<=2 && !instructional.test(h.title)) starts.push({start:i,title:h.title,level:h.level});}
  if(!starts.length) starts.push({start:0,title:path.basename(sourcePath,'.md'),level:1});
  const sections=starts.map((entry,index)=>{
    const end=(starts[index+1]?.start ?? lines.length)-1;
    let practice=-1;
    for(let i=entry.start;i<=end;i++) if(tier(lines[i])) {practice=i;break;}
    const units=[];
    for(let i=entry.start;i<=end;) {
      if(!lines[i].trim()) {i++;continue;}
      const begin=i, fenced=/^\s*```/.test(lines[i]), table=tableStart(lines[i]);
      if(fenced) {i++; while(i<=end&&!/^\s*```/.test(lines[i])) i++; if(i<=end)i++;}
      else if(practice>=0&&i>practice&&numbered(lines[i])) {
        i++; while(i<=end&&!numbered(lines[i])&&!tier(lines[i])&&!(heading(lines[i])?.level<=2))i++;
      } else if(table) {i++;while(i<=end&&lines[i].trim())i++;}
      else {
        i++;while(i<=end&&lines[i].trim()&&!tableStart(lines[i])&&!heading(lines[i])&&!tier(lines[i]))i++;
      }
      const raw=lines.slice(begin,i).join('\n');
      units.push({startLine:begin+1,endLine:i,kind:practice>=0&&begin>practice&&numbered(lines[begin])?'question':/\b(?:worked )?example\b/i.test(raw)?'example':/\bkey ideas\b/i.test(raw)?'key-ideas':/\bguided practice|your turn\b/i.test(raw)?'scaffold':'context',text:raw,chars:normalizeSourceExcerpt(raw).length});
    }
    return {title:entry.title,startLine:entry.start+1,endLine:end+1,practiceLine:practice<0?null:practice+1,units,teachingEndLine:practice<0?end+1:practice};
  });
  return {path:sourcePath,hash:hashValue(text),lines,sections};
}
export function readSelectedEvidence(root, refs, {budgetChars=DEFAULT_SOURCE_BUDGET}={}) {
  const evidence=[],gaps=[],seen=new Set();
  for(const ref of refs) {
    const key=`${ref.path}:${ref.startLine}:${ref.endLine}`; if(seen.has(key))continue;seen.add(key);
    const file=inside(root,ref.path);
    if(!fs.existsSync(file)) {gaps.push({kind:'missing-source',path:ref.path});continue;}
    const bytes=fs.readFileSync(file),hash=hashValue(bytes),lines=bytes.toString('utf8').split('\n');
    if(ref.hash&&ref.hash!==hash) {gaps.push({kind:'stale-source-hash',path:ref.path,expected:ref.hash,actual:hash});continue;}
    if(!Number.isInteger(ref.startLine)||!Number.isInteger(ref.endLine)||ref.startLine<1||ref.endLine<ref.startLine||ref.endLine>lines.length) {gaps.push({kind:'invalid-line-range',path:ref.path,startLine:ref.startLine,endLine:ref.endLine});continue;}
    const rawExcerpt=lines.slice(ref.startLine-1,ref.endLine).join('\n'),excerpt=normalizeSourceExcerpt(rawExcerpt);
    const images=[];
    for(const name of sourceMarkdownImages(rawExcerpt)) {
      if(/^https?:/i.test(name))continue;
      try {const imagePath=relative(root,path.resolve(path.dirname(file),decodeURIComponent(name)));inside(root,imagePath);images.push({path:imagePath,status:'referenced-not-visually-reviewed'});}
      catch {gaps.push({kind:'invalid-image-reference',path:ref.path,reference:name});}
    }
    evidence.push({...ref,hash,rawExcerptHash:hashValue(rawExcerpt),excerptHash:hashValue(excerpt),excerpt,normalizedChars:excerpt.length,images:[...new Map(images.map(image=>[image.path,image])).values()]});
  }
  const normalizedChars=evidence.reduce((sum,ref)=>sum+ref.normalizedChars,0);
  if(normalizedChars>budgetChars) gaps.push({kind:'source-budget-exceeded',normalizedChars,budgetChars,action:'Keep curated/recorded spans intact; coordinator must select a smaller complete context or record an indivisible-context exception before dispatch.'});
  return {evidence,gaps,normalizedChars};
}

export function createSourceSelectionContext(root, options={}) {
  const taxonomy=options.taxonomy||taxonomyAt(root),catalog=options.catalog||sourceCatalog(root),documents=new Map();
  const frequency=new Map();
  for(const sourcePath of catalog.originals) {
    const text=fs.readFileSync(inside(root,sourcePath),'utf8'),doc=inventorySourceText({path:sourcePath,text});
    doc.hash=hashValue(fs.readFileSync(inside(root,sourcePath)));doc.stage=Number(sourcePath.match(/Stage ([3-6])/)?.[1]||9);
    doc.words=tokens(path.basename(sourcePath));
    for(const section of doc.sections) {
      section.headingWords=tokens(section.title);section.words=tokens(section.units.filter(u=>u.kind!=='question').map(u=>u.text).join('\n'));
      for(const word of section.headingWords)frequency.set(word,(frequency.get(word)||0)+1);
    }
    documents.set(sourcePath,doc);
  }
  return {root,taxonomy,catalog,documents,frequency,totalSections:[...documents.values()].reduce((n,d)=>n+d.sections.length,0)};
}

function hasTeachingContent(section) {
  return section.units.some(unit=>unit.endLine<=section.teachingEndLine&&unit.kind!=='question'&&
    unit.text.replace(/<!--[^]*?-->/g,'').split('\n').some(line=>line.trim()&&!heading(line)&&!tier(line)));
}
// Subject words identify what is taught; notation/fraction are only its representation.
// Scoped heuristic: these signals suggest candidates, never establish scope or support.
function subjectRouteEvidence(context, skill, scope, main, minor, doc, section) {
  const identity=tokens((skill.id||'')+' '+(skill.title||''));
  const governing=tokens(((context.taxonomy.topics||[]).find(row=>row.id===scope.topicId)?.title||'')+' '+((context.taxonomy.dotpoints||[]).find(row=>row.id===scope.dotPointId)?.text||''));
  const domains=['probability','geometry'];
  const subjects=domains.filter(word=>identity.includes(word));
  // Governing/blurb context may disambiguate a generic request; it cannot override an explicit subject.
  if(!subjects.length && main.some(word=>['notation','language'].includes(word))) subjects.push(...domains.filter(word=>minor.includes(word)||governing.includes(word)));
  if(!subjects.length)return {required:false,matched:false,route:false,bonus:0,reason:''};
  // Apply the new subject/representation disambiguation only when these two
  // reported representation requests occur. Other specialised probability or
  // geometry methods retain the existing ranking/eligibility rules.
  const fractionalProbability=subjects.includes('probability')&&main.includes('fraction');
  const geometryNaming=subjects.includes('geometry')&&main.some(word=>['notation','language'].includes(word));
  if(!fractionalProbability&&!geometryNaming)return {required:false,matched:false,route:false,bonus:0,reason:''};
  const body=section.units.filter(unit=>unit.endLine<=section.teachingEndLine&&unit.kind!=='question').map(unit=>unit.text).join('\n'),words=tokens(body);
  const objects=['point','line','interval','ray','angle'];
  const geometry=section.headingWords.includes('geometry')||words.includes('geometry')||section.headingWords.some(word=>objects.includes(word));
  const probability=section.headingWords.includes('probability')||(doc.words.includes('probability')&&words.includes('probability'));
  const matched=subjects.every(subject=>subject==='geometry'?geometry:probability);
  let route=true,reason='';
  if(fractionalProbability) {
    // Counting favourable versus total outcomes is the representation signal,
    // independent of TeX/native fraction/ratio/division serialization.
    route=words.some(word=>['favourable','favorable'].includes(word))&&words.includes('total')&&words.includes('outcome');
    reason='Probability subject plus actual favourable-over-total outcome counting teaching.';
  } else if(geometryNaming) {
    const explicitObjects=minor.filter(word=>objects.includes(word));
    const requested=explicitObjects.length?explicitObjects:governing.filter(word=>objects.includes(word));
    const objectHeading=requested.some(word=>section.headingWords.includes(word));
    const namingHeading=section.headingWords.some(word=>['label','name','notation'].includes(word));
    const namedObjects=/\b(?:[Pp]oint|[Rr]ay|[Ll]ine|[Ii]nterval|[Ss]egment)\s+[A-Z]{1,3}\b/.test(body);
    const foreign=words.some(word=>['vector','function','variation'].includes(word)&&!identity.includes(word));
    route=objectHeading&&(namingHeading||namedObjects)&&!foreign;
    reason='Geometry subject plus requested object/naming teaching; generic notation/language overlap is insufficient.';
  }
  return {required:true,matched,route,bonus:matched&&route?24:0,reason:reason||'Explicit subject must match actual teaching, not an unrelated representation.'};
}

function rankSections(context,skill,state,scope) {
  const main=tokens(skill.title||skill.id.replaceAll('-',' ')),minor=tokens(skill.blurb||''),prereq=context.taxonomy.skills.filter(s=>skill.prereqs?.includes(s.id)).flatMap(s=>tokens(s.title));
  const mapped=new Map([...(state.sources||[]),...(context.catalog.bySkill.get(skill.id)||[]),...(context.catalog.byTopic.get(scope.topicId)||[])].map(ref=>[ref.path,ref]));
  const primary=main.filter(word=>!['linear','simple','basic','step','two','2','one','1'].includes(word)),query=primary.length?primary:main;
  const score=(words,target)=>target.reduce((n,word)=>n+(words.includes(word)?1+Math.log(1+context.totalSections/(context.frequency.get(word)||1)):0),0);
  const rows=[];
  for(const doc of context.documents.values())for(const section of doc.sections) {
    if(!hasTeachingContent(section))continue;
    const hits=query.filter(word=>section.headingWords.includes(word)),bodyHits=query.filter(word=>section.words.includes(word));
    const subject=subjectRouteEvidence(context,skill,scope,main,minor,doc,section);
    if(subject.required&&(!subject.matched||!subject.route))continue;
    const coherentRoute=subject.required&&subject.matched&&subject.route;
    // A broad mapped topic alone is never sufficient evidence of the skill's method.
    const mappedRef=mapped.get(doc.path),fileHits=query.filter(word=>doc.words.includes(word));
    const mappedFallback=Boolean(mappedRef)&&fileHits.length/Math.max(1,query.length)>=.7;
    if(!hits.length&&bodyHits.length<Math.min(2,query.length)&&!mappedFallback&&!coherentRoute)continue;
    if(!query.length)continue;
    const explicit=new Set([...main,...minor]);
    const advanced=['algebraic','polynomial','derivative','differentiate','integrate','calculus','differential','compound','complex','vector','trigonometry','pythagoras','logistic','exponential'];
    if(section.headingWords.some(word=>advanced.includes(word)&&!explicit.has(word)))continue;
    const operations=main.filter(word=>['add','subtract','multiply','divide'].includes(word));
    if(operations.length&&!operations.some(word=>section.headingWords.includes(word)||section.words.includes(word)))continue;
    if(main.includes('one')&&section.headingWords.some(word=>['two','three','2','3'].includes(word))&&!main.some(word=>['two','three','2','3'].includes(word)))continue;
    const discriminator=['length','area','volume','mass','capacity','time','triangle','rectangle','parallelogram','circle','fraction','decimal','percent','interest','rate','function','equation','inequality'];
    const required=query.filter(word=>discriminator.includes(word));
    if(required.length&&required.some(word=>!section.headingWords.includes(word))&&hits.length/query.length<.7&&!mappedFallback&&!coherentRoute)continue;
    if(hits.length/query.length<.5&&bodyHits.length/query.length<.8&&!mappedFallback&&!coherentRoute)continue;
    const value=score(section.headingWords,main)*3+score(section.words,main)*.28+score(section.headingWords,minor)+score(section.words,minor)*.08+score(section.headingWords,prereq)*.12+score(doc.words,main)*.5;
    const stageFit=doc.stage===skill.stage?8:doc.stage<skill.stage?0:-8*(doc.stage-skill.stage);
    const prior=mapped.get(doc.path);
    const intentBonus=/\bclassif/i.test(skill.title)&&/classif|types|categor/i.test(section.title)?20:/\bdefine\b/i.test(skill.title)&&/identif|definition|notation/i.test(section.title)?15:0;
    rows.push({doc,section,score:value+stageFit+(prior?1:0)+intentBonus+subject.bonus,hits,bodyHits,mapping:prior?.mapping,headingScore:score(section.headingWords,main),selectionReason:`Lexical candidate: heading matches ${hits.join(', ')||'none'}; teaching text matches ${bodyHits.join(', ')||'none'}. ${subject.reason} ${mappedFallback?'Mapping-backed filename overlap permits a candidate despite different section wording; author must confirm relevance.':prior?'Archived/frozen mapping considered, without granting support.':''}`});
  }
  return rows.sort((a,b)=>b.score-a.score||a.doc.stage-b.doc.stage||a.doc.path.localeCompare(b.doc.path)||a.section.startLine-b.section.startLine);
}
function teachingCandidates(row) {
  const {doc,section}=row,teaching=section.units.filter(u=>u.endLine<=section.teachingEndLine);
  const span=(startLine,endLine,label)=>({startLine,endLine,label,chars:normalizeSourceExcerpt(doc.lines.slice(startLine-1,endLine).join('\n')).length});
  const candidates=[span(section.startLine,section.teachingEndLine,section.title+' — complete teaching')];
  for(let i=0;i<teaching.length;i++) if(teaching[i].kind==='example') {
    let start=i,end=i;
    // Keep the immediately preceding rule/context, and all following scaffold/Key Ideas.
    while(start>0&&i-start<2&&teaching[start-1].kind==='context')start--;
    while(end+1<teaching.length&&!['example'].includes(teaching[end+1].kind))end++;
    candidates.push(span(teaching[start].startLine,teaching[end].endLine,section.title+' — complete example with adjacent rule/scaffold/Key Ideas'));
  }
  return candidates.filter(c=>c.endLine>=c.startLine);
}
function curatedRefs(root,skillId,evidenceDir) {
  const file=inside(root,evidenceDir+'/'+skillId+'.json');if(!fs.existsSync(file))return null;
  const note=readJson(file);return {refs:note.sources||[],notes:Object.fromEntries(['taughtMethods','methodDistinctions','stage3Boundary','scopeBoundary','sourceQuirks','correctionProvenance','sourceImages','supplementalLocators'].filter(key=>note[key]!==undefined).map(key=>[key,note[key]])),hash:hashValue(fs.readFileSync(file)),path:relative(root,file)};
}

export function selectSourceEvidence({root=process.cwd(),skillId,campaignId='worked-examples-2026-09',campaignDir=`booklets/provenance/content-campaign/${campaignId}`,evidenceDir=`.agywork/content-campaign/${campaignId}/pilot-evidence`,budgetChars=DEFAULT_SOURCE_BUDGET,context,state: suppliedState}={}) {
  context ||= createSourceSelectionContext(root);const skill=context.taxonomy.skills.find(s=>s.id===skillId);if(!skill)throw new Error('Unknown skill '+skillId);
  const stateFile=inside(root,campaignDir+'/skills/'+skillId+'.json'),state=suppliedState||(fs.existsSync(stateFile)?readJson(stateFile):{});
  const scope=state.scope||governingScope(skill,context.taxonomy),gaps=[];
  const curated=curatedRefs(root,skillId,evidenceDir);
  const recorded=(state.stage?.sourceReview||[]).filter(ref=>Number.isInteger(ref.startLine)&&Number.isInteger(ref.endLine));
  let origin,refs=[],candidateSections=[];
  if(recorded.length) {origin='preserved-staged-source-selection';refs=recorded;}
  else if(curated?.refs.length) {origin='curated-pilot-selection';refs=curated.refs;}
  else {
    origin='structural-lexical-candidate';const ranked=rankSections(context,skill,state,scope);candidateSections=ranked.slice(0,8).map(row=>({path:row.doc.path,title:row.section.title,startLine:row.section.startLine,endLine:row.section.endLine,score:Number(row.score.toFixed(2)),selectionReason:row.selectionReason}));
    if(!ranked.length)gaps.push({kind:'no-relevant-source-candidate',classification:'lexical-selection-miss-not-established-source-gap',mappedSourcePaths:[...new Set((state.sources||[]).map(ref=>ref.path))],action:'Inspect mapped original teaching and heading synonyms before a paid call; this heuristic miss does not establish a genuine teaching/source gap. No unrelated topic selected.'});
    let used=0;const chosen=[];
    for(const row of ranked.slice(0,12)) {
      if(chosen.length>=3||row.score<ranked[0].score*.72)break;
      if(/\bclassif/i.test(skill.title)&&chosen.some(previous=>/classif|types|categor/i.test(previous.section.title))&&!/classif|types|categor/i.test(row.section.title))continue;
      if(chosen.some(old=>old.doc.path===row.doc.path&&old.section.startLine===row.section.startLine))continue;
      const candidates=teachingCandidates(row),preferred=candidates.find(c=>c.chars<=Math.min(budgetChars-used,6500))||candidates.slice(1).sort((a,b)=>a.chars-b.chars).find(c=>c.chars<=budgetChars-used)||candidates.find(c=>c.chars<=budgetChars-used);
      if(!preferred) {if(!chosen.length)gaps.push({kind:'indivisible-teaching-over-budget',path:row.doc.path,section:row.section.title,smallestChars:Math.min(...candidates.map(c=>c.chars)),action:'No teaching fragment emitted. Select/inspect complete relevant context manually.'});continue;}
      refs.push({path:row.doc.path,hash:row.doc.hash,startLine:preferred.startLine,endLine:preferred.endLine,locator:preferred.label,support:'candidate',mapping:row.mapping||'structural lexical selection',section:row.section.title,selectionReason:row.selectionReason});used+=preferred.chars;chosen.push(row);
      const question=row.section.units.find(u=>u.kind==='question');
      if(question&&question.chars<=Math.min(2500,budgetChars-used)) {refs.push({path:row.doc.path,hash:row.doc.hash,startLine:question.startLine,endLine:question.endLine,locator:row.section.title+' — complete first practice question',support:'candidate',section:row.section.title,selectionReason:'Practice sample follows selected teaching; whole numbered question retained.'});used+=question.chars;}
      else if(question)gaps.push({kind:'practice-sample-not-included',path:row.doc.path,section:row.section.title,questionChars:question.chars,action:'Whole question exceeded remaining practice budget; not truncated.'});
    }
    if(chosen.length&&!chosen.some(row=>row.section.units.some(unit=>unit.kind==='example'&&refs.some(ref=>ref.path===row.doc.path&&ref.startLine<=unit.startLine&&ref.endLine>=unit.endLine))))gaps.push({kind:'no-explicit-worked-example-selected',action:'Selected complete definitions/rules/scaffolds may be relevant, but author must confirm teaching support and derive an example without claiming a source worked example.'});
    if(chosen.length&&/2-step/.test(skillId)) {
      for(const method of ['negative','group','scenario'])if(!chosen.some(row=>row.section.title.toLowerCase().includes(method)))gaps.push({kind:'method-section-needs-confirmation',method,action:'Two-step equations need relevant grouped/negative and scenario context when current items assess it; candidate selection is not method coverage acceptance.'});
    }
  }
  refs=[...new Map(refs.map(ref=>[`${ref.path}:${ref.startLine}:${ref.endLine}`,ref])).values()].map(ref=>({path:ref.path,hash:ref.hash,startLine:ref.startLine,endLine:ref.endLine,locator:ref.locator||`Lines ${ref.startLine}-${ref.endLine}`,support:skill.stage===3&&/Stage [4-6]/.test(ref.path)?'indirect':ref.support==='indirect'||ref.support==='indirect-candidate'?'indirect':'candidate',mapping:ref.mapping,section:ref.section,selectionReason:ref.selectionReason||'Preserved exact curated/recorded locator; support still requires author and independent review.'}));
  const read=readSelectedEvidence(root,refs,{budgetChars});gaps.push(...read.gaps);
  if(scope.pending)gaps.push({kind:'governing-scope-gap',reason:scope.pending});
  const contentFile=inside(root,`public/content/${skillId}.json`),quizFile=inside(root,`public/quizzes/${skillId}.json`);
  const prereqs=context.taxonomy.skills.filter(s=>skill.prereqs?.includes(s.id)).map(s=>{const file=inside(root,`public/content/${s.id}.json`);return {skillId:s.id,skillHash:hashValue(s),contentHash:fs.existsSync(file)?hashValue(fs.readFileSync(file)):null};});
  const binding={skillHash:hashValue(skill),governingScopeHash:hashValue(scope),prerequisiteHash:hashValue(prereqs),prerequisites:prereqs,contentHash:fs.existsSync(contentFile)?hashValue(fs.readFileSync(contentFile)):null,quizHash:fs.existsSync(quizFile)?hashValue(fs.readFileSync(quizFile)):null,frozenBaseline:state.baseline||null,curated:curated?{path:curated.path,hash:curated.hash}:null,sourceHashes:read.evidence.map(ref=>({path:ref.path,hash:ref.hash,startLine:ref.startLine,endLine:ref.endLine,rawExcerptHash:ref.rawExcerptHash,excerptHash:ref.excerptHash}))};
  const result={format:SOURCE_SELECTION_VERSION,skillId,evidenceStatus:'candidate-only',accepted:false,origin,scope,sources:refs,evidence:read.evidence,gaps,normalizedChars:read.normalizedChars,budgetChars,dispatchReady:refs.length>0&&!gaps.some(gap=>['source-budget-exceeded','missing-source','stale-source-hash','invalid-line-range','invalid-image-reference','governing-scope-gap'].includes(gap.kind)),candidateSections,curatedNotes:curated?.notes||null,binding,normalization:'markdown-table-cell-padding-and-separator-runs-v1; exact prepareAssignment normalization. No question/block/TeX tokens truncated or rewritten.',instruction:'dispatchReady means candidate bytes fit the source budget, not that teaching support or method coverage has been accepted. Author must confirm relevant taught methods and Stage 3 boundary; independent reviewer must check support. Candidate selection supplies no review credit.'};
  result.selectionHash=hashValue(result);return result;
}

export function writeSourceSelectionInventory({root=process.cwd(),campaignId='worked-examples-2026-09',outDir=`.agywork/content-campaign/${campaignId}/source-selections`,budgetChars=DEFAULT_SOURCE_BUDGET,ids,context}={}) {
  context ||= createSourceSelectionContext(root);const campaign=readJson(inside(root,`booklets/provenance/content-campaign/${campaignId}/campaign.json`));
  const selectedIds=ids||campaign.skillIds;if(selectedIds.some(id=>!campaign.skillIds.includes(id)))throw new Error('Source inventory skill outside frozen campaign');
  const absolute=inside(root,outDir),allowed=inside(root,`.agywork/content-campaign/${campaignId}/source-selections`);
  if(absolute!==allowed&&!absolute.startsWith(allowed+path.sep))throw new Error('Source selection output must remain in campaign staging source-selections');
  fs.mkdirSync(absolute,{recursive:true});const rows=[];
  for(const skillId of selectedIds) {const selection=selectSourceEvidence({root,skillId,campaignId,budgetChars,context});fs.writeFileSync(path.join(absolute,skillId+'.json'),JSON.stringify(selection,null,2)+'\n');rows.push({skillId,origin:selection.origin,sources:selection.sources.length,normalizedChars:selection.normalizedChars,dispatchReady:selection.dispatchReady,selectionHash:selection.selectionHash,gaps:selection.gaps});}
  const gapCounts={};for(const row of rows)for(const gap of row.gaps)gapCounts[gap.kind]=(gapCounts[gap.kind]||0)+1;
  const report={format:SOURCE_SELECTION_VERSION,evidenceStatus:'candidate-only',campaignId,frozenMembershipHash:campaign.membershipHash,budgetChars,originals:context.documents.size,skills:rows.length,dispatchReady:rows.filter(row=>row.dispatchReady).length,noSources:rows.filter(row=>!row.sources).length,gapCounts,rows};
  fs.writeFileSync(path.join(absolute,'inventory.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const args=process.argv.slice(2),value=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];};
  const report=writeSourceSelectionInventory({root:process.cwd(),campaignId:value('--campaign-id')||'worked-examples-2026-09',budgetChars:Number(value('--budget')||DEFAULT_SOURCE_BUDGET),ids:value('--skills')?.split(',')});
  console.log(JSON.stringify({skills:report.skills,originals:report.originals,dispatchReady:report.dispatchReady,noSources:report.noSources,gapCounts:report.gapCounts}));
}
