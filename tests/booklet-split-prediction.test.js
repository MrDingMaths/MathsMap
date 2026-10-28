import test from 'node:test';
import assert from 'node:assert/strict';
import {largestFit,predictFit} from '../src/lib/booklet-pagination.js';

// A question of parts with these heights on a page of the given capacity; a trial of
// `count` parts measures their total (plus an optional reflow error) and reports where
// each part ends, as measurePartBottoms does.
function page(heights,capacity,{error=0}={}){
  const trials=[];
  const measure=count=>{
    let bottom=0;const partBottoms={};
    heights.slice(0,count).forEach((h,i)=>{bottom+=h;partBottoms['p'+i]=bottom;});
    return {height:bottom+(count?error:0),capacity,partBottoms};
  };
  const trial=async count=>{trials.push(count);return measure(count);};
  return {trial,trials,measure,groups:heights.map((_,i)=>({parentId:'q',ids:['p'+i]}))};
}
async function binarySearch(high,trial){let best=0,low=1;while(low<=high){const count=Math.floor((low+high)/2),m=await trial(count);if(m.height<=m.capacity+.2){best=count;low=count+1;}else high=count-1;}return best;}

test('the predicted split matches the binary search for every monotonic case',async()=>{
  for(let n=1;n<=14;n++)for(let capacity=5;capacity<=n*10+5;capacity+=7)for(const error of [0,3,-3]){
    const heights=Array.from({length:n},(_,i)=>5+(i*7)%11);
    const plain=page(heights,capacity,{error}),predicted=page(heights,capacity,{error});
    const expected=await binarySearch(n,plain.trial);
    const overflowed=predicted.measure(n);
    assert.equal(await largestFit(n,predicted.trial,{overflowed,groups:predicted.groups}),expected,JSON.stringify({heights,capacity,error}));
    if(!error)assert.ok(predicted.trials.length<=Math.max(2,plain.trials.length),'an exact prediction costs at most two trials');
  }
});

test('a prediction needs part bottoms for every part in a group',()=>{
  assert.equal(predictFit({height:50,capacity:30,partBottoms:{a:10,b:20,c:40}},[{ids:['a']},{ids:['b']},{ids:['c']}],3),2);
  assert.equal(predictFit({height:50,capacity:30,partBottoms:{a:10}},[{ids:['a']},{ids:['b']}],2),1);
  assert.equal(predictFit({height:50,capacity:30,partBottoms:{a:10,b:20}},[{ids:['a','x']},{ids:['b']}],2),0);
  assert.equal(predictFit({height:50,capacity:30},[{ids:['a']}],1),0,'cached measurements without part bottoms fall back to the search');
  assert.equal(predictFit({height:50,capacity:30,partBottoms:{a:10,b:20}},[{ids:['a']},{ids:['b']}],1),1,'never beyond the search range');
});
