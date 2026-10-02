// Scoped maintenance: presentation remains local; original-owned answers sync
// through the ordinary revision-safe project transaction.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {questionDifficulty} from '../../src/lib/booklet-bank-ratings.js';
import {contentSource} from '../../src/lib/document-content.js';
import {resolveArrangement} from '../../src/lib/booklet-arrangement.js';
import {syncDiagramPresentation} from '../../src/lib/booklet-document-tools.js';
import {answerDiagramWidth,answerDiagramSignature,withAnswerDiagramWidth} from '../../src/lib/booklet-exercises.js';

const explicitResultIds=new Set([
  'p16-q11-response', // Sketch and state the range in interval notation.
  'mixed-review-q-14e30933-52a9-4426-9dc8-c4e0272e9689-p33-concept-check-q8-response', // Estimate the intercepts, not a sketch task.
]);

export function repairFurtherTransformationsLayout(project,{shortWidthReviews={},questionWidthReviews={}}={}){
  if(project.id!=='further-transformations-v1')throw Error('Select Further Transformations v1.');
  let next=structuredClone(project);
  const records=[];
  for(const section of next.sections)for(const block of section.blocks){
    if(block.type!=='question'||!block.content)continue;
    const difficulty=questionDifficulty(block)?.difficulty;
    const simplify=['Foundation','Development'].includes(difficulty);
    const mixed=section.id==='further-transformations-mixed-review';
    const visit=(node,stem='')=>{
      const context=(stem+' '+contentSource(node.prompt??'')).trim();
      // These two sketch responses use their parent's one shared sum graph;
      // the intervening part explicitly requests an explanation and keeps it.
      const hasSketch=node.answer?.solutionDiagrams?.length||['p34-q6-sketch','p34-q6b'].includes(node.id);
      if(simplify&&hasSketch&&node.answer.short&&!explicitResultIds.has(node.id)&&/\b(?:sketch|graph|draw)\b/i.test(context)){
        records.push({kind:'graph-only-short',blockId:block.id,nodeId:node.id,difficulty,before:node.answer.short});
        node.answer.short=null;
      }
      for(const diagram of [...node.answer?.solutionDiagrams??[],...node.sharedSolutionDiagrams??[]]){
        const settings=next.settings.compactAnswers;
        const width=answerDiagramWidth(settings,'short',diagram,Math.min(Number(diagram.widthMm)||60,60));
        const review=shortWidthReviews[diagram.id];
        if(review&&review.sourceSignature!==answerDiagramSignature(diagram))throw Error('Reviewed graph source changed: '+diagram.id);
        const target=review?.widthMm??50;
        if(width>target||review&&width!==target){
          next.settings.compactAnswers=withAnswerDiagramWidth(settings,'short',diagram.id,target);
          records.push({kind:'short-diagram-width',blockId:block.id,diagramId:diagram.id,before:width,after:target});
        }
      }
      for(const diagram of node.questionDiagrams??[]){
        const review=questionWidthReviews[diagram.id];
        if(!mixed&&!review)continue;
        if(review&&review.sourceSignature!==answerDiagramSignature(diagram))throw Error('Reviewed graph source changed: '+diagram.id);
        const resolved=resolveArrangement(block,next.settings.layoutOverrides.blockLayouts?.[block.id]?.arrangement,next.settings.layoutOverrides);
        const find=n=>n.ref===diagram.id?n:(n.children??[]).map(find).find(Boolean);
        const placement=find(resolved.tree.root);
        const width=placement?.width??(Number(diagram.widthMm)||95);
        const target=review?.widthMm??70;
        if(width>target||review&&width!==target){
          next=syncDiagramPresentation(next,block.id,diagram.id,{widthMm:target});
          records.push({kind:'question-diagram-width',blockId:block.id,diagramId:diagram.id,before:width,after:target});
        }
      }
      node.children?.forEach(child=>visit(child,context));
    };
    visit(block.content);
  }
  return {next,records};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const directory=path.resolve('.booklet-work/further-transformations-spacing-20261002');
  await fs.mkdir(directory,{recursive:true});
  const project=JSON.parse(await fs.readFile('booklets/projects/further-transformations-v1.json','utf8'));
  const reviewFile='booklets/provenance/further-transformations-layout-2026-10-02.json';
  const review=JSON.parse(await fs.readFile(reviewFile,'utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}));
  const {next,records}=repairFurtherTransformationsLayout(project,review);
  await fs.writeFile(path.join(directory,'baseline.json'),JSON.stringify(project,null,2)+'\n');
  await fs.writeFile(path.join(directory,'candidate.json'),JSON.stringify(next,null,2)+'\n');
  await fs.writeFile(path.join(directory,'changes.json'),JSON.stringify({startedAt:new Date().toISOString(),revision:project.revision,records},null,2)+'\n');
  if(process.argv.includes('--apply')){
    const {saveBookletProject}=await import('./project-studio-server.mjs');
    const saved=await saveBookletProject(next,{expectedRevision:project.revision,checkpoint:true});
    await fs.writeFile(path.join(directory,'saved.json'),JSON.stringify(saved,null,2)+'\n');
    console.log('Saved revision '+saved.revision);
  }
  console.log(JSON.stringify({changes:records.reduce((counts,r)=>(counts[r.kind]=(counts[r.kind]??0)+1,counts),{}),directory}));
}
