// A pinned executable is mandatory when supplied; never fall back to a live browser.
export async function launchChromium(chromium,options={headless:true}){
 const executablePath=process.env.MATHSMAP_BOOKLET_CHROMIUM;
 if(executablePath){
  const {channel,...selected}=options;
  return chromium.launch({...selected,executablePath});
 }
 try{return await chromium.launch(options);}
 catch{return chromium.launch({...options,channel:'chrome'});}
}
