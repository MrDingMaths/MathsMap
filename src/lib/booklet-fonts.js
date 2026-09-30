const nunitoLoads=new WeakMap();

// FontFaceSet.check() also succeeds for an absent family: the browser silently
// chooses a fallback. Require actual registered and loaded faces before sizing
// or printing a booklet that asks for Nunito.
export async function settleBookletFonts(root) {
 const doc=root.ownerDocument,fonts=doc.fonts;
 const requested=doc.defaultView.getComputedStyle(root).fontFamily;
 if(/(?:^|,)\s*["']?Nunito["']?\s*(?:,|$)/i.test(requested)){
  const isNunito=face=>face.family.replace(/["']/g,'').trim().toLowerCase()==='nunito';
  if(![...fonts].some(isNunito))throw Error('The Nunito booklet font is unavailable; restore the local font stylesheet before exporting.');
  let load=nunitoLoads.get(doc);
  if(!load){
   load=Promise.all([400,600,700,800].map(async weight=>{
    const faces=await fonts.load(`${weight} 11pt Nunito`,'Aa0123');
    if(!faces.some(face=>isNunito(face)&&face.status==='loaded'))throw Error('The Nunito booklet font failed to load.');
   }));
   nunitoLoads.set(doc,load);
   load.catch(()=>{if(nunitoLoads.get(doc)===load)nunitoLoads.delete(doc);});
  }
  await load;
 }
 await fonts.ready;
 if([...fonts].some(face=>face.status==='error'))throw Error('A booklet font failed to load; reload after restoring font access.');
}
