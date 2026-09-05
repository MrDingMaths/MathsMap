import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {rankEvidence,textWindows,verifyPacketFiles,nearbyAssetOccurrences,supplementalAssetLinks,readableEvidence} from '../scripts/booklet/transcription-packet.mjs';

test('human-readable evidence preserves real table rows and TeX rather than JSON-escaped long lines',()=>{
  const math='| x | 1 | 2 |\n| y | $\\frac{1}{2}$ | 1 |';
  const rendered=readableEvidence([{reference:'Teacher page 42; candidate only',text:math}]);
  assert.ok(rendered.includes(math));
  assert.match(rendered,/Teacher page 42; candidate only/);
  assert.equal(rendered.includes('\\n'),false);
});

test('wrapped table image links missing from the old index are recovered with uncertainty retained',()=>{
  const md='| generated](D:/evidence/image69.png) | generated](D:/evidence/image70.png) |';
  const links=supplementalAssetLinks(md,[{path:'D:/evidence/image69.png'}]);
  assert.equal(links.length,1);
  assert.equal(links[0].path,'D:/evidence/image70.png');
  assert.equal(links[0].reviewStatus,'needs-review');
  assert.equal(md.slice(links[0].markdownOffset).startsWith('](D:/evidence/image70.png)'),true);
});

test('asset retrieval retains graphs just outside text excerpt boundaries without duplicating occurrences',()=>{
  const occurrences=[{occurrenceId:'preceding-graph',markdownOffset:263890},{occurrenceId:'inside',markdownOffset:267972},{occurrenceId:'following',markdownOffset:272000},{occurrenceId:'unrelated',markdownOffset:290000}];
  const selected=nearbyAssetOccurrences(occurrences,[{start:265200,end:271200},{start:270400,end:276400}]);
  assert.deepEqual(selected.map(a=>a.occurrenceId),['preceding-graph','inside','following']);
  assert.throws(()=>nearbyAssetOccurrences(occurrences,[],-1),/nonnegative/);
});

test('teacher retrieval follows mathematical content when pagination differs',()=>{
  const ranked=rankEvidence('Find the gradient of the line through (7,10) and (8,13).',[
    {sourcePage:37,text:'Calculate the circumference of a circle with radius 9.'},
    {sourcePage:42,text:'Find the gradient of the line through (7,10) and (8,13). Answer: gradient 3.'},
  ],1);
  assert.equal(ranked[0].sourcePage,42);
  assert.match(ranked[0].text,/Answer/);
});

test('overlapping Word windows preserve exact offsets and cover trailing evidence',()=>{
  const source='0123456789abcdefghijklmnop';
  const windows=textWindows(source,10,3);
  for(const w of windows)assert.equal(w.text,source.slice(w.start,w.end));
  assert.equal(windows.at(-1).end,source.length);
  assert.equal(windows[1].start,7);
  for(let i=0;i<source.length;i++)assert.ok(windows.some(w=>w.start<=i&&i<w.end));
  assert.throws(()=>textWindows(source,10,10),/overlap/);
});

test('packet verification rejects changed evidence and prompts before execution',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-packet-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const digest=v=>crypto.createHash('sha256').update(v).digest('hex');
  const prompt='Transcribe the supplied pages.';
  fs.writeFileSync(path.join(dir,'task-013.md'),prompt);
  fs.writeFileSync(path.join(dir,'page.txt'),'source');
  const packet={format:'mathsmap-transcription-packet-v1',task:'task-013',executionTaskSha256:digest(prompt),files:[{path:'page.txt',bytes:6,sha256:digest('source')}]};
  assert.equal(verifyPacketFiles(dir,packet),packet);
  fs.writeFileSync(path.join(dir,'page.txt'),'edited');
  assert.throws(()=>verifyPacketFiles(dir,packet),/evidence changed/);
  fs.writeFileSync(path.join(dir,'page.txt'),'source');
  fs.writeFileSync(path.join(dir,'task-013.md'),'different');
  assert.throws(()=>verifyPacketFiles(dir,packet),/prompt changed/);
  assert.throws(()=>verifyPacketFiles(dir,{...packet,files:[{path:'../outside'}]}),/outside packet/);
});
