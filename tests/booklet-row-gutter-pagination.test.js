import test from 'node:test';
import assert from 'node:assert/strict';
import {group,item,arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
import {questionSplitGroups,fragmentQuestion,fragmentLayouts,paginateFlow} from '../src/lib/booklet-pagination.js';
import {readFileSync} from 'node:fs';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {fromSource} from '../src/lib/document-content.js';

const fixture=(ids=['a','b','c','d'])=>{
  const block={
    id:'row-gutter-question',type:'question',sourceOrder:1,
    content:{
      id:'q',prompt:fromSource('Use the source context to sketch each graph.'),
      children:ids.map(id=>({
        id,label:id,prompt:fromSource('Sketch graph '+id+'.'),
        answer:{short:'Graph'},answerSpaceMm:40
      }))
    }
  };
  const initial=resolveArrangement(block);
  const fields=id=>arrangementItems(initial.tree.root)
    .filter(n=>initial.entries.get(n.ref)?.ownerId===id)
    .map(n=>structuredClone(n));
  const cell=id=>group(id+'-cell',fields(id));
  const split=root=>{
    const arrangement={version:1,root};
    assert.deepEqual(resolveArrangement(block,arrangement).missing,[],
      'The fixture must retain every native content reference');
    const before=structuredClone(arrangement);
    const result=questionSplitGroups(block,{[block.id]:{arrangement}});
    assert.deepEqual(arrangement,before,'Calculating safe cuts must preserve the saved arrangement');
    return result;
  };
  return {block,fields,cell,split};
};

const expected=(...ids)=>ids.map(ids=>({parentId:'q',ids}));

const gutterRoot=f=>group('root',[
  group('root-context',f.fields('q').filter(n=>n.ref!=='q/label')),
  group('label-gutter',[
    item('q/label'),
    group('response-stack',f.block.content.children.map(n=>f.cell(n.id)))
  ],'row')
]);

test('a root label gutter around two peer rows permits a cut between the rows',()=>{
  const f=fixture();
  assert.ok(f.fields('q').some(n=>n.ref==='q/label'));
  const root=group('root',[
    group('root-context',f.fields('q').filter(n=>n.ref!=='q/label')),
    group('label-gutter',[
      item('q/label'),
      group('response-stack',[
        group('first-peer-row',[f.cell('a'),f.cell('b')],'row'),
        group('second-peer-row',[f.cell('c'),f.cell('d')],'row')
      ])
    ],'row')
  ]);
  assert.deepEqual(f.split(root),expected(['a','b'],['c','d']));
});

test('a source context column beside stacked responses leaves each response independently splittable',()=>{
  const f=fixture();
  const root=group('context-and-responses',[
    group('source-context',f.fields('q')),
    group('response-stack',['a','b','c','d'].map(f.cell))
  ],'row');
  assert.deepEqual(f.split(root),expected(['a'],['b'],['c'],['d']));
});

test('real sibling response cells remain atomic while a later response stays separate',()=>{
  const f=fixture(['a','b','c']);
  const root=group('root',[
    group('root-context',f.fields('q')),
    group('peer-row',[f.cell('a'),f.cell('b')],'row'),
    f.cell('c')
  ]);
  assert.deepEqual(f.split(root),expected(['a','b'],['c']));

  const pair=fixture(['a','b']);
  assert.deepEqual(pair.split(group('root',[
    group('root-context',pair.fields('q')),
    group('peer-row',[pair.cell('a'),pair.cell('b')],'row')
  ])),[],'An entirely atomic question has no safe cut');
});

test('explicit dependency chains still join stacked responses through a label gutter',()=>{
  const f=fixture();
  f.block.content.children[1].dependsOn=['a'];
  f.block.content.children[2].dependsOn=['b'];
  assert.deepEqual(f.split(gutterRoot(f)),expected(['a','b','c'],['d']));
});

test('dependencies spanning intermediate responses keep the complete interval atomic',()=>{
  const f=fixture();
  f.block.content.children[2].dependsOn=['a'];
  const root=group('context-and-responses',[
    group('source-context',f.fields('q')),
    group('response-stack',['a','b','c','d'].map(f.cell))
  ],'row');
  assert.deepEqual(f.split(root),expected(['a','b','c'],['d']));
});

test('explicit atomicity and shared-diagram guards still prevent safe cuts',()=>{
  const base=fixture(['a','b']).block;
  const variants=[
    {...base,flow:{keepTogether:true}},
    {...base,pairedBlockId:'paired-question'},
    {...base,content:{...base.content,questionDiagrams:[{id:'shared-diagram',format:'image',src:'/shared.png'}]}},
    {...base,content:{...base.content,sharedSolutionDiagrams:[{id:'shared-solution',format:'image',src:'/solution.png'}]}}
  ];
  for(const block of variants)assert.deepEqual(questionSplitGroups(block),[]);
});

const leafNodes=node=>node.children?.length?node.children.flatMap(leafNodes):[node];
const leafAnswers=block=>leafNodes(block.content).map(node=>({id:node.id,label:node.label,short:node.answer?.short}));

const nestedColumnFixture=()=>{
  const labels=['abcdefg','hijklmn','opqrstu'].map(column=>[...column]);
  const block={
    id:'nested-column-question',type:'question',sourceOrder:4,sourcePageNumber:44,
    sourceRefs:[{pageNumber:44}],classification:{primarySkillId:'solve-linear-2-step'},
    flow:{sourcePageBreakBefore:false,localDifficulty:{difficulty:'Development'}},
    content:{
      id:'nested-root',type:'question',label:'4',prompt:'Solve these equations.',layout:'grid',columns:3,
      children:labels.map((column,index)=>({
        id:'semantic-column-'+index,type:'group',label:'',prompt:'',layout:'list',
        children:column.map(label=>({
          id:'nested-'+label,type:'part',label,prompt:'$2x+5=11$',
          answerSpaceMm:index===2&&'pqstu'.includes(label)?32:26,
          answer:{short:'$x=3$',worked:'Subtract 5 from both sides, then divide both sides by 2.'}
        }))
      }))
    }
  };
  const rows=Array.from({length:7},(_,index)=>labels.map(column=>'nested-'+column[index]));
  block.flow.continuationRows=rows;
  const nativeIds=node=>[node.id,...(node.children??[]).flatMap(nativeIds)];
  const contentIds=nativeIds(block.content);
  assert.equal(new Set(contentIds).size,contentIds.length,
    'The nested fixture must have unique native content IDs before layout resolution');
  const initial=resolveArrangement(block);
  const fields=id=>[...initial.entries.values()]
    .filter(entry=>entry.ownerId===id&&!['answer-short','answer-worked'].includes(entry.role))
    .map(entry=>item(entry.ref,entry.title));
  const arrangement={version:1,root:group('nested-arrangement',[
    group('nested-stem',fields(block.content.id),'row'),
    ...rows.map((row,index)=>group('physical-row-'+index,
      row.map(id=>group(id+'-cell',[
        group(id+'-question',fields(id).filter(node=>node.ref!==id+'/space'),'row'),
        ...fields(id).filter(node=>node.ref===id+'/space')
      ],'stack')),'row'))
  ],'stack')};
  assert.deepEqual(resolveArrangement(block,arrangement).missing,[],
    'The nested fixture must use unique native student fields');
  const layout={arrangement};
  block.presentation={layoutOverrides:{blockLayouts:{[block.id]:layout}}};
  return {block,rows,layouts:{[block.id]:layout}};
};

test('explicit physical rows split nested semantic columns without changing source or answer order',()=>{
  const f=nestedColumnFixture(),before=structuredClone(f);
  const legacy=structuredClone(f.block);
  delete legacy.flow.continuationRows;
  assert.deepEqual(questionSplitGroups(legacy,f.layouts),[],
    'Non-opted questions retain the existing whole-column atomicity');
  const groups=questionSplitGroups(f.block,f.layouts);
  assert.deepEqual(groups.map(group=>group.ids),f.rows);
  assert.equal(groups.length,7);
  assert.deepEqual(leafAnswers(f.block).map(answer=>answer.label),[...'abcdefghijklmnopqrstu']);
  assert.deepEqual(f,before,'Safe-cut discovery must not mutate editable source or saved layouts');
});

test('nested row fragments retain original ancestors, complete leaf content and pruned saved layouts',()=>{
  const f=nestedColumnFixture();
  f.block.flow.exerciseHeadingBefore={title:'Original heading'};
  f.block.flow.pageBreakBefore=true;
  f.block.flow.sourceContinuationLabel=true;
  const before=structuredClone(f);
  const selected=questionSplitGroups(f.block,f.layouts).slice(1,4);
  const fragment=fragmentQuestion(f.block,selected,2);
  assert.deepEqual(fragment.content.children.map(column=>column.id),
    f.block.content.children.map(column=>column.id));
  assert.deepEqual(fragment.content.children.map(column=>column.children.map(part=>part.label)),
    [['b','c','d'],['i','j','k'],['p','q','r']]);
  for(let column=0;column<3;column++)assert.deepEqual(fragment.content.children[column],{
    ...f.block.content.children[column],children:f.block.content.children[column].children.slice(1,4)
  },'Pruning must retain every selected part and its ancestor metadata');
  assert.deepEqual(fragment.classification,f.block.classification);
  assert.deepEqual(fragment.sourceRefs,f.block.sourceRefs);
  assert.deepEqual(fragment.flow.localDifficulty,f.block.flow.localDifficulty);
  assert.deepEqual(fragment.flow.continuationRows,f.rows.slice(1,4));
  assert.equal(fragment.flow.fragment,2);
  assert.equal(fragment.flow.hideRepeatedStem,true);
  assert.equal(fragment.flow.pageBreakBefore,false);
  assert.equal(fragment.flow.sourcePageBreakBefore,false);
  assert.equal(fragment.flow.sourceContinuationLabel,false);
  assert.equal('exerciseHeadingBefore' in fragment.flow,false);
  for(const layouts of [f.layouts,{}]){
    const projected=fragmentLayouts([fragment],layouts)[fragment.id].arrangement;
    assert.deepEqual(projected.root.children.map(node=>node.id),
      ['nested-stem','physical-row-1','physical-row-2','physical-row-3']);
    for(const row of projected.root.children.slice(1)){
      assert.equal(row.children.length,3,'Every retained physical row must keep all three cells');
      for(const cell of row.children){
        const owners=new Set(arrangementItems(cell).map(node=>node.ref.split('/')[0]));
        assert.equal(owners.size,1,'A retained response cell must contain one complete leaf');
      }
    }
    assert.deepEqual(questionSplitGroups(fragment,layouts).map(group=>group.ids),f.rows.slice(1,4),
      'A generated fragment remains safely splittable using its projected row definitions');
  }
  assert.deepEqual(f,before,'Fragment creation and layout projection must preserve the original question');
});

test('nested continuation definitions fail closed for incomplete, reordered or cross-row content',()=>{
  const variants=[
    f=>f.block.flow.continuationRows.reverse(),
    f=>f.block.flow.continuationRows[0].pop(),
    f=>f.block.flow.continuationRows[0][0]='unknown-part',
    f=>f.block.flow.continuationRows[1][0]=f.block.flow.continuationRows[0][0],
    f=>f.block.content.children[0].children[1].dependsOn=['nested-a'],
    f=>f.block.content.children[0].children[0].dependsOn=['unknown-part'],
    f=>f.block.content.children[0].children[0].dependsOn=['semantic-column-1'],
    f=>f.block.content.children[0].answer={short:'A shared response'},
    f=>f.block.content.children[0].prompt='Use this column-specific definition.',
    f=>f.block.content.children[0].answerSpaceMm=40,
    f=>f.block.content.answer={short:'A shared response'},
    f=>f.block.content.sharedSolutionDiagrams=[{id:'shared-solution',format:'image',src:'/shared.png'}],
    f=>f.block.flow.keepTogether=true,
    f=>f.block.pairedBlockId='paired-question',
    f=>f.block.content.children[0].keepTogether=true,
    f=>f.block.content.children[0].children[0].pairedBlockId='paired-part',
    f=>f.block.content.representations=[{id:'alternative'}],
    f=>f.block.content.questionDiagrams=[{id:'shared-figure',format:'image',src:'/shared.png'}],
    f=>f.layouts[f.block.id].arrangement.root.direction='row',
    f=>f.layouts[f.block.id].arrangement.root.keepTogether=true,
    f=>f.layouts[f.block.id].arrangement.root.children[0].children.shift(),
    f=>f.layouts[f.block.id].arrangement.root.children[0].children.pop(),
    f=>f.layouts[f.block.id].arrangement.root.children[1].children[0].children[0].children.shift(),
    f=>f.layouts[f.block.id].arrangement.root.children[1].children[0].children[0].children.pop(),
    f=>f.layouts[f.block.id].arrangement.root.children[1].children[0].children.pop(),
    f=>f.layouts[f.block.id].arrangement.root.children[1].children[0].children.push(item('unknown-content')),
    f=>{
      const tree=f.layouts[f.block.id].arrangement.root;
      tree.children[1].children[0].children.push(...structuredClone(tree.children[2].children[0].children));
    }
  ];
  for(const mutate of variants){
    const f=nestedColumnFixture();mutate(f);
    assert.deepEqual(questionSplitGroups(f.block,f.layouts),[],
      'Unsupported opted content must not fall back to a potentially unsafe structural cut');
  }
  const safe=nestedColumnFixture();
  safe.block.content.children[0].children[0].dependsOn=['nested-h'];
  assert.equal(questionSplitGroups(safe.block,safe.layouts).length,7,
    'A dependency entirely inside a complete physical row remains atomic within that row');
});

test('repeated shared comparison figures remain whole while complete practice rows continue',()=>{
  const f=fixture([...'abcdefgh']);
  f.block.content.layout='grid';f.block.content.columns=2;
  const figure={id:'paired-demonstrations',format:'image',src:'/paired-demonstrations.png',widthMm:125};
  const block={...f.block,content:{
    id:'comparison-root',label:'8',prompt:'Compare both methods.',layout:'list',
    questionDiagrams:[figure],children:[f.block.content]
  },flow:{}};
  const initial=resolveArrangement(block);
  const fields=id=>arrangementItems(initial.tree.root)
    .filter(node=>initial.entries.get(node.ref)?.ownerId===id)
    .map(node=>structuredClone(node));
  const arrangement={version:1,root:group('comparison-arrangement',[
    group('shared-context',fields('comparison-root'),'stack'),
    group('practice-instruction',fields('q'),'stack'),
    ...Array.from({length:4},(_,index)=>group('practice-row-'+index,
      [String.fromCharCode(97+index*2),String.fromCharCode(98+index*2)]
        .map(id=>group(id+'-response',fields(id),'stack')),'row'))
  ],'stack')};
  const layouts={[block.id]:{arrangement}};
  assert.deepEqual(questionSplitGroups(block,layouts),[]);
  block.flow.repeatSharedDiagram=true;
  const before=structuredClone(block),groups=questionSplitGroups(block,layouts);
  assert.deepEqual(groups.map(group=>group.ids),[['a','b'],['c','d'],['e','f'],['g','h']]);
  for(let index=0;index<groups.length;index++){
    const fragment=fragmentQuestion(block,[groups[index]],index);
    assert.deepEqual(fragment.content.questionDiagrams,[figure],
      'Both annotated demonstrations remain one unchanged shared figure');
    assert.deepEqual(fragment.content.children[0].children,
      block.content.children[0].children.slice(index*2,index*2+2));
  }
  assert.deepEqual(block,before);
});

// Run this integration case against the coordinator's supplied source snapshot.
// It uses the real project schema and a deterministic measurement derived from
// the unchanged response allowances; it establishes no visual acceptance.
test('measured pagination recovers the actual source-44 nested grid overflow',
  {skip:!process.env.MATHSMAP_LAYOUT_SOURCE_SNAPSHOT},async()=>{
    const snapshot=JSON.parse(readFileSync(process.env.MATHSMAP_LAYOUT_SOURCE_SNAPSHOT,'utf8'));
    const project=structuredClone(snapshot.project??snapshot),targets=[];
    const visit=value=>{
      if(!value||typeof value!=='object')return;
      if(value.id==='p44-q4-block'&&value.type==='question'&&value.content?.children){
        targets.push(value);
        const columns=value.content.children;
        value.flow={...value.flow,continuationRows:columns[0].children.map((_,index)=>columns.map(column=>column.children[index].id))};
      }
      for(const child of Object.values(value))visit(child);
    };
    visit(project);
    assert.ok(targets.length,'The supplied snapshot must contain the actual source-44 question');
    assert.ok(project.settings?.layoutOverrides,'The snapshot must contain a complete paginator project');
    const target=targets[0],layouts=project.settings.layoutOverrides.blockLayouts??{};
    const originalAnswers=leafAnswers(target),before=structuredClone(project);
    assert.deepEqual(originalAnswers.map(answer=>answer.label),[...'abcdefghijklmnopqrstu']);
    assert.equal(questionSplitGroups(target,layouts).length,7);
    const measure=async page=>({capacity:120,height:page.blocks.reduce((height,block)=>{
      if(block.id!==target.id)return height;
      const columns=block.content.children;
      const rows=columns[0].children.map((_,index)=>Math.max(...columns.map(column=>column.children[index].answerSpaceMm))+13);
      return height+(block.flow?.hideRepeatedStem?0:12)+rows.reduce((sum,row)=>sum+row,0);
    },0)});
    assert.ok((await measure({blocks:[target]})).height>120,
      'The complete question must exceed the measured page capacity before continuation');
    const result=await paginateFlow(project,'student',measure);
    assert.equal(result.issues.some(issue=>issue.kind==='oversized-content'&&issue.id===target.id),false);
    const fragments=result.pages.flatMap(page=>page.blocks.filter(block=>block.id===target.id));
    assert.ok(fragments.length>1,'The actual nested grid must recover by continuing complete rows');
    assert.deepEqual(fragments.flatMap(block=>block.flow.continuationRows),target.flow.continuationRows,
      'Every physical row must occur exactly once and in its original vertical order');
    const originals=new Map(leafNodes(target.content).map(part=>[part.id,part]));
    for(const page of result.pages){
      if(!page.blocks.some(block=>block.id===target.id))continue;
      const measured=await measure(page);
      assert.ok(measured.height<=measured.capacity+.2,'Recovered pages must fit without reducing handwriting allowances');
      const projected=fragmentLayouts(page.blocks,layouts);
      for(const fragment of page.blocks.filter(block=>block.id===target.id)){
        assert.deepEqual(fragment.content.children.map(column=>column.id),target.content.children.map(column=>column.id));
        for(const part of leafNodes(fragment.content))assert.deepEqual(part,originals.get(part.id));
        const arrangement=projected[fragment.id]?.arrangement??fragment.presentation.layoutOverrides.blockLayouts[fragment.id].arrangement;
        const allowed=new Set(leafNodes(fragment.content).map(part=>part.id));
        for(const item of arrangementItems(arrangement.root)){
          const owner=item.ref.split('/')[0];
          if(originals.has(owner))assert.ok(allowed.has(owner),'A saved fragment layout must not reference removed parts');
        }
      }
    }
    assert.deepEqual(leafAnswers(target),originalAnswers,'Full-project answers retain column-first reading order');
    assert.deepEqual(project,before,'Pagination must preserve the complete editable source project');
  });
