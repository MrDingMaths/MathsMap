export const CELL_BORDER_SIDES=['top','right','bottom','left'];
export function normalizeCellBorders(cell){
  const borders=Object.fromEntries(CELL_BORDER_SIDES.filter(side=>typeof cell.borders?.[side]==='boolean').map(side=>[side,cell.borders[side]]));
  return Object.keys(borders).length?{borders}:{};
}
export function tableCellBorderStyle(table,cell){
  const stroke=`${cell.borderWidthMm??table.borderWidthMm}mm solid ${cell.borderColour??table.borderColour}`;
  return `border:${(cell.border??table.border)?stroke:'0'};`+CELL_BORDER_SIDES.filter(side=>typeof cell.borders?.[side]==='boolean').map(side=>`border-${side}:${cell.borders[side]?stroke:'0'};`).join('');
}
