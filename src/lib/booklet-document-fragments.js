const copy=value=>JSON.parse(JSON.stringify(value));
export const inlineLength=inline=>inline.type==='text'?inline.text.length:1;
export function sliceInlines(inlines,start,end){let at=0;return inlines.flatMap(inline=>{const length=inlineLength(inline),a=Math.max(0,start-at),b=Math.min(length,end-at);at+=length;if(a>=b)return [];return [{...copy(inline),...(inline.type==='text'?{text:inline.text.slice(a,b)}:{})}];});}
export function paragraphSlice(document,start,end){const paragraph=document.blocks[0];return {...document,blocks:[{...paragraph,inlines:sliceInlines(paragraph.inlines,start,end)}],_bookletSlice:{nodeId:paragraph.id,start,end}};}
export function replaceParagraphSlice(document,slice,edited){
 const index=document.blocks.findIndex(b=>b.id===slice.nodeId);if(index<0)throw Error('The edited paragraph changed. Your draft is retained.');
 const paragraph=document.blocks[index],total=paragraph.inlines.reduce((n,i)=>n+inlineLength(i),0),blocks=copy(edited.blocks);
 const prefix=sliceInlines(paragraph.inlines,0,slice.start),suffix=sliceInlines(paragraph.inlines,slice.end,total);
 if(!blocks.length)blocks.push({...paragraph,inlines:[]});
 if(blocks[0].type!=='paragraph'||blocks.at(-1).type!=='paragraph')throw Error('Insert tables or teaching groups outside this continued paragraph.');
 blocks[0].inlines=[...prefix,...blocks[0].inlines];blocks[0].id=paragraph.id;blocks.at(-1).inlines.push(...suffix);
 return {...document,blocks:[...document.blocks.slice(0,index),...blocks,...document.blocks.slice(index+1)]};
}
