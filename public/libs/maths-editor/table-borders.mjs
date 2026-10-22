export const CELL_BORDER_SIDES=['top','right','bottom','left'];
export function normalizeCellBorders(cell){
  const borders=Object.fromEntries(CELL_BORDER_SIDES.filter(side=>typeof cell.borders?.[side]==='boolean').map(side=>[side,cell.borders[side]]));
  return {...(Object.keys(borders).length?{borders}:{}),...(['down','up'].includes(cell.diagonalBorder)?{diagonalBorder:cell.diagonalBorder}:{})};
}
export function tableCellBorderStyle(table,cell){
  const stroke=`${cell.borderWidthMm??table.borderWidthMm}mm solid ${cell.borderColour??table.borderColour}`;
  const diagonal=['down','up'].includes(cell.diagonalBorder)?diagonalCellBorderStyle(table,cell):'';
  return `border:${(cell.border??table.border)?stroke:'0'};`+CELL_BORDER_SIDES.filter(side=>typeof cell.borders?.[side]==='boolean').map(side=>`border-${side}:${cell.borders[side]?stroke:'0'};`).join('')+diagonal;
}

// An optional border leaves the cell's native text, fill and geometry intact.
// Non-scaling stroke keeps the printed ink width independent of cell aspect.
function diagonalCellBorderStyle(table,cell){
  const colour=/^#[0-9a-f]{6}$/i.test(cell.borderColour??table.borderColour??'')?(cell.borderColour??table.borderColour):'#000000';
  const width=Math.max(0,Math.min(2,Number(cell.borderWidthMm??table.borderWidthMm??.26)||0))*96/25.4;
  const down=cell.diagonalBorder==='down';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 ${down?0:100} L100 ${down?100:0}" fill="none" stroke="${colour}" stroke-width="${width}" vector-effect="non-scaling-stroke"/></svg>`;
  return `background-image:url('data:image/svg+xml,${encodeURIComponent(svg)}');background-size:100% 100%;background-repeat:no-repeat;`;
}

// A fully outlined cell already provides a response region. Keep its answer
// node editable, but avoid a second scaffold inside that region.
export function cellProvidesClozeSpace(table,cell){
  if(table.showClozeDots)return false;
  const inlines=cell.blocks?.length===1&&cell.blocks[0].type==='paragraph'?cell.blocks[0].inlines:[];
  if(inlines?.length!==1||inlines[0].type!=='cloze'||inlines[0].enclosure||inlines[0].position)return false;
  return table.annotations?.some(a=>a.type==='box'&&a.cellId===cell.id)||CELL_BORDER_SIDES.every(side=>cell.borders?.[side]??cell.border??table.border);
}

