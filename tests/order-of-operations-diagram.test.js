import test from 'node:test';
import assert from 'node:assert/strict';
import {orderOfOperationsDiagram,ORDER_OF_OPERATIONS_WIDTH_MM} from '../src/lib/order-of-operations-diagram.js';
test('the shared operation chart retains four coloured tiers and source mnemonic emphasis',()=>{
 const code=orderOfOperationsDiagram({reference:'page 43'}),mnemonic=orderOfOperationsDiagram({reference:'page 52',mnemonic:true});
 assert.equal(ORDER_OF_OPERATIONS_WIDTH_MM,170);
 assert.equal((code.match(/fill=level/g)||[]).length,4);
 assert.ok(code.includes('font=\\fontsize{10}{12}'));
 assert.ok(code.includes('Operations in innermost'));
 assert.equal((code.match(/Left to right/g)||[]).length,3);
 assert.ok(code.includes('\\sqrt{'));assert.ok(code.includes('densely dotted'));
 assert.ok(mnemonic.includes('\\textbf{B}rackets'));assert.ok(mnemonic.includes('\\textbf{I}ndices/Roots'));
 assert.equal(JSON.parse(code.split('\n')[0].replace('% mathsmap-diagram-colours ','')).reference,'page 43');
});
