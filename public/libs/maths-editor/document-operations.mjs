import {paragraph,uid} from './document-model.mjs';
import {tableGrid} from './table-model.mjs';

// Cells addressed by a table control: the selected cell, its row, its column
// or the whole table. Merged cells belong to every row and column they span.
export function tableScopeCells(table,cellId,scope='cell'){
 const entries=tableGrid(table).entries,at=entries.find(e=>e.cell.id===cellId);if(!at)return [];
 return entries.filter(e=>e.cell.id===cellId||scope==='table'||scope==='row'&&e.row<at.row+at.rows&&e.row+e.rows>at.row||scope==='column'&&e.col<at.col+at.cols&&e.col+e.cols>at.col).map(e=>e.cell);
}
export function setTableCells(doc,cellId,patch,scope='cell'){
 const at=locateDocumentNode(doc,cellId);if(at?.parent?.type!=='table')throw Error('Select a table cell.');
 for(const cell of tableScopeCells(at.parent,cellId,scope)){
  Object.assign(cell,patch);
  // Cells that keep per-line alignment would otherwise ignore the cell value.
  if(patch.align&&cell.preserveParagraphAlignment)for(const block of cell.blocks)if(block.type==='paragraph')block.align=patch.align;
 }
 return cellId;
}
// Whole-table spacing. Rows are given by index; omit them for every row.
export function setTableRowHeights(table,value,rows=null){
 const heights=table.rows.map((_,i)=>table.rowHeights?.[i]??10);
 for(const i of rows??heights.keys())if(i>=0&&i<heights.length)heights[i]=Math.max(4,value);
 table.rowHeights=heights;return table;
}
const sides=['paddingTop','paddingRight','paddingBottom','paddingLeft'];
// One padding for the table; cells stop overriding it side by side.
export function setTablePadding(table,value){
 table.padding=value;for(const cell of table.rows.flat())for(const side of sides)delete cell[side];
 return table;
}
// The padding every cell shows, or null where cells differ.
export function tablePadding(table){
 const base=table.padding??2;
 return table.rows.flat().every(cell=>sides.every(side=>(cell[side]??base)===base))?base:null;
}
// Position one paragraph or equation. A table cell normally imposes its own
// alignment on every line; before one line may differ, write the alignment
// each line currently shows so stored-but-ignored values do not take effect.
export function alignDocumentBlock(doc,id,align,{single=false}={}){
 const at=locateDocumentNode(doc,id);if(at?.node.type!=='paragraph')throw Error('Select text or an equation.');
 const cell=at.parent?.type==='cell'?at.parent:null;
 if(cell&&!cell.preserveParagraphAlignment){
  if(!single){cell.align=align;return id;}
  for(const block of cell.blocks)if(block.type==='paragraph')block.align=cell.align??'center';
  cell.preserveParagraphAlignment=true;
 }
 at.node.align=align;return id;
}

// Resolve ownership instead of assuming a selection is a top-level block.
export function locateDocumentNode(doc,id){
 let found;
 const walk=(nodes,parent,ancestors=[])=>{for(let index=0;index<(nodes??[]).length;index++){
  const node=nodes[index];if(node.id===id){found={node,parent,nodes,index,ancestors};return;}
  const next=[...ancestors,node];
  if(node.blocks)walk(node.blocks,node,next);
  if(node.inlines)walk(node.inlines,node,next);
  for(const collection of [node.slots,node.items,node.rows?.flat(),node.annotations])if(collection)walk(collection,node,next);
  if(found)return;
 }};walk(doc.blocks,doc);return found;
}
export function removeDocumentNode(doc,id,{allowEmptyRoot=false}={}){
 const target=locateDocumentNode(doc,id);if(!target)throw Error('The selected item is no longer available.');
 if(target.node.type==='cell'||target.parent.slots===target.nodes)throw Error('Select the content, or use the row/column controls.');
 // Remove the empty list too, including nested lists, rather than leaving a
 // phantom bullet. Other blocks in its enclosing item or cell stay intact.
 if(target.node.type==='list-item'&&target.nodes.length===1)return removeDocumentNode(doc,target.parent.id,{allowEmptyRoot});
 target.nodes.splice(target.index,1);
 // Nested containers need a caret paragraph; deleting the last root block
 // must instead report an empty document to the owning Studio content block.
 if(!target.nodes.length&&target.nodes===target.parent.blocks&&(!allowEmptyRoot||target.parent!==doc))target.nodes.push(paragraph());
 return target.nodes[Math.min(target.index,target.nodes.length-1)]?.id??target.parent.id??doc.blocks[0]?.id;
}
export function moveDocumentNode(doc,id,targetId,position='before'){
 const source=locateDocumentNode(doc,id),target=locateDocumentNode(doc,targetId);
 if(!source||!target||id===targetId||target.ancestors.some(n=>n.id===id))throw Error('Choose a destination outside the selection.');
 if(source.nodes!==source.parent.blocks||target.nodes!==target.parent.blocks)throw Error('Select a block to reposition.');
 if(position==='inside'){if(target.node.type!=='layout')throw Error('Choose a layout group.');source.nodes.splice(source.index,1);target.node.slots.at(-1).blocks.push(source.node);if(!source.nodes.length)source.nodes.push(paragraph());return id;}
 source.nodes.splice(source.index,1);
 const at=target.nodes.indexOf(target.node);
 if(['left','right'].includes(position)){
  const pair=position==='left'?[source.node,target.node]:[target.node,source.node];
  target.nodes.splice(at,1,{id:uid(),type:'layout',arrangement:'parallel',border:false,padding:0,margin:0,gap:3,columns:2,slots:pair.map(node=>({id:uid(),blocks:[node]}))});
 }else target.nodes.splice(at+(position==='after'?1:0),0,source.node);
 if(!source.nodes.length)source.nodes.push(paragraph());
 return id;
}

export function transformDocumentLayout(doc,id,command,options={}){
 let at=locateDocumentNode(doc,id);
 if(at?.node.type==='inline-image'){
  const paragraphAt=locateDocumentNode(doc,at.parent.id),image=at.node;
  const before={...paragraphAt.node,inlines:at.nodes.slice(0,at.index)},after={...paragraphAt.node,id:uid(),inlines:at.nodes.slice(at.index+1)};
  paragraphAt.nodes.splice(paragraphAt.index,1,before,{...image,type:'image',align:'center',caption:'',crop:[0,0,0,0]},after);at=locateDocumentNode(doc,id);
 }
 if(!at||at.nodes!==at.parent.blocks)throw Error('Select a text, equation, table, image or layout block.');
 if(command==='before'||command==='after'){const to=at.index+(command==='before'?-1:1);if(to>=0&&to<at.nodes.length){at.nodes.splice(at.index,1);at.nodes.splice(to,0,at.node);}}
 else if(command==='move')moveDocumentNode(doc,id,options.targetId,options.position);
 else if(command==='group'){
  const ids=options.ids??[id],nodes=at.nodes.filter(n=>ids.includes(n.id));if(nodes.length!==ids.length)throw Error('Group blocks from the same container.');
  const index=at.nodes.indexOf(nodes[0]);at.nodes.splice(0,at.nodes.length,...at.nodes.filter(n=>!ids.includes(n.id)));const layout={id:uid(),type:'layout',arrangement:'parallel',border:false,padding:0,margin:0,gap:2,columns:1,slots:nodes.map(n=>({id:uid(),blocks:[n]}))};at.nodes.splice(index,0,layout);return layout.id;
 }else if(command==='ungroup'){
  if(at.node.type!=='layout'||at.node.arrangement!=='parallel')throw Error('Select a plain layout group; teaching templates retain their structure.');
  at.nodes.splice(at.index,1,...at.node.slots.flatMap(s=>s.blocks));return at.nodes[at.index]?.id;
 }else if(command==='out'||command==='full-width'){
  const layout=[...at.ancestors].reverse().find(n=>n.type==='layout'&&(command==='out'||n.columns>1));if(!layout)throw Error('This block already spans its container.');
  const destination=locateDocumentNode(doc,layout.id);at.nodes.splice(at.index,1);destination.nodes.splice(destination.index+1,0,at.node);if(!at.nodes.length)at.nodes.push(paragraph());
 }else if(command==='vertical'){
  const slot=[...at.ancestors].reverse().find(n=>n.blocks&&!n.type);if(!slot)throw Error('Place this block beside another item to align its column.');slot.verticalAlign=options.value;
 }else if(command==='direction'){
  if(at.node.type!=='layout')throw Error('Select a layout group.');at.node.columns=options.value==='row'?at.node.slots.length:1;
 }
 return id;
}
