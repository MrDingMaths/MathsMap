import path from 'node:path';

// Node authoring tools need filesystem imports, while the standalone editor
// already loads these same modules from /libs/. Give the browser one identity.
// Production keeps the existing bundling; only the dev-server resolver changes.
export function publicLibraryModulesPlugin(){
  let directory;
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
      const file=path.resolve(path.dirname(importer.split('?')[0]),source),relative=path.relative(directory,file);
      if(relative.startsWith('..')||path.isAbsolute(relative))return null;
      return {id:'/libs/maths-editor/'+relative.split(path.sep).join('/'),external:true};
    },
  };
}
