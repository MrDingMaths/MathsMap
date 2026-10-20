export const CELL_BORDER_SIDES=['top','right','bottom','left'];
export function normalizeCellBorders(cell){
  const borders=Object.fromEntries(CELL_BORDER_SIDES.filter(side=>typeof cell.borders?.[side]==='boolean').map(side=>[side,cell.borders[side]]));
  return Object.keys(borders).length?{borders}:{};
}
export function tableCellBorderStyle(table,cell){
  const stroke=`${cell.borderWidthMm??table.borderWidthMm}mm solid ${cell.borderColour??table.borderColour}`;
  return `border:${(cell.border??table.border)?stroke:'0'};`+CELL_BORDER_SIDES.filter(side=>typeof cell.borders?.[side]==='boolean').map(side=>`border-${side}:${cell.borders[side]?stroke:'0'};`).join('');
}

// A fully outlined cell already provides a response region. Keep its answer
// node editable, but avoid a second scaffold inside that region.
export function cellProvidesClozeSpace(table,cell){
  if(table.showClozeDots)return false;
  const inlines=cell.blocks?.length===1&&cell.blocks[0].type==='paragraph'?cell.blocks[0].inlines:[];
  if(inlines?.length!==1||inlines[0].type!=='cloze'||inlines[0].enclosure||inlines[0].position)return false;
  return table.annotations?.some(a=>a.type==='box'&&a.cellId===cell.id)||CELL_BORDER_SIDES.every(side=>cell.borders?.[side]??cell.border??table.border);
}
