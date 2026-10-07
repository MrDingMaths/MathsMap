import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {effectiveInventory} from '../scripts/booklet/workflow-review.mjs';

function readInventory(t,entries){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-header-icons-'));
 t.after(()=>{assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));fs.rmSync(root,{recursive:true,force:true});});
 fs.mkdirSync(path.join(root,'semantic-packets'));
 const original={pageNumber:4,inventoried:true,entries};
 const file=path.join(root,'semantic-packets','page-004.inventory.json');
 fs.writeFileSync(file,JSON.stringify(original));
 const result=effectiveInventory(root,4,{reviewProfile:'textbook-three-pass-v1',corrections:[]});
 assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),original,'Original independent inventory is immutable');
 return result.entries;
}

test('explicit standard header-icon exclusions remain renderer furniture',t=>{
 const entries=readInventory(t,[
  {id:'information',kind:'diagram',description:'Circled information icon beside Horizontal Translations.',presentation:{exclusionReason:'Renderer-owned standard information header icon; use the shared template decoration rather than a mathematical diagram target.'}},
  {id:'question',kind:'diagram',description:'Circled question-mark icon beside Interpret.',presentation:{exclusionReason:'Renderer-owned standard question-mark header icon; use the shared template decoration rather than a mathematical diagram target.'}},
  {id:'combined',kind:'diagram',description:'Circled information icon beside Vertical Translations; circled question-mark icon beside Interpret.',presentation:{exclusionReason:'Renderer-owned standard header icons; no mathematical content or separate diagram target.'}},
  {id:'example',kind:'example',description:'Standard example icon beside the Example heading.',presentation:{exclusionReason:'Renderer-owned example-header decoration; no mathematical content.'}},
  {id:'teaching',kind:'teaching',description:'Information icon, Example icon and Guided Practice pencil icon.',presentation:{exclusionReason:'Renderer-owned teaching-header template decorations; they carry no mathematical content.'}},
  {id:'bulb',kind:'teaching',description:'Light-bulb header icon.',presentation:{exclusionReason:'Renderer-owned standard Key Ideas header decoration; no mathematical content.'}}
 ]);
 for(const entry of entries)assert.equal(entry.exclusionReason,entry.presentation.exclusionReason);
});

test('header-icon furniture cannot excuse a mathematical diagram or response',t=>{
 const reason='Renderer-owned standard information header icon; use the shared template decoration.';
 const entries=readInventory(t,[
  {id:'graph',kind:'diagram',description:'Graph of a parabola with marked intercepts.',presentation:{exclusionReason:reason}},
  {id:'response',kind:'diagram',description:'Information icon with a required student construction.',responseKind:'working',presentation:{exclusionReason:reason}},
  {id:'cloze',kind:'diagram',description:'Information icon with a completion response.',responseKind:'cloze',presentation:{exclusionReason:reason}},
  {id:'given',kind:'diagram',description:'Information icon naming a mathematical shape.',expectedAnswer:'triangle',presentation:{exclusionReason:reason}},
  {id:'unexplained',kind:'diagram',description:'Question-mark icon beside an exercise.',presentation:{exclusionReason:'Source appearance is decorative.'}}
 ]);
 for(const entry of entries)assert.equal(entry.exclusionReason,undefined);
});

test('explicit decorative rules and warning furniture preserve associated teaching',t=>{
 const entries=readInventory(t,[
  {id:'rule',kind:'diagram',description:'Thin blue top rule and pale grey column/row separator rules.',presentation:{exclusionReason:'Decorative page and layout separators carry no mathematical information; use shared arrangement presets.'}},
  {id:'category',kind:'cover',description:'Thin blue horizontal rule above the FOUNDATION category.',presentation:{exclusionReason:'Decorative section rule with no mathematical or instructional content; use the shared house template.'}},
  {id:'warning',kind:'teaching',description:'Three orange warning triangles alongside the three reminder statements.',presentation:{exclusionReason:'Decorative warning markers; retain every associated instructional sentence as editable text.'}},
  {id:'panels',kind:'diagram',description:'Thin vertical separators between question 3 graph panels.',presentation:{exclusionReason:'Decorative panel dividers contain no mathematical information; retain part identities and reading order through the house arrangement.'}},
  {id:'parts',kind:'teaching',description:'Light grey vertical divider between Q2 columns and horizontal divider between its rows.',presentation:{exclusionReason:'Decorative separators between independent sketch regions; response-space allocation is preserved through house arrangement presets.'}},
  {id:'axes',kind:'diagram',description:'Cartesian axes and an asymptote at y=2.',presentation:{exclusionReason:'Decorative layout rules.'}},
  {id:'instruction',kind:'teaching',description:'Reflect first, then translate three units up.',presentation:{exclusionReason:'Decorative warning markers; retain the instruction elsewhere.'}}
 ]);
 for(const entry of entries.slice(0,5))assert.equal(entry.exclusionReason,entry.presentation.exclusionReason);
 for(const entry of entries.slice(5))assert.equal(entry.exclusionReason,undefined);
});
