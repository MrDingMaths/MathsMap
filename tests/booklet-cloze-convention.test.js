import test from 'node:test';
import assert from 'node:assert/strict';
import {fractionConvention,isFullScaffold,parseFraction,boxLatex,gapLatex,bracketBlanks,conflictsWithDecidedConvention} from '../src/lib/booklet-cloze-convention.js';
import {sweepProject} from '../sweep/rules.mjs';

const B=boxLatex(12);

test('a full fraction scaffold keeps its two boxes and its vinculum',()=>{
 const scaffold=`\\frac{${B}}{${B}}`;
 const r=fractionConvention(scaffold);
 assert.equal(r.latex,scaffold);assert.deepEqual(r.issues,[]);
 assert.equal(isFullScaffold(scaffold),true);
 assert.equal(isFullScaffold(`\\frac{${B}}{4}`),false);
 const ghost=`x=\\frac{{\\color{#cccccc}${B}}}{{\\color{#cccccc}${B}}}`;
 assert.equal(fractionConvention(ghost).latex,ghost,'a coloured ghost box is still a box');
});

test('a box inside parentheses in a component becomes the rule-and-space gap of the same width',()=>{
 const r=fractionConvention(`\\dfrac{\\$(\\rule{0pt}{4mm}${B})}{4\\text{ kg}}`);
 assert.equal(r.latex,`\\dfrac{\\$(\\rule{0pt}{4mm}${gapLatex(12)})}{4\\text{ kg}}`);
 assert.deepEqual(r.issues.map(i=>[i.kind,i.side,i.fixable]),[['parenthesised-blank-visible','numerator',true]]);
 const both=fractionConvention(`\\frac{\\left(${B}\\right)}{\\Bigl(${B}\\Bigr)+2}`);
 assert.deepEqual(both.issues.map(i=>i.side),['numerator','denominator']);
 assert.equal(fractionConvention(r.latex).issues.length,0,'already the gap: nothing to do');
 // The cloze rule leaves parentheses to bracket-blank.
 assert.equal(fractionConvention(`\\frac{(${B})}{2}`,{parens:false}).latex,`\\frac{(${B})}{2}`);
});

test('parentheses elsewhere in a fraction do not remove unrelated boxes',()=>{
 const coefficient=`\\frac{${B}(x+1)}{4}`;
 const r=fractionConvention(coefficient);
 assert.equal(r.latex,coefficient);assert.deepEqual(r.issues,[]);
});

test('dotted and invisible components become boxes; dots of unknown width are reported, not guessed',()=>{
 const sized=fractionConvention('\\frac{\\underline{\\hspace{14mm}}}{3}');
 assert.equal(sized.latex,`\\frac{${boxLatex(14)}}{3}`);assert.equal(sized.issues[0].fixable,true);
 const unknown=fractionConvention('\\frac{\\ldots}{3}');
 assert.equal(unknown.latex,'\\frac{\\ldots}{3}');assert.equal(unknown.issues[0].fixable,false);
 const invisible=fractionConvention(`\\frac{\\phantom{${B}}}{2}`);
 assert.equal(invisible.latex,`\\frac{${B}}{2}`);assert.equal(invisible.issues[0].kind,'invisible-component');
 const parenDots=fractionConvention('\\frac{(\\underline{\\hspace{10mm}})}{2}');
 assert.equal(parenDots.latex,`\\frac{(${gapLatex(10)})}{2}`);
 assert.equal(fractionConvention('\\frac{(\\ldots)}{3}').issues[0].fixable,false);
});

test('nested fractions are repaired inside their parts',()=>{
 const r=fractionConvention(`\\frac{\\frac{(${B})}{2}}{3}`);
 assert.equal(r.latex,`\\frac{\\frac{(${gapLatex(12)})}{2}}{3}`);
 assert.equal(parseFraction('\\frac{a}{b}c',0).end,11);
 assert.equal(parseFraction('\\fracture{a}{b}',0),null);
});

test('bracketBlanks: a box, an invisible box or sized dots in parentheses becomes the gap, anywhere in the formula',()=>{
 assert.equal(gapLatex(11),'\\rule{0pt}{5mm}\\hspace{11mm}');
 const box=bracketBlanks(`\\$\\,(${B})`);
 assert.equal(box.latex,`\\$\\,(${gapLatex(12)})`);assert.equal(box.issues[0].kind,'parenthesised-blank-visible');
 const phantom=bracketBlanks(`(\\phantom{${B}})\\,\\mathrm{g}`);
 assert.equal(phantom.latex,`(${gapLatex(12)})\\,\\mathrm{g}`);assert.equal(phantom.issues[0].kind,'parenthesised-blank-phantom');
 assert.equal(bracketBlanks('(\\underline{\\hspace{9mm}})').latex,`(${gapLatex(9)})`);
 assert.equal(bracketBlanks(`\\left(\\rule{0pt}{4mm}${B}\\right)`).latex,`\\left(\\rule{0pt}{4mm}${gapLatex(12)}\\right)`);
 const kept=`x=${B}+1`;
 assert.equal(bracketBlanks(kept).latex,kept,'a box with no brackets is left for the source review');
 const coefficient=`3(${B}+2)`;
 assert.equal(bracketBlanks(coefficient).latex,coefficient,'parentheses around more than the blank are not a bracket blank');
 assert.equal(bracketBlanks(bracketBlanks(`(${B})`).latex).issues.length,0,'already a gap: nothing to do');
 assert.equal(bracketBlanks('(\\ldots)').issues[0].fixable,false);
});

test('the sweep cloze and bracket-blank rules apply the convention to a booklet and leave everything else',()=>{
 const doc=latex=>({format:'maths-editor-document-v1',blocks:[{id:'par',type:'paragraph',inlines:[{id:'m',type:'math',latex}]}]});
 const project=latex=>({id:'p',sections:[{id:'s',phase:'teaching',blocks:[{id:'b',type:'question',content:{id:'q',type:'question',prompt:doc(latex)}}]}],settings:{}});
 const fixed=sweepProject(project(`\\frac{(${B})}{4}`),{fix:true,rules:['cloze','bracket-blank']});
 assert.equal(fixed.changed.length,1);
 assert.equal(fixed.project.sections[0].blocks[0].content.prompt.blocks[0].inlines[0].latex,`\\frac{(${gapLatex(12)})}{4}`);
 assert.ok(fixed.findings.some(f=>f.rule==='bracket-blank'&&f.action==='fix'&&/parenthesised-blank-visible/.test(f.detail)));
 const kept=sweepProject(project(`\\frac{${B}}{${B}}`),{fix:true,rules:['cloze','bracket-blank']});
 assert.equal(kept.changed.length,0,'a full scaffold is left alone');
 assert.equal(kept.findings.filter(f=>/box blank/.test(f.detail)).length,0,'its boxes are not "dots expected" blanks');
 const phantom=sweepProject(project(`x=\\phantom{${B}}+1`),{fix:false,rules:['cloze']});
 assert.equal(phantom.findings.filter(f=>/outlined box blank/.test(f.detail)).length,0,'an invisible phantom box is not a visible blank');
 const equation=sweepProject(project(`x=${B}+1`),{fix:false,rules:['cloze']});
 assert.equal(equation.findings.filter(f=>/outlined box blank/.test(f.detail)).length,1,'an ordinary box blank in an equation is still reported');
 const exception=sweepProject({...project(`\\frac{(${B})}{4}`),sections:[{id:'s',phase:'teaching',blocks:[{id:'b',type:'question',sourceReview:{intentionalDepartures:['Keep the boxes by teacher request for this question only']},content:{id:'q',type:'question',prompt:doc(`\\frac{(${B})}{4}`)}}]}]},{fix:true,rules:['cloze','bracket-blank']});
 assert.equal(exception.changed.length,0,'a local exception holds the block back');
});

test('first-pass normalise drops a response finding that contradicts a decided convention',async()=>{
 const {normalise}=await import('../first-pass/review.mjs');
 const context={index:{owners:new Map([['q1','b1']])},edition:'student',blockIds:['b1'],pages:[3]};
 const dropped=normalise({targets:['q1'],area:'response',page:3,comment:'Replace the rectangular numerator boxes with dotted blanks above the fraction bars.'},context);
 assert.match(dropped.error,/decided convention/);
 const kept=normalise({targets:['q1'],area:'response',page:3,comment:'The three clozes in part a have different widths; make them one size.'},context);
 assert.equal(kept.value.area,'response');
});

test('first-pass findings that contradict the decided conventions are dropped, others are kept',()=>{
 assert.ok(conflictsWithDecidedConvention({comment:'Replace the rectangular numerator boxes with dotted blanks above fraction bars.'}));
 assert.ok(conflictsWithDecidedConvention({comment:'Replace the boxed missing numerators and denominators with consistently sized dotted blanks.'}));
 assert.equal(conflictsWithDecidedConvention({comment:'Use a dotted cloze on the baseline for the final answer, one size for parallel parts.'}),null);
 assert.equal(conflictsWithDecidedConvention({comment:'Parts b and c have clozes of different widths; make them equal.'}),null);
 assert.equal(conflictsWithDecidedConvention({comment:'Remove the answer boxes inside the table cells.'}),null);
 assert.equal(conflictsWithDecidedConvention({}),null);
});

test('only a suggestion that contradicts the convention is dropped; agreeing and unrelated findings stay',()=>{
 // Agrees: the dotted component should be a box.
 assert.equal(conflictsWithDecidedConvention({comment:'The dotted denominator should be an outlined box, not dots.'}),null);
 assert.equal(conflictsWithDecidedConvention({comment:'Replace the dotted numerator with an outlined box.'}),null);
 assert.equal(conflictsWithDecidedConvention({comment:'The fraction denominator uses dots instead of an outlined box.'}),null);
 // Unrelated: width and overlap.
 assert.equal(conflictsWithDecidedConvention({comment:'The numerator box overlaps the fraction bar; make the box narrower, not dotted wider.'}),null);
 assert.equal(conflictsWithDecidedConvention({comment:'Change the denominator box width so the dotted cloze in part b lines up.'}),null);
 // Contradicts: boxes to dots, in any wording.
 assert.ok(conflictsWithDecidedConvention({comment:'The numerator box should be dots.'}));
 assert.ok(conflictsWithDecidedConvention({comment:'Use dots instead of boxes for the missing denominator.'}));
 assert.ok(conflictsWithDecidedConvention({comment:'Use the same dotted blanks for both calculations. Replace the numerator and denominator boxes.'}));
 assert.ok(conflictsWithDecidedConvention({comment:'Missing fractions',proposal:'Convert the full fraction scaffold into dotted clozes.'}));
 // Parentheses: adding marks is a contradiction, removing them is not.
 assert.ok(conflictsWithDecidedConvention({comment:'Add a box inside the parentheses in the fraction numerator.'}));
 assert.equal(conflictsWithDecidedConvention({comment:'Remove the box inside the parentheses in the fraction numerator.'}),null);
});
