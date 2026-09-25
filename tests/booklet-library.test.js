import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {normalizeProjectLibrary,groupLibraryProjects} from '../src/lib/booklet-library.js';
import {updateBookletProjectLibrary} from '../src/lib/booklet-project-storage.js';
import {validateEditableProject} from '../src/lib/editable-booklet-model.js';
import {libraryMigration} from '../scripts/booklet/migrate-project-library.mjs';
import {createBookletProject,listBookletProjects,loadBookletProject,updateProjectLibrary,saveBookletProject,duplicateBookletProject} from '../scripts/booklet/project-studio-server.mjs';

const courses=[{id:'s4',stage:4,title:'Stage 4',order:2},{id:'adv',stage:6,title:'Year 11 Advanced',order:7}];
test('library groups by category, course order and title, with search and separate archives',()=>{
  const projects=[{id:'z',title:'Zebra',library:{category:'master',courseId:'s4'}},{id:'a',title:'Algebra',library:{category:'master',courseId:'s4'}},{id:'v',title:'Volume',library:{category:'class',classLabel:'8MAT6'}},{id:'c',title:'Concept',library:{category:'import-review',courseId:'adv'}},{id:'u',title:'Legacy'},{id:'x',title:'Archived',library:{category:'master',archivedAt:'2026-09-17T00:00:00Z'}},{id:'m',title:'Unknown course',library:{category:'master'}}];
  const groups=groupLibraryProjects(projects,courses);
  assert.deepEqual(groups.map(g=>g.key),['master:s4','master:','class:8MAT6','import-review','unassigned']);
  assert.deepEqual(groups[0].projects.map(p=>p.id),['a','z']);
  assert.deepEqual(groupLibraryProjects(projects,courses,{query:'advanced'}).flatMap(g=>g.projects).map(p=>p.id),['c']);
  assert.equal(groupLibraryProjects(projects,courses,{query:'8mat6'})[0].projects[0].id,'v');
  assert.equal(groupLibraryProjects(projects,courses,{archived:true})[0].projects[0].id,'x');
  assert.deepEqual(groupLibraryProjects(projects,courses,{query:'not present'}),[]);
  assert.equal(normalizeProjectLibrary().category,null);
});

test('migration preserves manually classified and already migrated projects',()=>{
  const initial={id:'volume-v1',revision:4};
  assert.equal(libraryMigration([initial]).length,1);
  assert.equal(libraryMigration([{...initial,library:{category:'master'}}]).length,0);
  assert.equal(libraryMigration([{...initial,library:{courseId:'s4'}}]).length,0);
  assert.equal(libraryMigration([{id:'unknown',revision:1}]).length,0);
});

test('client library update uses the metadata-only PATCH contract',async()=>{
 let request;
 const library={category:'master',courseId:'adv',classLabel:'',archivedAt:null};
 const result=await updateBookletProjectLibrary('non-right-angled-trigonometry-v1',library,172,async(url,options)=>{
  request={url,options};return {ok:true,json:async()=>({id:'non-right-angled-trigonometry-v1',library,revision:173})};
 });
 assert.equal(request.url,'/__booklet/projects/non-right-angled-trigonometry-v1/library');
 assert.equal(request.options.method,'PATCH');
 assert.deepEqual(JSON.parse(request.options.body),{library,expectedRevision:172});
 assert.equal(result.revision,173);
});

test('library-only saves preserve exact content, reject stale revisions and survive archive/restore',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'booklet-library-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank')};
  const created=await createBookletProject({title:'Master'},options);
  assert.equal(created.library.category,'master');
  const before=JSON.parse(await fs.readFile(path.join(options.projectRoot,created.id+'.json'),'utf8'));
  const library={category:'import-review',courseId:'adv',archivedAt:'2026-09-17T00:00:00Z'};
  const archived=await updateProjectLibrary(created.id,library,{...options,expectedRevision:created.revision});
  for(const key of Object.keys(before).filter(k=>!['library','revision','updatedAt'].includes(k)))assert.deepEqual(archived[key],before[key],key);
  await assert.rejects(updateProjectLibrary(created.id,library,{...options,expectedRevision:created.revision}),{statusCode:409});
  await assert.rejects(saveBookletProject(created,{...options,expectedRevision:created.revision}),{statusCode:409});
  assert.equal((await listBookletProjects({...options,summary:true}))[0].library.archivedAt,library.archivedAt);
  assert.equal((await loadBookletProject(created.id,options)).library.category,'import-review');
  const copy=await duplicateBookletProject(created.id,{...options,library:{category:'class',classLabel:'8MAT6'},expectedRevision:archived.revision});
  assert.equal(copy.library.archivedAt,null);assert.equal(copy.library.classLabel,'8MAT6');assert.equal(copy.library.courseId,'adv');
  assert.deepEqual(copy.settings,archived.settings);assert.deepEqual(copy.sections,archived.sections);
  const restored=await updateProjectLibrary(created.id,{...archived.library,archivedAt:null},{...options,expectedRevision:archived.revision});
  assert.equal(restored.library.archivedAt,null);
  const unchanged=await updateProjectLibrary(created.id,restored.library,{...options,expectedRevision:restored.revision});
  assert.equal(unchanged.revision,restored.revision);
});

test('library-only saves can update metadata on a project with duplicate live node IDs',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'booklet-library-invalid-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank')};
 const created=await createBookletProject({title:'Invalid draft'},options);
 const file=path.join(options.projectRoot,created.id+'.json');
 const bad=JSON.parse(await fs.readFile(file,'utf8'));
 const duplicateDocument={format:'maths-editor-document-v1',version:1,blocks:[{id:'duplicate-marker',type:'paragraph',fontSize:null,align:'left',spaceBefore:0,spaceAfter:2,lineHeight:1.4,indent:0,inlines:[{type:'text',text:'same',marks:[]}]}]};
 bad.sections[0].blocks=[{id:'rich-a',type:'rich-text',content:duplicateDocument},{id:'rich-b',type:'rich-text',content:structuredClone(duplicateDocument)}];
 assert.equal(validateEditableProject(bad).valid,false);
 await fs.writeFile(file,JSON.stringify(bad,null,2)+'\n');
 const before=JSON.parse(await fs.readFile(file,'utf8'));
 const updated=await updateProjectLibrary(created.id,{category:'master',courseId:'adv'}, {...options,expectedRevision:before.revision});
 assert.equal(updated.revision,before.revision+1);
 assert.equal(updated.library.courseId,'adv');
 assert.deepEqual(updated.sections,before.sections);
});
