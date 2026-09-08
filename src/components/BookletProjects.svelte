<script>
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';
  import FlowBookletPreview from './FlowBookletPreview.svelte';
  import FlowBookletOutline from './FlowBookletOutline.svelte';
  import FlowBookletPage from './FlowBookletPage.svelte';
  import {isFlexible,FLOW_EDITIONS,flowCommand,selectedFlowIds} from '../lib/booklet-flow.js';
  import { adoptHouseStyle, BOOKLET_HOUSE_STYLE, houseStyleVariables } from '../lib/booklet-house-style.js';
  import {teachingLabels} from '../lib/booklet-labels.js';
  import { independentAnswerPages } from '../lib/booklet-answer-options.js';
  import { resolvePreviewAssets } from '../lib/booklet-preview.js';
  import { fromSource, isDocument, normalizeDocument } from '../lib/document-content.js';
  import { mergeProjectChanges } from '../lib/booklet-save-merge.js';
  import { onMount, tick, setContext } from 'svelte';
  import FocusedBookletEditor from './FocusedBookletEditor.svelte';
  import TranscribedBookletPage from './TranscribedBookletPage.svelte';
  import BookletReviewInspector from './BookletReviewInspector.svelte';
  import {shareUnchanged} from '../lib/booklet-arrangement.js';
  import {resolveArrangement,findContent} from '../lib/booklet-arrangement.js';
  import BookletAssemblyPanel from './BookletAssemblyPanel.svelte';
  import { reviewTargets } from '../lib/booklet-review-model.js';
  import { skills } from '../lib/data.js';
  import {
    addProjectBlock, addProjectSection, createProjectBlock, deleteProjectBlock,
    deleteProjectSection, duplicateProjectBlock, duplicateProjectSection, moveProjectBlock,
    moveProjectSection, resizeFirstProjectTable, resizeQuestionParts, snapshotBankQuestion,
    updateProjectContent, updateProjectSettings,
  } from '../lib/editable-booklet-model.js';
  import {
    createBookletProject, deleteBookletProject, duplicateBookletProject,
    listBookletProjects, loadBookletProject, promoteProjectModule,
    promoteProjectQuestion, saveBookletProject, getProjectBankSync, resolveProjectBankSync,
  } from '../lib/booklet-project-storage.js';

  let { initialProjectId = null, bank = [], onprojectchange = null } = $props();
  let projects = $state([]);
  let project = $state.raw(null);
  const flexible=$derived(isFlexible(project));
  let flowPreview=$state(),flowOutline=$state(),flowMap=$state.raw({pages:[],issues:[],ready:false}),flowEdition=$state('student'),flowActive=$state(1);
  function selectFlow(id,sectionId){selectedBlockId=id;selectedSectionId=sectionId;selectedTargetId='';flowPreview?.jumpTo(id);}
  function flowSelected(page){selectedSectionId=page.section.sourceSectionId;}
  async function createFlexibleCopy(){
    if(inlineSession||editSession)return;
    busy='Creating flexible copy';error='';
    try{if(saveState!=='Saved')await persist();if(saveState!=='Saved')throw Error('Resolve the current save before creating a copy.');
      const created=await duplicateBookletProject(project.id,{title:project.title+' — Flexible',flexible:true});await refreshProjects();await openProject(created.id);
    }catch(e){error=e.message;}finally{busy='';}
  }
  let bankSync = $state.raw({items:[]});
  let showBankSync = $state(false), bankSyncError=$state(''), syncBusy=$state(false);
  const bankUpdates=$derived(bankSync.items.filter(i=>['update','conflict','pending','missing'].includes(i.state)));
  async function refreshBankSync(){
    if(!project)return;const id=project.id;
    try{const result=await getProjectBankSync(id);if(project?.id===id){bankSync=result;bankSyncError='';}}
    catch(e){if(project?.id===id)bankSyncError='Could not check bank updates. '+e.message;}
  }
  async function applyBankSync(item,action){
    if(inlineSession||editSession||saveState!=='Saved'||saveInFlight){status='Save or cancel the current edit before resolving a bank update.';return;}
    syncBusy=true;error='';
    try{
      const saved=await resolveProjectBankSync(project.id,{blockId:item.blockId,action,bankRevision:item.bankRevision,localHash:item.localHash,expectedRevision:project.revision});
      project=saved;savedBase=clone(saved);undoStack=[];redoStack=[];
      status=action==='use-bank'?'Bank version applied; local page layout retained.':action==='keep-local'?'Local version kept as a separate question.':'Booklet version saved to the bank.';
      await refreshBankSync();await refreshProjects();
    }catch(e){error=e.message;await refreshBankSync();}finally{syncBusy=false;}
  }
  const labels=$derived(teachingLabels(project?.sections.flatMap(s=>s.blocks)??[]));
  setContext('booklet-labels',()=>labels);
  let printReady = $state(false);
  let printing = $state(false), printProgress = $state('');
  let inlineSession = $state.raw(null);
  const inlineEditing={get session(){return inlineSession;},close(){const restore=inlineSession?.restoreFocus;inlineSession=null;tick().then(()=>restore?.());},focus(result){editSession={...inlineSession,value:result?.value??inlineSession.value,layout:result?.layout??inlineSession.layout};inlineSession=null;}};
  setContext('booklet-inline-edit',inlineEditing);
  let selectedSectionId = $state('');
  let selectedPageId = $state('');
  let selectedBlockId = $state('');
  let selectedTargetId = $state('');
  let canvas=$state(null);
  $effect(()=>{
    if(!canvas)return;
    const select=event=>{const rootId=event.target.closest('[data-edit-root]')?.dataset.editRoot??event.target.closest('[data-node-id]')?.dataset.nodeId;const target=reviewTargets(project).find(t=>t.id===rootId);if(target){selectedBlockId=target.block.id;selectedTargetId=target.id;}};
    canvas.addEventListener('click',select);return()=>canvas?.removeEventListener('click',select);
  });
  let bankQuestionId = $state('');
  let addBlockType = $state('rich-text');
  let status = $state('');
  let error = $state('');
  let busy = $state('');
  let saveState = $state('Saved');
  let promotion = $state(null);
  let exportSettings = $state({ showKeyIdeasAnswers:false, showReviewAnswers:false, showIdentifyAnswers:false, showGuidedPracticeAnswers:false, showTheorySolutions: true, showResponseSpaces: true, practiceAnswers: 'short' });
  let undoStack = $state.raw([]);
  let redoStack = $state.raw([]);
  let saveTimer = null;
  let saveInFlight = false;
  let savePending = false;
  let savedBase=null;let saveConflict=$state(false),mergeReview=$state(null),mergeChoices=$state({}),diagramRecovery=$state({});

  let answerView=$state('student');
  let navigation=$state(true),comparison=$state(false),panel=$state(''),tool=$state(''),zoom=$state('width'),sourceZoom=$state('width'),workspaceWidth=$state(1400),workspace,focusedEditor=$state();
  let editSession=$state.raw(null),preferencesReady=$state(false);
  const selectedSourcePage=$derived(selectedBlock?.sourcePageNumber??selectedSection?.sourcePageNumber);
  const sourceUrl=$derived(project?.source?.runId && selectedSourcePage ? `/__booklet/full-imports/${encodeURIComponent(project.source.runId)}/files/evidence/pages/page-${String(selectedSourcePage).padStart(3,'0')}.png` : '');
  const flagCount=$derived((project?.studio?.flags??[]).filter(f=>!f.resolved).length);
  const dockReview=$derived(panel==='review' && workspaceWidth-(navigation?240:0)-360>=794);
  const pageIndex=$derived(projectPages.indexOf(previewPage));
  function blockLabel(block,index=0){const value=block.title||block.label||block.content?.prompt||block.content?.stem||block.content?.text||block.content;const text=typeof value==='string'?value.replace(/[_*#`$\\{}]/g,'').replace(/\s+/g,' ').trim():'';return (block.type==='question'?`Question ${block.content?.label??index+1}`:block.type==='callout'?(typeof block.label==='string'?block.label:'Theory'):(block.type==='rich-text'?'Text':block.type.replaceAll('-',' ')))+(text?' · '+text.slice(0,65):'');}
  function goPage(index){if(inlineSession){status="Save or cancel the current page edit before changing pages.";return;}const page=projectPages[index];if(!page)return;selectedPageId=page.id;selectedSectionId=page.section.id;selectedBlockId=page.blocks[0]?.id??'';selectedTargetId='';if(workspaceWidth<1100)navigation=false;}
  function zoomBy(delta){const actual=canvas?.querySelector('.preview-frame');const current=Number(zoom)||Number(actual&&getComputedStyle(actual).getPropertyValue('--preview-scale'))||1;zoom=String(Math.max(.25,Math.min(2,current+delta)).toFixed(2));}
  let comparisonScroll=null;
  async function toggleComparison(){if(!comparison){comparisonScroll={top:canvas.scrollTop,left:canvas.querySelector('.paper-scroll')?.scrollLeft??0};comparison=true;tool='';}else{comparison=false;await tick();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));canvas.scrollTop=comparisonScroll?.top??0;const paper=canvas.querySelector('.paper-scroll');if(paper)paper.scrollLeft=comparisonScroll?.left??0;}}
  function togglePanel(next){panel=panel===next?'':next;}
  function editLocation(origin,target){const labels=[];for(let node=origin?.closest('.question-node');node;node=node.parentElement?.closest('.question-node')){const label=node.querySelector(':scope > .question-line > .part-label')?.textContent?.trim().replace(/[.)]$/,'');if(label)labels.unshift(label);}return `Page ${previewPage?.pageNumber} · ${labels.length?'Question '+labels.join(''):target?blockLabel(target.block,previewPage.blocks.indexOf(target.block)):'Content'}`;}
  function requestEdit(request){
    if(inlineSession){status='Save or cancel the current page edit before editing another item.';return;}
    if(request.pointer==='/section/title')request={...request,rootId:flexible?(flowMap.pages[Number(request.origin?.closest('[data-flow-index]')?.dataset.flowIndex)]?.section.sourceSectionId??selectedSectionId):previewPage.section.id,pointer:'/title'};
    let target=reviewTargets(project).find(t=>t.id===request.rootId);
    if(!target){for(const section of project.sections){for(const block of section.blocks){const node=findContent(block,request.rootId);if(node){target={id:request.rootId,node,block,section,kind:'part'};break;}}if(target)break;}}
    if(flexible&&target?.section)selectedSectionId=target.section.id;
    if(target&&['question','worked-example','callout','activity','guided-practice'].includes(target.block.type)&&!/^\/(title|label|sourceAtom|section)/.test(request.pointer)){openArrangement(target,request);return;}
    if(target){selectedBlockId=target.block.id;selectedTargetId=target.id;}
    if(flexible&&target&&request.value!==undefined){const original=request.pointer.split('/').slice(1).reduce((v,k)=>v?.[k],target.node);if(original!==undefined)request={...request,value:original};}
    const enclosing=request.origin?.closest('.question-node.diagrams-beside');
    const layoutId=enclosing?.dataset.nodeId??request.rootId;
    const layoutTarget=reviewTargets(project).find(t=>t.id===layoutId);
    const page=request.origin?.closest('.preview-page');const scale=page?page.getBoundingClientRect().width/page.offsetWidth:1;
    const layoutContext={id:layoutId,beside:!!enclosing,inset:!!request.origin?.closest('.stacked-prompt'),widthMm:enclosing?enclosing.getBoundingClientRect().width/scale*25.4/96:180,textWidthMm:enclosing?enclosing.querySelector(':scope > .question-line')?.getBoundingClientRect().width/scale*25.4/96:undefined,diagramWidthMm:layoutTarget?.node.questionDiagrams?.[0]?.widthMm};
    const nextSession={...request,houseStyleVersion:project.settings.houseStyleVersion,layoutContext,layout:clone(project.settings.layoutOverrides.blockLayouts?.[layoutId]??{}),question:target?.block.type==='question'?resolvePreviewAssets(target.block.content,src=>src.startsWith('evidence/')?`/__booklet/full-imports/${encodeURIComponent(project.source?.runId??project.id)}/files/lanes/exact/${src}`:src):null,blockLayouts:clone(project.settings.layoutOverrides.blockLayouts??{}),
      restoreFocus:()=>canvas?.querySelector('[data-edit-root="'+CSS.escape(request.rootId)+'"][data-edit-path="'+CSS.escape(request.pointer)+'"] .clickable')?.focus({preventScroll:true}),context:editLocation(request.origin,target),sourceUrl,
      commit:result=>{
        let next=project;
        for(const id of request.rootIds?.length?request.rootIds:[request.rootId])next=updateProjectContent(next,id,request.pointer,result.value);
        if(result.applyTabs&&target?.block.type==='question'){
          const visit=node=>{if(!node.children?.length&&node.id!==request.rootId){const doc=isDocument(node.prompt)?normalizeDocument(node.prompt):fromSource(node.prompt??'');for(const p of doc.blocks)if(p.type==='paragraph')p.tabStops=clone(result.applyTabs);next=updateProjectContent(next,node.id,'/prompt',doc);}else node.children?.forEach(visit);};visit(target.block.content);
        }
        if(result.layout)next=updateProjectSettings(next,{layoutOverrides:{...next.settings.layoutOverrides,blockLayouts:{...next.settings.layoutOverrides.blockLayouts,[layoutId]:result.layout}}});
        change(next);
      }};
    editSession=nextSession;
  }
  function requestDiagram(request){
    if(inlineSession){status='Save or cancel the current page edit first.';return;}
    const {target,item,origin}=request,d=item.diagram;
    if(['question','worked-example','callout','activity','guided-practice'].includes(target.block.type)){openArrangement(target,{rootId:target.id,selectedDiagramId:d.id,origin});return;}
    editSession={key:[project.id,target.id,item.path,d.id].join(':'),projectId:project.id,targetId:target.id,path:item.path,diagram:d,origin,
      colourMode:project.settings.layoutOverrides.diagramColourModes[d.id]??'original',assetBase:'/__booklet/full-imports/'+encodeURIComponent(project.source?.runId??project.id)+'/files/lanes/exact/',
      context:'Page '+previewPage?.pageNumber+' ? '+(d.alt??'Diagram'),sourceUrl,commit:draft=>{
        let next=project;
        const diagram={...d,[d.format==='tikz'?'code':'src']:draft.code,widthMm:draft.width,mathematicalModel:draft.mathematicalModel,...(d.format!=='tikz'?{sourceRegion:draft.sourceRegion}:{} )};
        if(item.path)next=updateProjectContent(next,target.id,item.path,diagram);
        else next={...next,sections:next.sections.map(section=>({...section,blocks:section.blocks.map(block=>block.id===d.id?diagram:block)}))};
        if(d.format!=='tikz')next=updateProjectSettings(next,{layoutOverrides:{...next.settings.layoutOverrides,diagramColourModes:{...next.settings.layoutOverrides.diagramColourModes,[d.id]:draft.colourMode}}});
        change(next);
      }};
  }
  function openArrangement(target,request){
    const block=target.block;
    const related=new Set(reviewTargets(project).filter(t=>t.block.id===block.id).map(t=>t.id));
    selectedBlockId=block.id;selectedTargetId=target.id;
    const paper=request.origin?.closest('.preview-page'),scale=paper?paper.getBoundingClientRect().width/paper.offsetWidth:1;
    const arrangementContainer=request.origin?.closest('.booklet-arrangement');
    const container=request.origin?.closest('.atom-body,.body-box,.practice');
    const widthMm=arrangementContainer?arrangementContainer.clientWidth*25.4/96:container?Math.round(Math.min(190,Math.max(80,(container.getBoundingClientRect().width/scale-parseFloat(getComputedStyle(container).paddingLeft)-parseFloat(getComputedStyle(container).paddingRight))*25.4/96))*10)/10:180;
    const initialArrangement=resolveArrangement(block,project.settings.layoutOverrides.blockLayouts?.[block.id]?.arrangement,{...project.settings.layoutOverrides,labels},widthMm).tree;
    editSession={...request,block:clone(block),arrangement:initialArrangement,widthMm,houseStyleVersion:project.settings.houseStyleVersion,diagramColourModes:project.settings.layoutOverrides.diagramColourModes,sourceUrl,assetBase:'/__booklet/full-imports/'+encodeURIComponent(project.source?.runId??project.id)+'/files/lanes/exact/',context:editLocation(request.origin,target),commit:result=>{
      const sections=project.sections.map(section=>section.blocks.some(b=>b.id===block.id)?{...section,blocks:section.blocks.map(b=>b.id===block.id?shareUnchanged(b,result.block):b)}:section);
      const layouts=project.settings.layoutOverrides.blockLayouts??{};
      const answerSpaces={...project.settings.layoutOverrides.answerSpaces};
      const oldSpaces=new Map();
      const visitSpaces=(node,visit)=>{if(node?.type==='item'&&node.ref?.endsWith('/space'))visit(node);for(const child of node?.children??[])visitSpaces(child,visit);};
      visitSpaces(initialArrangement.root,n=>oldSpaces.set(n.ref,n.height));
      visitSpaces(result.arrangement.root,n=>{if(n.height!=null&&n.height!==oldSpaces.get(n.ref))answerSpaces[n.ref.slice(0,-6)]=n.height;});
      const diagramWidths={...project.settings.layoutOverrides.diagramWidths};
      const previousDiagrams=new Map();
      const visitDiagrams=(value,visit)=>{if(!value||typeof value!=='object')return;if(value.id&&value.format&&value.widthMm!=null)visit(value);for(const [key,child] of Object.entries(value))if(!['sourceAtom','originalDiagram','spec'].includes(key))visitDiagrams(child,visit);};
      visitDiagrams(block,d=>previousDiagrams.set(d.id,d));
      visitDiagrams(result.block,d=>{const previous=previousDiagrams.get(d.id);if(previous&&previous.widthMm!==d.widthMm)diagramWidths[d.id]=d.widthMm;});
      change({...project,sections,settings:{...project.settings,layoutOverrides:{...project.settings.layoutOverrides,answerSpaces,diagramWidths,blockLayouts:{...layouts,[block.id]:{...layouts[block.id],arrangement:result.arrangement}}}}});
    }};
  }
  function clickedDiagram(event){if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;const element=event.target.closest('[data-diagram-id]');if(!element||event.target.closest('button'))return;const id=element.dataset.diagramId;for(const target of reviewTargets(project)){let item;const visit=(node,path='')=>{if(!node||typeof node!=='object'||item)return;if(node.id===id&&(node.format||node.type==='image')){item={diagram:node,path};return;}for(const [key,value] of Object.entries(node))if(value&&typeof value==='object')Array.isArray(value)?value.forEach((v,i)=>visit(v,path+'/'+key+'/'+i)):visit(value,path+'/'+key);};visit(target.node);if(item){event.preventDefault();requestDiagram({target,item,origin:element});return;}}}
  $effect(()=>{if(!canvas)return;project;const decorate=()=>canvas.querySelectorAll('[data-diagram-id]').forEach(el=>{el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','Edit diagram');});decorate();const observer=new MutationObserver(decorate);observer.observe(canvas,{childList:true,subtree:true});canvas.addEventListener('click',clickedDiagram);canvas.addEventListener('keydown',clickedDiagram);return()=>{observer.disconnect();canvas?.removeEventListener('click',clickedDiagram);canvas?.removeEventListener('keydown',clickedDiagram);};});
  setContext('booklet-edit-request',requestEdit);
  $effect(()=>{if(preferencesReady)try{sessionStorage.setItem('booklet-workspace',JSON.stringify({navigation,zoom,sourceZoom,panel,answerView}));}catch{}});
  onMount(()=>{try{const prefs=JSON.parse(sessionStorage.getItem('booklet-workspace')??'{}');navigation=prefs.navigation??innerWidth>=1100;zoom=prefs.zoom??'width';sourceZoom=prefs.sourceZoom??'width';panel=prefs.panel??'';answerView=['student','short','worked'].includes(prefs.answerView)?prefs.answerView:'student';}catch{}preferencesReady=true;const observer=new ResizeObserver(entries=>workspaceWidth=entries[0].contentRect.width);observer.observe(workspace);const closeMenu=e=>{const menu=e.target.closest('.menu');if(menu&&e.target.closest('button'))menu.open=false;};workspace.addEventListener('click',closeMenu);return()=>{observer.disconnect();workspace.removeEventListener('click',closeMenu);};});

  const selectedSection = $derived(project?.sections?.find((section) => section.id === selectedSectionId) ?? project?.sections?.[0] ?? null);
  const selectedBlock = $derived(selectedSection?.blocks?.find((block) => block.id === selectedBlockId) ?? null);
  function buildPages(sections = []) {
    const pages = [];
    for (const section of sections) {
      let blocks = [],continuation=0;
      const flush = () => {
        pages.push({ id: `project-page-${section.id}-${pages.length + 1}`, pageNumber: project?.settings?.preserveSourcePages ? (section.sourcePageNumber ?? pages.length + 1) : pages.length + 1, continuation:continuation++, section, blocks });
        blocks = [];
      };
      for (const block of section.blocks ?? []) {
        if (block.type === 'page-break') flush();
        else blocks.push(block);
      }
      if (blocks.length || !pages.length || pages.at(-1)?.section?.id !== section.id) flush();
    }
    return pages;
  }

  const projectPages = $derived(flexible?flowMap.pages.map(p=>({...p,section:{...p.section,id:p.section.sourceSectionId}})):buildPages(project?.sections ?? []));
  async function checkCurrentPage(){
    status='Checking page…';
    try{const {settleBooklet,inspectBooklet}=await import('../lib/booklet-qa.js');const root=canvas.querySelector('.paper-scroll');await settleBooklet(root);const report=inspectBooklet(root,{style:project.settings.houseStyleVersion==='1.1.0'});const issues=report.flatMap(p=>p.issues);status=issues.length?'Page needs attention: '+issues.map(i=>`${i.kind} (${i.diagramId??i.id})`).join('; '):'Page QA passed: content fits above the footer and applicable style checks pass.';}catch(e){status='Page QA failed: '+e.message;}
  }
  const previewPage = $derived(projectPages.find(page=>page.id===selectedPageId&&page.section.id===selectedSection?.id&&(!selectedBlockId||page.blocks.some(b=>b.id===selectedBlockId))) ?? projectPages.find((page) => page.section.id === selectedSection?.id && (!selectedBlockId || page.blocks.some((block) => block.id === selectedBlockId))) ?? projectPages.find((page) => page.section.id === selectedSection?.id) ?? projectPages[0] ?? null);
  const bookletPages = $derived(project?.settings?.preserveSourcePages ? projectPages : [{ id: 'project-cover-anchor', pageNumber: 0, section: { title: project?.title ?? '' }, blocks: [] }, ...projectPages]);
  const exportPages = $derived(projectPages.filter(page=>page.section.role!=='candidate-pool'));
  const answerPages = $derived(independentAnswerPages(exportPages));
  const effectiveSpaces = $derived((() => {
    const spaces = { ...(project?.settings?.layoutOverrides?.answerSpaces ?? {}) };
    if (exportSettings.showResponseSpaces !== false) return spaces;
    const visit = (value) => {
      if (!value || typeof value !== 'object') return;
      if (value.id && value.type && !value.children?.length && 'answer' in value) spaces[value.id] = 0;
      for (const child of Object.values(value)) Array.isArray(child) ? child.forEach(visit) : visit(child);
    };
    visit(project?.sections ?? []);
    return spaces;
  })());

  const clone = (value) => JSON.parse(JSON.stringify(value));

  async function refreshProjects() {
    projects = await listBookletProjects();
  }

  function selectDefaults(next) {
    flowMap={pages:[],issues:[],ready:false};flowEdition=next?.settings?.flowEdition??'student';flowActive=1;
    selectedPageId='';
    selectedSectionId = next?.sections?.[0]?.id ?? '';
    selectedBlockId = next?.sections?.[0]?.blocks?.[0]?.id ?? '';
    exportSettings = {
      showTheorySolutions: next?.settings?.showTheorySolutions !== false,
      showKeyIdeasAnswers: next?.settings?.showKeyIdeasAnswers === true,
      showReviewAnswers: next?.settings?.showReviewAnswers === true,
      showIdentifyAnswers: next?.settings?.showIdentifyAnswers === true,
      showGuidedPracticeAnswers: next?.settings?.showGuidedPracticeAnswers === true,
      showResponseSpaces: next?.settings?.showResponseSpaces !== false,
      practiceAnswers: next?.settings?.practiceAnswers ?? 'short',
    };
    promotion = null;
  }

  async function openProject(id) {
    if(inlineSession)return;
    if(project&&saveState!=='Saved'){await persist();if(saveState!=='Saved'){status='Finish saving the current booklet before switching projects.';return;}}
    printReady = false;
    busy = 'Opening'; error = ''; status = '';
    try {
      project = await loadBookletProject(id);savedBase=clone(project);saveConflict=false;mergeReview=null;
      bankSync={items:[]};showBankSync=false;await refreshBankSync();
      selectDefaults(project);
      undoStack = []; redoStack = [];
      onprojectchange?.(project.id);
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function createNew() {
    const title = window.prompt('Booklet title', 'Untitled booklet');
    if (!title) return;
    busy = 'Creating'; error = '';
    try {
      const created = await createBookletProject({ title });
      await refreshProjects();
      project = created;savedBase=clone(created); selectDefaults(created); onprojectchange?.(created.id);
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function duplicateCurrent() {
    if (!project) return;
    busy = 'Duplicating'; error = '';
    try {
      const created = await duplicateBookletProject(project.id);
      await refreshProjects(); project = created;savedBase=clone(created); selectDefaults(created); onprojectchange?.(created.id);
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function removeCurrent() {
    if (!project) return;
    const confirmId = window.prompt(`Type ${project.id} to permanently delete this project.`);
    if (confirmId !== project.id) return;
    busy = 'Deleting'; error = '';
    try {
      await deleteBookletProject(project.id, confirmId);
      project = null; await refreshProjects();
      if (projects[0]) await openProject(projects[0].id);
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  function remember() {
    if (!project) return;
    undoStack = [...undoStack.slice(-39), clone(project)];
    redoStack = [];
  }

  function change(next, { rememberBefore = true } = {}) {
    if (rememberBefore) remember();
    project = next;
    saveState = 'Unsaved changes';
    promotion = null;
    queueSave();
  }

  function queueSave() {
    if (!project || saveConflict) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 500);
  }

  async function persist() {
    if (!project||saveConflict) return;
    if (saveInFlight) { savePending = true; return; }
    saveInFlight = true; saveState = 'Saving…'; error = '';
    const savingProject = project;
    const snapshot = clone(project);
    try {
      const saved = await saveBookletProject(snapshot);
      if(project.id!==snapshot.id)return;
      const editedDuringSave=project!==savingProject;
      savedBase=clone(saved);project = editedDuringSave?{ ...project, revision: saved.revision, updatedAt: saved.updatedAt }:saved;
      saveState = editedDuringSave?'Unsaved changes':'Saved';
      if(editedDuringSave)savePending=true;
      await refreshBankSync();
      await refreshProjects();
    } catch (exception) {
      error = exception.message;saveConflict=exception.status===409;if(saveConflict){clearTimeout(saveTimer);savePending=false;} saveState = saveConflict ? 'Conflict - edits retained' : 'Save failed';
    } finally {
      saveInFlight = false;
      if (savePending) { savePending = false; queueSave(); }
    }
  }

  function downloadRecovery(){
    const drafts=[...document.querySelectorAll('.editable-booklet-text maths-editor')].map(e=>({rootId:e.closest('[data-edit-root]')?.dataset.editRoot,pointer:e.closest('[data-edit-path]')?.dataset.editPath,document:e.document}));
    if(editSession&&!editSession.diagram)drafts.push({rootId:editSession.rootId,pointer:editSession.pointer,...focusedEditor?.getValue()});
    const diagramDrafts=Object.values(diagramRecovery).filter(d=>d.projectId===project.id);
    if(editSession?.diagram)diagramDrafts.push({key:editSession.key,projectId:editSession.projectId,targetId:editSession.targetId,path:editSession.path,diagramId:editSession.diagram.id,draft:focusedEditor?.getValue()});
    const url=URL.createObjectURL(new Blob([JSON.stringify({project,drafts,diagramDrafts},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=project.id+'-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function loadLatestAndMerge(){
    try{const latest=await loadBookletProject(project.id);mergeChoices={};const result=mergeProjectChanges(savedBase,project,latest);mergeReview={latest,...result};if(!result.conflicts.length)finishMerge();}catch(e){error=e.message;}
  }
  function finishMerge(){
    const result=mergeProjectChanges(savedBase,project,mergeReview.latest,mergeChoices);if(result.conflicts.length){mergeReview={...mergeReview,...result};return;}
    project=result.project;savedBase=clone(mergeReview.latest);mergeReview=null;saveConflict=false;error='';saveState='Unsaved changes';queueSave();
  }

  function undo() {
    if (!undoStack.length || !project) return;
    const previous = undoStack.at(-1);
    redoStack = [...redoStack, clone(project)];
    undoStack = undoStack.slice(0, -1);
    change({ ...previous, revision: project.revision }, { rememberBefore: false });
  }

  function redo() {
    if (!redoStack.length || !project) return;
    const next = redoStack.at(-1);
    undoStack = [...undoStack, clone(project)];
    redoStack = redoStack.slice(0, -1);
    change({ ...next, revision: project.revision }, { rememberBefore: false });
  }

  function editContent(event) {
    try { change(updateProjectContent(project, event.rootId, event.pointer, event.value)); }
    catch (exception) { error = exception.message; }
  }

  function setSetting(patch) { change(updateProjectSettings(project, patch)); }

  function setExportSetting(patch) { exportSettings = { ...exportSettings, ...patch }; if(flexible&&patch.practiceAnswers)flowEdition=patch.practiceAnswers==='none'?'student':patch.practiceAnswers; }

  function saveExportDefaults() {
    setSetting({...exportSettings,...(flexible?{flowEdition}:{})});
    status = 'PDF defaults saved with this booklet.';
  }

  function resetExportDefaults() {
    exportSettings = {
      showTheorySolutions: project.settings.showTheorySolutions !== false,
      showKeyIdeasAnswers: project.settings.showKeyIdeasAnswers === true,
      showReviewAnswers: project.settings.showReviewAnswers === true,
      showIdentifyAnswers: project.settings.showIdentifyAnswers === true,
      showGuidedPracticeAnswers: project.settings.showGuidedPracticeAnswers === true,
      showResponseSpaces: project.settings.showResponseSpaces !== false,
      practiceAnswers: project.settings.practiceAnswers ?? 'short',
    };
  }

  function setAnswerSpace(id, value) {
    setSetting({ layoutOverrides: { ...project.settings.layoutOverrides, answerSpaces: { ...project.settings.layoutOverrides.answerSpaces, [id]: Number(value) } } });
  }

  function addSection() {
    const existingIds = new Set(project.sections.map((section) => section.id));
    const next = addProjectSection(project, { afterIndex: project.sections.findIndex((section) => section.id === selectedSectionId) });
    change(next);
    selectedSectionId = next.sections.find((section) => !existingIds.has(section.id))?.id ?? selectedSectionId;
    selectedBlockId = '';
  }

  function removeSection() {
    if (!selectedSection || !window.confirm(`Delete “${selectedSection.title}” and all of its blocks?`)) return;
    change(deleteProjectSection(project, selectedSection.id));
    selectedSectionId = project.sections[0]?.id ?? '';
    selectedBlockId = project.sections[0]?.blocks?.[0]?.id ?? '';
  }

  function addBlock() {
    if (!selectedSection) return;
    const at = selectedSection.blocks.findIndex((block) => block.id === selectedBlockId);
    const block = createProjectBlock(addBlockType);
    change(addProjectBlock(project, selectedSection.id, block, { afterIndex: at >= 0 ? at : null }));
    selectedBlockId = block.id;
  }

  function addBankQuestion() {
    const question = bank.find((item) => item.id === bankQuestionId);
    if (!question || !selectedSection) return;
    const block = snapshotBankQuestion(question);
    const at = selectedSection.blocks.findIndex((item) => item.id === selectedBlockId);
    change(addProjectBlock(project, selectedSection.id, block, { afterIndex: at >= 0 ? at : null }));
    selectedBlockId = block.id;
  }

  function removeBlock() {
    if (!selectedBlock || !window.confirm('Delete this block from the booklet?')) return;
    const next = flexible?flowCommand(project,{type:'delete',ids:[selectedBlock.id]}):deleteProjectBlock(project, selectedSection.id, selectedBlock.id);
    change(next);
    selectedBlockId = next.sections.find((section) => section.id === selectedSection.id)?.blocks?.[0]?.id ?? '';
  }
  function duplicateActiveBlock(){if(!selectedBlock)return;if(!flexible){change(duplicateProjectBlock(project,selectedSection.id,selectedBlock.id));return;}const ids=selectedFlowIds(project,[selectedBlock.id]),last=Math.max(...selectedSection.blocks.map((b,i)=>ids.includes(b.id)?i:-1));change(flowCommand(project,{type:'duplicate',ids,sectionId:selectedSection.id,beforeId:selectedSection.blocks[last+1]?.id}));}

  function resizeTable(rows, columns) {
    try { change(resizeFirstProjectTable(project, selectedBlock.id, { rows, columns })); }
    catch (exception) { error = exception.message; }
  }

  function patchSelected(pointer, value) {
    if (!selectedBlock) return;
    try { let next=project;const blocks=pointer.startsWith('/sourceAtom/')&&selectedBlock.sourceAtom?selectedSection.blocks.filter(b=>b.sourceAtom?.id===selectedBlock.sourceAtom.id):[selectedBlock];for(const block of blocks)next=updateProjectContent(next,block.id,pointer,value);change(next); }
    catch (exception) { error = exception.message; }
  }

  async function inspectPromotion() {
    if (!selectedBlock) return;
    busy = 'Checking bank'; error = '';
    try { promotion = await promoteProjectQuestion(project.id, { blockId: selectedBlock.id, mode: 'inspect' }); }
    catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function promote(mode, targetId = null) {
    busy = 'Promoting'; error = '';
    try {
      const result = await promoteProjectQuestion(project.id, { blockId: selectedBlock.id, mode, targetId });
      project = result.project; promotion = null; status = mode === 'link-existing' ? 'Linked to the existing bank question.' : 'Question promoted to the shared bank.';
      await refreshProjects();
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function promoteSection() {
    if (!selectedSection) return;
    const title = window.prompt('Reusable module title', selectedSection.title);
    if (!title) return;
    busy = 'Promoting module'; error = '';
    try {
      const result = await promoteProjectModule(project.id, { sectionId: selectedSection.id, title });
      status = `Saved reusable module ${result.module.id}.`;
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function printProject() {
    if(printing)return;
    if(inlineSession||editSession){status='Save or cancel the current edit before printing.';return;}
    printing = true; printProgress = 'Preparing booklet…';
    busy = 'Preparing print'; error = '';
    let progressTimer;
    try {
      if (saveState !== 'Saved') await persist();
      if (saveState !== 'Saved') throw new Error('Save the booklet before printing. Resolve any save conflict and try again.');
      if(flexible)await flowPreview.waitUntilReady();
      printReady = true;
      await tick();
      const root = document.querySelector('.project-print');
      if (!root?.querySelector('.print-page')) throw new Error('Add booklet content before printing.');
      const total = root.querySelectorAll('.tikz-wrap').length;
      const updateProgress = () => {
        const complete = [...root.querySelectorAll('.tikz-wrap')].filter(el=>el.querySelector('svg.tikz-svg')).length;
        printProgress = total ? `Preparing diagrams: ${complete} of ${total}. Large booklets can take a few minutes.` : 'Preparing images and fonts…';
      };
      updateProgress();
      progressTimer = setInterval(updateProgress, 500);
      if (window.TikZ && !await window.TikZ.flushPending(root, 300000)) throw new Error('Diagrams are still rendering. Please retry printing.');
      if (root.querySelector('.tikz-error')) throw new Error('Repair the flagged diagram before printing.');
      clearInterval(progressTimer);
      printProgress = 'Preparing images and fonts…';
      await document.fonts.ready;
      await Promise.all([...root.querySelectorAll('img')].map(async image => {
        image.loading = 'eager';
        try { await image.decode(); }
        catch { throw new Error(`Could not load an image for printing: ${image.alt || image.getAttribute('src')}. Retry after it has loaded.`); }
      }));
      printProgress = 'Opening print dialog…';
      window.print();
    } catch (exception) { error = exception.message; }
    finally { clearInterval(progressTimer); printReady = false; busy = ''; printing = false; printProgress = ''; }
  }

  onMount(() => {
    const syncTimer=setInterval(()=>{if(project&&saveState==='Saved'&&!document.hidden)refreshBankSync();},15000);
    window.addEventListener('focus',refreshBankSync);
    const key=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='p'){e.preventDefault();printProject();}};
    // Headless PDF exports explicitly request the same print surface.
    const preparePrint=()=>{printReady=true;};
    window.addEventListener('booklet-prepare-print',preparePrint);
    const unload=e=>{if(inlineSession||editSession||saveState!=='Saved'){e.preventDefault();e.returnValue='';}};
    window.addEventListener('keydown',key);window.addEventListener('beforeunload',unload);
    return ()=>{clearInterval(syncTimer);window.removeEventListener('focus',refreshBankSync);window.removeEventListener('booklet-prepare-print',preparePrint);window.removeEventListener('keydown',key);window.removeEventListener('beforeunload',unload);clearTimeout(saveTimer);};
  });
  onMount(async () => {
    try {
      await refreshProjects();
      const requested = initialProjectId && projects.some((item) => item.id === initialProjectId) ? initialProjectId : null;
      if (requested) await openProject(requested);
    } catch (exception) { error = exception.message; }
  });
</script>
<section class="project-shell" bind:this={workspace}>
 <header class="project-toolbar project-screen">
  <button aria-label="Toggle page navigation" aria-expanded={navigation&&!comparison} onclick={()=>navigation=!navigation}>☰ Pages</button>
  <label class="project-picker"><span class="sr-only">Open booklet</span><select disabled={!!inlineSession} aria-label="Open booklet" value={project?.id??''} onchange={e=>openProject(e.currentTarget.value)}><option value="">Choose a project</option>{#each projects as item}<option value={item.id}>{item.title}</option>{/each}</select></label>
  <span class="save-state" role="status">{saveState}</span>
  {#if project&&!flexible}<button disabled={!!inlineSession||!!editSession||!!busy} onclick={createFlexibleCopy}>Create flexible copy</button>{/if}
  {#if project}<button aria-expanded={showBankSync} onclick={()=>{showBankSync=!showBankSync;refreshBankSync();}}>Bank sync{bankUpdates.length?` (${bankUpdates.length})`:''}</button>{/if}
  <div class="toolbar-actions"><button onclick={undo} disabled={!!inlineSession||!undoStack.length}>Undo</button><button onclick={redo} disabled={!!inlineSession||!redoStack.length}>Redo</button><button disabled={!sourceUrl} aria-pressed={comparison} onclick={toggleComparison}>{comparison?'Exit comparison':'Compare source'}</button><button aria-expanded={panel==='review'} onclick={()=>togglePanel('review')}>Review {flagCount?`(${flagCount})`:''}</button><button aria-expanded={panel==='pdf'} onclick={()=>togglePanel('pdf')}>PDF</button>
  <details inert={!!inlineSession} class="menu"><summary>Project</summary><div><button onclick={createNew}>New booklet</button>{#if project}<button onclick={()=>{panel='metadata';}}>Project details</button><button onclick={duplicateCurrent}>Duplicate booklet</button><button class="danger" onclick={removeCurrent}>Delete booklet</button>{/if}</div></details>
  <details class="menu"><summary>Tools</summary><div><button onclick={checkCurrentPage}>Check page</button><button onclick={()=>tool='assembly'}>Assembly</button></div></details></div>
 </header>
  {#if error || status}<div class:error class="project-notice project-screen">{error || status}</div>{/if}
  {#if bankUpdates.length&&!showBankSync}<div class="project-notice project-screen" role="status">{bankUpdates.some(i=>i.state==='conflict')?'Bank sync needs review.':'Question bank updates available.'} <button onclick={()=>showBankSync=true}>Review updates</button></div>{/if}
  {#if showBankSync&&project}
    <section class="bank-sync-panel project-screen" aria-label="Question bank sync">
      <h2>Question bank sync</h2>
      <p>Original booklet questions sync on save. Other booklets keep their saved versions until you accept an update. Page layout and answer spaces stay local.</p>
      {#if bankSyncError}<p role="alert">{bankSyncError}</p>{/if}
      {#if !bankUpdates.length}<p>{bankSync.items.some(i=>i.owner)?'Original questions are synced.':'No bank updates available.'}</p>{/if}
      <button onclick={refreshBankSync} disabled={syncBusy}>Check for updates</button>
      {#each bankUpdates as item (item.blockId)}
        <article class="bank-sync-item">
          <h3>{item.title??'Question'} — {item.state==='conflict'?'Both versions changed':item.state==='missing'?'Bank question removed':item.state==='pending'?'Waiting to sync':'Update available'}</h3>
          {#if item.state==='conflict'}<p>Automatic sync is paused for this question. Compare both versions before choosing which to keep.</p>{/if}
          {#if item.local&&item.bank}<details><summary>Compare question and worked solution</summary><div class="sync-comparison">{#each [{label:'This booklet',question:item.local},{label:'Question bank',question:item.bank}] as side}<section><h4>{side.label}</h4><PracticeQuestionRenderer question={side.question} showSpaces={false}/><h4>Worked solution</h4><PracticeQuestionRenderer question={side.question} showSpaces={false} showWorkedSolutions={true} answerColumnsLimit={1}/></section>{/each}</div></details>{/if}
          {#if item.state!=='missing'}<div class="sync-actions"><button disabled={syncBusy||saveState!=='Saved'||!!inlineSession||!!editSession} onclick={()=>applyBankSync(item,'use-bank')}>Use bank version</button>{#if item.owner}<button disabled={syncBusy||saveState!=='Saved'||!!inlineSession||!!editSession} onclick={()=>applyBankSync(item,'use-booklet')}>Use booklet version</button>{:else}<button disabled={syncBusy||saveState!=='Saved'||!!inlineSession||!!editSession} onclick={()=>applyBankSync(item,'keep-local')}>Keep local version</button>{/if}</div>{/if}
        </article>
      {/each}
    </section>
  {/if}

  {#if saveConflict}<section class="project-screen project-notice" aria-label="Save recovery"><p>Your edits are retained. Another session saved a newer revision.</p><button onclick={downloadRecovery}>Download recovery</button><button onclick={loadLatestAndMerge}>Load latest and merge</button>
    {#if mergeReview}{#each mergeReview.conflicts as conflict}<fieldset><legend>{conflict.path}</legend><pre>Local: {JSON.stringify(conflict.local,null,2)}</pre><pre>Latest: {JSON.stringify(conflict.latest,null,2)}</pre><label>Keep<select aria-label={'Resolve '+conflict.path} value={mergeChoices[conflict.path]??''} onchange={e=>mergeChoices[conflict.path]=e.currentTarget.value}><option value="">Choose a version</option><option value="local">Local edit</option><option value="latest">Latest saved edit</option></select></label></fieldset>{/each}<button onclick={finishMerge} disabled={mergeReview.conflicts.some(c=>!mergeChoices[c.path])}>Save resolved merge</button>{/if}
  </section>{/if}

 {#if project}
  <div class="project-editor project-screen" class:with-navigation={navigation&&!comparison} class:with-review={dockReview&&!comparison} class:comparison>
   <section class="tool-view" hidden={!tool}><header><h2>Assembly</h2><button onclick={()=>tool=''}>Back to booklet</button></header><div hidden={tool!=='assembly'}><BookletAssemblyPanel {project} onchange={change} oncreated={openProject} expanded/></div></section>
   <aside class="project-outline" class:drawer={workspaceWidth<1100} hidden={!navigation||comparison||!!tool} aria-label="Page navigation">
    {#if flexible}<FlowBookletOutline bind:this={flowOutline} {project} pages={flowMap.pages} {bank} {selectedBlockId} disabled={!!inlineSession||!!editSession} onchange={change} onselect={selectFlow} onsection={id=>selectedSectionId=id} onerror={message=>error=message}/>{:else}
    <div class="outline-heading"><strong>Pages</strong><button aria-label="Close page navigation" onclick={()=>navigation=false}>×</button></div>
    <nav class="section-list">{#each projectPages as page,index}<article class:active={page.id===previewPage?.id}>
     <button class="section-select" aria-current={page.id===previewPage?.id?'page':undefined} onclick={()=>goPage(index)}><b>{page.pageNumber}</b><span>{page.section.title}{page.continuation?` (continued ${page.continuation})`:""}</span></button>
     {#if page.id===previewPage?.id}
      <details inert={!!inlineSession} class="page-menu"><summary>Page actions</summary><label>Page title<input disabled={!!inlineSession} aria-label="Page title" value={page.section.title} onchange={e=>change({...project,sections:project.sections.map(s=>s.id===page.section.id?{...s,title:e.currentTarget.value}:s)})}/></label><button onclick={()=>change(moveProjectSection(project,page.section.id,-1))}>Move page up</button><button onclick={()=>change(moveProjectSection(project,page.section.id,1))}>Move page down</button><button onclick={()=>change(duplicateProjectSection(project,page.section.id))}>Duplicate page</button><button onclick={removeSection}>Delete page</button><button onclick={promoteSection}>Save as reusable module</button></details>
      <ol inert={!!inlineSession} class="block-list">{#each page.blocks as block,blockIndex}<li class:active={selectedBlockId===block.id}><button onclick={()=>{selectedBlockId=block.id;selectedTargetId='';}}>{blockLabel(block,blockIndex)}</button><details><summary aria-label={'Actions for '+blockLabel(block,blockIndex)}>⋯</summary><div><button onclick={()=>{selectedBlockId=block.id;panel='properties';}}>Block properties</button><button onclick={()=>change(moveProjectBlock(project,page.section.id,block.id,-1))}>Move up</button><button onclick={()=>change(moveProjectBlock(project,page.section.id,block.id,1))}>Move down</button><button onclick={()=>change(duplicateProjectBlock(project,page.section.id,block.id))}>Duplicate block</button><button onclick={()=>{selectedBlockId=block.id;removeBlock();}}>Delete block</button></div></details></li>{/each}</ol>
      <details class="page-menu"><summary>Add content</summary><label>Block type<select aria-label="Block type" bind:value={addBlockType}><option value="rich-text">Text</option><option value="heading">Heading</option><option value="callout">Theory / callout</option><option value="review">Review activity</option><option value="activity">Activity (identify / proof / investigation)</option><option value="guided-practice">Guided practice</option><option value="worked-example">Worked example</option><option value="question">Local question</option><option value="grid">Table</option><option value="image">Image</option><option value="spacer">Spacing</option><option value="page-break">Page break</option></select></label><button onclick={addBlock}>Add block</button><label>Question bank<select bind:value={bankQuestionId}><option value="">Choose a question</option>{#each bank as question}<option value={question.id}>{question.title||question.id}</option>{/each}</select></label><button onclick={addBankQuestion} disabled={!bankQuestionId}>Add copy</button></details>
     {/if}
    </article>{/each}</nav><button disabled={!!inlineSession} class="add-page" onclick={addSection}>Add page</button>{/if}
   </aside>
   <main class="project-canvas" bind:this={canvas} hidden={!!tool}>
    {#if flexible}
    <div class="canvas-heading"><strong>{flowMap.ready ? 'Page '+flowActive+' of '+flowMap.pages.length : 'Paginating…'}</strong><label>Jump to page<input type="number" min="1" max={flowMap.pages.length} value={flowActive} onchange={e=>flowPreview?.jumpTo(flowMap.pages[Number(e.currentTarget.value)-1]?.id)} style="width:80px"/></label><label>Edition<select aria-label="Booklet edition" bind:value={flowEdition} disabled={!!inlineSession||!!editSession}>{#each FLOW_EDITIONS as [value,title]}<option {value}>{title}</option>{/each}</select></label><label>Zoom<select aria-label="Booklet zoom" bind:value={zoom}><option value="width">Fit width</option><option value="1">100%</option><option value="0.75">75%</option><option value="0.5">50%</option></select></label></div>
    <div hidden={comparison}><FlowBookletPreview bind:this={flowPreview} {project} edition={flowEdition} options={exportSettings} {zoom} {selectedBlockId} editing={!!inlineSession||!!editSession} onmap={map=>flowMap=map} onpage={page=>{if(page){flowActive=page.pageNumber;selectedPageId=page.id;}}} onselect={flowSelected} onContentEdit={editContent} onSpaceResize={setAnswerSpace} onmove={(id,section,before)=>flowOutline?.drop(id,section,before)}/></div>
    {:else}
    <div class="canvas-heading"><div class="page-controls"><button aria-label="Previous page" onclick={()=>goPage(pageIndex-1)} disabled={pageIndex<=0}>←</button><strong>Page {previewPage?.pageNumber}</strong><button aria-label="Next page" onclick={()=>goPage(pageIndex+1)} disabled={pageIndex>=projectPages.length-1}>→</button></div><div class="answer-views" role="group" aria-label="Canvas answer view">{#each [['student','Questions'],['short','Short answers'],['worked','Worked solutions']] as mode}<button aria-pressed={answerView===mode[0]} disabled={!!inlineSession} onclick={()=>answerView=mode[0]}>{mode[1]}</button>{/each}</div><div class="zoom-controls" hidden={comparison}><label><span class="sr-only">Booklet zoom</span><select aria-label="Booklet zoom" bind:value={zoom}><option value="width">Fit width</option><option value="page">Fit page</option><option value="1">100%</option>{#if !['width','page','1'].includes(zoom)}<option value={zoom}>{Math.round(Number(zoom)*100)}%</option>{/if}</select></label><button aria-label="Zoom out" onclick={()=>zoomBy(-.1)}>−</button><button aria-label="Zoom in" onclick={()=>zoomBy(.1)}>+</button></div></div>
    {/if}
    <div class="source-reconstruction" hidden={flexible&&!comparison} class:paired={comparison} style:--source-min-width={Number(sourceZoom)>0?210*Number(sourceZoom)+'mm':'0px'} style:--transcribed-min-width={Number(zoom)>0?210*Number(zoom)+'mm':'0px'}>
     {#if sourceUrl}<section class="source-evidence comparison-pane" hidden={!comparison}><header><strong>Original source</strong><select aria-label="Source zoom" bind:value={sourceZoom}><option value="width">Fit width</option><option value="page">Fit page</option><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option></select></header><div class="source-scroll"><img src={sourceUrl} alt={'Original source page '+previewPage?.pageNumber} style:width={sourceZoom==='width'?'100%':sourceZoom==='page'?'auto':210*Number(sourceZoom)+'mm'} style:max-height={sourceZoom==='page'?'max(240px, calc(100dvh - 320px))':'none'} style:max-width={sourceZoom==='page'?'100%':'none'}/></div></section>{/if}

     <section class="transcribed-evidence comparison-pane">{#if comparison}<header><strong>Transcribed page</strong><select aria-label="Transcribed zoom" bind:value={zoom}><option value="width">Fit width</option><option value="page">Fit page</option><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option>{#if !['width','page','1','1.5','2'].includes(zoom)}<option value={zoom}>{Math.round(Number(zoom)*100)}%</option>{/if}</select></header>{/if}<div class="paper-scroll">{#if previewPage&&(!flexible||comparison)}{#if previewPage.compactAnswers}<FlowBookletPage {project} page={previewPage} pages={flowMap.pages} editMode={true} onContentEdit={editContent}/>{:else}<TranscribedBookletPage houseStyleVersion={project.settings.houseStyleVersion} blockLayouts={project.settings.layoutOverrides.blockLayouts} flow={!project.settings.preserveSourcePages} {zoom} page={previewPage} {bookletPages} runId={project.source?.runId??project.id} showKeyIdeasAnswers={exportSettings.showKeyIdeasAnswers} showTheorySolutions={exportSettings.showTheorySolutions} showReviewAnswers={exportSettings.showReviewAnswers} showIdentifyAnswers={exportSettings.showIdentifyAnswers} showGuidedPracticeAnswers={exportSettings.showGuidedPracticeAnswers} solutionMode={answerView} answerSpaceOverrides={effectiveSpaces} diagramColourModes={project.settings.layoutOverrides.diagramColourModes} onSpaceResize={setAnswerSpace} editMode={true} onContentEdit={editContent} isEdited={()=>false}/>{/if}{/if}</div></section>
    </div>
   </main>
   <aside class="workspace-panel project-inspector" class:docked={dockReview&&!comparison} hidden={!panel||!!tool} aria-label={panel==='review'?'Review':panel==='pdf'?'PDF configuration':panel==='metadata'?'Project details':'Block properties'}>
    <header><h2>{panel==='review'?'Review':panel==='pdf'?'PDF':panel==='metadata'?'Project details':'Block properties'}</h2><button aria-label="Close panel" onclick={()=>panel=''}>×</button></header>
    <div hidden={panel!=='review'}><BookletReviewInspector {project} blockId={selectedBlockId} {selectedTargetId} onchange={change} tabbed onDiagramEdit={requestDiagram}/></div>
    <div hidden={panel!=='pdf'}>        <div class="export-settings">
          <strong>PDF configuration</strong>
          <label><input type="checkbox" checked={exportSettings.showKeyIdeasAnswers} onchange={event=>setExportSetting({showKeyIdeasAnswers:event.currentTarget.checked})} /> Show Key Ideas answers</label>
          <label><input type="checkbox" checked={exportSettings.showTheorySolutions} onchange={(event) => setExportSetting({ showTheorySolutions: event.currentTarget.checked })} /> Show theory solutions</label>
          <label><input type="checkbox" checked={exportSettings.showReviewAnswers} onchange={event => setExportSetting({ showReviewAnswers: event.currentTarget.checked })} /> Show review answers</label>
          <label><input type="checkbox" checked={exportSettings.showIdentifyAnswers} onchange={event => setExportSetting({ showIdentifyAnswers: event.currentTarget.checked })} /> Show identify answers</label>
          <label><input type="checkbox" checked={exportSettings.showGuidedPracticeAnswers} onchange={event => setExportSetting({ showGuidedPracticeAnswers: event.currentTarget.checked })} /> Show guided practice answers</label>
          <p class="export-help">Identify answers includes proof, verification and investigation activities. Teaching answer switches are independent of practice answers.</p>
          <label><input type="checkbox" checked={exportSettings.showResponseSpaces} onchange={(event) => setExportSetting({ showResponseSpaces: event.currentTarget.checked })} /> Student response spaces</label>
          <button onclick={()=>setExportSetting({practiceAnswers:answerView==='student'?'none':answerView})}>Use current view</button><label>Practice answers<select aria-label="Practice answers" value={exportSettings.practiceAnswers} onchange={(event) => setExportSetting({ practiceAnswers: event.currentTarget.value })}><option value="none">Questions only</option><option value="short">Short answers only (back of book)</option><option value="worked">{project.settings.preserveSourcePages ? 'Worked solutions' : 'Worked solutions at back'}</option></select></label>
          <div class="row-actions"><button onclick={saveExportDefaults}>Save as defaults</button><button onclick={resetExportDefaults}>Reset</button></div>
        </div>
<button class="primary" onclick={printProject} disabled={printing}>{printing?'Preparing PDF…':'Print / save PDF'}</button>
{#if printing}<p role="status" aria-live="polite">{printProgress}</p>{/if}
{#if error}<p role="alert">{error}</p>{/if}</div>
    <div hidden={panel!=='metadata'}><label>Title<input value={project.title} onchange={e=>change({...project,title:e.currentTarget.value})}/></label><label>Subtitle<input value={project.subtitle} onchange={e=>change({...project,subtitle:e.currentTarget.value})}/></label><p>House style: {project.settings.houseStyleVersion??'Original formatting'}</p><button onclick={()=>change(adoptHouseStyle(project))} disabled={project.settings.houseStyleVersion===BOOKLET_HOUSE_STYLE.version}>Apply house style {BOOKLET_HOUSE_STYLE.version}</button><p>Applies shared defaults in one undoable change. Custom layout overrides are retained.</p></div>
    <div hidden={panel!=='properties'}>        <h3>Selected block</h3>
        {#if selectedBlock}
          <p><code>{selectedBlock.id}</code></p>
          <div class="row-actions"><button onclick={duplicateActiveBlock}>Duplicate</button><button class="danger" onclick={removeBlock}>Delete</button></div>
          {#if typeof selectedBlock.content === 'string' && selectedBlock.content.includes('|')}
            <fieldset><legend>Table</legend><div class="row-actions"><button onclick={() => resizeTable(1, 0)}>+ Row</button><button onclick={() => resizeTable(-1, 0)}>− Row</button><button onclick={() => resizeTable(0, 1)}>+ Column</button><button onclick={() => resizeTable(0, -1)}>− Column</button></div></fieldset>
          {/if}
          {#if selectedBlock.type === 'image'}
            <label>Image URL<input value={selectedBlock.src} onchange={(event) => patchSelected('/src', event.currentTarget.value)} /></label>
            <label>Width (mm)<input type="number" min="10" max="190" value={selectedBlock.widthMm} onchange={(event) => patchSelected('/widthMm', Number(event.currentTarget.value))} /></label>
            <label>Caption<input value={selectedBlock.caption} onchange={(event) => patchSelected('/caption', event.currentTarget.value)} /></label>
          {/if}
          {#if selectedBlock.type === 'spacer'}
            <label>Space height (mm)<input type="number" min="0" max="80" value={selectedBlock.heightMm ?? 10} onchange={(event) => patchSelected('/heightMm', Math.max(0, Math.min(80, Number(event.currentTarget.value))))} /></label>
          {/if}
          {#if selectedBlock.sourceAtom}
            <label>Activity style<select value={selectedBlock.sourceAtom.kind} onchange={event => patchSelected('/sourceAtom/kind',event.currentTarget.value)}><option value="review">Review</option><option value="identify">Activity (identify / proof)</option><option value="investigation">Investigation / verification</option><option value="guided-practice">Guided practice</option><option value="definition">Theory / definition</option><option value="example">Worked example</option><option value="key-ideas">Key ideas</option></select></label>
          {/if}
          {#if selectedBlock.type === 'question'}
            <button onclick={event=>openArrangement({id:selectedBlock.content.id,block:selectedBlock},{origin:event.currentTarget})}>Edit question content</button>
            {#if selectedBlock.content?.representations}<label>Teaching arrangement<select value={selectedBlock.content.layoutPreset??''} onchange={event=>patchSelected('/content/layoutPreset',event.currentTarget.value)}><option value="">Pattern and table above equation and graph</option><option value="pattern-top">Pattern above table, equation and graph</option></select></label>{/if}
            <label>Question title<input value={selectedBlock.title ?? ''} onchange={(event) => patchSelected('/title', event.currentTarget.value)} /></label>
            <label>Primary skill<select value={selectedBlock.classification?.primarySkillId ?? ''} onchange={(event) => patchSelected('/classification/primarySkillId', event.currentTarget.value)}><option value="">Choose a skill</option>{#each skills as skill}<option value={skill.id}>{skill.code} - {skill.name}</option>{/each}</select></label>
            <label>Reasoning score<input type="number" min="0" max="100" value={selectedBlock.classification?.reasoningScore ?? 25} onchange={(event) => patchSelected('/classification/reasoningScore', Number(event.currentTarget.value))} /></label>
            <label>Part layout<select value={selectedBlock.content?.layout ?? 'list'} onchange={(event) => { patchSelected('/content/layout', event.currentTarget.value); if (event.currentTarget.value === 'list') patchSelected('/content/columns', null); }}><option value="list">List</option><option value="grid">Grid</option></select></label>
            {#if selectedBlock.content?.layout === 'grid'}<label>Columns<input type="number" min="2" max="4" value={selectedBlock.content?.columns ?? 2} onchange={(event) => patchSelected('/content/columns', Math.max(2, Math.min(4, Number(event.currentTarget.value))))} /></label>{/if}
            <fieldset><legend>Parts</legend><div class="row-actions"><button onclick={() => change(resizeQuestionParts(project, selectedBlock.id, 1))}>+ Part</button><button onclick={() => change(resizeQuestionParts(project, selectedBlock.id, -1))} disabled={!selectedBlock.content?.children?.length}>- Part</button></div></fieldset>
            <div class="bank-state"><strong>{selectedBlock.bankRef?.id ? `Bank snapshot: ${selectedBlock.bankRef.id}` : 'Booklet-local question'}</strong><button onclick={inspectPromotion} disabled={!!busy}>Check / promote</button>{#if selectedBlock.bankRef?.id}<button onclick={() => promote('update')}>Update bank question</button>{/if}</div>
            {#if promotion}<div class="promotion"><p>{promotion.candidates.length ? 'Possible bank matches:' : 'No duplicate candidates found.'}</p>{#each promotion.candidates as candidate}<article><span>{candidate.exact ? 'Exact' : `${Math.round(candidate.score * 100)}% similar`} · {candidate.title || candidate.id}</span><button onclick={() => promote('link-existing', candidate.id)}>Use existing</button></article>{/each}<button class="primary" onclick={() => promote('create')}>Create new bank question</button></div>{/if}
          {/if}
        {:else}<p>Select a block from the page outline.</p>{/if}
</div>
   </aside>
  </div>
  {#if editSession}<FocusedBookletEditor bind:this={focusedEditor} session={editSession} onclose={()=>editSession=null}/>{/if}
    <section class="project-print" data-pagination-state={flexible?(flowMap.error?'error':flowMap.ready&&flowMap.edition===flowEdition?'ready':'pending'):undefined} data-flow-edition={flexible?flowMap.edition:undefined} data-layout-issues={flexible?JSON.stringify(flowMap.issues):undefined} class:flexible-print={flexible} class:short-answers={!flexible&&exportSettings.practiceAnswers === 'short'} class:source-pages={project.settings.preserveSourcePages && exportSettings.practiceAnswers !== 'short'} aria-hidden="true">
      {#if printReady}
      {#if flexible}
        {#each flowMap.pages as page}<div class="print-page" data-flow-page={page.pageNumber} data-flow-blocks={page.blocks.map(b=>b.id).join(',')}><FlowBookletPage {project} {page} pages={flowMap.pages} options={exportSettings}/></div>{/each}
      {:else}
      {#if exportSettings.practiceAnswers === 'short'}
        <h1 class="answer-heading">Answers</h1>
        {#each answerPages as page}<div class="print-page"><TranscribedBookletPage houseStyleVersion={project.settings.houseStyleVersion} answerSheet={true} blockLayouts={project.settings.layoutOverrides.blockLayouts} flow={true} page={{...page,section:{...page.section,headingStyle:'normal',title:project.settings.preserveSourcePages?'Page '+(exportPages.findIndex(p=>p.id===page.id)+1):page.section.title,difficultyTitle:null}}} bookletPages={answerPages} runId={project.source?.runId ?? project.id} showTheorySolutions={false} solutionMode="short" /></div>{/each}
        {#if !answerPages.length}<p>No independent-practice questions in this booklet.</p>{/if}
      {:else}
      {#if !project.settings.preserveSourcePages}<article class="project-cover"><h1>{project.title}</h1>{#if project.subtitle}<p>{project.subtitle}</p>{/if}</article>{/if}
      {#each exportPages as page}<div class="print-page"><TranscribedBookletPage houseStyleVersion={project.settings.houseStyleVersion} blockLayouts={project.settings.layoutOverrides.blockLayouts} flow={!project.settings.preserveSourcePages} {page} {bookletPages} runId={project.source?.runId ?? project.id} showKeyIdeasAnswers={exportSettings.showKeyIdeasAnswers} showTheorySolutions={exportSettings.showTheorySolutions} showReviewAnswers={exportSettings.showReviewAnswers} showIdentifyAnswers={exportSettings.showIdentifyAnswers} showGuidedPracticeAnswers={exportSettings.showGuidedPracticeAnswers} solutionMode={project.settings.preserveSourcePages && exportSettings.practiceAnswers !== 'none' ? exportSettings.practiceAnswers : 'student'} answerSpaceOverrides={effectiveSpaces} diagramColourModes={project.settings.layoutOverrides.diagramColourModes} /></div>{/each}
      {#if exportSettings.practiceAnswers !== 'none' && !project.settings.preserveSourcePages}
        <article class="answers-divider"><h1>{exportSettings.practiceAnswers === 'short' ? 'Answers' : 'Worked solutions'}</h1></article>
        {#each answerPages as page}<div class="print-page"><TranscribedBookletPage houseStyleVersion={project.settings.houseStyleVersion} blockLayouts={project.settings.layoutOverrides.blockLayouts} flow={!project.settings.preserveSourcePages} {page} bookletPages={[{ id: 'answer-anchor', pageNumber: 0, section: {}, blocks: [] }, ...answerPages]} runId={project.source?.runId ?? project.id} showTheorySolutions={false} solutionMode={exportSettings.practiceAnswers} answerSpaceOverrides={effectiveSpaces} diagramColourModes={project.settings.layoutOverrides.diagramColourModes} /></div>{/each}
      {/if}
      {/if}
      {/if}
      {/if}
    </section>
  {:else}
    <section class="empty-project project-screen"><h3>{projects.length?'Open a booklet':'No editable booklets yet'}</h3><p>{projects.length?'Choose a saved booklet from the Open booklet menu above.':'Materialise an accepted full import or create a blank booklet.'}</p><button class="primary" onclick={createNew}>Create booklet</button></section>
  {/if}
</section>

<style>
@media print{.project-print.flexible-print{page:booklet-source;}}
@media print{.flexible-print .print-page{width:210mm;height:297mm;min-height:297mm;break-after:page;break-inside:avoid}.flexible-print .print-page:last-child{break-after:auto}.flexible-print :global(.preview-frame){height:297mm!important;width:210mm!important}.flexible-print :global(.preview-page){transform:none!important;position:static!important}.flexible-print :global(.booklet-page){height:297mm!important;overflow:visible!important}}
  .bank-sync-panel{padding:1rem;max-height:65vh;overflow:auto;border-bottom:1px solid #94a3b8;background:var(--panel,#fff);color:var(--text,#24324a)}
  .bank-sync-panel h2{font-size:1rem;margin:0}.bank-sync-item{padding:.8rem 0;border-top:1px solid #94a3b8;margin-top:.75rem}.bank-sync-item h3{font-size:.95rem}.sync-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem}.sync-comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.sync-comparison>section{background:white;color:#24324a;padding:1rem;overflow:auto}.bank-sync-panel summary{cursor:pointer;padding:.5rem 0}
  @media(max-width:700px){.sync-comparison{grid-template-columns:1fr}}


.answer-views{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.answer-views button[aria-pressed=true]{background:#245f93;color:white;border-color:#245f93}

 .project-shell{--ink:var(--text-strong,#23395d);--muted:var(--text-muted,#66758d);--border:var(--line,#d5dde7);--surface:var(--panel,#fff);color:var(--text,#243348);font-size:16px;min-width:0;width:100%;box-sizing:border-box}.project-toolbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface);flex-wrap:wrap}.project-picker{flex:1;min-width:180px;max-width:420px}.project-picker select{width:100%}.toolbar-actions,.canvas-heading,.page-controls,.zoom-controls,.outline-heading,.row-actions{display:flex;align-items:center;gap:8px}.toolbar-actions{margin-left:auto;flex-wrap:wrap}.save-state{font-size:14px;color:var(--muted)}button,select,input,summary{box-sizing:border-box;font:inherit;min-height:36px}button,select,input{border:1px solid var(--border);border-radius:6px;background:var(--surface);color:inherit;padding:6px 10px;max-width:100%}button,summary{cursor:pointer}button:disabled{opacity:.45;cursor:default}button.primary{background:#286647;color:#fff}button.danger{color:#bc5149}button:focus-visible,summary:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #438ccc;outline-offset:2px}summary{display:flex;align-items:center;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:14px}details[open]>summary{font-weight:700}.menu{position:relative}.menu>div{position:absolute;right:0;top:100%;z-index:25;width:230px;display:grid;gap:8px;padding:12px;background:var(--surface);box-shadow:0 6px 24px #0003;border:1px solid var(--border);border-radius:8px}.project-editor{position:relative;display:grid;grid-template-columns:minmax(0,1fr);height:calc(100dvh - 190px);min-height:420px;overflow:hidden}.project-editor.with-navigation{grid-template-columns:240px minmax(0,1fr)}.project-editor.with-review{grid-template-columns:minmax(0,1fr) 360px}.project-editor.with-navigation.with-review{grid-template-columns:240px minmax(0,1fr) 360px}.project-outline{min-width:0;overflow:auto;padding:12px;background:var(--surface);border-right:1px solid var(--border)}[hidden]{display:none!important}.outline-heading{justify-content:space-between;margin-bottom:12px}.section-list article{margin:4px 0 12px;border:1px solid var(--border);border-radius:8px}.section-list article.active{border-color:#438ccc}.section-select{display:flex;gap:10px;text-align:left;width:100%;border:0;background:transparent;align-items:start;padding:10px}.section-select span{overflow-wrap:anywhere}.section-select b{color:#438ccc}.block-list{list-style:none;padding:0 6px;margin:8px 0}.block-list li{display:grid;grid-template-columns:minmax(0,1fr) 36px;margin:6px 0;align-items:start}.block-list li.active{box-shadow:inset 3px 0 #438ccc}.block-list li>button{border:0;text-align:left;font-size:14px;background:transparent;overflow-wrap:anywhere}.block-list details[open]{grid-column:1/-1}.block-list details>div{display:grid;padding:6px;gap:4px}.page-menu{margin:6px}.page-menu button{width:100%;margin-top:6px}.page-menu label{display:grid;font-size:14px;margin-top:8px}.page-menu input,.page-menu select{width:100%;min-width:0}.add-page{width:100%;margin-top:8px}.project-canvas{min-width:0;overflow:auto;background:var(--app-canvas,#e9eef4);padding:16px}.canvas-heading{justify-content:space-between;position:sticky;top:-16px;z-index:8;background:var(--app-canvas,#e9eef4);padding:0 0 16px;flex-wrap:wrap}.source-reconstruction{min-width:0}.source-reconstruction.paired{display:grid;grid-template-columns:minmax(var(--source-min-width,0px),1fr) minmax(var(--transcribed-min-width,0px),1fr);gap:24px;align-items:start}.source-evidence,.paper-scroll{min-width:0;overflow:auto}.comparison-pane{min-width:0}.comparison-pane header{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:36px;margin-bottom:12px}.paired .source-evidence,.paired .source-scroll,.paired .paper-scroll{height:auto;overflow:visible}.paired .paper-scroll :global(.preview-frame){margin-inline:auto}.source-scroll{overflow:auto}.source-scroll img{display:block;margin:auto;background:white}.paper-scroll{background:transparent}.workspace-panel{box-sizing:border-box;position:absolute;right:0;top:0;bottom:0;width:min(420px,100%);z-index:15;padding:16px;background:var(--surface);border-left:1px solid var(--border);box-shadow:-8px 0 32px #0002;overflow:auto}.workspace-panel.docked{position:relative;width:360px;box-shadow:none}.workspace-panel>header,.tool-view>header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}.workspace-panel h2,.tool-view h2{font-size:20px;margin:0}.workspace-panel label{display:grid;gap:6px;margin:12px 0;font-size:14px}.workspace-panel input,.workspace-panel select{width:100%}.workspace-panel input[type=checkbox]{width:auto}.export-settings label:has(input[type=checkbox]){display:flex;align-items:center}.export-settings{margin-bottom:20px}.project-notice{padding:16px;background:var(--surface);border:1px solid #b98539;overflow-wrap:anywhere}.project-notice pre{white-space:pre-wrap;font-size:14px}.tool-view{grid-column:1/-1;overflow:auto;padding:24px}.sr-only{position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden}.project-print{display:none}.project-cover,.answers-divider{box-sizing:border-box;width:210mm;height:297mm;padding:45mm 24mm;background:#fff;color:var(--ink);break-after:page}.project-cover h1,.answers-divider h1{font-size:30pt}.project-cover p{font-size:16pt}.print-page{break-after:page}
 @media(max-width:1099px){.project-editor.with-navigation{grid-template-columns:minmax(0,1fr)}.project-outline.drawer{position:absolute;inset:0 auto 0 0;width:240px;box-sizing:border-box;z-index:16;box-shadow:8px 0 32px #0003}.project-editor{height:calc(100dvh - 230px)}}
 @media(max-width:600px){.project-toolbar{padding:8px;gap:8px}.project-picker{min-width:150px;max-width:none}.save-state{font-size:14px}.toolbar-actions{margin:0;gap:6px}button,summary,select,input{min-height:44px}.toolbar-actions button,.toolbar-actions summary{font-size:14px;padding:6px 8px}.project-canvas{padding:8px}.canvas-heading{top:-8px;gap:8px}.source-reconstruction.paired{grid-template-columns:1fr}.project-editor{height:calc(100dvh - 280px)}.zoom-controls{gap:4px}.block-list li{grid-template-columns:minmax(0,1fr) 44px}.menu>div{position:fixed;left:8px;right:8px;top:auto;width:auto}}
  @media(pointer:coarse){button,select,input,summary{min-height:44px}}
  .tool-view :global(.assembly-panel){background:var(--surface);color:inherit}.tool-view :global(label),.tool-view :global(table),.tool-view :global(pre),.tool-view :global(.hint){font-size:14px}.tool-view :global(button),.tool-view :global(input),.tool-view :global(select){min-height:36px;font:inherit;background:var(--surface);color:inherit}.tool-view :global(table){display:block;overflow:auto;max-width:100%}@media(pointer:coarse){.tool-view :global(button),.tool-view :global(input),.tool-view :global(select){min-height:44px}}
  .project-print:global(.qa-print){display:block;position:absolute;left:-100000px;top:0;width:210mm}.project-print:global(.qa-print) :global(.preview-page){position:static;transform:none}.project-print:global(.qa-print) :global(.preview-frame){width:210mm;height:297mm;overflow:visible}.project-print:global(.qa-print) :global(.flow.preview-frame),.project-print:global(.qa-print) :global(.flow .preview-page),.project-print:global(.qa-print) :global(.flow .booklet-page){width:180mm;height:auto;min-height:0;overflow:visible}.project-print:global(.qa-print) :global(.flow .booklet-page){display:block;padding:0}.project-print:global(.qa-print) :global(.flow .booklet-page main){padding:0}.project-print:global(.qa-print) :global(.flow .booklet-footer){display:none}
 .short-answers .print-page{break-after:auto;margin-bottom:5mm}.answer-heading{font-size:20pt;color:#24282d;margin:0 0 6mm}.export-help{font-size:14px;line-height:1.4}
  @page studio-flow{background:white;size:A4;margin:10mm 15mm 15mm;@bottom-right{vertical-align:bottom;padding-bottom:3mm;content:counter(page) " / " counter(pages);font-size:8pt;color:#66758d}}
  @page booklet-source { size:A4; margin:0; }
  @media print { :global(.site-content:has(.project-shell)) { background:white; min-height:0; } }
  @media print{.project-print.source-pages{page:booklet-source}.source-pages .print-page{width:210mm;min-height:297mm}.source-pages .print-page:last-child{break-after:auto}:global(html),:global(body){color-scheme:light!important;background:white!important;color:#24282d!important}.project-shell :global(.project-screen){display:none!important}.project-screen{display:none!important}.project-shell{--ink:#23395d;max-width:none;margin:0;padding:0}.project-print{display:block;page:studio-flow;background:white}.project-cover,.answers-divider{display:block;width:180mm;height:270mm;padding:35mm 10mm}.print-page{display:block;width:180mm;min-height:0}.print-page:last-child{break-after:auto}}
</style>
