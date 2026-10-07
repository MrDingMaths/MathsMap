import test from 'node:test';
import assert from 'node:assert/strict';
import {menuGroup} from '../src/lib/booklet-menus.js';

// Minimal stand-ins for the DOM the action touches.
function target(){const listeners={};return{listeners,addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn),removeEventListener:(type,fn)=>{listeners[type]=(listeners[type]??[]).filter(f=>f!==fn);},fire(type,event){for(const fn of listeners[type]??[])fn(event);}};}
function menu(parent=null){const summary={focused:false,focus(){summary.focused=true;}};const m={open:false,parent,summary,matches:()=>true,contains:other=>{for(let n=other;n;n=n.parent)if(n===m)return true;return false;},querySelector:()=>summary,closest:()=>m};return m;}
function fixture(){const doc={...target(),activeElement:null},file=menu(),insert=menu(),nested=menu(insert);const node={...target(),ownerDocument:doc,querySelectorAll:()=>[file,insert,nested]};return{doc,node,file,insert,nested,action:menuGroup(node)};}
const inside=(m,button=true)=>({parent:m,closest:selector=>selector==='button'?(button?{}:null):m});

test('opening one menu closes the others but keeps a nested menu\'s parent',()=>{
  const {node,file,insert,nested}=fixture();
  file.open=true;insert.open=true;node.fire('toggle',{target:insert});
  assert.deepEqual([file.open,insert.open],[false,true]);
  nested.open=true;node.fire('toggle',{target:nested});
  assert.deepEqual([insert.open,nested.open],[true,true]);
});

test('an outside press closes every menu; a press inside keeps that menu',()=>{
  const {doc,file,insert}=fixture();
  file.open=true;doc.fire('pointerdown',{target:inside(file,false)});assert.equal(file.open,true);
  insert.open=true;doc.fire('pointerdown',{target:{closest:()=>null}});
  assert.deepEqual([file.open,insert.open],[false,false]);
});

test('choosing an item closes its menu; other clicks inside do not',()=>{
  const {node,file}=fixture();
  file.open=true;node.fire('click',{target:inside(file,false)});assert.equal(file.open,true);
  node.fire('click',{target:inside(file)});assert.equal(file.open,false);
});

test('Escape closes open menus, returns focus and is ignored when none are open',()=>{
  const {node,file}=fixture();let prevented=0;const event={key:'Escape',preventDefault:()=>prevented++,stopPropagation(){}};
  node.fire('keydown',event);assert.equal(prevented,0);
  file.open=true;node.fire('keydown',event);
  assert.deepEqual([file.open,file.summary.focused,prevented],[false,true,1]);
});

test('destroy removes every listener',()=>{
  const {doc,node,action}=fixture();action.destroy();
  assert.equal(Object.values(node.listeners).flat().length+Object.values(doc.listeners).flat().length,0);
});
