import test from 'node:test';
import assert from 'node:assert/strict';
import {fromSource} from '../src/lib/document-content.js';
import {compactAnswerLabel,answerNodePath,answerNodeContext,answerFragments,exerciseLabelWidth} from '../src/lib/booklet-exercises.js';

const part=(id,label,short,prompt='')=>({id,type:'part',label,prompt,source:{reference:id},answer:{short,worked:`Working for ${id}: ${short}`}});
const group=(id,prompt,children,label='')=>({id,type:'group',label,prompt,children});
const block=(number,children,prompt='')=>({sourceOrder:number,content:{id:`question-${number}`,type:'question',label:String(number),prompt,children}});

// Apply the shared display API to the consumer's response tree. Expected labels
// and source relationships below are explicit source fixtures, not generated.
function responses(item,mode='short'){
 const result=[];
 const root=item.content;
 function visit(node,path=[],index=0,contexts=[],parent=null){
  const next=answerNodePath(root,node,path,index);
  const context=answerNodeContext(root,node,index,parent);
  const headings=context?[...contexts,context]:contexts;
  if(node.children?.length&&!node.answer?.[mode]){
   node.children.forEach((child,childIndex)=>visit(child,next,childIndex,headings,node));
  }else result.push({id:node.id,label:compactAnswerLabel(item.sourceOrder,next),contexts:headings,answer:node.answer?.[mode],source:node.source});
 }
 visit(root);
 return result;
}

function verifyFragments(item,expectedLabels,mode='short'){
 const saved=structuredClone(item);
 const whole=responses(item,mode);
 const fragments=answerFragments(item,mode);
 const split=fragments.flatMap(fragment=>responses(fragment,mode));
 assert.deepEqual(split,whole,'fragmentation preserves response identity, context, source and mathematics');
 assert.deepEqual(split.map(response=>response.label),expectedLabels);
 assert.equal(new Set(split.map(response=>response.id)).size,split.length,'each response occurs once');
 assert.equal(new Set(split.map(response=>response.label)).size,split.length,'each response has a distinct navigation label');
 assert.deepEqual(item,saved,'display preparation does not mutate stored content');
 return {whole,split,fragments};
}

test('numeric subitems cannot be confused with question numbers; ordinary labels stay familiar',()=>{
 assert.equal(compactAnswerLabel(9,['1']),'9(1)');
 assert.equal(compactAnswerLabel(9,['1','2']),'9(1)(2)');
 assert.equal(compactAnswerLabel(12,['b','2']),'12b(2)');
 assert.equal(compactAnswerLabel(1,['a']),'1a');
 assert.equal(compactAnswerLabel(12,['b','ii']),'12bii');
 assert.equal(compactAnswerLabel(1,['a','Front']),'1a Front');
 assert.equal(compactAnswerLabel(null,['a','Top']),'a Top');
 const item=block(9,[
  part('p70-q9-part1','1','$2g$'),part('p70-q9-part2','2','$8w$'),
  part('p70-q9-part3','3','$p$'),part('p70-q9-part4','4','$3p$'),
  part('p70-q9-part5','5','$9r$'),part('p70-q9-part6','6','$4p$'),
  part('p70-q9-part7','7','Only Jo'),part('p70-q9-part8','8','Both')
 ]);
 const expected=['9(1)','9(2)','9(3)','9(4)','9(5)','9(6)','9(7)','9(8)'];
 for(const mode of ['short','worked'])verifyFragments(item,expected,mode);
 assert.equal(exerciseLabelWidth([item]),'9(1)'.length*2.1);
 const nested=block(9,[group('numbered','',[part('nested','2','$x=4$')],'1')]);
 verifyFragments(nested,['9(1)(2)']);
});

test('the two pen responses retain their relationship and distinct source identities',()=>{
 const item=block(3,[
  part('p72-q3-select','','C','Which of these equations represents the information given?'),
  part('p72-q3-solve','','27 cents','Solve the correct equation to find the price of one pen.')
 ],'The total price of three pens and one pencil is 99 cents.');
 for(const mode of ['short','worked']){
  const {split}=verifyFragments(item,['3(1)','3(2)'],mode);
  assert.deepEqual(split.map(response=>response.id),['p72-q3-select','p72-q3-solve']);
 }
 assert.deepEqual(responses(item).map(response=>response.answer),['C','27 cents']);
});

test('named student examples remain separately paginatable with source headings',()=>{
 const fixtures=[
  {
   item:block(6,[
    group('p29-q6-marvin','Marvin’s work:\n\n$k-6=3$',[part('p29-q6-marvin-why','','He subtracted 6 from both sides instead of adding 6.'),part('p29-q6-marvin-check','','Substitute $k=-3$ back into the equation.'),part('p29-q6-marvin-solve','','$k=91$')]),
    group('p29-q6-hannah','Hannah’s work:\n\n$6k=3$',[part('p29-q6-hannah-why','','$k$ was multiplied by 6, so the inverse operation is to divide, not subtract.'),part('p29-q6-hannah-solve','','$k=18$')])
   ],'Read the examples carefully and answer the questions.'),
   labels:['6(1)(1)','6(1)(2)','6(1)(3)','6(2)(1)','6(2)(2)'],
   headings:['Marvin’s work','Marvin’s work','Marvin’s work','Hannah’s work','Hannah’s work']
  },
  {
   item:block(9,[
    group('p38-q9-mackenzie','Mackenzie’s work:\n\n$6=3+2k$',[part('p38-q9-explain','','Divide every term by 2, including the 3.'),part('p38-q9-solve','','$k=4.5$')]),
    group('p39-q9-ken-group','Ken’s work:\n\n$6x+5x+3=11+14$',[part('p39-q9-ken-explain','','3 is not a like term.'),part('p39-q9-ken-solve','','$x=1$')])
   ],'Read the examples carefully and answer the questions.'),
   labels:['9(1)(1)','9(1)(2)','9(2)(1)','9(2)(2)'],
   headings:['Mackenzie’s work','Mackenzie’s work','Ken’s work','Ken’s work']
  },
  {
   item:block(10,[
    group('p87-jackson-group','Jackson’s work:\n\n$3+6x=5x$',[part('p87-jackson-identify','','$3$ and $6x$; they are not like terms.'),part('p87-jackson-like-terms','','For example, $3x+6x$.'),part('p87-jackson-solve','','$x=3$. Add $6x$ to both sides to get $3=x$.')]),
    group('p87-umi-group','Umi’s work:\n\n$3x=4x-6+5$',[part('p87-umi-error','','She subtracted $5$ from each constant on the right instead of applying the same operation once to both sides.'),part('p87-umi-next-step','','Simplify $-6+5$ to $-1$, then subtract $3x$ from both sides.'),part('p87-umi-solve','','$x=-3$.')]),
    group('p87-george-group','George’s work:\n\n$6(x+3)=12+4x$',[part('p87-george-expansion','','He expanded the brackets.'),part('p87-george-solve','','$x=11$.')])
   ],'Read the examples carefully and answer the questions.'),
   labels:['10(1)(1)','10(1)(2)','10(1)(3)','10(2)(1)','10(2)(2)','10(2)(3)','10(3)(1)','10(3)(2)'],
   headings:['Jackson’s work','Jackson’s work','Jackson’s work','Umi’s work','Umi’s work','Umi’s work','George’s work','George’s work']
  }
 ];
 for(const fixture of fixtures){
  for(const mode of ['short','worked']){
   const {split,fragments}=verifyFragments(fixture.item,fixture.labels,mode);
   assert.equal(fragments.length,fixture.labels.length,'large example questions can still split at each response');
   assert.deepEqual(split.map(response=>response.contexts.join(' · ')),fixture.headings);
   assert.deepEqual(split.map(response=>response.source.reference),split.map(response=>response.id));
  }
 }
 const narrow=block(10,[group('example','Jackson’s work:',[part('answer','','$x=3$')])]);
 const long=structuredClone(narrow);
 long.content.children[0].prompt='A much longer source heading identifying the same student example:';
 assert.equal(exerciseLabelWidth([long]),exerciseLabelWidth([narrow]),'heading length does not change the label gutter');
});

test('named methods preserve both student attribution and original method order',()=>{
 const ashley=block(6,[
  group('p85-q6-methods','Solve the equation using both methods.',[part('p85-q6-ashley-method','','$x=3$'),part('p85-q6-amelia-method','','$x=3$')]),
  part('p85-q6-preference','','Ashley’s method avoids negative coefficients of $x$.','Which method do you prefer?')
 ],'Ashley and Amelia are solving the equation $8x+3=2x+21$');
 const harriet=block(7,[
  part('p85-q7-strategy','','Harriet’s strategy is more sensible: adding $3t$ to both sides leaves a positive coefficient of $t$.','Whose strategy is most sensible? Explain why'),
  group('p85-q7-methods','Solve the equation using both methods.',[part('p85-q7-emma-method','','$t=1$'),part('p85-q7-harriet-method','','$t=1$')])
 ],'Emma and Harriet are solving the equation $10-3t=2+5t$');
 for(const mode of ['short','worked']){
  const first=verifyFragments(ashley,['6(1)(1)','6(1)(2)','6(2)'],mode).split;
  assert.deepEqual(first.map(response=>response.contexts),[
   ['Solve the equation using both methods.','Ashley’s method'],
   ['Solve the equation using both methods.','Amelia’s method'],[]
  ]);
  const second=verifyFragments(harriet,['7(1)','7(2)(1)','7(2)(2)'],mode).split;
  assert.deepEqual(second.map(response=>response.contexts),[
   [],['Solve the equation using both methods.','Emma’s method'],
   ['Solve the equation using both methods.','Harriet’s method']
  ]);
 }
});

test('unnamed method and direct-response families receive stable positional paths',()=>{
 const methods=block(6,[
  group('p46-q6-methods','',[
   part('p46-q6-method-1','','Subtract $8$, then divide by $-4$, applying each operation to both sides.'),
   part('p46-q6-method-2','','Add $4x$, subtract $12$, then divide by $4$, applying each operation to both sides.'),
   part('p46-q6-method-3','','Divide by $4$, subtract $2$, then divide by $-1$, applying each operation to both sides.')
  ]),part('p46-q6-preference','','Answers will vary; any of the three methods may be preferred.','Which method do you prefer?')
 ],'Consider these three methods of solving $8-4x=12$');
 const eliza=block(2,[
  part('p43-q2-subtract','','Subtracting 6 cancels the positive 6 term; adding 6 would not cancel it.'),
  part('p43-q2-divide','','Dividing by $-1$ isolates $k$.'),part('p43-q2-solve','','$k=5$')
 ],'Read Eliza’s work carefully and answer the questions.\n\nEliza’s work:');
 for(const mode of ['short','worked']){
  verifyFragments(methods,['6(1)(1)','6(1)(2)','6(1)(3)','6(2)'],mode);
  const {split}=verifyFragments(eliza,['2(1)','2(2)','2(3)'],mode);
  assert.deepEqual(split.map(response=>response.contexts),[['Eliza’s work'],['Eliza’s work'],['Eliza’s work']]);
 }
});

test('verification responses retain their grouped relationship and named student context',()=>{
 const item=block(11,[
  group('p88-q11-verify','Verify Bobbie’s solution by substitution to show it is incorrect.',[
   part('p88-q11-verify-lhs','','$LHS=4$.','$LHS=$'),
   part('p88-q11-verify-rhs','','$RHS=16$. Since $LHS$ differs from $RHS$, 2 is not the solution.','$RHS=$')
  ]),part('p88-q11-correct','','He should have kept the negative sign with 6 on the left. $x=-4$.','Identify Bobbie’s error and solve the equation correctly.')
 ],'Bobbie is solving the equation $5x-6=2+7x$');
 for(const mode of ['short','worked']){
  const {split}=verifyFragments(item,['11(1)(1)','11(1)(2)','11(2)'],mode);
  assert.deepEqual(split.map(response=>response.contexts),[
   ['Bobbie’s work','Verify Bobbie’s solution by substitution to show it is incorrect.'],
   ['Bobbie’s work','Verify Bobbie’s solution by substitution to show it is incorrect.'],
   ['Bobbie’s work']
  ]);
 }
});

test('missing-label families and transparent groups retain their original fragment paths',()=>{
 const item=block(6,[
  group('ordinary','',[part('ordinary-a','a','$x=1$')],null),
  group('mixed','',[part('blank','','$x=2$'),part('named','b','$x=3$')],null)
 ]);
 const {fragments}=verifyFragments(item,['6a','6(2)(1)','6(2)b']);
 assert.equal(responses(fragments[2])[0].label,'6(2)b','a retained group segment cannot disappear when only its named child remains');
 for(const fragment of fragments){
  assert.deepEqual(answerFragments(fragment,'short').flatMap(unit=>responses(unit)),responses(fragment),'refragmentation preserves the original display path');
 }
 const missing=block(4,[
  group('first','First approach:',[part('first-response',null,'First result')],null),
  group('second','Second approach:',[part('second-response',null,'Second result')],null)
 ]);
 verifyFragments(missing,['4(1)a','4(2)a']);
 const ordinary=block(4,[part('a',null,'First result'),part('b',null,'Second result')]);
 verifyFragments(ordinary,['4a','4b']);
});

test('ordinary, consolidated and atomic answer behaviour remains intact',()=>{
 const ordinary=block(1,[group('a','',[part('front','Front','$x=4$')],'a')]);
 verifyFragments(ordinary,['1a Front']);
 assert.equal(exerciseLabelWidth([ordinary]),'1a Front'.length*2.1);
 const renumbered={sourceOrder:2,content:{id:'source-question-3',type:'group',label:'3',children:[part('a','a','$x=1$'),part('b','b','$x=2$')]}};
 verifyFragments(renumbered,['2a','2b']);
 assert.equal(exerciseLabelWidth([renumbered]),8);
 const consolidated=block(2,[part('hidden-a','a','Hidden'),part('hidden-b','b','Hidden')]);
 consolidated.content.answer={short:'One consolidated answer',worked:'One consolidated solution'};
 for(const mode of ['short','worked']){
  const {split,fragments}=verifyFragments(consolidated,['2'],mode);
  assert.equal(fragments.length,1);
  assert.equal(split[0].id,consolidated.content.id);
  assert.equal(split[0].answer,consolidated.content.answer[mode]);
 }
 const nested=block(1,[group('consolidated-part','',[part('hidden','i','Hidden')],'a')]);
 nested.content.children[0].answer={short:'Combined result',worked:'Combined working'};
 for(const mode of ['short','worked'])verifyFragments(nested,['1a'],mode);
 const dependent=block(5,[part('first','a','$x=3$'),part('second','b','$y=4$')]);
 dependent.content.children[1].dependsOn=['first'];
 const shared=block(5,[part('first','a','$x=3$'),part('second','b','$y=4$')]);
 shared.content.sharedSolutionDiagrams=[{id:'shared-diagram',tikz:'source diagram'}];
 for(const item of [dependent,shared]){
  for(const mode of ['short','worked']){
   const {fragments}=verifyFragments(item,['5a','5b'],mode);
   assert.equal(fragments.length,1,'shared or dependent responses remain atomic');
  }
 }
});

function nativeContextPrompt(source){
 const prompt=fromSource(source);
 assert.equal(prompt.format,'maths-editor-document-v1');
 assert.equal(prompt.blocks[0].type,'paragraph','the source heading is a native first paragraph');
 assert.ok(prompt.blocks.slice(1).some(block=>block.type==='table'||block.inlines?.some(inline=>inline.type==='math')),'following working contains native mathematics or a native table');
 return prompt;
}

function verifyNativeContextFragments(item,labels,headings,mode){
 const {split,fragments}=verifyFragments(item,labels,mode);
 assert.deepEqual(split.map(response=>response.contexts),headings);
 for(const response of split){
  for(const text of [response.label,...response.contexts]){
   assert.doesNotMatch(text,/[\\$\t\r\n]/,'display labels contain no native TeX or tabbed working body');
  }
 }
 for(const fragment of fragments){
  assert.deepEqual(answerFragments(fragment,mode).flatMap(unit=>responses(unit,mode)),responses(fragment,mode),'native context survives repeated fragmentation');
 }
 return split;
}

test('native student documents retain first-paragraph names without exposing their working bodies',()=>{
 const item=block(10,[
  group('p87-jackson-group',nativeContextPrompt('Jackson’s work:\n\n$3+6x=5x$\t$\\Huge\\times$\n\n$3+6x$\t$=$\t$5x$\n$9x$\t$=$\t$5x$'),[
   part('p87-jackson-identify','','$3$ and $6x$; they are not like terms.'),
   part('p87-jackson-like-terms','','For example, $3x+6x$.'),
   part('p87-jackson-solve','','$x=3$. Add $6x$ to both sides to get $3=x$.')
  ]),
  group('p87-umi-group',nativeContextPrompt('Umi’s work:\n\n$3x=4x-6+5$\t$\\Huge\\times$\n\n$3x$\t$=$\t$4x$\t$-6$\t$+5$\n\t\t\t$-5$\t$-5$\n$3x$\t$=$\t$4x-11$'),[
   part('p87-umi-error','','She subtracted $5$ from each constant on the right instead of applying the same operation once to both sides.'),
   part('p87-umi-next-step','','Simplify $-6+5$ to $-1$, then subtract $3x$ from both sides.'),
   part('p87-umi-solve','','$x=-3$.')
  ]),
  group('p87-george-group',nativeContextPrompt('George’s work:\n\n$6(x+3)=12+4x$\n\n$6x+18$\t$=$\t$12+4x$\n$-4x$\t\t$-4x$\n$2x+18$\t$=$\t$12$\n$-18$\t\t$-18$\n$2x$\t$=$\t$-6$\n$\\div 2$\t\t$\\div 2$\n$x'),[
   part('p87-george-expansion','','He expanded the brackets.'),
   part('p87-george-solve','','$x=11$.')
  ])
 ],'Read the examples carefully and answer the questions.');
 const labels=['10(1)(1)','10(1)(2)','10(1)(3)','10(2)(1)','10(2)(2)','10(2)(3)','10(3)(1)','10(3)(2)'];
 const headings=[
  ['Jackson’s work'],['Jackson’s work'],['Jackson’s work'],
  ['Umi’s work'],['Umi’s work'],['Umi’s work'],
  ['George’s work'],['George’s work']
 ];
 for(const mode of ['short','worked']){
  const split=verifyNativeContextFragments(item,labels,headings,mode);
  assert.deepEqual(split.map(response=>response.id),[
   'p87-jackson-identify','p87-jackson-like-terms','p87-jackson-solve',
   'p87-umi-error','p87-umi-next-step','p87-umi-solve',
   'p87-george-expansion','p87-george-solve'
  ]);
  assert.deepEqual(split.map(response=>response.source.reference),split.map(response=>response.id));
 }
});

test('native paired-method roots retain Ashley Amelia Emma and Harriet in source order',()=>{
 const ashley=block(6,[
  group('p85-q6-methods',fromSource('Solve the equation using both methods.'),[
   part('p85-q6-ashley-method','','$x=3$'),
   part('p85-q6-amelia-method','','$x=3$')
  ]),
  part('p85-q6-preference','','Ashley’s method avoids negative coefficients of $x$.','Which method do you prefer?')
 ],nativeContextPrompt('Ashley and Amelia are solving the equation $8x+3=2x+21$\n\nI’m going to subtract $2x$ from both sides first\nI’m going to subtract $8x$ from both sides first'));
 const harriet=block(7,[
  part('p85-q7-strategy','','Harriet’s strategy is more sensible: adding $3t$ to both sides leaves a positive coefficient of $t$.','Whose strategy is most sensible? Explain why'),
  group('p85-q7-methods','Solve the equation using both methods.',[
   part('p85-q7-emma-method','','$t=1$'),
   part('p85-q7-harriet-method','','$t=1$')
  ])
 ],nativeContextPrompt("Emma and Harriet are solving the equation $10-3t=2+5t$\n\nI'm going to subtract $5t$ from both sides.\nI'm going to add $3t$ to both sides."));
 assert.equal(ashley.content.children[0].prompt.format,'maths-editor-document-v1','the method-parent context also exercises native content');
 for(const mode of ['short','worked']){
  const first=verifyNativeContextFragments(ashley,['6(1)(1)','6(1)(2)','6(2)'],[
   ['Solve the equation using both methods.','Ashley’s method'],
   ['Solve the equation using both methods.','Amelia’s method'],[]
  ],mode);
  assert.deepEqual(first.map(response=>response.id),['p85-q6-ashley-method','p85-q6-amelia-method','p85-q6-preference']);
  const second=verifyNativeContextFragments(harriet,['7(1)','7(2)(1)','7(2)(2)'],[
   [],['Solve the equation using both methods.','Emma’s method'],
   ['Solve the equation using both methods.','Harriet’s method']
  ],mode);
  assert.deepEqual(second.map(response=>response.id),['p85-q7-strategy','p85-q7-emma-method','p85-q7-harriet-method']);
 }
});
