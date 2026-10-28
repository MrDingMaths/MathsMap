import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {copyFrozenDependencies,frozenDependencyDifferences,verifyFrozenDependencies} from '../scripts/booklet/frozen-dependencies.mjs';

function fixture(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-frozen-dependencies-'));
 const root=path.join(directory,'source'),snapshot=path.join(directory,'snapshot');fs.mkdirSync(path.join(root,'node_modules'),{recursive:true});
 t.after(()=>{assert.equal(path.dirname(directory),fs.realpathSync(os.tmpdir()));fs.rmSync(directory,{recursive:true,force:true});});
 const write=(file,text)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
 const pkg=(name,manifest={},base=path.join(root,'node_modules'))=>{const directory=path.join(base,name);write(path.join(directory,'package.json'),JSON.stringify({name,version:'1.0.0',...manifest}));write(path.join(directory,'index.js'),'export default '+JSON.stringify(manifest.version??'1.0.0')+';');return directory;};
 return {root,snapshot,write,pkg,directory};
}
function junction(t,target,link){
 try{fs.symlinkSync(target,link,process.platform==='win32'?'junction':'dir');return true;}
 catch(error){if(['EPERM','EACCES','ENOSYS'].includes(error.code)){t.skip('Directory symlinks unavailable: '+error.code);return false;}throw error;}
}

test('copies declared dependencies, dev dependencies, installed peers and optional closure without host links',t=>{
 const f=fixture(t);f.write(path.join(f.root,'package.json'),JSON.stringify({dependencies:{a:'1'},devDependencies:{dev:'1'},optionalDependencies:{missing:'1'}}));
 const a=f.pkg('a',{dependencies:{child:'1'},optionalDependencies:{absent:'1'},peerDependencies:{peer:'1',notInstalled:'1'}});f.pkg('child');f.pkg('peer');f.pkg('dev');f.pkg('unrelated');
 f.write(path.join(a,'.env'),'a secret');f.write(path.join(a,'.cache','unused'),'cache');f.write(path.join(f.root,'node_modules','.bin','a'),'wrapper');
 const manifest=copyFrozenDependencies(f.root,f.snapshot);
 assert.deepEqual(manifest.packages.map(p=>p.name).sort(),['a','child','dev','peer']);
 assert.equal(fs.existsSync(path.join(f.snapshot,'node_modules','unrelated')),false);
 assert.equal(fs.existsSync(path.join(f.snapshot,'node_modules','a','.env')),false);
 assert.equal(fs.existsSync(path.join(f.snapshot,'node_modules','a','.cache')),false);
 assert.equal(fs.existsSync(path.join(f.snapshot,'node_modules','.bin')),false);
 assert.equal(verifyFrozenDependencies(f.snapshot,manifest),true);
 for(const row of manifest.files)assert.equal(fs.lstatSync(path.join(f.snapshot,row.path)).isSymbolicLink(),false);
});

test('retains nested installed versions and hoisted resolution, including dependency cycles',t=>{
 const f=fixture(t),a=f.pkg('a',{dependencies:{shared:'1',b:'1'}});f.pkg('shared',{version:'1.0.0'},path.join(a,'node_modules'));
 f.pkg('shared',{version:'2.0.0'});f.pkg('b',{dependencies:{a:'1',shared:'2'}});
 const manifest=copyFrozenDependencies(f.root,f.snapshot,{roots:['a','shared']});
 assert.equal(JSON.parse(fs.readFileSync(path.join(f.snapshot,'node_modules/a/node_modules/shared/package.json'))).version,'1.0.0');
 assert.equal(JSON.parse(fs.readFileSync(path.join(f.snapshot,'node_modules/shared/package.json'))).version,'2.0.0');
 assert.equal(manifest.packages.length,4);
 assert.equal(verifyFrozenDependencies(f.snapshot,manifest),true);
});

test('host package changes cannot affect frozen dependency bytes',t=>{
 const f=fixture(t),a=f.pkg('a');const manifest=copyFrozenDependencies(f.root,f.snapshot,{roots:['a']});
 const frozen=fs.readFileSync(path.join(f.snapshot,'node_modules/a/index.js'),'utf8');
 f.write(path.join(a,'index.js'),'mutated host dependency');
 assert.equal(fs.readFileSync(path.join(f.snapshot,'node_modules/a/index.js'),'utf8'),frozen);
 assert.deepEqual(frozenDependencyDifferences(f.snapshot,manifest),[]);
});

test('verification detects tampering, missing files, extra files and unsafe manifest paths',t=>{
 const f=fixture(t);f.pkg('a');const manifest=copyFrozenDependencies(f.root,f.snapshot,{roots:['a']});
 f.write(path.join(f.snapshot,'node_modules/a/index.js'),'tampered');fs.unlinkSync(path.join(f.snapshot,'node_modules/a/package.json'));f.write(path.join(f.snapshot,'node_modules/a/extra.js'),'extra');
 assert.deepEqual(frozenDependencyDifferences(f.snapshot,manifest),['node_modules/a/extra.js','node_modules/a/index.js','node_modules/a/package.json']);
 assert.throws(()=>verifyFrozenDependencies(f.snapshot,manifest),/Frozen dependencies changed/);
 assert.throws(()=>frozenDependencyDifferences(f.snapshot,{version:1,files:[{path:'node_modules/../../outside',hash:'a'.repeat(64)}]}),/Invalid frozen dependency manifest/);
});

test('missing required dependencies fail, while missing optional dependencies are skipped',t=>{
 const f=fixture(t);f.pkg('a',{dependencies:{required:'1'},optionalDependencies:{optional:'1'}});
 assert.throws(()=>copyFrozenDependencies(f.root,f.snapshot,{roots:['a']}),/Missing required installed dependency required/);
 assert.throws(()=>copyFrozenDependencies(f.root,path.join(f.directory,'other'),{roots:['../outside']}),/Invalid dependency name/);
});

test('materializes package links within installed dependencies and resolves their real nested dependencies',t=>{
 const f=fixture(t),store=path.join(f.root,'node_modules','.store'),a=f.pkg('a',{dependencies:{child:'1'}},store);f.pkg('child',{version:'3.0.0'},path.join(a,'node_modules'));
 if(!junction(t,a,path.join(f.root,'node_modules','a')))return;
 const manifest=copyFrozenDependencies(f.root,f.snapshot,{roots:['a']});
 assert.equal(fs.lstatSync(path.join(f.snapshot,'node_modules/a')).isSymbolicLink(),false);
 assert.equal(JSON.parse(fs.readFileSync(path.join(f.snapshot,'node_modules/a/node_modules/child/package.json'))).version,'3.0.0');
 assert.equal(verifyFrozenDependencies(f.snapshot,manifest),true);
});

test('rejects dependency package and internal directory links escaping approved package files',t=>{
 const f=fixture(t),outside=f.pkg('outside',{},path.join(f.directory,'private'));
 if(!junction(t,outside,path.join(f.root,'node_modules','escape')))return;
 assert.throws(()=>copyFrozenDependencies(f.root,f.snapshot,{roots:['escape']}),/escapes node_modules/);
 const a=f.pkg('a');if(!junction(t,outside,path.join(a,'private')))return;
 assert.throws(()=>copyFrozenDependencies(f.root,path.join(f.directory,'second'),{roots:['a']}),/symlink escapes its package/);
});

test('verification rejects injected directory links without following them',t=>{
 const f=fixture(t);f.pkg('a');const manifest=copyFrozenDependencies(f.root,f.snapshot,{roots:['a']});
 const outside=f.pkg('private',{},path.join(f.directory,'private'));
 if(!junction(t,outside,path.join(f.snapshot,'node_modules','injected')))return;
 assert.deepEqual(frozenDependencyDifferences(f.snapshot,manifest),['node_modules/injected']);
});
