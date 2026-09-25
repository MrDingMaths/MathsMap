import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {readBody} from '../scripts/booklet/project-studio-server.mjs';

test('booklet saves preserve Unicode split across request chunks',async()=>{
 const value={source:{description:'3^(2x) − 3^x − 20 = 0'},prompt:'−0 °C · ⊕ 😀'};
 const bytes=Buffer.from(JSON.stringify(value));
 const request=new PassThrough(),parsed=readBody(request);
 for(const byte of bytes)request.write(Buffer.from([byte]));
 request.end();assert.deepEqual(await parsed,value);
});

test('invalid JSON requests remain rejected',async()=>{
 const request=new PassThrough(),parsed=readBody(request);
 request.end('{broken');await assert.rejects(parsed,/invalid JSON/);
});
