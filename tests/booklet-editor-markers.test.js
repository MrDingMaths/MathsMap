import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile} from 'svelte/compiler';
import {build} from 'esbuild';

// Exercise the actual practice wrapper; isolate unrelated question rendering.
const page=fs.readFileSync(new URL('../src/components/TranscribedBookletPage.svelte',import.meta.url),'utf8');
const declarations=page.slice(page.indexOf("{@const rated=block.type==='question'"),page.indexOf('{#if block.flow?.exerciseAnchorBefore'));
const start=page.indexOf('<section class:atom-practice={insideAtom}');
const wrapper=page.slice(start,page.indexOf('</section>',start)+10);
const source=`<script>
 import {questionDifficulty,chilliCount} from './src/lib/booklet-bank-ratings.js';
 let {block,editMode=false}=$props();
 const page={section:{phase:'practice'},blocks:[block]},insideAtom=false,anchorPrefix='';
 const isTheoryReview=()=>false,firstPlacement=()=>true,bankMarker=()=>({state:'local',title:'Local',label:'L'}),answerHrefFor=()=>null;
 </script>
 {#snippet questionView(block,number,href)}<b data-question-number>{number}</b>{/snippet}
 {#each [block] as block}${declarations}${wrapper}{/each}`;
const built=await build({stdin:{contents:"import {render} from 'svelte/server';import Probe from 'probe.svelte';export const view=props=>render(Probe,{props}).body;",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'marker-probe',setup(b){b.onResolve({filter:/^probe\.svelte$/},()=>({path:'probe.svelte',namespace:'probe'}));b.onLoad({filter:/.*/,namespace:'probe'},()=>({contents:compile(source,{filename:'probe.svelte',generate:'server'}).js.code,resolveDir:process.cwd()}));}}]});
const {view}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));

test('practice ratings remain editable but are absent from exported question wrappers',()=>{
 const block={id:'q',type:'question',classification:{reasoningScore:78},flow:{exerciseNumber:1}};
 const published=view({block});
 assert.doesNotMatch(published,/data-chillies|data-reasoning-band|editor-markers/);
 assert.match(published,/data-question-number/);
 const editor=view({block,editMode:true});
 assert.match(editor,/data-chillies="[1-4]"/);
 assert.match(editor,/editor-markers/);
 assert.match(editor,/>78<\/span>/);
});
