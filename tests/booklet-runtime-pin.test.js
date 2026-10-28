import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createPinnedRuntime,verifyPinnedRuntime,pinnedArguments,PIN_FILE} from '../scripts/booklet/frozen-runtime-pin.mjs';
import {prepareVerificationSnapshot} from '../scripts/booklet/import-verification-runtime.mjs';

function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap runtime pin test-'));
 // Keep these small Git fixtures and frozen bytes available for diagnosis.
 t.diagnostic('Preserved runtime-pin fixture: '+root);
 const write=(relative,bytes)=>{const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);return file;};
 const manifest={name:'runtime-pin-fixture',private:true,type:'module',dependencies:{'pin-fixture-dep':'1.0.0'}};
 write('package.json',JSON.stringify(manifest));
 write('package-lock.json',JSON.stringify({name:manifest.name,lockfileVersion:3,packages:{'':{dependencies:manifest.dependencies},'node_modules/pin-fixture-dep':{version:'1.0.0'}}}));
 write('src/lazy.js','export async function later(){const renderer=await import("./renderer.js");const dependency=await import("pin-fixture-dep");return renderer.default+":"+dependency.default;}');
 write('src/renderer.js','export default "committed renderer";');
 write('index.html','<!doctype html><title>Runtime pin fixture</title>');
 write('.gitignore','node_modules/\n.booklet-work/\n');
 write('node_modules/pin-fixture-dep/package.json',JSON.stringify({name:'pin-fixture-dep',version:'1.0.0',type:'module',exports:'./index.js'}));
 write('node_modules/pin-fixture-dep/index.js','export default "installed dependency";');
 const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();
 git(['init','--quiet']);
 git(['add','--','package.json','package-lock.json','src','index.html','.gitignore']);
 git(['-c','user.name=Runtime Pin Fixture','-c','user.email=runtime-pin-fixture@example.invalid','-c','commit.gpgsign=false','commit','--quiet','-m','Temporary runtime pin fixture']);
 const revision=git(['rev-parse','HEAD']),out=path.join(root,'.booklet-work','test-pin');
 const nodeExecutable=write('.booklet-work/installed-engines/node.exe','fixture Node');
 const browserExecutable=write('.booklet-work/installed-engines/chrome/chrome.exe','fixture Chrome');
 write('.booklet-work/installed-engines/chrome/1.2.3.4/chrome.dll','fixture browser runtime');
 const pin=()=>createPinnedRuntime({sourceRoot:root,out,revision:'HEAD',overlays:[],engines:{nodeExecutable,browserExecutable,browserVersion:'1.2.3.4'}});
 return {root,out,write,pin,revision};
}
function assertPhysicalTree(directory){
 for(const entry of fs.readdirSync(directory)){
  const file=path.join(directory,entry),stat=fs.lstatSync(file);
  assert.equal(stat.isSymbolicLink(),false,'No link may remain in '+file);
  if(stat.isDirectory())assertPhysicalTree(file);else assert.equal(stat.isFile(),true);
 }
}

test('pin physically copies committed renderer and installed dependency; later live mutations cannot affect lazy imports',async t=>{
 const f=fixture(t);
 f.write('src/renderer.js','export default "uncommitted renderer before pin";');
 const pin=f.pin();
 assert.equal(pin.revision,f.revision);assertPhysicalTree(pin.root);
 f.write('src/lazy.js','throw Error("live lazy module was imported");');
 f.write('src/renderer.js','throw Error("live renderer was imported");');
 f.write('node_modules/pin-fixture-dep/index.js','throw Error("live dependency was imported");');
 const module=await import(pathToFileURL(path.join(pin.root,'src/lazy.js')).href);
 assert.equal(await module.later(),'committed renderer:installed dependency');
 assert.equal(verifyPinnedRuntime(pin.root).manifestHash,pin.manifestHash);
 assert.equal(fs.realpathSync(path.join(pin.root,'node_modules')),path.join(pin.root,'node_modules'));
});

test('pin retains a Markdown contract read synchronously when a lazy convention module first loads',async t=>{
 const f=fixture(t),contract='docs/booklet-worked-solution-style.md';
 f.write(contract,'# Committed worked-solution contract\nUse the source method.\n');
 f.write('src/solution-conventions.js','import fs from "node:fs";export const contract=fs.readFileSync(new URL("../docs/booklet-worked-solution-style.md",import.meta.url),"utf8");');
 f.write('src/contract-lazy.js','export async function later(){return (await import("./solution-conventions.js")).contract;}');
 f.write('docs/archive/old-contract.md','Archived text is not an execution contract.');
 f.write('docs/bulk-index.json','{"notAnExecutionContract":true}');
 const git=args=>execFileSync('git',args,{cwd:f.root,encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
 git(['add','--',contract,'src/solution-conventions.js','src/contract-lazy.js','docs/archive/old-contract.md','docs/bulk-index.json']);
 git(['-c','user.name=Runtime Pin Fixture','-c','user.email=runtime-pin-fixture@example.invalid','-c','commit.gpgsign=false','commit','--quiet','-m','Temporary synchronous Markdown contract fixture']);
 const pin=f.pin(),expected='# Committed worked-solution contract\nUse the source method.\n';
 assert.equal(fs.readFileSync(path.join(pin.root,contract),'utf8'),expected);
 assert.equal(pin.files.some(row=>row.path===contract),true);
 assert.equal(fs.existsSync(path.join(pin.root,'docs/archive/old-contract.md')),false);
 assert.equal(fs.existsSync(path.join(pin.root,'docs/bulk-index.json')),false);
 f.write(contract,'Live contract changed after pin; this must not be read.');
 const module=await import(pathToFileURL(path.join(pin.root,'src/contract-lazy.js')).href);
 assert.equal(await module.later(),expected);
 assert.equal(verifyPinnedRuntime(pin.root).manifestHash,pin.manifestHash);
});

test('pin verification rejects renderer/dependency tampering and added renderer files',t=>{
 const f=fixture(t),pin=f.pin(),renderer=path.join(pin.root,'src/renderer.js'),dependency=path.join(pin.root,'node_modules/pin-fixture-dep/index.js');
 const rendererBytes=fs.readFileSync(renderer),dependencyBytes=fs.readFileSync(dependency);
 fs.writeFileSync(renderer,'export default "tampered";');
 assert.throws(()=>verifyPinnedRuntime(pin.root),/Pinned execution file changed: src\/renderer\.js/);
 fs.writeFileSync(renderer,rendererBytes);fs.writeFileSync(dependency,'export default "tampered dependency";');
 assert.throws(()=>verifyPinnedRuntime(pin.root),/Frozen dependencies changed/);
 fs.writeFileSync(dependency,dependencyBytes);fs.writeFileSync(path.join(pin.root,'src','extra-lazy.js'),'export default "unexpected";');
 assert.throws(()=>verifyPinnedRuntime(pin.root),/Unexpected pinned execution file/);
});

test('pin verification rejects unexpected execution files at the pin root',t=>{
 const f=fixture(t),pin=f.pin();fs.writeFileSync(path.join(pin.root,'unexpected-loader.mjs'),'export default "unexpected";');
 assert.throws(()=>verifyPinnedRuntime(pin.root),/Unexpected pinned execution file/);
});

test('pinned arguments resolve canonical run and file paths while stripping launcher-only runtime-root',t=>{
 const root=path.resolve(os.tmpdir(),'runtime pin argument source'),pin={root:path.join(root,'.booklet-work','pin','runtime'),workRoot:path.join(root,'.booklet-work','full-imports')};
 const options=['--project-file','--out','--exports','--sample','--visibility-reviews','--corrections','--config','--runs','--pool','--teaching-exports','--teaching-project-file','--previous-exports'];
 const args=['finish','--runtime-root',pin.root,'--run-id','book-one',...options.flatMap((option,i)=>[option,'relative path '+i]),'--concurrency','3'];
 const forwarded=pinnedArguments(args,pin,root);
 assert.equal(forwarded.includes('--runtime-root'),false);assert.equal(forwarded[forwarded.indexOf('--run-id')+1],path.join(pin.workRoot,'book-one'));
 for(const [i,option]of options.entries())assert.equal(forwarded[forwarded.indexOf(option)+1],path.join(root,'relative path '+i));
 assert.deepEqual(forwarded.slice(-2),['--concurrency','3']);
 const absolute=path.join(pin.workRoot,'another-book');
 assert.deepEqual(pinnedArguments(['content','--run-id',absolute],pin,root),['content','--run-id',absolute]);
});

test('verification snapshots reuse exactly one immutable pin root and preserve canonical outputs after live edits',t=>{
 const f=fixture(t),pin=f.pin(),out=path.join(f.root,'.booklet-work','full-imports','book-one','exports','1');
 const manifest=prepareVerificationSnapshot({root:pin.root,out});
 const expectedHash=createHash('sha256').update(fs.readFileSync(path.join(pin.root,PIN_FILE))).digest('hex');
 assert.equal(manifest.version,2);assert.equal(manifest.root,pin.root);assert.equal(manifest.snapshot,pin.root);
 assert.equal(manifest.pin.root,pin.root);assert.equal(manifest.pin.manifestHash,expectedHash);assert.equal(manifest.pin.revision,f.revision);assert.equal(manifest.pin.workRoot,pin.workRoot);
 assert.equal(fs.existsSync(path.join(out,'runtime')),false,'An export must not create another runtime copy or node_modules junction');
 assert.equal(fs.lstatSync(path.join(pin.root,'node_modules')).isSymbolicLink(),false);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out,'runtime-manifest.json'))),manifest);
 f.write('src/renderer.js','export default "live changed after export preparation";');
 f.write('src/new-live-only.js','export default "not in pinned execution";');
 f.write('node_modules/pin-fixture-dep/index.js','export default "live dependency changed";');
 assert.equal(verifyPinnedRuntime(pin.root).manifestHash,expectedHash);
 assert.deepEqual(prepareVerificationSnapshot({root:pin.root,out}),manifest);
 const second=prepareVerificationSnapshot({root:pin.root,out:path.join(path.dirname(out),'2')});
 assert.equal(second.snapshot,pin.root);assert.equal(second.pin.manifestHash,expectedHash);
 assert.throws(()=>prepareVerificationSnapshot({root:pin.root,out:path.join(f.root,'outside-canonical-work')}),/canonical \.booklet-work/);
});
