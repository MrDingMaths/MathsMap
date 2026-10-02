import path from 'node:path';
import fs from 'node:fs';

const PUBLIC_LIBRARY_URL = '/libs/maths-editor/';
const cleanUrl = value => String(value ?? '').split(/[?#]/, 1)[0];
const inside = (root, file) => {
  const relative = path.relative(root, file);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
};

// Node authoring tools need filesystem imports, while the standalone editor
// already loads these same modules from /libs/. Give the browser one identity.
// Production keeps the existing bundling; only the dev-server resolver changes.
export function publicLibraryModulesPlugin(){
  let directory;
  const importerFile = importer => {
    const url = cleanUrl(importer);
    return url.startsWith(PUBLIC_LIBRARY_URL)
      ? path.join(directory, url.slice(PUBLIC_LIBRARY_URL.length))
      : url;
  };
  return {
    name:'public-library-modules',apply:'serve',enforce:'pre',
    configResolved(config){directory=path.resolve(config.publicDir,'libs/maths-editor');},
    handleHotUpdate({file,server}){
      const relative=path.relative(directory,file);
      if(relative.startsWith('..')||path.isAbsolute(relative))return;
      // Raw public modules are native browser imports, outside Vite's module
      // transform graph. Reload so a new cache version cannot label old code.
      server.ws.send({type:'full-reload'});return [];
    },
    resolveId(source,importer,options){
      if(options?.ssr||!importer||!source.startsWith('.')||/[?#]/.test(source)||!/[.]m?js$/.test(source))return null;
      const file=path.resolve(path.dirname(importerFile(importer)),source),relative=path.relative(directory,file);
      if(relative.startsWith('..')||path.isAbsolute(relative))return null;
      // Vite's esbuild dependency scanner uses only resolved.id and reads it
      // from disk. An external /libs URL becomes a drive-root filesystem path
      // there, so give the scanner the real file while retaining one browser URL.
      if(options?.scan)return {id:file.split(path.sep).join('/')};
      return {id:'/libs/maths-editor/'+relative.split(path.sep).join('/'),external:true};
    },
    load(id){
      const url=cleanUrl(id);
      if(!url.startsWith(PUBLIC_LIBRARY_URL)||!/[.]m?js$/.test(url))return null;
      const file=path.resolve(directory,url.slice(PUBLIC_LIBRARY_URL.length));
      if(!inside(directory,file))return null;
      try{return fs.readFileSync(file,'utf8');}
      catch(error){if(error?.code==='ENOENT')return null;throw error;}
    },
  };
}
