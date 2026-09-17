import test from 'node:test';
import assert from 'node:assert/strict';
import {createMeasurementStore} from '../src/lib/booklet-cache-store.js';

test('queued measurements are immediately readable and coalesced into one write transaction',async()=>{
 const scheduled=[],transactions=[],rows=new Map();
 const db={transaction(){const puts=[];transactions.push(puts);const tx={objectStore:()=>({put(row){puts.push(row);rows.set(row.key,row);},count(){const req={result:rows.size};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.();});return req;}})};return tx;}};
 const indexedDB={open(){const req={result:db};queueMicrotask(()=>req.onsuccess());return req;}};
 const store=createMeasurementStore({indexedDB,schedule:work=>scheduled.push(work)});
 store.enqueue('a',{height:1,capacity:10});store.enqueue('b',{height:2,capacity:10});store.enqueue('a',{height:3,capacity:10});store.enqueue('bad',{height:NaN,capacity:10});
 assert.deepEqual(store.peek('a'),{height:3,capacity:10});assert.equal(transactions.length,0);assert.equal(scheduled.length,1);
 await store.flush();assert.equal(transactions.length,1);assert.equal(transactions[0].length,2);assert.equal(rows.get('a').height,3);
 store.enqueue('c',{height:4,capacity:10});await store.flush();assert.equal(transactions.length,2);
});

test('blocked storage never delays enqueue and pending dimensions stay bounded',async()=>{
 const store=createMeasurementStore({indexedDB:{open(){return {};}},limit:2,timeoutMs:5,schedule:()=>{}});
 for(const key of ['a','b','c'])assert.equal(store.enqueue(key,{height:1,capacity:10}),undefined);
 assert.equal(store.peek('a'),null);assert.equal(store.peek('c').height,1);
 await store.flush();assert.equal(store.peek('c').height,1);
});
