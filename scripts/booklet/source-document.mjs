// Compact editable source structures for post-score corrections and new packets.
export const documentValue=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
export function sourceParagraph(id,text,{fontSize=11,align='left',spaceAfter=0,lineHeight=1.4}={}){
 const inlines=[];for(const piece of String(text).split(/(\$[^$]*\$)/g)){if(!piece)continue;if(piece.startsWith('$')&&piece.endsWith('$'))inlines.push({type:'math',latex:piece.slice(1,-1),display:false});else inlines.push({type:'text',text:piece,marks:[]});}
 return{id,type:'paragraph',align,fontSize,spaceAfter,lineHeight,inlines};
}
export function sourceTable(id,values,{widthMm=70,rowHeight=8,shadeLabels=true,colour='#111111',borderColour='#bdbdbd',borderWidthMm=.2,annotations=[]}={}){
 return{id,type:'table',widthMm,widths:values[0].map(()=>1),rowHeights:values.map(()=>rowHeight),padding:.6,border:true,borderColour,borderWidthMm,annotations,rows:values.map((row,r)=>row.map((text,c)=>({id:`${id}-r${r}-c${c}`,type:'cell',header:false,align:'center',verticalAlign:'middle',background:shadeLabels&&c===0?'#d3e8fc':'#ffffff',colour,bold:false,rotation:0,colspan:1,rowspan:1,blocks:[sourceParagraph(`${id}-r${r}-c${c}-p`,text)]})))};
}
export function xyTable(id,x,y=null,options={}){return sourceTable(id,[['$x$',...x.map(v=>'$'+v+'$')],['$y$',...x.map((v,i)=>y?'$'+y[i]+'$':'')]],options);}
