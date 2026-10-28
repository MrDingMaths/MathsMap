import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {copyFrozenEngines} from '../scripts/booklet/frozen-engines.mjs';

const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function fixture(t){
 const root=path.resolve('.booklet-work/test-tmp');fs.mkdirSync(root,{recursive:true});
 const directory=fs.mkdtempSync(path.join(root,'frozen-engines-'));
 t.after(()=>{assert.ok(path.resolve(directory).startsWith(root+path.sep));fs.rmSync(directory,{recursive:true,force:true});});
 const write=(relative,bytes)=>{const file=path.join(directory,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);return file;};
 const nodeExecutable=write('host/node.exe','node binary'),browserExecutable=write('host/Chrome/Application/chrome.exe','chrome loader');
 write('host/Chrome/Application/156.0.8078.49/chrome.dll','chrome engine');write('host/Chrome/Application/156.0.8078.49/locales/en-US.pak','locale');
 write('host/Chrome/Application/156.0.8078.49/Installer/setup.exe','installer excluded');write('host/Chrome/Application/155.0.0.0/chrome.dll','old engine excluded');write('host/Chrome/User Data/Default/Cookies','profile excluded');
 return {directory,write,snapshot:path.join(directory,'pin'),options:{nodeExecutable,browserExecutable,browserVersion:'156.0.8078.49'}};
}
test('copies exact Node and only the selected Chrome runtime with verifiable hashes',t=>{
 const {snapshot,options}=fixture(t),result=copyFrozenEngines(snapshot,options);
 assert.equal(result.node.source,options.nodeExecutable);assert.equal(result.browser.source,options.browserExecutable);assert.equal(result.browser.version,options.browserVersion);
 assert.equal(fs.readFileSync(result.node.executable,'utf8'),'node binary');assert.equal(fs.readFileSync(result.browser.executable,'utf8'),'chrome loader');
 assert.equal(result.files.length,4);
 for(const row of result.files){const file=path.resolve(snapshot,row.path);assert.ok(file.startsWith(snapshot+path.sep));assert.ok(fs.lstatSync(file).isFile());assert.equal(hash(file),row.hash);}
 assert.equal(result.node.hash,hash(result.node.executable));assert.equal(result.browser.hash,hash(result.browser.executable));
 assert.ok(result.files.every(row=>!/(?:Installer|155\.0\.0\.0|User Data|Cookies)/.test(row.path)));
});
test('later live binary mutation leaves the copied runtime and manifest unchanged; pins cannot be overwritten',t=>{
 const {snapshot,options,write}=fixture(t),result=copyFrozenEngines(snapshot,options),before=JSON.stringify(result);
 write('host/node.exe','updated node');write('host/Chrome/Application/chrome.exe','updated chrome loader');write('host/Chrome/Application/156.0.8078.49/chrome.dll','updated chrome engine');
 for(const row of result.files)assert.equal(hash(path.join(snapshot,row.path)),row.hash);
 assert.equal(JSON.stringify(result),before);assert.throws(()=>copyFrozenEngines(snapshot,options),/already exist/);
 assert.equal(fs.readFileSync(result.browser.executable,'utf8'),'chrome loader');
});
test('rejects an unsafe version or a destination inside the installed browser without writing it',t=>{
 const {snapshot,options}=fixture(t);
 assert.throws(()=>copyFrozenEngines(snapshot,{...options,browserVersion:'../User Data'}),/exact version/);assert.equal(fs.existsSync(snapshot),false);
 const inside=path.join(path.dirname(options.browserExecutable),'pin');assert.throws(()=>copyFrozenEngines(inside,options),/separate/);assert.equal(fs.existsSync(inside),false);
});
