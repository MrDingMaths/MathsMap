import test from 'node:test';
import assert from 'node:assert/strict';
import {launchChromium} from '../scripts/booklet/browser-launch.mjs';

function environment(t,value){
 const before=process.env.MATHSMAP_BOOKLET_CHROMIUM;
 if(value===undefined)delete process.env.MATHSMAP_BOOKLET_CHROMIUM;else process.env.MATHSMAP_BOOKLET_CHROMIUM=value;
 t.after(()=>{if(before===undefined)delete process.env.MATHSMAP_BOOKLET_CHROMIUM;else process.env.MATHSMAP_BOOKLET_CHROMIUM=before;});
}
test('pinned browser overrides executable and channel while preserving other launch options',async t=>{
 environment(t,'D:/pin/engines/chromium/Application/chrome.exe');const calls=[],browser={};
 const chromium={launch:async options=>{calls.push(options);return browser;}};
 assert.equal(await launchChromium(chromium,{headless:true,channel:'chrome',executablePath:'C:/live/chrome.exe',args:['--disable-gpu']}),browser);
 assert.deepEqual(calls,[{headless:true,executablePath:process.env.MATHSMAP_BOOKLET_CHROMIUM,args:['--disable-gpu']}]);
});
test('pinned executable failure is propagated without a system-browser fallback',async t=>{
 environment(t,'D:/missing-pin/chrome.exe');const failure=Error('pinned engine missing'),calls=[];
 await assert.rejects(launchChromium({launch:async options=>{calls.push(options);throw failure;}},{headless:true}),error=>error===failure);
 assert.equal(calls.length,1);assert.equal(calls[0].channel,undefined);
});
test('unconfigured browser preserves default launch and existing Chrome fallback',async t=>{
 environment(t);const calls=[],browser={};
 const chromium={launch:async options=>{calls.push(options);if(calls.length===1)throw Error('default absent');return browser;}};
 assert.equal(await launchChromium(chromium,{headless:true,args:['--example']}),browser);
 assert.deepEqual(calls,[{headless:true,args:['--example']},{headless:true,args:['--example'],channel:'chrome'}]);
});
test('successful default launch does not attempt Chrome fallback',async t=>{
 environment(t);let calls=0;const browser={};
 assert.equal(await launchChromium({launch:async options=>{calls++;assert.deepEqual(options,{headless:true});return browser;}}),browser);
 assert.equal(calls,1);
});
