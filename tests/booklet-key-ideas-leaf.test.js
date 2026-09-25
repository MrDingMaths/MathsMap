import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile} from 'svelte/compiler';
import {build} from 'esbuild';

// Render the actual specialised branch with an editor probe so the test checks
// content selection and the editing/control contract, not unrelated page setup.
const page=fs.readFileSync(new URL('../src/components/TranscribedBookletPage.svelte',import.meta.url),'utf8');
const branch=page.slice(page.indexOf("{#if block.pedagogyRole==='key-ideas'"),page.indexOf('{:else if isGuided(block)'))+'{/if}';
const sources={
 'probe.svelte':`<script>import EditableBookletText from 'editor.svelte';let {block,showKeyIdeasAnswers=false}=$props();const editProps=()=>({editMode:true});</script>${branch}`,
 'editor.svelte':'<script>let {value,rootId,pointer,fillCloze,editMode}=$props();</script><span data-owner={rootId} data-pointer={pointer} data-fill={fillCloze} data-edit={editMode}>{value}</span>',
};
const compiled=await build({stdin:{contents:"import {render} from 'svelte/server';import Probe from 'probe.svelte';export const html=props=>render(Probe,{props}).body;",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'key-ideas-probe',setup(b){b.onResolve({filter:/^(probe|editor)\.svelte$/},a=>({path:a.path,namespace:'probe'}));b.onLoad({filter:/.*/,namespace:'probe'},a=>({contents:compile(sources[a.path],{filename:a.path,generate:'server'}).js.code,resolveDir:process.cwd()}));}}]});
const {html}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const block=content=>({id:'ki',pedagogyRole:'key-ideas',sourceReview:{responses:[{kind:'cloze'}]},content});

test('leaf Key Ideas prompts render once with their own editable identity and answer control',()=>{
 for(const children of [undefined,[]])for(const showKeyIdeasAnswers of [false,true]){
  const result=html({block:block({id:'leaf',label:'2',prompt:'Keep the base',children}),showKeyIdeasAnswers});
  assert.equal((result.match(/Keep the base/g)??[]).length,1);
  assert.match(result,/cloze-number[^>]*>2\./);
  assert.match(result,/data-owner="leaf" data-pointer="\/prompt"/);
  assert.match(result,new RegExp('data-fill="'+showKeyIdeasAnswers+'" data-edit="true"'));
 }
});

test('grouped Key Ideas retain only their existing numbered child statements',()=>{
 const result=html({block:block({id:'stem',prompt:'Do not add a new stem slot',children:[{id:'a',label:'1',prompt:'First idea'},{id:'b',label:'2',prompt:'Second idea'}]})});
 assert.equal((result.match(/class="cloze-statement"/g)??[]).length,2);
 assert.ok(result.indexOf('First idea')<result.indexOf('Second idea'));
 assert.doesNotMatch(result,/Do not add a new stem slot|data-owner="stem"/);
 assert.match(result,/data-owner="a"/);assert.match(result,/data-owner="b"/);
});
