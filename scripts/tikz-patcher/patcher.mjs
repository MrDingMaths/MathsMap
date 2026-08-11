import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function replaceOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`Missing literal patch site: ${label}`);
  if (source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`Literal patch site is not unique: ${label}`);
  }
  return source.slice(0, first) + replacement + source.slice(first + needle.length);
}

export function patchRunTex(source) {
  let out = source;
  out = replaceOnce(out, "let o,i,a;", "let o,i,a,l;", "run-tex state");
  out = replaceOnce(out,
    `(0,t.expose)({async load(A){a=A,i=await c("tex.wasm.gz"),o=new Uint8Array(await c("core.dump.gz"),0,65536*B.pages)}`,
    `(0,t.expose)({async load(A){a=A;const _workerStart=performance.now(),_wasmStart=performance.now(),_dumpStart=performance.now(),[t,r]=await Promise.all([c("tex.wasm.gz").then(async t=>{const e=performance.now(),r=await WebAssembly.compile(t);return{bytes:t,module:r,texWasmFetchInflateMs:e-_wasmStart,wasmCompileMs:performance.now()-e}}),c("core.dump.gz").then(t=>({bytes:t,coreDumpFetchInflateMs:performance.now()-_dumpStart}))]);i=t.bytes;l=t.module;o=new Uint8Array(r.bytes,0,65536*B.pages);return{texWasmFetchInflateMs:t.texWasmFetchInflateMs,coreDumpFetchInflateMs:r.coreDumpFetchInflateMs,wasmCompileMs:t.wasmCompileMs,workerReadyMs:performance.now()-_workerStart}}`,
    "run-tex concurrent asset load and module compile");
  out = replaceOnce(out,
    `new Uint8Array(n.buffer,0,65536*B.pages).set(o.slice(0)),B.setMemory(n.buffer)`,
    `const _dumpMemoryCopyStart=performance.now();new Uint8Array(n.buffer,0,65536*B.pages).set(o);const dumpMemoryCopyMs=performance.now()-_dumpMemoryCopyStart;B.setMemory(n.buffer)`,
    "run-tex dump copy");
  out = replaceOnce(out,
    `async texify(t,e){const r=e.texPackages?JSON.parse(e.texPackages):{}`,
    `async texify(t,e){const _texifyStart=performance.now();const r=e.texPackages?JSON.parse(e.texPackages):{}`,
    "run-tex render timing start");
  out = replaceOnce(out,
    `const a=await WebAssembly.instantiate(i,{library:B,env:{memory:n}});await B.executeAsync(a.instance.exports);const w=B.readFileSync("input.dvi").buffer;B.deleteEverything();let Q="";const h=new g.Writable({write(A,t,e){Q+=A.toString(),e()}});return await(0,A.dvi2html)(async function*(){yield s.Buffer.from(w)}(),h),Q`,
    `try{const _wasmInstantiateStart=performance.now(),a=await WebAssembly.instantiate(l,{library:B,env:{memory:n}}),wasmInstantiateMs=performance.now()-_wasmInstantiateStart,_texExecutionStart=performance.now();await B.executeAsync(a.exports);const texExecutionMs=performance.now()-_texExecutionStart,w=B.readFileSync("input.dvi").buffer;let Q="";const h=new g.Writable({write(A,t,e){Q+=A.toString(),e()}}),_dviStart=performance.now();await(0,A.dvi2html)(async function*(){yield s.Buffer.from(w)}(),h);return{svg:Q,timings:{dumpMemoryCopyMs,wasmInstantiateMs,texExecutionMs,dviToSvgMs:performance.now()-_dviStart,texifyMs:performance.now()-_texifyStart}}}finally{B.deleteEverything()}`,
    "run-tex cached module instance and VFS cleanup");
  return out;
}

export function patchTikzJax(source) {
  let out = source;
  out = replaceOnce(out,
    `U=function(e,t,{blocked:r,upgrade:n,blocking:o,terminated:s}={}){const i=indexedDB.open(e,t),a=m(i);return n&&i.addEventListener("upgradeneeded",(e=>{n(m(i.result),e.oldVersion,e.newVersion,m(i.transaction),e)})),r&&i.addEventListener("blocked",(e=>r(e.oldVersion,e.newVersion,e))),a.then((e=>{s&&e.addEventListener("close",(()=>s())),o&&e.addEventListener("versionchange",(e=>o(e.oldVersion,e.newVersion,e)))})).catch((()=>{})),a}("TikzJax",2,{upgrade(e){e.createObjectStore("svgImages")}}),Q=async e=>(await U).get("svgImages",e),q=[];`,
    `U=null;const Y=()=>U||(U=(function(e,t,{blocked:r,upgrade:n,blocking:o,terminated:s}={}){const i=indexedDB.open(e,t),a=m(i);return n&&i.addEventListener("upgradeneeded",(e=>{n(m(i.result),e.oldVersion,e.newVersion,m(i.transaction),e)})),r&&i.addEventListener("blocked",(e=>r(e.oldVersion,e.newVersion,e))),a.then((e=>{s&&e.addEventListener("close",(()=>s())),o&&e.addEventListener("versionchange",(e=>o(e.oldVersion,e.newVersion,e)))})).catch((()=>{})),a})("TikzJax",2,{upgrade(e){e.createObjectStore("svgImages")}}));const Q=async e=>(await Y()).get("svgImages",e),q=[];`,
    "tikzjax lazy legacy IDB");
  out = replaceOnce(out,
    `const t=e.dataset.disableCache?void 0:await Q(e.sourceHash);if(t){const r=document.createRange().createContextualFragment(t).firstChild;e.replaceWith(r);const n=new Event("tikzjax-load-finished",{bubbles:!0});r.dispatchEvent(n)}`,
    `const t=e.dataset.disableCache?void 0:await Q(e.sourceHash);if(t){const r=document.createRange().createContextualFragment(t).firstChild;e.replaceWith(r);const n=new CustomEvent("tikzjax-load-finished",{bubbles:!0,detail:{source:"driver-cache"}});r.dispatchEvent(n)}`,
    "tikzjax cache event");
  out = replaceOnce(out,
    `const t=e.childNodes[0].nodeValue,r=e.loader,n=e.dataset.disableCache?void 0:await Q(e.sourceHash);if(n){const e=document.createRange().createContextualFragment(n).firstChild;r.replaceWith(e);const t=new Event("tikzjax-load-finished",{bubbles:!0});return void e.dispatchEvent(t)}let o="";try{o=await V.texify(t,Object.assign({},e.dataset))}`,
    `const t=e.childNodes[0].nodeValue,r=e.loader,n=e.dataset.disableCache?void 0:await Q(e.sourceHash);if(n){const e=document.createRange().createContextualFragment(n).firstChild;r.replaceWith(e);const t=new CustomEvent("tikzjax-load-finished",{bubbles:!0,detail:{source:"driver-cache"}});return void e.dispatchEvent(t)}let o="";const d=performance.now();let renderTimings;try{const result=await V.texify(t,Object.assign({},e.dataset));o="string"==typeof result?result:result.svg,renderTimings="string"==typeof result?void 0:result.timings}`,
    "tikzjax compiled timing start");
  out = replaceOnce(out,
    `const a=new Event("tikzjax-load-finished",{bubbles:!0});i.dispatchEvent(a)`,
    `const a=new CustomEvent("tikzjax-load-finished",{bubbles:!0,detail:{source:"compiled",timings:{...(renderTimings||{}),texifyMs:performance.now()-d}}});i.dispatchEvent(a)`,
    "tikzjax compiled event");
  out = replaceOnce(out, "await U).put", "await Y()).put", "tikzjax lazy IDB write");
  out = replaceOnce(out,
    `Z=async()=>{H&&H.disconnect(),await n.terminate(await V)}`,
    `Z=()=>{H&&H.disconnect(),window.removeEventListener("load",K),window.removeEventListener("unload",Z),window.__tikzTeardown===Z&&(window.__tikzTeardown=null)}`,
    "tikzjax synchronous teardown");
  out = replaceOnce(out,
    `try{await r.load(e)}catch(e){console.log(e)}return r})(),`,
    `try{const t=await r.load(e);window.dispatchEvent(new CustomEvent("tikzjax-engine-ready",{bubbles:!0,detail:{source:"worker-load",timings:t||{}}}))}catch(e){console.log(e);window.dispatchEvent(new CustomEvent("tikzjax-engine-ready",{bubbles:!0,detail:{source:"worker-load",error:!0}}))}return r})(),`,
    "tikzjax engine-ready event");
  out = replaceOnce(out,
    'r=await t(new o(`${e}/run-tex.js`));',
    'r=await(()=>{window.__tikzWorkerUrlHint=`${e}/run-tex.js`;try{return t(new o(window.__tikzWorkerUrlHint))}finally{window.__tikzWorkerUrlHint=null}})();',
    "tikzjax run-tex worker URL hint");
  out = replaceOnce(out,
    `window.addEventListener("unload",Z))})()})();`,
    `window.addEventListener("unload",Z))})()})();`,
    "tikzjax teardown export");
  out = replaceOnce(out,
    `};window.TikzJax||(`,
    `};window.__tikzTeardown=Z,window.TikzJax||(`,
    "tikzjax teardown export");
  return out;
}

export function generate({write = true} = {}) {
  const runVendor = path.join(root, "public/libs/tikzjax/run-tex.vendor.js");
  const tikzVendor = path.join(root, "public/libs/tikzjax/tikzjax.vendor.js");
  const runOut = patchRunTex(fs.readFileSync(runVendor, "utf8"));
  const tikzOut = patchTikzJax(fs.readFileSync(tikzVendor, "utf8"));
  if (write) {
    fs.writeFileSync(path.join(root, "public/libs/tikzjax/run-tex.js"), runOut);
    fs.writeFileSync(path.join(root, "public/libs/tikzjax/tikzjax.js"), tikzOut);
  }
  return {runOut, tikzOut};
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) generate();
