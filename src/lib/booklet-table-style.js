// Border presets for a cell, row, column or whole table, over the fields the
// renderer already reads: table.border, cell.border, cell.borders.{side} and
// borderColour. Cells draw their own sides, so an edge turned off is also turned
// off on the neighbouring cell that shares it; otherwise "None" leaves lines.
import {tableGrid} from '../../public/libs/maths-editor/table-model.mjs';

export const BORDER_PRESETS=Object.freeze([['all','All'],['outside','Outside'],['inside','Inside'],['none','None']]);
export const BORDER_SCOPES=Object.freeze([['cell','Cell'],['row','Row'],['column','Column'],['table','Table']]);
const SIDES=['top','right','bottom','left'],OPPOSITE={top:'bottom',bottom:'top',left:'right',right:'left'};

export function scopeEntries(map,scope,cellIds=[]){
 if(scope==='table')return map.entries;
 const selected=cellIds.map(id=>map.byId.get(id)).filter(Boolean);
 if(!selected.length)return [];
 if(scope==='cell')return selected;
 const covers=(e,axis)=>selected.some(s=>axis==='row'?e.row<s.row+s.rows&&s.row<e.row+e.rows:e.col<s.col+s.cols&&s.col<e.col+e.cols);
 return map.entries.filter(e=>covers(e,scope==='row'?'row':'column'));
}

export function setTableBorders(table,preset,scope='table',cellIds=[]){
 if(!BORDER_PRESETS.some(([p])=>p===preset))throw Error('Unknown border preset');
 const next=structuredClone(table),map=tableGrid(next),entries=scopeEntries(map,scope,cellIds);
 if(!entries.length)throw Error('Select a table cell first.');
 if(scope==='table'&&(preset==='all'||preset==='none')){
  next.border=preset==='all';
  for(const e of map.entries){delete e.cell.border;delete e.cell.borders;}
  return next;
 }
 const top=Math.min(...entries.map(e=>e.row)),bottom=Math.max(...entries.map(e=>e.row+e.rows)),left=Math.min(...entries.map(e=>e.col)),right=Math.max(...entries.map(e=>e.col+e.cols));
 const inScope=new Set(entries.map(e=>e.cell.id));
 const edge=(e,side)=>side==='top'?e.row===top:side==='bottom'?e.row+e.rows===bottom:side==='left'?e.col===left:e.col+e.cols===right;
 const want=(e,side)=>preset==='all'||(preset==='outside'?edge(e,side):preset==='inside'?!edge(e,side):false);
 const neighbours=(e,side)=>{const cells=new Set();
  if(side==='top'||side==='bottom'){const y=side==='top'?e.row-1:e.row+e.rows;if(y>=0&&y<map.rows)for(let x=e.col;x<e.col+e.cols;x++)cells.add(map.grid[y][x]);}
  else{const x=side==='left'?e.col-1:e.col+e.cols;if(x>=0&&x<map.columns)for(let y=e.row;y<e.row+e.rows;y++)cells.add(map.grid[y][x]);}
  return [...cells].filter(n=>n&&!inScope.has(n.cell.id));};
 for(const e of entries){
  const borders=Object.fromEntries(SIDES.map(side=>[side,want(e,side)]));
  delete e.cell.border;e.cell.borders=borders;
  // An outer edge turned off must not be drawn by the cell on its other side.
  for(const side of SIDES)if(!borders[side]&&edge(e,side))for(const n of neighbours(e,side))n.cell.borders={...SIDES.reduce((all,s)=>({...all,[s]:n.cell.borders?.[s]??n.cell.border??next.border??false}),{}),[OPPOSITE[side]]:false};
 }
 return next;
}

export function setTableBorderColour(table,colour,scope='table',cellIds=[]){
 if(!/^#[0-9a-f]{6}$/i.test(colour))throw Error('Choose a palette colour.');
 const next=structuredClone(table);
 if(scope==='table'){next.borderColour=colour;return next;}
 const entries=scopeEntries(tableGrid(next),scope,cellIds);if(!entries.length)throw Error('Select a table cell first.');
 for(const e of entries)e.cell.borderColour=colour;
 return next;
}

export function setCellFill(table,colour,scope='cell',cellIds=[]){
 if(colour&&!/^#[0-9a-f]{6}$/i.test(colour))throw Error('Choose a palette colour.');
 const next=structuredClone(table),entries=scopeEntries(tableGrid(next),scope,cellIds);if(!entries.length)throw Error('Select a table cell first.');
 for(const e of entries){if(colour)e.cell.background=colour;else delete e.cell.background;}
 return next;
}

// What a cell's side currently shows, for tests and the format bar state.
export const cellSideVisible=(table,cell,side)=>cell.borders?.[side]??cell.border??table.border??false;
