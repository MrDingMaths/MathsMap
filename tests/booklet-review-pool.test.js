import test from 'node:test';
import assert from 'node:assert/strict';
import {pool} from '../pedagogy/review.mjs';

test('review failure drains active calls before rejecting and does not start queued work',async()=>{
 let releaseFirst,releaseSecond,settled=false;
 const first=new Promise(resolve=>{releaseFirst=resolve;}),second=new Promise(resolve=>{releaseSecond=resolve;});
 const started=[],finished=[],failure=Error('invalid review output');
 const pending=pool([0,1,2],2,async item=>{started.push(item);if(item===0){await first;throw failure;}await second;finished.push(item);});
 pending.then(()=>{settled=true;},()=>{settled=true;});
 assert.deepEqual(started,[0,1]);releaseFirst();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(settled,false);assert.deepEqual(started,[0,1]);
 releaseSecond();await assert.rejects(pending,error=>error===failure);assert.deepEqual(finished,[1]);assert.deepEqual(started,[0,1]);
});

test('successful review pool completes all work within its worker cap',async()=>{
 let active=0,maximum=0;const completed=[];
 await pool([0,1,2,3],2,async item=>{active++;maximum=Math.max(maximum,active);await new Promise(resolve=>setImmediate(resolve));completed.push(item);active--;});
 assert.equal(maximum,2);assert.deepEqual(completed.sort(),[0,1,2,3]);
});
