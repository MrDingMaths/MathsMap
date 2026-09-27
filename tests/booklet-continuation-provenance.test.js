import test from 'node:test';
import assert from 'node:assert/strict';
import {coalescePacketContinuations} from '../scripts/booklet/packet-continuations.mjs';

test('nonprinting source headings retain valid mappings during continuation assembly',()=>{
 const carrier=page=>({id:'difficulty-'+page,title:'FOUNDATION',headingStyle:'none',phase:'practice',blocks:[]});
 const heading=page=>({inventoryId:'heading-'+page,targetId:'difficulty-'+page,field:'/title'});
 const standalone={pageNumber:1,sections:[carrier(1)],inventoryMappings:[heading(1)]};
 assert.deepEqual(coalescePacketContinuations([standalone]),[standalone]);
 const block={id:'whole-question',sourceRefs:[{pageNumber:1},{pageNumber:2}],content:{id:'stem',type:'question',prompt:'One shared stem.',answer:{short:'2',worked:'1+1=2'}}};
 const packets=[1,2].map(page=>({pageNumber:page,sections:[carrier(page),{id:'content-'+page,title:'Practice',blocks:[structuredClone(block)]}],inventoryMappings:[heading(page),{inventoryId:'question-'+page,targetId:'stem'}],answerEvidence:[{questionId:block.id,evidence:'same source answer'}],...(page===2?{sharedContentContinuations:[{blockId:block.id,canonicalPageNumber:1,reason:'The same question continues on page 2.'}]}:{})}));
 const before=structuredClone(packets),merged=coalescePacketContinuations(packets,{continuations:[{from:1,to:2,entryIds:['question-1','question-2']}]});
 assert.deepEqual(packets,before);
 assert.deepEqual(merged[1].sections,[carrier(2)]);
 assert.equal(merged.flatMap(p=>p.sections.flatMap(s=>s.blocks)).length,1);
 for(const packet of merged){const mapping=packet.inventoryMappings[0];assert.equal(packet.sections.find(s=>s.id===mapping.targetId).title,'FOUNDATION');}
 assert.equal(merged[1].inventoryMappings[1].continuationOf,'question-1');
 assert.deepEqual(merged[1].answerEvidence,[]);
});
