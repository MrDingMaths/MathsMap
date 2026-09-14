<script>
  import BookletInspectorTabs from './BookletInspectorTabs.svelte';
  import {createBookletPersistence} from '../lib/booklet-persistence.js';
  import {createBookletDocumentSession} from '../lib/booklet-document-session.js';
  import BookletPageControls from './BookletPageControls.svelte';
  import BookletBankPicker from './BookletBankPicker.svelte';
  import {contentExcerpt,setPageBoundary} from '../lib/booklet-workspace.js';
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';
  import {updateBookletCover} from '../lib/booklet-cover.js';
  import {applyBankRatings,questionDifficulty} from '../lib/booklet-bank-ratings.js';
  import FlowBookletPreview from './FlowBookletPreview.svelte';
  import BookletPageGuide from './BookletPageGuide.svelte';
  import FlowBookletOutline from './FlowBookletOutline.svelte';
  import FlowBookletPage from './FlowBookletPage.svelte';
  import {isFlexible,FLOW_EDITIONS,flowCommand,flowNumbers,selectedFlowIds,logicalUnits,captureFlowClipboard} from '../lib/booklet-flow.js';
  import {createDocumentHistory,contentTarget,fieldValue,createTeachingGroup,createDocumentQuestion,TEACHING_TEMPLATES,replaceDocumentFragment} from '../lib/booklet-document-controller.js';
  import {captureEditorSelection,restoreEditorSelection,placeEditorAtPoint,runEditorCommand,prosePoint} from '../lib/booklet-editor-dom.js';
  import {bookletComments,createFeedback,reconcileFeedback,feedbackPrompt} from '../lib/booklet-feedback.js';
  import BookletComments from './BookletComments.svelte';
  import BookletRangeSpacing from './BookletRangeSpacing.svelte';
  import BookletSelectionSpacing from './BookletSelectionSpacing.svelte';
  import MathsEditor from './MathsEditor.svelte';
  import {moveConnected} from '../../public/libs/maths-editor/document-dom.mjs';
  import {documentSearchIndex} from '../lib/booklet-document-search.js';
  import {theme} from '../lib/theme.svelte.js';
  import BookletQuestionSpacing from './BookletQuestionSpacing.svelte';
  import {bookletColours,DOCUMENT_INSERT_TOOLS,applyQuestionSpacing,syncDiagramPresentation} from '../lib/booklet-document-tools.js';
  import {captureBookletTextRange,applyBookletTextRange,copyBookletTextRange,replaceBookletTextRange,documentTextLength,joinDocumentParagraph,selectedBookletParagraphs,setBookletParagraphSpacing} from '../lib/booklet-text-selection.js';
  import {readClipboard,plainTextDocument} from '../../public/libs/maths-editor/document-clipboard.mjs';
  import {locateDocumentNode} from '../../public/libs/maths-editor/document-operations.mjs';
  import {replaceParagraphSlice} from '../lib/booklet-document-fragments.js';
  import {canKeepPageEditor} from '../lib/booklet-pagination-work.js';
  import {reconcileSyncLayout} from '../lib/question-sync-layout.js';
  import { adoptHouseStyle, BOOKLET_HOUSE_STYLE, houseStyleVariables } from '../lib/booklet-house-style.js';
  import {teachingLabels} from '../lib/booklet-labels.js';
  import { independentAnswerPages } from '../lib/booklet-answer-options.js';
  import { resolvePreviewAssets } from '../lib/booklet-preview.js';
  import { fromSource, isDocument, normalizeDocument, toSource } from '../lib/document-content.js';
  import { mergeProjectChanges } from '../lib/booklet-save-merge.js';
  import { onMount, tick, setContext, untrack } from 'svelte';
  import BookletDirectLayout from './BookletDirectLayout.svelte';
  import {bookletLayoutSelection,applyBookletLayout} from '../lib/booklet-direct-layout.js';
  import FocusedBookletEditor from './FocusedBookletEditor.svelte';
  import TranscribedBookletPage from './TranscribedBookletPage.svelte';
  import BookletReviewInspector from './BookletReviewInspector.svelte';
  import BookletCoverage from './BookletCoverage.svelte';
  import {sourceReferences} from '../lib/booklet-source-content.js';
  import {contentNodes} from '../lib/booklet-content-verification.js';
  import {shareUnchanged} from '../lib/booklet-arrangement.js';
  import {reconcileSaveAcknowledgement} from '../lib/booklet-save-patch.js';
  import {resolveArrangement,findContent} from '../lib/booklet-arrangement.js';
  import BookletAssemblyPanel from './BookletAssemblyPanel.svelte';
  import { reviewTargets, findEditableDiagram } from '../lib/booklet-review-model.js';
  import { skills } from '../lib/data.js';
  import {
    addProjectBlock, addProjectSection, createProjectBlock, deleteProjectBlock,
    deleteProjectSection, duplicateProjectBlock, duplicateProjectSection, moveProjectBlock,
    moveProjectSection, resizeFirstProjectTable, resizeQuestionParts, snapshotBankQuestion,
    updateProjectContent, updateProjectSettings,
  } from '../lib/editable-booklet-model.js';
  import {
    createBookletProject, deleteBookletProject, duplicateBookletProject,
    listBookletProjects, loadBookletProject, openBookletProject, promoteProjectModule,
    promoteProjectQuestion, saveBookletProject, getProjectBankSync, resolveProjectBankSync,
  } from '../lib/booklet-project-storage.js';

  let { initialProjectId = null, bank = [], onrequestbank = null, onprojectchange = null } = $props();
  let projects = $state([]);
  let projectsReady = $state(false);
  let opening=$state.raw({id:null,title:'',stage:'Loading booklets'}),loadGeneration=0,previewAttempt=$state(0);
  function previewProgress(info,attempt){
    if(attempt!==loadGeneration||!opening?.preview||opening.id!==info.projectId)return;
    if(info.error){opening={...opening,stage:info.stage,error:info.error};busy='';}
    else if(info.ready){opening=null;busy='';}
    else opening={...opening,stage:info.stage,complete:info.complete,total:info.total};
  }
  function returnToCurrent(){loadGeneration++;opening=null;busy='';onprojectchange?.(project.id);}
  async function initialiseProjects(){
    const token=++loadGeneration;opening={id:null,title:'',stage:'Loading booklets'};
    try{
      const requested=initialProjectId;lastRequestedProjectId=requested;
      const listing=refreshProjects().then(()=>{projectsReady=true;});
      if(requested){const opened=openProject(requested);await listing.catch(e=>{error='Could not refresh booklet list. '+e.message;});await opened;}
      else {await listing;if(token===loadGeneration)opening=null;}
    }catch(e){if(token===loadGeneration)opening={...opening,error:e.message};}
  }
  let lastRequestedProjectId;
  let project = $state.raw(null);
  const flexible=$derived(isFlexible(project));
  let flowPreview=$state(),flowOutline=$state(),flowMap=$state.raw({pages:[],issues:[],ready:false}),flowEdition=$state('student'),flowActive=$state(1);
  function selectFlow(id,sectionId){finishInline();if(!groupSelection.includes(id))groupSelection=selectedFlowIds(project,[id]);selectedBlockId=id;selectedSectionId=sectionId;selectedTargetId='';const block=project.sections.flatMap(s=>s.blocks).find(b=>b.id===id);if(block){const tree=resolveArrangement(block,project.settings.layoutOverrides.blockLayouts?.[id]?.arrangement,project.settings.layoutOverrides).tree;layoutSelection={blockId:id,id:tree.root.id,ids:[tree.root.id]};}documentSelection={rootId:id,edition:flexible?flowEdition:answerView};flowPreview?.jumpTo(id);}
  function flowSelected(page){selectedSectionId=page.section.sourceSectionId;}
  async function createFlexibleCopy(){
    finishInline();if(editSession)return;
    busy='Creating flexible copy';error='';
    try{if(saveState!=='Saved')await persist();if(saveState!=='Saved')throw Error('Resolve the current save before creating a copy.');
      const created=await duplicateBookletProject(project.id,{title:project.title+' — Flexible',flexible:true});await refreshProjects();await openProject(created.id);
    }catch(e){error=e.message;}finally{busy='';}
  }
  let bankSync = $state.raw({items:[]});
  let showBankSync = $state(false), bankSyncError=$state(''), syncBusy=$state(false);
  const bankUpdates=$derived(bankSync.items.filter(i=>['update','conflict','pending','missing'].includes(i.state)));
  async function refreshBankSync(){
    if(!project||opening)return;const id=project.id,token=loadGeneration;
    try{const result=await getProjectBankSync(id);if(project?.id===id&&token===loadGeneration&&!opening){bankSync=result;project=applyBankRatings(project,result.items);bankSyncError='';}}
    catch(e){if(project?.id===id&&token===loadGeneration&&!opening)bankSyncError='Could not check bank updates. '+e.message;}
  }
  async function applyBankSync(item,action){
    finishInline();
    if(editSession||saveState!=='Saved'||saveInFlight){status='Save or cancel the current edit before resolving a bank update.';return;}
    syncBusy=true;error='';
    try{
      const saved=await resolveProjectBankSync(project.id,{blockId:item.blockId,action,bankRevision:item.bankRevision,localHash:item.localHash,expectedRevision:project.revision});
      documentSession.dispatch(saved,{remember:false});savedBase=clone(saved);history.reset();undoStack=[];redoStack=[];
      status=action==='use-bank'?'Bank version applied; local page layout retained.':action==='keep-local'?'Local version kept as a separate question.':'Booklet version saved to the bank.';
      await refreshBankSync();await refreshProjects();
    }catch(e){error=e.message;await refreshBankSync();}finally{syncBusy=false;}
  }
  const questionNumbers=$derived(project?flowNumbers(project):{});
  const labels=$derived(teachingLabels(project?.sections.flatMap(s=>s.blocks)??[]));
  setContext('booklet-labels',()=>labels);
  setContext('booklet-presentation',()=>project?.settings);
  setContext('booklet-cover-edit', {
    start: () => finishInline(),
    commit: (field, value) => change(updateBookletCover(project, field, value)),
  });
  let printReady = $state(false);
  let printing = $state(false), printProgress = $state('');
  let inlineSession = $state.raw(null);
  let editorParking,editorPortal,paginationSelection=null,selectionBeforeEdit=null;
  const editorSlots=new Map();
  function attachEditor(){const slot=editorSlots.get(inlineSession?.hostId);if(slot&&editorPortal)moveConnected(slot,editorPortal);}
  let activeEditor=$state.raw(null),composing=$state(false),selecting=$state(false),pasteFallback=$state.raw(null),documentSelection=$state.raw(null),groupSelection=$state([]),groupClipboard=$state.raw(null),textSelection=$state.raw(null),nativeTable=$state(false);
  let documentGeneration=$state(0);
  const documentSession=createBookletDocumentSession({read:()=>project,publish:next=>project=next,ontransaction:t=>documentGeneration=t.generation});
  const history=documentSession.history;
  const persistence=createBookletPersistence();
  onMount(()=>()=>persistence.dispose());
  const rangeParagraphs=$derived(textSelection?.crossSurface?selectedBookletParagraphs(project,textSelection):[]);
  function spaceSelectedParagraphs(targets,key,value){const next=setBookletParagraphSpacing(project,targets,key,value);finishInline();history.boundary();change(next);history.boundary();}
  const documentColours=$derived(bookletColours(project));
  let inspectorTab=$state('layout'), spacingScope=$state('selection'), bankPicker=$state(false);
  const spacingTarget=$derived([selectedBlockId,layoutSelection?.id,inlineSession?.key].join('|'));
  $effect(()=>{spacingTarget;spacingScope='selection';});
  let workspaceTop=$state(120),layoutStatus=$state.raw({pending:true}),finder=$state(''),findQuery=$state(''),findEntries=$state.raw([]),finderInput=$state(),finderDialog=$state(),goPageValue=$state('1');
  const wordWorkspace=typeof window==='undefined'||localStorage.getItem('booklet-word-workspace')!=='off';
  const commands=[
    ['Equation spacing','layout'],['Paragraph spacing','layout'],['Cell padding','layout'],['Image spacing and size','layout'],
    ['Page break behaviour','page'],['Detailed arrangement','arrange'],['Find in document','find'],['Go to page','goto'],
    ['Outline','outline'],['Add comment','comment'],['Comments','comments'],['Review','review'],['Export PDF','pdf'],
    ['Compare source','compare'],['Bank sync','bank'],['Project details','metadata'],['Specialist block properties','properties'],
    ['Assembly','assembly'],['Toggle theme','theme']
  ];
  const commandMatches=$derived(commands.filter(([name])=>name.toLowerCase().includes(findQuery.toLowerCase())));
  const findMatches=$derived(findQuery.trim()?findEntries.filter(e=>e.text.toLowerCase().includes(findQuery.toLowerCase())).slice(0,100):[]);
  async function openFinder(mode){documentSelection=currentAnchor();finder=mode;findQuery='';goPageValue=String(flowActive);if(mode==='find')findEntries=documentSearchIndex(project);await tick();if(!finderDialog?.open)finderDialog?.showModal();finderInput?.focus();finderInput?.select();}
  function closeFinder(){finderDialog?.close();finder='';if(activeEditor&&inlineSession?.bookmark)restoreEditorSelection(activeEditor,inlineSession.bookmark);}
  function command(action){closeFinder();if(action==='find'||action==='goto')openFinder(action);else if(action==='outline')navigation=!navigation;else if(action==='comment')addComment();else if(action==='compare')toggleComparison();else if(action==='bank'){showBankSync=!showBankSync;refreshBankSync();}else if(action==='theme')theme.toggle();else if(action==='assembly')tool='assembly';else if(action==='arrange')arrangeSelectedQuestion();else{panel=action==='page'?'layout':action;inspectorTab=action==='page'?'page':'layout';}}
  async function locateMatch(match){
    const start=match.text.toLowerCase().indexOf(findQuery.toLowerCase()),length=findQuery.length;closeFinder();finishInline();
    const pages=flowMap.pages.flatMap((p,i)=>p.blocks.some(b=>b.id===match.blockId)?[i]:[]);for(const index of pages)await flowPreview?.revealPage(index);await tick();
    const fields=[...canvas.querySelectorAll('[data-edit-root="'+CSS.escape(match.rootId)+'"][data-edit-path="'+CSS.escape(match.pointer)+'"]')];
    const field=fields.find(el=>(!match.nodeId||el.querySelector('[data-id="'+CSS.escape(match.nodeId)+'"]'))&&(!el.hasAttribute('data-fragment-start')||start>=Number(el.dataset.fragmentStart)&&start<Number(el.dataset.fragmentEnd)))??fields[0];
    if(!field){status='This result is in another edition. Choose the edition containing this answer.';return;}
    field.scrollIntoView({block:'center'});field.querySelector('.clickable')?.click();await tick();
    const surface=activeEditor?.documentController.surface,target=match.nodeId?surface?.querySelector('[data-id="'+CSS.escape(match.nodeId)+'"]'):surface;
    if(target){const offset=start-Number(field.dataset.fragmentStart??0),selection=getSelection();selection.setBaseAndExtent(...prosePoint(target,Math.max(0,offset)),...prosePoint(target,Math.max(0,offset)+length));activeEditor.documentController.saveRange();}
  }
  function layoutChanged(info){layoutStatus=info;if(!info.pending&&!info.error)documentSession.acceptLayout({generation:info.generation,edition:info.edition,ready:true});}
  async function closeProject(){try{await flushDocument();finishInline();project=null;flowMap={pages:[],issues:[],ready:false};onprojectchange?.(null);window.history.replaceState(null,'','#/booklet?stage=projects');window.dispatchEvent(new HashChangeEvent('hashchange'));}catch(e){error=e.message;}}
  $effect(()=>{if(!status)return;const timer=setTimeout(()=>status='',5000);return()=>clearTimeout(timer);});
  const selectionLabel=$derived(activeEditor?.documentController?.selected?.type??directLayout?.entry?.title??(selectedBlock?selectedBlock.sourceAtom?.label||selectedBlock.title||contentExcerpt(selectedBlock.content)||directLayout?.node.title||'Selected block':'Nothing selected'));
  const bankDestination=$derived(selectedBlock?'After '+(contentExcerpt(selectedBlock.content,60)||selectedBlock.title||'selected block'):'End of '+(selectedSection?.title??'section'));
  function pageBoundary(action,id=selectedBlockId){if(!id)return;finishInline();change(setPageBoundary(project,id,action));}
  function pageLayout(patch){if(!selectedBlockId)return;finishInline();change(flowCommand(project,{type:'layout',ids:[selectedBlockId],patch}));}
  async function insertBank(question){
    finishInline();const unit=logicalUnits(project).find(u=>u.blocks.some(b=>b.id===selectedBlockId));
    const last=unit?.blocks.at(-1),section=project.sections.find(s=>s.blocks.some(b=>b.id===last?.id))??selectedSection;
    if(!section)throw Error('Add a section first.');
    const block=snapshotBankQuestion(question),at=last?section.blocks.findIndex(b=>b.id===last.id):section.blocks.length-1;
    change(addProjectBlock(project,section.id,block,{afterIndex:at}));selectedBlockId=block.id;selectedSectionId=section.id;groupSelection=[];
    await tick();await flowPreview?.waitUntilReady();flowPreview?.jumpTo(block.id);
  }
  onMount(()=>{const closeMenus=event=>{const button=event.target.closest?.('.document-insert button');if(button)for(const menu of button.closest('.project-toolbar,.document-toolbar')?.querySelectorAll('details[open]')??[])menu.open=false;};document.addEventListener('click',closeMenus);return()=>document.removeEventListener('click',closeMenus);});
  onMount(()=>{const measure=()=>workspaceTop=workspace.getBoundingClientRect().top+window.scrollY;const observer=new ResizeObserver(measure);observer.observe(workspace.parentElement);window.addEventListener('resize',measure);measure();return()=>{observer.disconnect();window.removeEventListener('resize',measure);};});
  let copiedDocumentTabs=null;
  let layoutSelection=$state.raw(null),layoutPanelButton=$state();
  function closeLayoutPanel(){panel='';layoutPanelButton?.focus({preventScroll:true});}
  const directLayout=$derived(bookletLayoutSelection(project,layoutSelection));
  function selectLayout(blockId,id,event){finishInline();groupSelection=[];diagramSelection=null;selectedBlockId=blockId;layoutSelection={blockId,id,ids:event?.ctrlKey&&layoutSelection?.blockId===blockId?[...new Set([...(layoutSelection.ids??[]),id])]:[id]};}
  function layoutCommand(command,options={}){try{finishInline();history.boundary();const previous=bookletLayoutSelection(project,layoutSelection),next=applyBookletLayout(project,layoutSelection,command,options);change(next);const current=bookletLayoutSelection(next,layoutSelection),id=command==='group'?current?.parent?.id:command==='ungroup'?previous?.node.children?.[0]?.id:current?.node.id??previous?.parent?.id;if(id)layoutSelection={blockId:layoutSelection.blockId,id,ids:[id]};history.boundary();}catch(e){error=e.message;}}
  function nativeLayoutPanel(node,config){return config.editor?.documentController.mountLayoutPanel(node,{category:config.category});}
  function deleteSelectedParagraph(){const c=activeEditor?.documentController;if(c?.selected?.type==='paragraph'){history.boundary();c.deleteNode(c.selectedId);history.boundary();}}
  function paragraphProperty(key,value){if(!activeEditor)return;history.boundary();activeEditor.documentController.modify(n=>{if(n.type==='paragraph')n[key]=Number(value);});history.boundary();}
  const inlineEditing={get session(){return inlineSession;},close:finishInline,
    registerView(id,value){return documentSession.register(id,value);},
    attach(node,session){editorSlots.set(session.hostId,node);attachEditor();return {destroy(){if(editorPortal?.parentElement===node&&editorParking)moveConnected(editorParking,editorPortal);editorSlots.delete(session.hostId);}};},
    beforePagination(nextPages){if(!inlineSession)return null;const index=Number(activeEditor?.closest('[data-flow-index]')?.dataset.flowIndex);if(!paginationSelection&&activeEditor?.isConnected&&(inlineSession.fragmentIds?.length??0)<=1&&canKeepPageEditor(inlineSession,flowMap.pages[index],nextPages?.[index]))return {keepMounted:true};const saved={...inlineSession,bookmark:clone(paginationSelection??captureEditorSelection(activeEditor)??inlineSession.bookmark??null)};if(!paginationSelection&&saved.paragraphSlice)for(const key of ['start','end'])if(saved.bookmark?.[key]?.nodeId===saved.paragraphSlice.nodeId)saved.bookmark[key].offset+=saved.paragraphSlice.start;inlineSession={...inlineSession,redistributing:true};documentSelection=currentAnchor();if(editorPortal&&editorParking)moveConnected(editorParking,editorPortal);return saved;},
    afterPagination(saved){if(!saved||saved.keepMounted)return;const fields=[...canvas.querySelectorAll('[data-edit-root="'+CSS.escape(saved.rootId)+'"][data-edit-path="'+CSS.escape(saved.pointer)+'"]')];const nodeId=saved.bookmark?.start?.nodeId,offset=saved.bookmark?.start?.offset??0;const field=fields.find(el=>{const value=documentSession.hosts.get(el.dataset.hostId)?.value;return nodeId&&(value?.blocks&&locateDocumentNode(value,nodeId)||el.querySelector('[data-id="'+CSS.escape(nodeId)+'"]'))&&(!el.hasAttribute('data-fragment-start')||offset>=Number(el.dataset.fragmentStart)&&offset<=Number(el.dataset.fragmentEnd));})??fields.find(el=>el.closest('.flow-paper'));paginationSelection=saved.bookmark;const view=field&&documentSession.hosts.get(field.dataset.hostId);if(view){requestEdit({...saved,...view,hostId:field.dataset.hostId,origin:field});}else{attachEditor();restoreEditorSelection(activeEditor,saved.bookmark);}paginationSelection=null;},
    host(session){return {
      get copiedTabs(){return copiedDocumentTabs;},set copiedTabs(value){copiedDocumentTabs=value;},
      ready(editor){activeEditor=editor;attachEditor();if(session.bookmark)restoreEditorSelection(editor,session.bookmark);else placeEditorAtPoint(editor,session.point);documentSelection=currentAnchor();},
      selection(bookmark){if(inlineSession?.key===session.key){inlineSession.bookmark=bookmark;documentSelection=currentAnchor();documentSession.select(documentSelection);const c=activeEditor?.documentController;nativeTable=!!(c?.selectedId&&c.surface.querySelector(`[data-id="${CSS.escape(c.selectedId)}"]`)?.closest('table'));}},
      detached(bookmark){if(inlineSession?.key===session.key&&bookmark)inlineSession.bookmark=bookmark;},
      beforeInput(){selectionBeforeEdit=currentAnchor();}, boundary(){history.boundary();}, composition(value){composing=value;if(!value)queueSave();}, undo:direction=>direction<0?undo():redo(),adjacent:editAdjacent,
    };},
  };
  setContext('booklet-inline-edit',inlineEditing);
  const commentLocations=$derived(bookletComments(project).filter(f=>!f.resolved).map(flag=>({flag,blockId:contentTarget(project,flag.targetId)?.block?.id??flag.targetId})));
  setContext('booklet-document-actions',{
    get selected(){return groupSelection;},select:selectDocumentGroup,insert:insertDocumentContent,
    get layoutSelection(){return layoutSelection;},selectLayout,
    moveLayout(blockId,id,targetId,position){selectLayout(blockId,id);layoutCommand('move',{targetId,position});},
    resizeLayout(blockId,id,weights){selectLayout(blockId,id);try{const info=bookletLayoutSelection(project,layoutSelection),tree=clone(info.tree);const visit=n=>{if(n.id===id)n.children.forEach((c,i)=>c.weight=weights[i]);n.children?.forEach(visit);};visit(tree.root);const overrides=project.settings.layoutOverrides;change(updateProjectSettings(project,{layoutOverrides:{...overrides,blockLayouts:{...overrides.blockLayouts,[blockId]:{...overrides.blockLayouts[blockId],arrangement:tree}}}}));}catch(e){error=e.message;}},
    move(id,sectionId,beforeId){finishInline();change(flowCommand(project,{type:'move',ids:groupSelection.includes(id)?groupSelection:[id],sectionId:contentTarget(project,beforeId)?.section.id??sectionId,beforeId}));},
    commentsFor(ids){return commentLocations.filter(item=>ids.includes(item.blockId)).map(item=>item.flag);},
    comment(ids){finishInline();panel='comments';tick().then(()=>commentsPanel?.reveal(ids));},
  });
  let selectedSectionId = $state('');
  let selectedPageId = $state('');
  let selectedBlockId = $state('');
  let selectedTargetId = $state('');
  function currentAnchor(){const s=inlineSession;if(!s)return documentSelection;const bookmark=clone(captureEditorSelection(activeEditor)??s.bookmark??null);if(s.paragraphSlice)for(const key of ['start','end'])if(bookmark?.[key]?.nodeId===s.paragraphSlice.nodeId)bookmark[key].offset+=s.paragraphSlice.start;return {rootId:s.rootId,pointer:s.pointer,edition:flexible?flowEdition:answerView,nodeId:bookmark?.start?.nodeId,quote:bookmark?.quote??'',bookmark};}
  function finishInline(){if(inlineSession){documentSelection=currentAnchor();history.boundary();}inlineSession=null;activeEditor=null;composing=false;selecting=false;nativeTable=false;}
  async function editAdjacent(direction,options={}){
    const current=activeEditor?.closest('.editable-booklet-text');if(!current)return;
    const oldAnchor=currentAnchor(),oldSession=inlineSession,selection=getSelection(),range=selection?.rangeCount?selection.getRangeAt(0):null;
    const selectionAnchor=options.extend?{rootId:(selection.anchorNode?.parentElement?.closest('[data-edit-root]')??current).dataset.editRoot,pointer:(selection.anchorNode?.parentElement?.closest('[data-edit-path]')??current).dataset.editPath,bookmark:oldAnchor?.bookmark?.start,hostId:current.dataset.hostId}:null;
    if(options.deleting){
      // A page split is a view boundary. Delete in the canonical paragraph and
      // leave question and table ownership untouched at real field boundaries.
      const slice=oldSession?.paragraphSlice;
      if(!slice){
        const nodeId=direction<0?oldSession?.fragmentIds?.[0]:oldSession?.fragmentIds?.at(-1);
        const joined=joinDocumentParagraph(fieldValue(project,oldSession),nodeId,direction);if(!joined)return;
        selectionBeforeEdit=oldAnchor;history.boundary();const next=updateProjectContent(project,oldSession.rootId,oldSession.pointer,joined.document);
        paginationSelection=joined.bookmark;inlineSession={...oldSession,bookmark:joined.bookmark};change(next);history.boundary();return;
      }
      const doc=fieldValue(project,oldSession),offset=direction<0?slice.start:slice.end,total=documentTextLength(doc);if(direction<0&&offset<=0||direction>0&&offset>=total)return;
      textSelection={ranges:[{rootId:oldSession.rootId,pointer:oldSession.pointer,start:direction<0?offset-1:offset,end:direction<0?offset:offset+1}]};await replaceSelection(plainTextDocument(''));return;
    }
    if(options.documentEdge&&options.extend){selecting=true;await flowPreview?.revealAll();}
    else if(options.documentEdge)await flowPreview?.revealPage(direction<0?0:flowMap.pages.length-1);
    else{const index=Number(current.closest('[data-flow-index]')?.dataset.flowIndex);await flowPreview?.revealPage(index+direction);}
    const fields=[...canvas.querySelectorAll('.editable-booklet-text')].filter(e=>!e.closest('.flow-measure,[aria-hidden=true]')&&e.querySelector('.clickable,maths-editor'));
    const at=fields.indexOf(current),next=options.documentEdge?(direction<0?fields[0]:fields.at(-1)):fields[at+direction];if(!next)return;
    if(next!==current){getSelection()?.removeAllRanges();next.querySelector('.clickable')?.click();}if(!inlineSession)return;
    inlineSession.point={offset:(options.documentEdge?direction>0:direction<0)?Number.MAX_SAFE_INTEGER:0};
    if(options.vertical){const rect=next.getBoundingClientRect();inlineSession.point={...inlineSession.point,x:options.x,y:direction<0?rect.bottom-5:rect.top+5};}
    await tick();for(let i=0;i<10&&!activeEditor?.closest('.editable-booklet-text')?.isSameNode(next);i++)await new Promise(r=>setTimeout(r,10));
    if(!activeEditor)return;const surface=activeEditor.documentController.surface;placeEditorAtPoint(activeEditor,inlineSession.point);
    const caret=getSelection()?.rangeCount?getSelection().getRangeAt(0).getBoundingClientRect():surface.getBoundingClientRect(),bounds=canvas.getBoundingClientRect();if(caret.top<bounds.top+12)canvas.scrollTop+=caret.top-bounds.top-12;else if(caret.bottom>bounds.bottom-12)canvas.scrollTop+=caret.bottom-bounds.bottom+12;
    if(options.extend&&selectionAnchor){const from=fields.find(el=>el.dataset.hostId===selectionAnchor.hostId)??fields.find(el=>el.dataset.editRoot===selectionAnchor.rootId&&el.dataset.editPath===selectionAnchor.pointer),root=from?.querySelector('[data-id="'+CSS.escape(selectionAnchor.bookmark?.nodeId??'')+'"]')??from?.querySelector('.clickable,.me-content');if(root){const start=prosePoint(root,Math.max(0,(selectionAnchor.bookmark?.offset??0)-Number(from.dataset.fragmentStart??0))),s=getSelection();s.setBaseAndExtent(...start,s.focusNode,s.focusOffset);textSelection=captureBookletTextRange(canvas,project);selecting=true;}}
  }
  function formatDocument(name,value){history.boundary();if((textSelection?.crossSurface||textSelection?.ranges.length>1)&&['bold','italic','underline','colour'].includes(name)){const next=applyBookletTextRange(project,textSelection,name,value);finishInline();change(next);textSelection=null;return;}if(activeEditor&&inlineSession?.bookmark&&!activeEditor.contains(document.activeElement))restoreEditorSelection(activeEditor,inlineSession.bookmark);runEditorCommand(activeEditor,name,value);history.boundary();}
  async function replaceSelection(doc){const selection=textSelection;if(!selection)return;const first=selection.ranges[0],next=replaceBookletTextRange(project,selection,doc);finishInline();history.boundary();change(next);history.boundary();textSelection=null;window.getSelection()?.removeAllRanges();await tick();try{await flowPreview?.waitUntilReady();}catch{}const field=canvas?.querySelector('[data-edit-root="'+CSS.escape(first.rootId)+'"][data-edit-path="'+CSS.escape(first.pointer)+'"]');field?.querySelector('.clickable')?.click();if(inlineSession)inlineSession.point={offset:first.start+documentTextLength(doc)};}
  function spaceWholeQuestion(property,value){try{const next=applyQuestionSpacing(project,selectedBlockId,property,value);change(next);}catch(e){error=e.message;}}
  function pasteAtSection(sectionId,beforeId){if(!groupClipboard)return;finishInline();change(flowCommand(project,{type:'paste',clipboard:groupClipboard,sectionId,beforeId}));if(groupClipboard.mode==='cut')groupClipboard=null;}
  function selectDocumentGroup(ids,event={}){
    finishInline();const units=logicalUnits(project),target=units.findIndex(u=>u.blocks.some(b=>b.id===ids[0])),start=units.findIndex(u=>u.blocks.some(b=>b.id===groupSelection[0]));
    groupSelection=selectedFlowIds(project,event.shiftKey&&start>=0?units.slice(Math.min(start,target),Math.max(start,target)+1).flatMap(u=>u.blocks.map(b=>b.id)):ids);
    const first=contentTarget(project,groupSelection[0]);selectedBlockId=first?.block?.id??ids[0];selectedSectionId=first?.section.id??selectedSectionId;
    documentSelection={rootId:selectedBlockId,edition:flexible?flowEdition:answerView};
  }
  function groupCommand(type){try{finishInline();const ids=groupSelection.length?groupSelection:selectedFlowIds(project,[selectedBlockId]);
    if(type==='copy'||type==='cut'){groupClipboard=captureFlowClipboard(project,ids,type);status=type==='cut'?'Ready to move selected content.':'Selected content copied.';return;}
    const section=project.sections.find(s=>s.blocks.some(b=>ids.includes(b.id)))??selectedSection;const last=Math.max(-1,...section.blocks.map((b,i)=>ids.includes(b.id)?i:-1));
    const beforeId=section.blocks[last+1]?.id;const next=flowCommand(project,{type,ids,sectionId:section.id,beforeId, ...(type==='paste'?{clipboard:groupClipboard}: {})});
    change(next);if(type==='paste'&&groupClipboard?.mode==='cut')groupClipboard=null;if(type==='delete')groupSelection=[];
  }catch(e){error=e.message;}}
  async function insertDocumentContent(kind,beforeId=null,afterId=null){try{finishInline();let section=project.sections.find(s=>s.blocks.some(b=>b.id===(beforeId??afterId??selectedBlockId)))??selectedSection;
    if(!section){error='Add a section first.';return;}
    const block=kind==='text'?{...createProjectBlock('rich-text'),content:fromSource('')}:kind==='question'?createDocumentQuestion():createTeachingGroup(kind);
    const ids=selectedFlowIds(project,[afterId??selectedBlockId]),at=beforeId?section.blocks.findIndex(b=>b.id===beforeId)-1:Math.max(-1,...section.blocks.map((b,i)=>ids.includes(b.id)?i:-1));
    change(addProjectBlock(project,section.id,block,{afterIndex:at}));selectedBlockId=block.id;selectedSectionId=section.id;groupSelection=[];
    await tick();await flowPreview?.waitUntilReady();flowPreview?.jumpTo(block.id);await tick();
    document.querySelectorAll('.document-insert[open]').forEach(menu=>menu.open=false);const root=canvas.querySelector(`[data-document-group~="${CSS.escape(block.id)}"]`);const field=root?.querySelector('.atom-body .clickable,.body-box .clickable,.practice .clickable')??root?.querySelector('.clickable');field?.click();
  }catch(e){error=e.message;}}
  async function addComment(){const anchor=textSelection?{...textSelection.ranges[0],ranges:textSelection.ranges,quote:textSelection.quote,edition:flexible?flowEdition:answerView}:currentAnchor()??{rootId:selectedBlockId,edition:flexible?flowEdition:answerView};finishInline();documentSelection=anchor;panel='comments';await tick();commentsPanel?.start(anchor);}
  let commentsPanel=$state(),exportedFeedback=$state('');
  async function flushDocument(){if(composing)throw Error('Finish the current text input first.');clearTimeout(saveTimer);while(saveInFlight)await new Promise(r=>setTimeout(r,20));if(saveConflict)throw Error('Resolve the save conflict first.');if(saveState!=='Saved')await persist();while(saveInFlight)await new Promise(r=>setTimeout(r,20));if(saveState!=='Saved')throw Error('Save failed. Your comments and edits are retained; retry saving before copying feedback.');}
  async function copyComments(ids){try{await flushDocument();exportedFeedback=feedbackPrompt(project,ids);try{await navigator.clipboard.writeText(exportedFeedback);status='Feedback prompt copied.';}catch{status='Select and copy the feedback prompt below.';}}catch(e){error=e.message;}}
  let canvas=$state(null);
  $effect(()=>{
    if(!canvas)return;
    const select=event=>{const rootId=event.target.closest('[data-edit-root]')?.dataset.editRoot??event.target.closest('[data-node-id]')?.dataset.nodeId;const target=contentTarget(project,rootId);if(target?.block){selectedBlockId=target.block.id;selectedTargetId=rootId;}};
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
  let sourcePageChoice=$state(null);
  const selectedSourceRefs=$derived.by(()=>{
    const target=contentTarget(project,selectedTargetId)?.node;
    const own=sourceReferences(target);
    return own.length?own:sourceReferences(selectedBlock).length?sourceReferences(selectedBlock):sourceReferences(selectedSection);
  });
  $effect(()=>{selectedTargetId;selectedBlockId;sourcePageChoice=null;});
  const selectedSourcePage=$derived(selectedSourceRefs.some(r=>r.pageNumber===sourcePageChoice)?sourcePageChoice:selectedSourceRefs[0]?.pageNumber);
  function selectCoverageTarget(id){
    for(const section of project.sections){const block=section.blocks.find(b=>b.id===(contentNodes(project).get(id)?.block.id??id));if(!block)continue;
      selectedSectionId=section.id;selectedBlockId=block.id;selectedTargetId=id;
      const page=projectPages.find(p=>p.blocks.some(b=>b.id===block.id));if(page){selectedPageId=page.id;flowPreview?.jumpTo(page.id);}break;
    }
  }
  const sourceUrl=$derived(project?.source?.runId && selectedSourcePage ? `/__booklet/full-imports/${encodeURIComponent(project.source.runId)}/files/evidence/pages/page-${String(selectedSourcePage).padStart(3,'0')}.png` : '');
  const flagCount=$derived((project?.studio?.flags??[]).filter(f=>!f.resolved).length);
  const dockReview=$derived(panel==='review' && workspaceWidth-(navigation?240:0)-360>=794);
  const pageIndex=$derived(projectPages.indexOf(previewPage));
  function blockLabel(block,index=0){const value=block.title||block.label||block.content?.prompt||block.content?.stem||block.content?.text||block.content;const text=typeof value==='string'?value.replace(/[_*#`$\\{}]/g,'').replace(/\s+/g,' ').trim():'';return (block.type==='question'?`Question ${block.content?.label??index+1}`:block.type==='callout'?(typeof block.label==='string'?block.label:'Theory'):(block.type==='rich-text'?'Text':block.type.replaceAll('-',' ')))+(text?' · '+text.slice(0,65):'');}
  function goPage(index){finishInline();const page=projectPages[index];if(!page)return;selectedPageId=page.id;selectedSectionId=page.section.id;selectedBlockId=page.blocks[0]?.id??'';selectedTargetId='';if(workspaceWidth<1100)navigation=false;}
  function zoomBy(delta){const actual=canvas?.querySelector('.preview-frame');const current=Number(zoom)||Number(actual&&getComputedStyle(actual).getPropertyValue('--preview-scale'))||1;zoom=String(Math.max(.25,Math.min(2,current+delta)).toFixed(2));}
  let comparisonScroll=null;
  async function toggleComparison(){if(!comparison){comparisonScroll={top:canvas.scrollTop,left:canvas.querySelector('.paper-scroll')?.scrollLeft??0};comparison=true;tool='';}else{comparison=false;await tick();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));canvas.scrollTop=comparisonScroll?.top??0;const paper=canvas.querySelector('.paper-scroll');if(paper)paper.scrollLeft=comparisonScroll?.left??0;}}
  function togglePanel(next){panel=panel===next?'':next;}
  function editLocation(origin,target){const labels=[];for(let node=origin?.closest('.question-node');node;node=node.parentElement?.closest('.question-node')){const label=node.querySelector(':scope > .question-line > .part-label')?.textContent?.trim().replace(/[.)]$/,'');if(label)labels.unshift(label);}return `Page ${flexible?flowActive:previewPage?.pageNumber} · ${labels.length?'Question '+labels.join(''):target?blockLabel(target.block,target.section.blocks.indexOf(target.block)):'Content'}`;}
  function requestEdit(request){
    if(inlineSession?.rootId===request.rootId&&inlineSession?.pointer===request.pointer){
      if(request.hostId===inlineSession.hostId&&!paginationSelection)return;
      const original=fieldValue(project,request),value=request.value??original,slice=value?._bookletSlice??null,bookmark=clone(paginationSelection);
      if(slice)for(const key of ['start','end'])if(bookmark?.[key]?.nodeId===slice.nodeId)bookmark[key].offset-=slice.start;
      inlineSession={...inlineSession,hostId:request.hostId,value,redistributing:false,hostNodeId:value?.blocks?.[0]?.id,fragmentIds:isDocument(value)?value.blocks.map(b=>b.id):null,paragraphSlice:slice,paragraphBase:original,bookmark,point:request.point};
      const c=activeEditor?.documentController;if(c){c.doc=isDocument(value)?normalizeDocument(value):fromSource(value);c.lastHostDocument=c.doc;c.render(null);}
      tick().then(()=>{attachEditor();if(bookmark)restoreEditorSelection(activeEditor,bookmark);else placeEditorAtPoint(activeEditor,request.point);});return;
    }
    finishInline();groupSelection=[];
    const arrangement=request.origin?.closest('[data-arrangement-id]'),blockElement=arrangement?.closest('[data-arrangement-block]');
    if(arrangement&&blockElement)layoutSelection={blockId:blockElement.dataset.arrangementBlock,id:arrangement.dataset.arrangementId,ids:[arrangement.dataset.arrangementId]};
    diagramSelection=null;
    if(request.pointer==='/section/title')request={...request,rootId:flexible?(flowMap.pages[Number(request.origin?.closest('[data-flow-index]')?.dataset.flowIndex)]?.section.sourceSectionId??selectedSectionId):previewPage.section.id,pointer:'/title'};
    const found=contentTarget(project,request.rootId);let target=found?.block?{...found,id:request.rootId}:null;
    if(!target){for(const section of project.sections){for(const block of section.blocks){const node=findContent(block,request.rootId);if(node){target={id:request.rootId,node,block,section,kind:'part'};break;}}if(target)break;}}
    if(flexible&&target?.section)selectedSectionId=target.section.id;
    if(target){selectedBlockId=target.block.id;selectedTargetId=target.id;}
    if(flexible&&target&&request.value!==undefined){const original=request.pointer.split('/').slice(1).reduce((v,k)=>v?.[k],target.node);if(original!==undefined){
      const fragmentIds=isDocument(original)&&isDocument(request.value)?request.value.blocks.map(b=>b.id):null;
      request={...request,value:fragmentIds||request.value?._bookletSlice?request.value:original,fragmentIds,paragraphSlice:request.value?._bookletSlice??null,paragraphBase:request.value?._bookletSlice?original:null};
    }}
    const enclosing=request.origin?.closest('.question-node.diagrams-beside');
    const layoutId=enclosing?.dataset.nodeId??request.rootId;
    const layoutTarget=contentTarget(project,layoutId);
    const page=request.origin?.closest('.preview-page');const scale=page?page.getBoundingClientRect().width/page.offsetWidth:1;
    const layoutContext={id:layoutId,beside:!!enclosing,inset:!!request.origin?.closest('.stacked-prompt'),widthMm:enclosing?enclosing.getBoundingClientRect().width/scale*25.4/96:180,textWidthMm:enclosing?enclosing.querySelector(':scope > .question-line')?.getBoundingClientRect().width/scale*25.4/96:undefined,diagramWidthMm:layoutTarget?.node.questionDiagrams?.[0]?.widthMm};
    const nextSession={...request,houseStyleVersion:project.settings.houseStyleVersion,layoutContext,layout:clone(project.settings.layoutOverrides.blockLayouts?.[layoutId]??{}),question:target?.block.type==='question'?resolvePreviewAssets(target.block.content,src=>src.startsWith('evidence/')?`/__booklet/full-imports/${encodeURIComponent(project.source?.runId??project.id)}/files/lanes/exact/${src}`:src):null,blockLayouts:clone(project.settings.layoutOverrides.blockLayouts??{}),
      restoreFocus:()=>canvas?.querySelector('[data-edit-root="'+CSS.escape(request.rootId)+'"][data-edit-path="'+CSS.escape(request.pointer)+'"] .clickable')?.focus({preventScroll:true}),context:editLocation(request.origin,target),sourceUrl,
      commit:result=>{
        let next=project;
        const fragmentIds=inlineSession?.fragmentIds??request.fragmentIds;
        const paragraphSlice=inlineSession?.paragraphSlice??request.paragraphSlice;
        const stored=paragraphSlice?replaceParagraphSlice(inlineSession?.paragraphBase??request.paragraphBase,paragraphSlice,result.value):fragmentIds?replaceDocumentFragment(fieldValue(project,request),fragmentIds,result.value):result.value;
        for(const id of request.rootIds?.length?request.rootIds:[request.rootId])next=updateProjectContent(next,id,request.pointer,stored);
        if(result.applyTabs&&target?.block.type==='question'){
          const visit=node=>{if(!node.children?.length&&node.id!==request.rootId){const doc=isDocument(node.prompt)?normalizeDocument(node.prompt):fromSource(node.prompt??'');for(const p of doc.blocks)if(p.type==='paragraph')p.tabStops=clone(result.applyTabs);next=updateProjectContent(next,node.id,'/prompt',doc);}else node.children?.forEach(visit);};visit(target.block.content);
        }
        if(result.layout&&JSON.stringify(result.layout)!==JSON.stringify(next.settings.layoutOverrides.blockLayouts[layoutId]??{}))next=updateProjectSettings(next,{layoutOverrides:{...next.settings.layoutOverrides,blockLayouts:{...next.settings.layoutOverrides.blockLayouts,[layoutId]:result.layout}}});
        if(/\/(title|label|visibleSubtitle|description)$/.test(request.pointer)&&isDocument(result.value)){
          for(const id of request.rootIds?.length?request.rootIds:[request.rootId])next=updateProjectContent(next,id,request.pointer,toSource(result.value));
        }
        if(inlineSession){inlineSession={...inlineSession,value:result.value,bookmark:captureEditorSelection(activeEditor)??inlineSession.bookmark,fragmentIds:result.value.blocks?.map(b=>b.id)??null,hostNodeId:result.value.blocks?.[0]?.id};}
        change(next,{typingKey:request.rootId+request.pointer,structural:result.structural!==false||!isDocument(fieldValue(project,request)),changedIds:target?.block?[target.block.id]:undefined});
      }};
    inlineSession={...nextSession,key:crypto.randomUUID()};
  }
  function requestDiagram(request){
    finishInline();
    const {target,item,origin}=request,d=item.diagram;
    editSession={key:[project.id,target.id,item.path,d.id].join(':'),projectId:project.id,targetId:target.id,path:item.path,diagram:d,origin,
      colourMode:project.settings.layoutOverrides.diagramColourModes[d.id]??'original',assetBase:'/__booklet/full-imports/'+encodeURIComponent(project.source?.runId??project.id)+'/files/lanes/exact/',
      context:'Page '+previewPage?.pageNumber+' ? '+(d.alt??'Diagram'),sourceUrl,commit:draft=>{
        let next=project;
        const diagram={...d,[d.format==='tikz'?'code':'src']:draft.code,widthMm:draft.width,align:draft.align,mathematicalModel:draft.mathematicalModel,...(d.format!=='tikz'?{sourceRegion:draft.sourceRegion}:{} )};
        if(item.path)next=updateProjectContent(next,target.id,item.path,diagram);
        else next={...next,sections:next.sections.map(section=>({...section,blocks:section.blocks.map(block=>block.id===d.id?diagram:block)}))};
        if(d.format!=='tikz')next=updateProjectSettings(next,{layoutOverrides:{...next.settings.layoutOverrides,diagramColourModes:{...next.settings.layoutOverrides.diagramColourModes,[d.id]:draft.colourMode}}});
        next=syncDiagramPresentation(next,target.block.id,d.id,{widthMm:draft.width,align:draft.align});
        change(next);
      }};
  }
  function openArrangement(target,request){
    target={...target,section:target.section??project.sections.find(s=>s.blocks.some(b=>b.id===target.block.id))};
    const block=target.block;
    const related=new Set(reviewTargets(project).filter(t=>t.block.id===block.id).map(t=>t.id));
    selectedBlockId=block.id;selectedTargetId=target.id;
    const paper=request.origin?.closest('.preview-page'),scale=paper?paper.getBoundingClientRect().width/paper.offsetWidth:1;
    const arrangementContainer=request.origin?.closest('.booklet-arrangement');
    const container=request.origin?.closest('.atom-body,.body-box,.practice');
    const widthMm=arrangementContainer?arrangementContainer.clientWidth*25.4/96:container?Math.round(Math.min(190,Math.max(80,(container.getBoundingClientRect().width/scale-parseFloat(getComputedStyle(container).paddingLeft)-parseFloat(getComputedStyle(container).paddingRight))*25.4/96))*10)/10:180;
    const initialArrangement=resolveArrangement(block,project.settings.layoutOverrides.blockLayouts?.[block.id]?.arrangement,{...project.settings.layoutOverrides,labels},widthMm).tree;
    editSession={...request,pageControls:flexible,block:clone(block),arrangement:initialArrangement,widthMm,houseStyleVersion:project.settings.houseStyleVersion,diagramColourModes:project.settings.layoutOverrides.diagramColourModes,sourceUrl,assetBase:'/__booklet/full-imports/'+encodeURIComponent(project.source?.runId??project.id)+'/files/lanes/exact/',context:editLocation(request.origin,target),commit:result=>{
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
      let next={...project,sections,settings:{...project.settings,layoutOverrides:{...project.settings.layoutOverrides,answerSpaces,diagramWidths,blockLayouts:{...layouts,[block.id]:{...layouts[block.id],arrangement:result.arrangement}}}}};
      for(const action of result.pageActions??[])next=setPageBoundary(next,block.id,action);
      change(next);
    }};
  }
  let diagramSelection=$state.raw(null);
  const selectedDiagram=$derived(diagramSelection?fieldValue(project,diagramSelection):null);
  function diagramRequest(){const target=contentTarget(project,diagramSelection?.rootId);return target?{target:{...target,id:diagramSelection.rootId},item:{diagram:selectedDiagram,path:diagramSelection.pointer},origin:canvas.querySelector(`[data-diagram-id="${CSS.escape(selectedDiagram.id)}"]`)}:null;}
  function editSelectedDiagram(){const request=diagramRequest();if(request)requestDiagram(request);}
  function arrangeSelectedQuestion(event){
    if(!selectedBlock)return;
    const diagram=!activeEditor?diagramRequest():null;
    const selectedNodeId=activeEditor?.documentController?.selectedId;
    const selectedArrangementId=!activeEditor&&layoutSelection?.blockId===selectedBlock.id?layoutSelection.id:undefined;
    const origin=diagram?.target.block.id===selectedBlock.id?diagram.origin:canvas.querySelector(`[data-edit-root="${CSS.escape(selectedBlock.content?.id??selectedBlock.id)}"]`)??event.currentTarget;
    const request={origin,rootId:inlineSession?.rootId??selectedBlock.content?.id??selectedBlock.id,pointer:inlineSession?.pointer??'/prompt',selectedNodeId,selectedArrangementId,selectedDiagramId:diagram?.target.block.id===selectedBlock.id?selectedDiagram.id:undefined};
    finishInline();openArrangement({id:selectedBlock.content?.id??selectedBlock.id,block:selectedBlock},request);
  }
  function changeDiagram(patch){if(!selectedDiagram)return;const width=patch.widthMm;if(width!=null&&(!Number.isFinite(width)||width<5||width>190)){error='Choose a diagram width between 5 and 190 mm.';return;}let next=diagramSelection.pointer?updateProjectContent(project,diagramSelection.rootId,diagramSelection.pointer,{...selectedDiagram,...patch}):{...project,sections:project.sections.map(s=>({...s,blocks:s.blocks.map(b=>b.id===selectedDiagram.id?{...b,...patch}:b)}))};if(width!=null)next=updateProjectSettings(next,{layoutOverrides:{...next.settings.layoutOverrides,diagramWidths:{...next.settings.layoutOverrides.diagramWidths,[selectedDiagram.id]:width}}});next=syncDiagramPresentation(next,contentTarget(project,diagramSelection.rootId)?.block?.id,selectedDiagram.id,patch);change(next);}
  function clickedDiagram(event){if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;const element=event.target.closest('[data-diagram-id]');if(!element||event.target.closest('button'))return;const id=element.dataset.diagramId;const arr=element.closest('[data-arrangement-id]'),ab=arr?.closest('[data-arrangement-block]');if(arr&&ab)layoutSelection={blockId:ab.dataset.arrangementBlock,id:arr.dataset.arrangementId,ids:[arr.dataset.arrangementId]};for(const target of reviewTargets(project)){const item=findEditableDiagram(target.node,id);if(item){event.preventDefault();finishInline();diagramSelection={rootId:target.id,pointer:item.path};documentSelection={...diagramSelection,edition:flexible?flowEdition:answerView};selectedBlockId=target.block.id;selectedSectionId=target.section.id;canvas.querySelectorAll('.document-diagram-selected').forEach(e=>e.classList.remove('document-diagram-selected'));element.classList.add('document-diagram-selected');if(event.type==='dblclick'||event.type==='keydown')editSelectedDiagram();return;}}}
  $effect(()=>{if(!canvas)return;project;const decorate=()=>canvas.querySelectorAll('[data-diagram-id]').forEach(el=>{
    el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','Select diagram');
    if(!el.querySelector(':scope > .document-diagram-resize')){const handle=document.createElement('button');handle.className='document-diagram-resize';handle.setAttribute('aria-label','Resize diagram');handle.textContent='↔';el.style.position='relative';el.append(handle);
      handle.onpointerdown=e=>{e.preventDefault();e.stopPropagation();clickedDiagram({target:el,preventDefault(){},type:'click'});const start=e.clientX,initial=el.getBoundingClientRect().width,mm=selectedDiagram?.widthMm??78;let width=mm;handle.setPointerCapture(e.pointerId);const move=event=>{width=Math.max(5,Math.min(190,mm+(event.clientX-start)*mm/initial));el.style.width=width+'mm';};const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',cancel);changeDiagram({widthMm:Math.round(width*10)/10});};const cancel=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',cancel);el.style.width=mm+'mm';};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',cancel);};}
  });decorate();const observer=new MutationObserver(decorate);observer.observe(canvas,{childList:true,subtree:true});for(const type of ['click','dblclick','keydown'])canvas.addEventListener(type,clickedDiagram);return()=>{observer.disconnect();for(const type of ['click','dblclick','keydown'])canvas?.removeEventListener(type,clickedDiagram);};});
  setContext('booklet-edit-request',requestEdit);
  $effect(()=>{if(preferencesReady)try{sessionStorage.setItem('booklet-workspace-v2',JSON.stringify({navigation,zoom,sourceZoom,panel,answerView}));}catch{}});
  onMount(()=>{try{const prefs=JSON.parse(sessionStorage.getItem('booklet-workspace-v2')??'{}');navigation=false;zoom=prefs.zoom??'width';sourceZoom=prefs.sourceZoom??'width';panel='';answerView=['student','short','worked'].includes(prefs.answerView)?prefs.answerView:'student';}catch{}preferencesReady=true;const observer=new ResizeObserver(entries=>workspaceWidth=entries[0].contentRect.width);observer.observe(workspace);const closeMenu=e=>{const menu=e.target.closest('.menu,.document-insert,.item-menu');if(menu&&e.target.closest('button'))menu.open=false;};workspace.addEventListener('click',closeMenu);return()=>{observer.disconnect();workspace.removeEventListener('click',closeMenu);};});

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
    try{const {settleBooklet,inspectBooklet}=await import('../lib/booklet-qa.js');document.querySelectorAll('.document-insert[open]').forEach(menu=>menu.open=false);const root=canvas.querySelector('.paper-scroll');await settleBooklet(root);const report=inspectBooklet(root,{style:project.settings.houseStyleVersion==='1.1.0'});const issues=report.flatMap(p=>p.issues);status=issues.length?'Page needs attention: '+issues.map(i=>`${i.kind} (${i.diagramId??i.id})`).join('; '):'Page QA passed: content fits above the footer and applicable style checks pass.';}catch(e){status='Page QA failed: '+e.message;}
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
    if(!id)return;
    if(editSession){error='Finish the current focused edit before switching booklets.';return;}
    const token=++loadGeneration;
    window.scrollTo({top:0});
    opening={id,title:projects.find(p=>p.id===id)?.title??id,stage:project&&(saveState!=='Saved'||saveInFlight)?'Saving current booklet':'Loading booklet'};
    finishInline();printReady=false;busy='Opening';error='';status='';
    const current=()=>token===loadGeneration;
    try {
      if(project&&(saveState!=='Saved'||saveInFlight))await flushDocument();
      if(!current())return;
      opening={...opening,stage:'Loading booklet'};
      const loaded=await openBookletProject(id);
      if(!current())return;
      const sync=loaded.bankSync,syncError=loaded.bankSyncError??'';
      const next=applyBankRatings(loaded.project,sync.items),base=clone(next);
      if(!projects.some(item=>item.id===id))projects=[...projects,{id,title:next.title}];
      project=next;savedBase=base;saveState='Saved';saveConflict=false;mergeReview=null;
      bankSync=sync;bankSyncError=syncError;showBankSync=false;
      selectDefaults(next);tool='';comparison=false;diagramSelection=null;layoutSelection=null;
      documentSession.reset();persistence.reset(project);documentGeneration=documentSession.generation;undoStack=[];redoStack=[];groupSelection=[];documentSelection=null;exportedFeedback='';
      previewAttempt=token;
      opening={...opening,stage:'Preparing pages',preview:true};
      onprojectchange?.(id);
      await tick();if(!current())return;
      if(canvas)canvas.scrollTop=0;
      if(!isFlexible(next)&&!projectPages.length){opening=null;busy='';}
    } catch (exception) {if(current()){opening={...opening,error:exception.message};busy='';}}
  }

  async function createNew() {
    const title = window.prompt('Booklet title', 'Untitled booklet');
    if (!title) return;
    busy = 'Creating'; error = '';
    try {
      finishInline();if(project)await flushDocument();
      const created = await createBookletProject({ title });
      await refreshProjects();
      project = created;savedBase=clone(created);documentSession.reset();persistence.reset(project);documentGeneration=documentSession.generation;undoStack=[];redoStack=[];groupSelection=[];groupClipboard=null;documentSelection=null;exportedFeedback='';selectDefaults(created); onprojectchange?.(created.id);
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function duplicateCurrent() {
    if (!project) return;
    busy = 'Duplicating'; error = '';
    try {
      finishInline();await flushDocument();
      const created = await duplicateBookletProject(project.id);
      await refreshProjects(); project = created;savedBase=clone(created);documentSession.reset();persistence.reset(project);documentGeneration=documentSession.generation;undoStack=[];redoStack=[];groupSelection=[];groupClipboard=null;documentSelection=null;exportedFeedback='';selectDefaults(created); onprojectchange?.(created.id);
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

  function remember(typingKey=null) {
    if (!project) return;
    history.record(project,currentAnchor(),typingKey);undoStack=history.past;redoStack=history.future;
  }

  function change(next, { rememberBefore = true, typingKey=null,structural=true,changedIds } = {}) {
    if(next===project)return;
    const previousBlocks=new Map(project?.sections.flatMap(s=>s.blocks).map(b=>[b.id,b])??[]);
    let layouts=next.settings.layoutOverrides.blockLayouts,layoutsChanged=false;
    if(structural)for(const block of next.sections.flatMap(s=>s.blocks)){const old=previousBlocks.get(block.id),holder=layouts[block.id];if(old&&old!==block&&holder?.arrangement){const updated=clone(holder);reconcileSyncLayout(old,block,updated,{editable:true});if(JSON.stringify(updated)!==JSON.stringify(holder)){if(!layoutsChanged)layouts={...layouts};layouts[block.id]=updated;layoutsChanged=true;}}}
    if(layoutsChanged)next={...next,settings:{...next.settings,layoutOverrides:{...next.settings.layoutOverrides,blockLayouts:layouts}}};
    documentSession.dispatch(reconcileFeedback(project,next),{remember:rememberBefore,typingKey,changedIds,selectionBefore:selectionBeforeEdit??documentSession.selection??currentAnchor(),selectionAfter:currentAnchor(),layoutImpact:structural?'structure':'content'});
    selectionBeforeEdit=null;undoStack=history.past;redoStack=history.future;
    saveState = 'Unsaved changes';
    promotion = null;
    queueSave();
  }

  function queueSave() {
    if (!project || saveConflict) return;
    if (saveTimer) clearTimeout(saveTimer);
    if(composing)return;
    saveTimer = setTimeout(persist, 500);
  }

  async function persist() {
    if (!project||saveConflict||composing) return;
    if (saveInFlight) { savePending = true; return; }
    saveInFlight = true; saveState = 'Saving…'; error = '';
    const savingProject = project;
    // The project tree is immutable; persistence sends changed branches to its
    // worker. Later edits replace branches without changing this snapshot.
    const snapshot = project;
    try {
      const saved = await persistence.save(snapshot);
      if(project.id!==snapshot.id)return;
      const editedDuringSave=project!==savingProject;
      savedBase=saved;const canonical=shareUnchanged(savingProject,saved);project=editedDuringSave?reconcileSaveAcknowledgement(snapshot,project,canonical):canonical;
      saveState = editedDuringSave?'Unsaved changes':'Saved';
      if(editedDuringSave)savePending=true;
      projects=projects.map(item=>item.id===saved.id?{...item,title:saved.title,revision:saved.revision}:item);
      // Bank status refresh remains available on focus, its 15 s timer and Review.
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
    finishInline();documentSession.dispatch(result.project);savedBase=clone(mergeReview.latest);mergeReview=null;saveConflict=false;error='';saveState='Unsaved changes';queueSave();
  }

  function undo() {
    historyStep(-1);
  }

  function redo() {
    historyStep(1);
  }
  async function historyStep(direction){
    if(!project||composing)return;const result=history.step(project,currentAnchor(),direction);if(!result)return;
    finishInline();documentSession.dispatch(result.project,{remember:false,selectionAfter:result.selection});undoStack=history.past;redoStack=history.future;documentSelection=result.selection;saveState='Unsaved changes';queueSave();
    await tick();const anchor=result.selection;if(anchor?.pointer&&contentTarget(project,anchor.rootId)){try{await flowPreview?.waitUntilReady();}catch{}const id=contentTarget(project,anchor.rootId)?.block?.id;for(const [i,page]of flowMap.pages.entries())if(page.blocks.some(b=>b.id===id))await flowPreview?.revealPage(i);await tick();
      const fields=[...canvas.querySelectorAll('[data-edit-root="'+CSS.escape(anchor.rootId)+'"][data-edit-path="'+CSS.escape(anchor.pointer)+'"]')],offset=anchor.bookmark?.start?.offset??0,nodeId=anchor.bookmark?.start?.nodeId;const field=fields.find(el=>{const value=documentSession.hosts.get(el.dataset.hostId)?.value;return (!nodeId||value?.blocks&&locateDocumentNode(value,nodeId))&&(!el.hasAttribute('data-fragment-start')||offset>=Number(el.dataset.fragmentStart)&&offset<=Number(el.dataset.fragmentEnd));})??fields[0];
      field?.querySelector('.clickable')?.click();if(inlineSession){const bookmark=clone(anchor.bookmark);if(inlineSession.paragraphSlice)for(const key of ['start','end'])if(bookmark?.[key]?.nodeId===inlineSession.paragraphSlice.nodeId)bookmark[key].offset-=inlineSession.paragraphSlice.start;inlineSession.bookmark=bookmark;await tick();restoreEditorSelection(activeEditor,bookmark);}
    }
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
    if (!selectedBlock) return;
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
      finishInline();documentSession.dispatch(result.project,{remember:false});savedBase=clone(result.project);promotion = null; status = mode === 'link-existing' ? 'Linked to the existing bank question.' : 'Question promoted to the shared bank.';
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
    if(opening)return;
    if(printing)return;
    finishInline();if(editSession){status='Apply or cancel the diagram/arrangement edit before printing.';return;}
    printing = true; printProgress = 'Preparing booklet…';
    busy = 'Preparing print'; error = '';
    let progressTimer;
    try {
      await flushDocument();
      if (saveState !== 'Saved') throw new Error('Save the booklet before printing. Resolve any save conflict and try again.');
      if(flexible)await flowPreview.waitUntilReady();
      const exportGeneration=documentSession.generation,exportEdition=flowEdition;
      if(flexible&&!documentSession.layoutReady(exportEdition))throw Error('Layout is still updating. Retry export once it has settled.');
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
      if(exportGeneration!==documentSession.generation||exportEdition!==flowEdition)throw Error('The document changed while export was being prepared. Retry export for the latest revision.');
      printProgress = 'Opening print dialog…';
      window.print();
    } catch (exception) { error = exception.message; }
    finally { clearInterval(progressTimer); printReady = false; busy = ''; printing = false; printProgress = ''; }
  }

  onMount(() => {
    const syncTimer=setInterval(()=>{if(project&&saveState==='Saved'&&!document.hidden)refreshBankSync();},15000);
    window.addEventListener('focus',refreshBankSync);
    const key=e=>{
      if(opening){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='p')e.preventDefault();return;}
      if(e.key==='Escape'&&panel==='layout'&&!e.target.closest('.selection-spacing')){e.preventDefault();closeLayoutPanel();return;}
      if(editSession||!project)return;
      const mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
      if(mod&&k==='a'&&canvas?.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();selecting=true;flowPreview?.revealAll().then(()=>{const fields=[...canvas.querySelectorAll('.editable-booklet-text .me-content,.editable-booklet-text .clickable')];if(fields.length){const range=document.createRange();range.setStart(fields[0],0);range.setEnd(fields.at(-1),fields.at(-1).childNodes.length);getSelection().removeAllRanges();getSelection().addRange(range);textSelection=captureBookletTextRange(canvas,project);}});return;}
      if(finder&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeFinder();return;}
      if(mod&&['f','g','k'].includes(k)){e.preventDefault();e.stopImmediatePropagation();openFinder({f:'find',g:'goto',k:'commands'}[k]);return;}
      if((textSelection?.crossSurface||textSelection?.ranges.length>1)&&['Delete','Backspace'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();const next=applyBookletTextRange(project,textSelection,'delete');finishInline();change(next);textSelection=null;return;}
      if((textSelection?.crossSurface||textSelection?.ranges.length>1)&&!mod&&!e.altKey&&!e.isComposing&&(e.key.length===1||e.key==='Enter')){e.preventDefault();e.stopImmediatePropagation();selecting=false;replaceSelection(plainTextDocument(e.key==='Enter'?'\n':e.key));return;}
      if(mod&&e.altKey&&k==='m'){e.preventDefault();addComment();return;}
      if(mod&&k==='p'){e.preventDefault();printProject();return;}
      if(mod&&k==='s'){e.preventDefault();flushDocument().catch(err=>error=err.message);return;}
      if(e.target.closest('input,textarea,select,[contenteditable=true],math-field,maths-editor'))return;
      if(mod&&['z','y'].includes(k)){e.preventDefault();k==='y'||e.shiftKey?redo():undo();}
      else if(groupSelection.length&&mod&&['x','c','v','d'].includes(k)){e.preventDefault();groupCommand({x:'cut',c:'copy',v:'paste',d:'duplicate'}[k]);}
      else if(layoutSelection&&['Delete','Backspace'].includes(e.key)&&e.target.closest('[data-layout-handle]')){e.preventDefault();layoutCommand('delete');}
      else if(groupSelection.length&&e.key==='Delete'){e.preventDefault();groupCommand('delete');}
    };
    // Headless PDF exports explicitly request the same print surface.
    const preparePrint=()=>{printReady=true;};
    window.addEventListener('booklet-prepare-print',preparePrint);
    const unload=e=>{if(editSession||saveState!=='Saved'){e.preventDefault();e.returnValue='';}};
    const selection=()=>{const next=captureBookletTextRange(canvas,project);if(next)textSelection=next;else if(canvas?.contains(document.activeElement))textSelection=null;};
    const clipboard=e=>{if((textSelection?.crossSurface||textSelection?.ranges.length>1)&&canvas?.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();const data=copyBookletTextRange(project,textSelection);e.clipboardData.setData('application/x-maths-editor+json',data.json);e.clipboardData.setData('text/plain',data.text);e.clipboardData.setData('text/html',data.html);if(e.type==='cut'){const next=applyBookletTextRange(project,textSelection,'delete');finishInline();change(next);textSelection=null;}}};
    let drag=null,plainPaste=false;
    const pointerdown=e=>{if(e.button!==0||!canvas?.contains(e.target)||!e.target.closest('.editable-booklet-text')||e.target.closest('math-field,button,input,select'))return;drag={x:e.clientX,y:e.clientY};};
    const pointermove=e=>{if(!drag||!(e.buttons&1))return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;selecting=true;const s=getSelection(),point=document.caretPositionFromPoint?.(e.clientX,e.clientY),node=point?.offsetNode;if(s?.anchorNode&&node&&canvas.contains(node)&&canvas.contains(s.anchorNode)){try{s.setBaseAndExtent(s.anchorNode,s.anchorOffset,node,point.offset);}catch{}}const bounds=canvas.getBoundingClientRect();if(e.clientY>bounds.bottom-28)canvas.scrollTop+=24;else if(e.clientY<bounds.top+28)canvas.scrollTop-=24;};
    const pointerup=()=>{if(drag){selection();drag=null;}selecting=false;};
    const pasteKey=e=>{plainPaste=(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='v';};
    const paste=e=>{if((textSelection?.crossSurface||textSelection?.ranges.length>1)){e.preventDefault();e.stopImmediatePropagation();try{const parsed=readClipboard(e.clipboardData,{plain:plainPaste});plainPaste=false;if(parsed.unsupported.length)pasteFallback=parsed;else{selecting=false;replaceSelection(parsed.document);}}catch(err){error=err.message;}}};
    window.addEventListener('pointerdown',pointerdown);window.addEventListener('pointermove',pointermove);window.addEventListener('pointerup',pointerup);window.addEventListener('keydown',pasteKey,true);window.addEventListener('paste',paste,true);
    document.addEventListener('selectionchange',selection);window.addEventListener('copy',clipboard,true);window.addEventListener('cut',clipboard,true);
    window.addEventListener('keydown',key,true);window.addEventListener('beforeunload',unload);
    return ()=>{loadGeneration++;clearInterval(syncTimer);window.removeEventListener('pointerdown',pointerdown);window.removeEventListener('pointermove',pointermove);window.removeEventListener('pointerup',pointerup);window.removeEventListener('keydown',pasteKey,true);window.removeEventListener('paste',paste,true);document.removeEventListener('selectionchange',selection);window.removeEventListener('copy',clipboard,true);window.removeEventListener('cut',clipboard,true);window.removeEventListener('focus',refreshBankSync);window.removeEventListener('booklet-prepare-print',preparePrint);window.removeEventListener('keydown',key,true);window.removeEventListener('beforeunload',unload);clearTimeout(saveTimer);};
  });
  $effect(() => {
    const requested = initialProjectId;
    if (!projectsReady) return;
    untrack(() => {
      if (requested === lastRequestedProjectId) return;
      lastRequestedProjectId = requested;
      if (requested && requested !== project?.id && projects.some(item => item.id === requested)) openProject(requested);
    });
  });
  onMount(() => {initialiseProjects();});
</script>
{#if pasteFallback}<div class="document-finder" role="dialog" aria-modal="true" aria-label="Paste options"><p>This clipboard contains {pasteFallback.unsupported.join(', ')}. Paste the available text, or cancel to keep your selection.</p><button onclick={()=>{const value=pasteFallback.text;pasteFallback=null;selecting=false;replaceSelection(plainTextDocument(value));}}>Paste text only</button><button onclick={()=>pasteFallback=null}>Cancel</button></div>{/if}
{#if finder}<dialog bind:this={finderDialog} oncancel={e=>{e.preventDefault();closeFinder();}} class="document-finder project-screen" aria-label={finder==='commands'?'Search commands':finder==='goto'?'Go to page':'Find in document'}>
 <header><strong>{finder==='commands'?'Commands':finder==='goto'?'Go to page':'Find in document'}</strong><button aria-label="Close search" onclick={closeFinder}>×</button></header>
 {#if finder==='goto'}<form onsubmit={e=>{e.preventDefault();flowPreview?.jumpTo(flowMap.pages[Number(goPageValue)-1]?.id);closeFinder();}}><input bind:this={finderInput} aria-label="Page number" type="number" min="1" max={flowMap.pages.length} bind:value={goPageValue}/><button>Go</button></form>
 {:else}<input bind:this={finderInput} aria-label={finder==='commands'?'Search commands':'Find text'} bind:value={findQuery} placeholder={finder==='commands'?'Try “equation spacing”':'Search this booklet'} onkeydown={e=>{if(e.key==='Enter'){if(finder==='commands'&&commandMatches[0])command(commandMatches[0][1]);else if(findMatches[0])locateMatch(findMatches[0]);}}}/>
 <div class="finder-results">{#if finder==='commands'}{#each commandMatches as [label,action]}<button onclick={()=>command(action)}>{label}</button>{/each}{:else}{#each findMatches as match}<button onclick={()=>locateMatch(match)}><small>{match.label}</small>{match.text.slice(Math.max(0,match.text.toLowerCase().indexOf(findQuery.toLowerCase())-35),Math.max(0,match.text.toLowerCase().indexOf(findQuery.toLowerCase())-35)+160)}</button>{/each}{#if findQuery&&!findMatches.length}<p>No matches</p>{/if}{/if}</div>{/if}
</dialog>{/if}
{#if bankPicker}<BookletBankPicker {bank} {onrequestbank} destination={bankDestination} oninsert={insertBank} onclose={()=>bankPicker=false}/>{/if}
 <section class="project-shell" class:is-opening={!!opening} class:word-workspace={wordWorkspace&&!!project} bind:this={workspace} style:--workspace-top={workspaceTop+'px'}>
 <div class="editor-parking" bind:this={editorParking}><div bind:this={editorPortal}>{#if inlineSession}{#key inlineSession.key}<MathsEditor value={inlineSession.value} inline session={inlineSession} documentHost={inlineEditing.host(inlineSession)} selectedNodeId={inlineSession.selectedNodeId} selectedType={inlineSession.selectedType} onchange={result=>inlineSession?.commit(result)}/>{/key}{/if}</div></div>
 <header class="project-toolbar project-screen">
  {#if project&&wordWorkspace}<button class="back-booklets" onclick={closeProject} aria-label="Back to booklets">← Booklets</button>{/if}
  <button disabled={!!opening} aria-label="Toggle page navigation" aria-expanded={navigation&&!comparison} onclick={()=>navigation=!navigation}>☰ Outline</button>
  <label class="project-picker"><span class="sr-only">Open booklet</span><select  aria-label="Open booklet" disabled={!!editSession} value={opening?.id??project?.id??''} onchange={e=>openProject(e.currentTarget.value)}><option value="">Choose a project</option>{#each projects as item}<option value={item.id}>{item.title}</option>{/each}</select></label>
  <span class="save-state" role="status">{opening?'Loading…':saveState}</span>
  {#if project&&!flexible}<button disabled={!!editSession||!!busy} onclick={createFlexibleCopy}>Create flexible copy</button>{/if}
   <div class="toolbar-actions" inert={!!opening||printing}><button data-equation-control onclick={undo} disabled={!undoStack.length}>Undo</button><button data-equation-control onclick={redo} disabled={!redoStack.length}>Redo</button><button aria-expanded={panel==='review'} onclick={()=>togglePanel('review')}>Review {flagCount?`(${flagCount})`:''}</button><button aria-expanded={panel==='pdf'} onclick={()=>togglePanel('pdf')}>Export</button>
   <button title="Find in document (Ctrl+F)" aria-label="Find in document" onclick={()=>openFinder('find')}>Find</button><button title="Commands (Ctrl+K)" aria-label="Search commands" onclick={()=>openFinder('commands')}>Commands</button>
   <details class="menu"><summary>File</summary><div><button onclick={createNew}>New booklet</button>{#if project}<button onclick={()=>panel='metadata'}>Project details</button><button onclick={duplicateCurrent}>Duplicate booklet</button><button onclick={()=>{showBankSync=!showBankSync;refreshBankSync();}}>Bank sync{bankUpdates.length?` (${bankUpdates.length})`:''}</button><button disabled={!sourceUrl} aria-pressed={comparison} onclick={toggleComparison}>{comparison?'Exit comparison':'Compare source'}</button><button onclick={checkCurrentPage}>Check page</button><button onclick={()=>tool='assembly'}>Assembly</button><button onclick={()=>panel='properties'}>Specialist block properties</button><button onclick={()=>theme.toggle()}>Toggle theme</button><button class="danger" onclick={removeCurrent}>Delete booklet</button>{/if}</div></details></div>
 </header>
 {#if opening}<div class="workspace-loading project-screen" aria-busy={!opening.error}>
   <div class="loading-card">
     {#if !opening.error}<span class="loading-spinner" aria-hidden="true"></span>{/if}
     <h2>{opening.error?'Could not open booklet':opening.title?'Opening '+opening.title:'Loading booklets'}</h2>
     <p role="status" aria-live="polite">{opening.stage}{opening.total?` · ${opening.complete} of ${opening.total} sections`:'…'}</p>
     {#if opening.error}<p role="alert">{opening.error}</p><button onclick={()=>opening.id?openProject(opening.id):initialiseProjects()}>Retry</button>{#if project}<button onclick={returnToCurrent}>Return to {project.title}</button>{/if}
     {:else}<progress aria-label={opening.stage} value={opening.total?opening.complete:undefined} max={opening.total||1}></progress>{/if}
   </div>
 </div>{/if}
 {#if project}<div class="document-toolbar project-screen" inert={!!opening} data-equation-control role="toolbar" tabindex="-1" aria-label="Document formatting" onpointerdown={e=>{if(e.target.closest('button'))e.preventDefault();}}>
   {#if !selectedDiagram}<select aria-label="Text style" onchange={e=>formatDocument(e.currentTarget.value==='body'?'paragraph':'size',e.currentTarget.value)}><option value="body">Body text</option><option value="14">Heading</option><option value="11">Subheading</option></select>
   <button aria-label="Bold" onclick={()=>formatDocument('bold')}><b>B</b></button><button aria-label="Italic" onclick={()=>formatDocument('italic')}><i>I</i></button><button aria-label="Underline" onclick={()=>formatDocument('underline')}><u>U</u></button>
   <details class="document-insert colour-menu"><summary title="Text colour">Colour</summary><div><input type="color" aria-label="Text colour" value="#24282d" onchange={e=>formatDocument('colour',e.currentTarget.value)}/>
   <div class="document-colours" role="group" aria-label="Booklet colour palette">{#each documentColours as colour}<button class="colour-swatch" aria-label={colour.name} title={`${colour.name} (${colour.value})`} style:background-color={colour.value} onclick={()=>formatDocument('colour',colour.value)}></button>{/each}</div></div></details>
   <select aria-label="Text alignment" onchange={e=>formatDocument('align',e.currentTarget.value)}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select>
   <button onclick={()=>formatDocument('bullets')}>Bullets</button><button onclick={()=>formatDocument('numbered')}>Numbering</button><button aria-label="Indent list" title="Indent list" onclick={()=>formatDocument('indent-list')}>⇥</button><button aria-label="Outdent list" title="Outdent list" onclick={()=>formatDocument('outdent-list')}>⇤</button><button onclick={()=>formatDocument('math')}>Maths</button>{/if}
   <details class="document-insert"><summary>Insert</summary><div><button onclick={()=>bankPicker=true}>From question bank…</button><button disabled={!selectedBlock} onclick={()=>pageBoundary('before')}>Page break before</button><button disabled={!selectedBlock} onclick={()=>pageBoundary('after')}>Page break after</button><button onclick={()=>insertDocumentContent('text')}>Text</button><button onclick={()=>insertDocumentContent('question')}>Question</button>{#each TEACHING_TEMPLATES as [kind,label]}<button onclick={()=>insertDocumentContent(kind)}>{label}</button>{/each}<button onclick={()=>formatDocument('table')}>Table</button><button onclick={()=>formatDocument('image')}>Image</button><button disabled={!activeEditor} onclick={()=>formatDocument('native','Insert tab')}>Tab</button><button disabled={!activeEditor} onclick={()=>formatDocument('native','Paragraph')}>Paragraph</button><details><summary>More insertions</summary>{#each DOCUMENT_INSERT_TOOLS as [label,command]}<button disabled={!activeEditor} onclick={()=>formatDocument('native',command)}>{label}</button>{/each}</details></div></details>
   <button bind:this={layoutPanelButton} aria-expanded={panel==='layout'} aria-controls="booklet-layout-spacing" onclick={()=>{inspectorTab='layout';panel='layout';}}>Spacing</button>
   <details class="document-insert"><summary>Comments {commentLocations.length||''}</summary><div><button onclick={addComment}>Add comment</button><button onclick={()=>togglePanel('comments')}>Show comments</button></div></details>
   {#if nativeTable}<details class="document-insert"><summary>Table</summary><div>{#each ['Add row','Remove row','Add column','Remove column','Merge right','Split cell'] as action}<button onclick={()=>formatDocument('table-action',action)}>{action}</button>{/each}</div></details>{/if}
   {#if selectedDiagram}<span class="selection-tools">{#if directLayout?.entry?.kind==='diagram'}<label>Space above image <input aria-label="Space above image on page (mm)" type="number" min="0" max="80" step=".5" value={directLayout.node.before??0} onchange={e=>layoutCommand('properties',{before:Number(e.currentTarget.value)})}/> mm</label>{/if}<label>Diagram width <input aria-label="Diagram width on page" type="number" min="5" max="190" value={selectedDiagram.widthMm??78} onchange={e=>changeDiagram({widthMm:Number(e.currentTarget.value)})}/> mm</label><select aria-label="Diagram alignment on page" value={selectedDiagram.align??'left'} onchange={e=>changeDiagram({align:e.currentTarget.value})}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select><button onclick={editSelectedDiagram}>{selectedDiagram.format==='tikz'?'Edit TikZ':'Edit image'}</button></span>{/if}
   {#if groupSelection.length}<details class="document-insert"><summary>Selection ({groupSelection.length})</summary><div><button onclick={()=>groupCommand('cut')}>Cut</button><button onclick={()=>groupCommand('copy')}>Copy</button><button onclick={()=>groupCommand('paste')} disabled={!groupClipboard}>Paste</button><button onclick={()=>groupCommand('duplicate')}>Duplicate</button><button onclick={()=>groupCommand('delete')}>Delete</button></div></details>{/if}
 </div>{/if}
  {#if error}<div class="project-notice error project-screen" role="alert">{error}</div>{:else if status}<div class="workspace-toast project-screen" role="status">{status}</div>{/if}
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
          {#if item.state!=='missing'}<div class="sync-actions"><button disabled={syncBusy||saveState!=='Saved'||!!editSession} onclick={()=>applyBankSync(item,'use-bank')}>Use bank version</button>{#if item.owner}<button disabled={syncBusy||saveState!=='Saved'||!!editSession} onclick={()=>applyBankSync(item,'use-booklet')}>Use booklet version</button>{:else}<button disabled={syncBusy||saveState!=='Saved'||!!editSession} onclick={()=>applyBankSync(item,'keep-local')}>Keep local version</button>{/if}</div>{/if}
        </article>
      {/each}
    </section>
  {/if}

  {#if saveConflict}<section class="project-screen project-notice" aria-label="Save recovery"><p>Your edits are retained. Another session saved a newer revision.</p><button onclick={downloadRecovery}>Download recovery</button><button onclick={loadLatestAndMerge}>Load latest and merge</button>
    {#if mergeReview}{#each mergeReview.conflicts as conflict}<fieldset><legend>{conflict.path}</legend><pre>Local: {JSON.stringify(conflict.local,null,2)}</pre><pre>Latest: {JSON.stringify(conflict.latest,null,2)}</pre><label>Keep<select aria-label={'Resolve '+conflict.path} value={mergeChoices[conflict.path]??''} onchange={e=>mergeChoices[conflict.path]=e.currentTarget.value}><option value="">Choose a version</option><option value="local">Local edit</option><option value="latest">Latest saved edit</option></select></label></fieldset>{/each}<button onclick={finishMerge} disabled={mergeReview.conflicts.some(c=>!mergeChoices[c.path])}>Save resolved merge</button>{/if}
  </section>{/if}

 {#if project}
  <div class="project-editor project-screen" inert={!!opening} aria-busy={!!opening&&!opening.error} class:with-navigation={navigation&&!comparison} class:with-review={!!panel&&!comparison} class:comparison>
   <section class="tool-view" hidden={!tool}><header><h2>Assembly</h2><button onclick={()=>tool=''}>Back to booklet</button></header><div hidden={tool!=='assembly'}><BookletAssemblyPanel {project} active={tool==='assembly'} onchange={change} oncreated={openProject} expanded/></div></section>
   <aside class="project-outline" class:drawer={workspaceWidth<1100} hidden={!navigation||comparison||!!tool} aria-label="Page navigation">
    {#if flexible}<FlowBookletOutline onbank={()=>bankPicker=true} onboundary={pageBoundary} {onrequestbank} bind:this={flowOutline} {project} pages={flowMap.pages} {bank} {selectedBlockId} disabled={!!editSession} selectedIds={groupSelection} onselection={ids=>groupSelection=ids} documentClipboard={groupClipboard} onpaste={pasteAtSection} onchange={change} onselect={selectFlow} onsection={id=>selectedSectionId=id} onerror={message=>error=message}/>{:else}
    <div class="outline-heading"><strong>Pages</strong><button aria-label="Close page navigation" onclick={()=>navigation=false}>×</button></div>
    <nav class="section-list">{#each projectPages as page,index}<article class:active={page.id===previewPage?.id}>
     <button class="section-select" aria-current={page.id===previewPage?.id?'page':undefined} onclick={()=>goPage(index)}><b>{page.pageNumber}</b><span>{page.section.title}{page.continuation?` (continued ${page.continuation})`:""}</span></button>
     {#if page.id===previewPage?.id}
      <details  class="page-menu"><summary>Page actions</summary><label>Page title<input  aria-label="Page title" value={page.section.title} onchange={e=>change({...project,sections:project.sections.map(s=>s.id===page.section.id?{...s,title:e.currentTarget.value}:s)})}/></label><button onclick={()=>change(moveProjectSection(project,page.section.id,-1))}>Move page up</button><button onclick={()=>change(moveProjectSection(project,page.section.id,1))}>Move page down</button><button onclick={()=>change(duplicateProjectSection(project,page.section.id))}>Duplicate page</button><button onclick={removeSection}>Delete page</button><button onclick={promoteSection}>Save as reusable module</button></details>
      <ol  class="block-list">{#each page.blocks as block,blockIndex}<li class:active={selectedBlockId===block.id}><button onclick={()=>{selectedBlockId=block.id;selectedTargetId='';}}>{blockLabel(block,blockIndex)}</button><details><summary aria-label={'Actions for '+blockLabel(block,blockIndex)}>⋯</summary><div><button onclick={()=>{selectedBlockId=block.id;panel='properties';}}>Block properties</button><button onclick={()=>change(moveProjectBlock(project,page.section.id,block.id,-1))}>Move up</button><button onclick={()=>change(moveProjectBlock(project,page.section.id,block.id,1))}>Move down</button><button onclick={()=>change(duplicateProjectBlock(project,page.section.id,block.id))}>Duplicate block</button><button onclick={()=>{selectedBlockId=block.id;removeBlock();}}>Delete block</button></div></details></li>{/each}</ol>
      <details class="page-menu" ontoggle={e=>{if(e.currentTarget.open)onrequestbank?.();}}><summary>Add content</summary><label>Block type<select aria-label="Block type" bind:value={addBlockType}><option value="rich-text">Text</option><option value="heading">Heading</option><option value="callout">Theory / callout</option><option value="review">Review activity</option><option value="activity">Activity (identify / proof / investigation)</option><option value="guided-practice">Guided practice</option><option value="worked-example">Worked example</option><option value="question">Local question</option><option value="grid">Table</option><option value="image">Image</option><option value="spacer">Spacing</option><option value="page-break">Page break</option></select></label><button onclick={addBlock}>Add block</button><button onclick={()=>bankPicker=true}>From question bank…</button></details>
     {/if}
    </article>{/each}</nav><button  class="add-page" onclick={addSection}>Add page</button>{/if}
   </aside>
   <main class="project-canvas" bind:this={canvas} hidden={!!tool}>
    {#if flexible}
    <div hidden={comparison}>{#key project.id+':'+previewAttempt}{@const attempt=previewAttempt}<FlowBookletPreview onremovebreak={id=>pageBoundary('remove',id)} onprogress={info=>previewProgress(info,attempt)} bind:this={flowPreview} {project} edition={flowEdition} options={exportSettings} {zoom} {selectedBlockId} editing={!!inlineSession||!!editSession} {composing} {selecting} {documentGeneration} onstatus={layoutChanged} onmap={map=>flowMap=map} onpage={page=>{if(page){flowActive=page.pageNumber;selectedPageId=page.id;}}} onselect={flowSelected} onContentEdit={editContent} onSpaceResize={setAnswerSpace} onmove={(id,section,before)=>flowOutline?.drop(id,section,before)}/>{/key}</div>
    {:else}
    <div class="canvas-heading"><div class="page-controls"><button aria-label="Previous page" onclick={()=>goPage(pageIndex-1)} disabled={pageIndex<=0}>←</button><strong>Page {previewPage?.pageNumber}</strong><button aria-label="Next page" onclick={()=>goPage(pageIndex+1)} disabled={pageIndex>=projectPages.length-1}>→</button></div><div class="answer-views" role="group" aria-label="Canvas answer view">{#each [['student','Questions'],['short','Short answers'],['worked','Worked solutions']] as mode}<button aria-pressed={answerView===mode[0]}  onclick={()=>{finishInline();answerView=mode[0];}}>{mode[1]}</button>{/each}</div><div class="zoom-controls" hidden={comparison}><label><span class="sr-only">Booklet zoom</span><select aria-label="Booklet zoom" bind:value={zoom}><option value="width">Fit width</option><option value="page">Fit page</option><option value="1">100%</option>{#if !['width','page','1'].includes(zoom)}<option value={zoom}>{Math.round(Number(zoom)*100)}%</option>{/if}</select></label><button aria-label="Zoom out" onclick={()=>zoomBy(-.1)}>−</button><button aria-label="Zoom in" onclick={()=>zoomBy(.1)}>+</button></div></div>
    {/if}
    <div class="source-reconstruction" hidden={flexible&&!comparison} class:paired={comparison} style:--source-min-width={Number(sourceZoom)>0?210*Number(sourceZoom)+'mm':'0px'} style:--transcribed-min-width={Number(zoom)>0?210*Number(zoom)+'mm':'0px'}>
     {#if sourceUrl}<section class="source-evidence comparison-pane" hidden={!comparison}><header><strong>Original source · p{selectedSourcePage}</strong>{#if selectedSourceRefs.length>1}<label>Source page<select aria-label="Source page" value={selectedSourcePage} onchange={e=>sourcePageChoice=Number(e.currentTarget.value)}>{#each [...new Set(selectedSourceRefs.map(r=>r.pageNumber))] as page}<option value={page}>{page}</option>{/each}</select></label>{/if}<select aria-label="Source zoom" bind:value={sourceZoom}><option value="width">Fit width</option><option value="page">Fit page</option><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option></select></header><div class="source-scroll"><img src={sourceUrl} alt={'Original source page '+selectedSourcePage} style:width={sourceZoom==='width'?'100%':sourceZoom==='page'?'auto':210*Number(sourceZoom)+'mm'} style:max-height={sourceZoom==='page'?'max(240px, calc(100dvh - 320px))':'none'} style:max-width={sourceZoom==='page'?'100%':'none'}/></div></section>{/if}

     <section class="transcribed-evidence comparison-pane">{#if comparison}<header><strong>Booklet content</strong><select aria-label="Transcribed zoom" bind:value={zoom}><option value="width">Fit width</option><option value="page">Fit page</option><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option>{#if !['width','page','1','1.5','2'].includes(zoom)}<option value={zoom}>{Math.round(Number(zoom)*100)}%</option>{/if}</select></header>{/if}<div class="paper-scroll">{#if previewPage&&(!flexible||comparison)}{#key project.id+':'+previewAttempt}{@const attempt=previewAttempt}<BookletPageGuide revision={[project,previewPage,answerView,exportSettings,zoom]} onready={()=>{if(!flexible)previewProgress({projectId:project.id,ready:true},attempt);}} onerror={error=>{if(!flexible)previewProgress({projectId:project.id,stage:'Preparing page preview',error},attempt);}}>{#if previewPage.compactAnswers}<FlowBookletPage {project} page={previewPage} pages={flowMap.pages} editMode={true} onContentEdit={editContent}/>{:else}<TranscribedBookletPage houseStyleVersion={project.settings.houseStyleVersion} blockLayouts={project.settings.layoutOverrides.blockLayouts} {zoom} page={previewPage} {bookletPages} runId={project.source?.runId??project.id} showKeyIdeasAnswers={exportSettings.showKeyIdeasAnswers} showTheorySolutions={exportSettings.showTheorySolutions} showReviewAnswers={exportSettings.showReviewAnswers} showIdentifyAnswers={exportSettings.showIdentifyAnswers} showGuidedPracticeAnswers={exportSettings.showGuidedPracticeAnswers} solutionMode={answerView} answerSpaceOverrides={effectiveSpaces} diagramColourModes={project.settings.layoutOverrides.diagramColourModes} onSpaceResize={setAnswerSpace} editMode={true} onContentEdit={editContent} isEdited={()=>false}/>{/if}</BookletPageGuide>{/key}{/if}</div></section>
    </div>
   </main>
   <aside class="workspace-panel project-inspector" class:docked={dockReview&&!comparison} hidden={!panel||!!tool} aria-label={panel==='layout'?'Spacing':panel==='review'?'Review':panel==='pdf'?'PDF configuration':panel==='metadata'?'Project details':'Block properties'}>
    <header><h2>{panel==='layout'?'Spacing':panel==='format'?'Selection options':panel==='comments'?'Comments':panel==='review'?'Review':panel==='pdf'?'PDF':panel==='metadata'?'Project details':'Block properties'}</h2><button aria-label="Close panel" onclick={()=>panel==='layout'?closeLayoutPanel():panel=''}>×</button></header>
    {#if panel==='layout'}
    <div id="booklet-layout-spacing" class="layout-spacing-panel" data-equation-control>
     {#if !activeEditor}<div class="selection-breadcrumb" title={selectionLabel}>{selectionLabel}</div>{/if}
     <BookletInspectorTabs value={inspectorTab} onchange={value=>inspectorTab=value} id="booklet-inspector"/>
     <div id="booklet-inspector-content" role="tabpanel" aria-labelledby={'booklet-inspector-'+inspectorTab}>
      {#if inspectorTab==='page'}<BookletPageControls block={selectedBlock} onboundary={pageBoundary} onlayout={pageLayout}/>
      {:else}
       {#if inspectorTab==='layout'&&selectedBlock?.type==='question'}<label class="scope-control">Scope<select aria-label="Spacing scope" bind:value={spacingScope}><option value="selection">Selected item</option><option value="question">Whole question</option></select></label>{/if}
       {#if inspectorTab==='layout'&&spacingScope==='question'&&selectedBlock?.type==='question'}<BookletQuestionSpacing {project} block={selectedBlock} onchange={spaceWholeQuestion}/>
       {:else}
        {#if rangeParagraphs.length&&inspectorTab==='layout'}<BookletRangeSpacing targets={rangeParagraphs} {canvas} oncommit={spaceSelectedParagraphs}/>{:else if activeEditor&&inspectorTab==='layout'}{#key activeEditor}<BookletSelectionSpacing editor={activeEditor} questionLabel={selectedBlock?.type==='question'?'Question '+(questionNumbers[selectedBlock.id]??''):'Content'} onboundary={()=>history.boundary()}/>{/key}
        {:else if activeEditor}{#key activeEditor}{#key inspectorTab}<div class="native-layout-fields" use:nativeLayoutPanel={{editor:activeEditor,category:inspectorTab}}></div>{/key}{/key}
        {:else}<BookletDirectLayout info={directLayout} selection={layoutSelection} category={inspectorTab} oncommand={layoutCommand}/>{#if selectedDiagram}<label>Diagram width (mm)<input type="number" min="5" max="190" value={selectedDiagram.widthMm??78} onchange={e=>changeDiagram({widthMm:Number(e.currentTarget.value)})}/></label><button onclick={editSelectedDiagram}>{selectedDiagram.format==='tikz'?'Edit TikZ':'Edit image'}</button>{/if}{/if}
       {/if}
      {/if}
     </div>
     <button class="detail-arrangement" disabled={!selectedBlock} onclick={arrangeSelectedQuestion}>Detailed arrangement…</button>
    </div>
    {/if}
    <div hidden={panel!=='comments'}><BookletComments bind:this={commentsPanel} {project} onchange={change} oncopy={copyComments} onlocate={flag=>{const target=contentTarget(project,flag.targetId);if(target){finishInline();selectedBlockId=target.block?.id??selectedBlockId;selectedTargetId=flag.targetId;selectedSectionId=target.section.id;flowPreview?.jumpTo(selectedBlockId);}else status='The original target is no longer in this booklet.';}}/>
      {#if exportedFeedback}<label>Feedback prompt<textarea aria-label="Feedback prompt" readonly rows="12" value={exportedFeedback} onclick={e=>e.currentTarget.select()}></textarea></label>{/if}
    </div>
    {#if panel==='review'}<div><BookletCoverage {project} onselect={selectCoverageTarget} layoutIssues={flowMap.issues??[]}/><BookletReviewInspector {project} blockId={selectedBlockId} {selectedTargetId} onchange={change} tabbed onDiagramEdit={requestDiagram}/></div>{/if}
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
            <button onclick={()=>togglePanel('layout')}>Spacing</button>
            {#if selectedBlock.content?.representations}<label>Teaching arrangement<select value={selectedBlock.content.layoutPreset??''} onchange={event=>patchSelected('/content/layoutPreset',event.currentTarget.value)}><option value="">Pattern and table above equation and graph</option><option value="pattern-top">Pattern above table, equation and graph</option></select></label>{/if}
            <label>Question title<input value={selectedBlock.title ?? ''} onchange={(event) => patchSelected('/title', event.currentTarget.value)} /></label>
            <label>Primary skill<select value={selectedBlock.classification?.primarySkillId ?? ''} onchange={(event) => patchSelected('/classification/primarySkillId', event.currentTarget.value)}><option value="">Choose a skill</option>{#each skills as skill}<option value={skill.id}>{skill.code} - {skill.name}</option>{/each}</select></label>
            {@const rating=questionDifficulty(selectedBlock)}
            <div data-question-difficulty><strong>Difficulty: {rating?.difficulty??'Not rated'}</strong>{#if rating}<p>Reasoning score: {rating.reasoningScore}/100</p><p>{rating.difficultyReason||'No assessment rationale recorded.'}</p>{/if}</div>
            {#if !selectedBlock.bankRef?.id}<label>Reasoning score<input type="number" min="0" max="100" placeholder="Not rated" value={rating?.reasoningScore??''} onchange={(event) => {const value=event.currentTarget.value;if(value!==''&&event.currentTarget.validity.valid)patchSelected('/classification/reasoningScore', Number(value));}} /></label>{:else}<small>Ratings refresh from the question bank. Edit the assessment in the bank.</small>{/if}
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
   {#if flexible}<div class="document-status project-screen"><button aria-label="Go to page" onclick={()=>openFinder('goto')}>Page {flowActive} of {flowMap.pages.length||'…'}</button><label>Edition<select aria-label="Booklet edition" value={flowEdition} disabled={!!editSession||printing} onchange={async e=>{const next=e.currentTarget.value;finishInline();try{await flushDocument();flowEdition=next;}catch(err){error=err.message;}}}>{#each FLOW_EDITIONS as [value,title]}<option {value}>{title}</option>{/each}</select></label><span class="layout-state" role="status">{layoutStatus.error?'Layout failed — edits retained':layoutStatus.pending?'Layout updating…':''}</span>{#if layoutStatus.error}<button onclick={()=>flowPreview?.retryLayout()}>Retry layout</button>{/if}{#if flowMap.issues?.length}<button onclick={()=>panel='review'}>{flowMap.issues.length} layout checks</button>{/if}<label class="status-zoom">Zoom<select aria-label="Booklet zoom" bind:value={zoom}><option value="width">Fit width</option><option value="1">100%</option><option value="0.75">75%</option><option value="0.5">50%</option></select></label></div>{/if}
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
 .editor-parking{position:fixed;left:-20000px;top:0;width:180mm;visibility:hidden;pointer-events:none}
 .document-toolbar :global(.equation-menu:not([open])>.me-math-tools){display:none!important}.document-toolbar :global(.equation-menu>.me-math-tools){top:100%;right:0;width:280px;display:grid;gap:6px;padding:10px;white-space:normal}.document-toolbar :global(.equation-menu .me-math-tools>label){display:none}.document-toolbar :global(.equation-menu .me-math-tools button){text-align:left}
 .layout-spacing-panel{display:grid;gap:0}.layout-spacing-panel label{display:flex;justify-content:space-between;gap:8px;margin:6px 0}.layout-spacing-panel input{width:80px}

.project-shell{position:relative}.is-opening{min-height:calc(100dvh - 100px)}
.is-opening>.project-toolbar{z-index:31}
.is-opening .project-editor,.is-opening .document-toolbar,.is-opening .empty-project{visibility:hidden}
.workspace-loading{position:absolute;inset:76px 0 0;z-index:29;background:var(--app-canvas,#e9eef4);display:flex;align-items:flex-start;justify-content:center;padding:60px 20px;box-sizing:border-box}
.loading-card{width:min(440px,100%);text-align:center;color:var(--text,#243348)}.loading-card h2{font-size:21px;overflow-wrap:anywhere}.loading-card p{font-size:15px}.loading-card button{margin:6px}.loading-card progress{width:100%;height:8px;accent-color:#52769a}
.loading-spinner{display:inline-block;width:30px;height:30px;border:3px solid #cad5df;border-top-color:#52769a;border-radius:50%;animation:booklet-loading 1s linear infinite}
@keyframes booklet-loading{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.loading-spinner{animation:none}}

@media print{.project-print.flexible-print{page:booklet-source;}}
@media print{.flexible-print .print-page{width:210mm;height:297mm;min-height:297mm;break-after:page;break-inside:avoid}.flexible-print .print-page:last-child{break-after:auto}.flexible-print :global(.preview-frame){height:297mm!important;width:210mm!important}.flexible-print :global(.preview-page){transform:none!important;position:static!important}.flexible-print :global(.booklet-page){height:297mm!important;overflow:visible!important}}
  .bank-sync-panel{padding:1rem;max-height:65vh;overflow:auto;border-bottom:1px solid #94a3b8;background:var(--panel,#fff);color:var(--text,#24324a)}
  .bank-sync-panel h2{font-size:1rem;margin:0}.bank-sync-item{padding:.8rem 0;border-top:1px solid #94a3b8;margin-top:.75rem}.bank-sync-item h3{font-size:.95rem}.sync-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem}.sync-comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.sync-comparison>section{background:white;color:#24324a;padding:1rem;overflow:auto}.bank-sync-panel summary{cursor:pointer;padding:.5rem 0}
  @media(max-width:700px){.sync-comparison{grid-template-columns:1fr}}


.answer-views{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.answer-views button[aria-pressed=true]{background:#245f93;color:white;border-color:#245f93}

 .project-shell{--ink:var(--text-strong,#23395d);--muted:var(--text-muted,#66758d);--border:var(--line,#d5dde7);--surface:var(--panel,#fff);color:var(--text,#243348);font-size:16px;min-width:0;width:100%;box-sizing:border-box}.project-toolbar{position:sticky;top:0;z-index:21;display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface);flex-wrap:wrap}.project-picker{flex:1;min-width:180px;max-width:420px}.project-picker select{width:100%}.toolbar-actions,.canvas-heading,.page-controls,.zoom-controls,.outline-heading,.row-actions{display:flex;align-items:center;gap:8px}.toolbar-actions{margin-left:auto;flex-wrap:wrap}.save-state{font-size:14px;color:var(--muted)}button,select,input,summary{box-sizing:border-box;font:inherit;min-height:36px}button,select,input{border:1px solid var(--border);border-radius:6px;background:var(--surface);color:inherit;padding:6px 10px;max-width:100%}button,summary{cursor:pointer}button:disabled{opacity:.45;cursor:default}button.primary{background:#286647;color:#fff}button.danger{color:#bc5149}button:focus-visible,summary:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #438ccc;outline-offset:2px}summary{display:flex;align-items:center;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:14px}details[open]>summary{font-weight:700}.menu{position:relative}.menu>div{position:absolute;right:0;top:100%;z-index:25;width:230px;display:grid;gap:8px;padding:12px;background:var(--surface);box-shadow:0 6px 24px #0003;border:1px solid var(--border);border-radius:8px}.project-editor{position:relative;display:grid;grid-template-columns:minmax(0,1fr);height:calc(100dvh - 190px);min-height:420px;overflow:hidden}.project-editor.with-navigation{grid-template-columns:240px minmax(0,1fr)}.project-editor.with-review{grid-template-columns:minmax(0,1fr) 360px}.project-editor.with-navigation.with-review{grid-template-columns:240px minmax(0,1fr) 360px}.project-outline{min-width:0;overflow:auto;padding:12px;background:var(--surface);border-right:1px solid var(--border)}[hidden]{display:none!important}.outline-heading{justify-content:space-between;margin-bottom:12px}.section-list article{margin:4px 0 12px;border:1px solid var(--border);border-radius:8px}.section-list article.active{border-color:#438ccc}.section-select{display:flex;gap:10px;text-align:left;width:100%;border:0;background:transparent;align-items:start;padding:10px}.section-select span{overflow-wrap:anywhere}.section-select b{color:#438ccc}.block-list{list-style:none;padding:0 6px;margin:8px 0}.block-list li{display:grid;grid-template-columns:minmax(0,1fr) 36px;margin:6px 0;align-items:start}.block-list li.active{box-shadow:inset 3px 0 #438ccc}.block-list li>button{border:0;text-align:left;font-size:14px;background:transparent;overflow-wrap:anywhere}.block-list details[open]{grid-column:1/-1}.block-list details>div{display:grid;padding:6px;gap:4px}.page-menu{margin:6px}.page-menu button{width:100%;margin-top:6px}.page-menu label{display:grid;font-size:14px;margin-top:8px}.page-menu input,.page-menu select{width:100%;min-width:0}.add-page{width:100%;margin-top:8px}.project-canvas{min-width:0;overflow:auto;background:var(--app-canvas,#e9eef4);padding:16px}.canvas-heading{justify-content:space-between;position:sticky;top:-16px;z-index:8;background:var(--app-canvas,#e9eef4);padding:0 0 16px;flex-wrap:wrap}.source-reconstruction{min-width:0}.source-reconstruction.paired{display:grid;grid-template-columns:minmax(var(--source-min-width,0px),1fr) minmax(var(--transcribed-min-width,0px),1fr);gap:24px;align-items:start}.source-evidence,.paper-scroll{min-width:0;overflow:auto}.comparison-pane{min-width:0}.comparison-pane header{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:36px;margin-bottom:12px}.paired .source-evidence,.paired .source-scroll,.paired .paper-scroll{height:auto;overflow:visible}.paired .paper-scroll :global(.preview-frame){margin-inline:auto}.source-scroll{overflow:auto}.source-scroll img{display:block;margin:auto;background:white}.paper-scroll{background:transparent}.workspace-panel{box-sizing:border-box;position:absolute;right:0;top:0;bottom:0;width:min(420px,100%);z-index:15;padding:16px;background:var(--surface);border-left:1px solid var(--border);box-shadow:-8px 0 32px #0002;overflow:auto}.workspace-panel.docked{position:relative;width:360px;box-shadow:none}.workspace-panel>header,.tool-view>header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}.workspace-panel h2,.tool-view h2{font-size:20px;margin:0}.workspace-panel label{display:grid;gap:6px;margin:12px 0;font-size:14px}.workspace-panel input,.workspace-panel select{width:100%}.workspace-panel input[type=checkbox]{width:auto}.export-settings label:has(input[type=checkbox]){display:flex;align-items:center}.export-settings{margin-bottom:20px}.project-notice{padding:16px;background:var(--surface);border:1px solid #b98539;overflow-wrap:anywhere}.project-notice pre{white-space:pre-wrap;font-size:14px}.tool-view{grid-column:1/-1;overflow:auto;padding:24px}.sr-only{position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden}.project-print{display:none}.project-cover,.answers-divider{box-sizing:border-box;width:210mm;height:297mm;padding:45mm 24mm;background:#fff;color:var(--ink);break-after:page}.project-cover h1,.answers-divider h1{font-size:30pt}.project-cover p{font-size:16pt}.print-page{break-after:page}
 @media(max-width:1099px){.project-editor.with-navigation{grid-template-columns:minmax(0,1fr)}.project-outline.drawer{position:absolute;inset:0 auto 0 0;width:240px;box-sizing:border-box;z-index:16;box-shadow:8px 0 32px #0003}.project-editor{height:calc(100dvh - 230px)}}
 @media(max-width:600px){.project-toolbar{padding:8px;gap:8px}.project-picker{min-width:150px;max-width:none}.save-state{font-size:14px}.toolbar-actions{margin:0;gap:6px}button,summary,select,input{min-height:44px}.toolbar-actions button,.toolbar-actions summary{font-size:14px;padding:6px 8px}.project-canvas{padding:8px}.canvas-heading{top:-8px;gap:8px}.source-reconstruction.paired{grid-template-columns:1fr}.project-editor{height:calc(100dvh - 280px)}.zoom-controls{gap:4px}.block-list li{grid-template-columns:minmax(0,1fr) 44px}.menu>div{position:fixed;left:8px;right:8px;top:auto;width:auto}}
  @media(pointer:coarse){button,select,input,summary{min-height:44px}}
  .tool-view :global(.assembly-panel){background:var(--surface);color:inherit}.tool-view :global(label),.tool-view :global(table),.tool-view :global(pre),.tool-view :global(.hint){font-size:14px}.tool-view :global(button),.tool-view :global(input),.tool-view :global(select){min-height:36px;font:inherit;background:var(--surface);color:inherit}.tool-view :global(table){display:block;overflow:auto;max-width:100%}@media(pointer:coarse){.tool-view :global(button),.tool-view :global(input),.tool-view :global(select){min-height:44px}}
  .project-print:global(.qa-print){display:block;position:absolute;left:-100000px;top:0;width:210mm}.project-print:global(.qa-print) :global(.preview-page){position:static;transform:none}.project-print:global(.qa-print) :global(.preview-frame){width:210mm;height:297mm;overflow:visible}.project-print:global(.qa-print) :global(.flow.preview-frame),.project-print:global(.qa-print) :global(.flow .preview-page),.project-print:global(.qa-print) :global(.flow .booklet-page){width:180mm;height:auto;min-height:0;overflow:visible}.project-print:global(.qa-print) :global(.flow .booklet-page){display:block;padding:0}.project-print:global(.qa-print) :global(.flow .booklet-page main){padding:0}.project-print:global(.qa-print) :global(.flow .booklet-footer){display:none}
 .short-answers .print-page{break-after:auto;margin-bottom:5mm}.answer-heading{font-size:20pt;color:#24282d;margin:0 0 6mm}.export-help{font-size:14px;line-height:1.4}
  @page studio-flow{background:white;size:A4;margin:10mm 15mm 15mm;@bottom-right{vertical-align:bottom;padding-bottom:3mm;content:counter(page) " / " counter(pages);font-size:8pt;color:#66758d}}
  @page booklet-source { size:A4; margin:0; }
  @media print {
    /* Printing snapshots the first animation frame. Keep the document visible
       when leaving the screen-only workspace, without a transformed page root. */
    :global(.route-stage:has(.project-shell)) { animation:none!important; opacity:1!important; transform:none!important; }
    :global(.site-content:has(.project-shell)) { background:white; min-height:0; }
  }
  @media print{.project-print.source-pages{page:booklet-source}.source-pages .print-page{width:210mm;min-height:297mm}.source-pages .print-page:last-child{break-after:auto}:global(html),:global(body){color-scheme:light!important;background:white!important;color:#24282d!important}.project-shell :global(.project-screen){display:none!important}.project-screen{display:none!important}.project-shell{--ink:#23395d;max-width:none;margin:0;padding:0}.project-print{display:block;page:studio-flow;background:white}.project-cover,.answers-divider{display:block;width:180mm;height:270mm;padding:35mm 10mm}.print-page{display:block;width:180mm;min-height:0}.print-page:last-child{break-after:auto}}

 /* Panels overlay the workspace; opening one never changes the paper width. */
 .project-editor,.project-editor.with-navigation,.project-editor.with-review,.project-editor.with-navigation.with-review{display:block;position:relative}
 .project-canvas{height:100%;box-sizing:border-box}.project-outline,.project-outline.drawer{position:absolute;inset:0 auto 0 0;width:240px;box-sizing:border-box;z-index:16;box-shadow:4px 0 16px #0002}.workspace-panel,.workspace-panel.docked{position:absolute;inset:0 0 0 auto;width:360px;max-width:calc(100% - 24px);z-index:17;box-shadow:-4px 0 16px #0002}
 .document-toolbar{position:relative;z-index:20;height:124px;box-sizing:border-box;align-content:flex-start;display:flex;align-items:center;flex-wrap:wrap;gap:5px;padding:8px 16px;border-bottom:1px solid var(--border,#cbd5e1);background:var(--panel,#fff);font:14px system-ui}.document-toolbar button,.document-toolbar select,.document-toolbar summary{font:inherit;min-height:32px;padding:4px 8px}.document-toolbar input[type=color]{box-sizing:border-box;width:32px;height:32px;padding:2px}.document-insert{position:relative}.document-insert>div{position:absolute;top:100%;left:0;width:220px;padding:8px;display:grid;background:var(--panel,#fff);border:1px solid #b5c1cf;border-radius:6px;box-shadow:0 8px 20px #0002}.document-insert:not([open])>div{display:none}.document-insert>div button{text-align:left}.selection-tools{display:flex;gap:4px;align-items:center}.workspace-panel textarea{width:100%;box-sizing:border-box;font:13px system-ui}
 :global(.booklet-document-field.me-document-editor){border:0!important;padding:0!important;margin:0!important;background:transparent!important;color:inherit!important;font:inherit!important;box-shadow:none!important}
 :global(.booklet-document-field>.me-toolbar),:global(.booklet-document-field>.me-properties){display:none!important}
 :global(.booklet-document-field>.me-content){min-height:0!important;padding:0!important;border:0!important;outline:none!important;background:transparent!important;color:inherit!important;font:inherit!important}
 .document-toolbar :global(.me-math-tools){position:absolute;z-index:25;top:calc(100% + 4px);right:16px;width:min(850px,calc(100vw - 32px));max-height:50vh;overflow:auto;box-sizing:border-box;background:#edf5fc;color:#24364b;box-shadow:0 6px 18px #0002}
 .document-toolbar :global(.me-math-tools button){background:#fff;color:#24364b}
 :global(.booklet-document-field .me-content [data-math]){max-width:100%}
 :global(.booklet-document-field .me-content [data-math] math-field){max-width:100%;box-sizing:border-box}
 :global(.editable-booklet-text.edit-mode .clickable:empty){min-height:1em}:global(.editable-booklet-text.edit-mode .clickable:empty::before){content:'Write here';color:#90a0ad;pointer-events:none}
 @media print{.document-toolbar{display:none!important}}
 .document-colours{display:flex;gap:3px;max-width:230px;flex-wrap:wrap}.document-toolbar .colour-swatch{width:21px;height:21px;min-height:21px;padding:0;border:1px solid #8d98a7;border-radius:3px}.colour-swatch:focus-visible{outline:2px solid #438ccc;outline-offset:2px}.document-insert>div{max-height:65vh;overflow:auto}.document-insert>div details>button{display:block;width:100%;margin-block:3px}

 :global(.document-diagram-resize){position:absolute;right:0;bottom:0;z-index:9;width:24px;height:24px;min-height:0!important;padding:0!important;background:white;color:#34546b;border:1px solid #b7c9d6;cursor:ew-resize;opacity:.15}:global([data-diagram-id]:hover>.document-diagram-resize),:global(.document-diagram-selected>.document-diagram-resize){opacity:1}:global(.document-diagram-selected){outline:2px solid #438ccc;outline-offset:2px}.selection-tools input[type=number]{width:65px}
 @media print{:global(.document-diagram-resize){display:none!important}:global(.document-diagram-selected){outline:none!important}}


 @media screen {
 :global(.route-stage:has(.project-shell)){animation:none}:global(.site-content:has(.project-shell)){min-height:0;padding-bottom:0}
 .project-shell{height:calc(100dvh - var(--workspace-top));min-height:0;display:flex;flex-direction:column;overflow:hidden;font-size:14px}
 .project-toolbar{flex:none;position:relative;min-height:48px;padding:6px 12px;gap:8px}.project-toolbar button,.project-toolbar select,.project-toolbar summary{min-height:32px;font-size:14px}.project-picker{max-width:320px}.toolbar-actions{gap:5px}
 .document-toolbar{height:auto;min-height:44px;flex:none;padding:6px 12px;gap:4px;align-content:center;font-size:14px}.document-colours{max-width:none}.document-toolbar .selection-tools{gap:4px}.selection-tools label{font-size:14px}.document-toolbar .colour-menu>div{width:230px}.document-toolbar .colour-menu input[type=color]{width:100%}
 .project-editor,.project-editor.with-navigation,.project-editor.with-review,.project-editor.with-navigation.with-review{display:grid;grid-template-columns:minmax(0,1fr);flex:1;min-height:0;height:auto;overflow:hidden}
 .project-editor.with-navigation{grid-template-columns:240px minmax(0,1fr)}.project-editor.with-review{grid-template-columns:minmax(0,1fr) 320px}.project-editor.with-navigation.with-review{grid-template-columns:240px minmax(0,1fr) 320px}
 .project-outline,.project-outline.drawer{position:relative;inset:auto;width:auto;box-shadow:none;overflow:auto;padding:12px}.workspace-panel,.workspace-panel.docked{position:relative;inset:auto;width:auto;max-width:none;box-shadow:none;min-height:0;overflow:auto;padding:12px}
 .workspace-panel>header{margin-bottom:8px}.workspace-panel h2{font-size:16px}.workspace-panel label{margin:6px 0;gap:4px}.workspace-panel input,.workspace-panel select,.workspace-panel button{min-height:32px;font-size:14px}.selection-breadcrumb{font-size:13px;color:var(--muted);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.scope-control{display:flex!important;align-items:center;justify-content:space-between}.scope-control select{width:auto}
 .native-layout-fields :global(.me-layout-fields){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px}.detail-arrangement{width:100%;margin-top:12px}.workspace-toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:50;padding:8px 16px;background:var(--panel,#fff);border:1px solid var(--border);border-radius:6px;box-shadow:0 3px 16px #0002;font-size:14px}
 .project-canvas{height:auto;min-height:0;box-sizing:border-box;padding:12px}.canvas-heading{top:-12px;padding-bottom:8px;gap:8px;min-height:36px;font-size:13px}.canvas-heading label{display:flex;align-items:center;gap:6px}.canvas-heading select{min-height:30px;font-size:13px;padding:3px 6px}.project-notice{flex:none;padding:8px 12px}.bank-sync-panel{max-height:40vh;overflow:auto}
 }
 @media screen and (max-width:1099px){.project-editor.with-navigation,.project-editor.with-review,.project-editor.with-navigation.with-review{grid-template-columns:minmax(0,1fr)}.project-outline,.project-outline.drawer{position:absolute;inset:0 auto 0 0;width:240px;z-index:16;box-shadow:4px 0 16px #0002}.workspace-panel,.workspace-panel.docked{position:absolute;inset:0 0 0 auto;width:320px;max-width:95%;z-index:17;box-shadow:-4px 0 16px #0002}.toolbar-actions{flex-wrap:wrap}.document-toolbar{max-height:140px;overflow:visible}}
 @media screen and (pointer:coarse){.project-shell button,.project-shell select{min-height:44px}}

 @media screen {
 :global(body:has(.word-workspace) nav.top),:global(body:has(.word-workspace) nav.mobile-nav),:global(body:has(.word-workspace) .workspace-tabs),:global(body:has(.word-workspace) .studio-header),:global(body:has(.word-workspace) .site-footer){display:none!important}
 :global(body:has(.word-workspace)),:global(body:has(.word-workspace) .site-content),:global(body:has(.word-workspace) .studio-shell){margin:0;padding:0;min-height:0;overflow:hidden}
 .word-workspace{height:100dvh;--workspace-top:0px!important}
 .word-workspace .project-toolbar{height:48px;min-height:48px;flex-wrap:nowrap;padding:5px 10px;gap:6px}
 .word-workspace .project-picker{min-width:120px;max-width:320px}.word-workspace .toolbar-actions{flex-wrap:nowrap;white-space:nowrap}
 .word-workspace .document-toolbar{height:44px;min-height:44px;max-height:44px;flex-wrap:nowrap;padding:5px 10px;white-space:nowrap;gap:4px}
 .word-workspace .document-toolbar select{width:auto}.word-workspace .document-toolbar .selection-tools{min-width:0}.word-workspace .document-toolbar label{white-space:nowrap}
 .word-workspace .project-editor,.word-workspace .project-editor.with-navigation,.word-workspace .project-editor.with-review,.word-workspace .project-editor.with-navigation.with-review{display:block;position:relative}
 .word-workspace .project-canvas{height:100%;padding:18px 24px}.word-workspace .project-outline{position:absolute;inset:0 auto 0 0;width:260px;z-index:16;box-shadow:4px 0 16px #0002}.word-workspace .workspace-panel{position:absolute;inset:0 0 0 auto;width:320px;max-width:95%;z-index:17;box-shadow:-4px 0 16px #0002}
 .document-status{display:flex;align-items:center;gap:12px;flex:none;box-sizing:border-box;height:28px;padding:1px 10px;background:var(--surface);border-top:1px solid var(--border);font-size:12px;white-space:nowrap}
 .document-status label{display:flex;align-items:center;gap:6px}.document-status button,.document-status select{font-size:12px;min-height:24px;height:24px;padding:1px 6px;border-color:transparent}.status-zoom{margin-left:auto}.layout-state{overflow:hidden;text-overflow:ellipsis;color:var(--muted)}
 .word-workspace .project-notice:not(:has(button)){position:absolute;bottom:32px;left:20px;max-width:calc(100% - 40px);z-index:30;border-radius:6px;box-shadow:0 4px 12px #0002}
 .word-workspace :global(.editable-booklet-text .clickable:hover){outline-color:transparent;background:transparent}.word-workspace :global([data-layout-handle]),.word-workspace :global(.document-diagram-resize){opacity:0}.word-workspace :global([data-arrangement-id]:hover>[data-layout-handle]),.word-workspace :global([data-layout-handle]:focus-visible),.word-workspace :global(.document-diagram-selected>.document-diagram-resize){opacity:1}
 .document-finder{margin:0;position:fixed;z-index:100;top:100px;left:50%;transform:translateX(-50%);box-sizing:border-box;width:min(540px,calc(100% - 32px));padding:16px;border:1px solid var(--line,#cbd5e1);border-radius:10px;background:var(--panel,#fff);color:var(--text,#243348);box-shadow:0 12px 48px #0004;font:14px system-ui}.document-finder header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.document-finder input{width:100%}.document-finder form{display:flex;gap:8px}.finder-results{display:grid;gap:4px;max-height:50vh;overflow:auto;margin-top:8px}.finder-results button{text-align:left;white-space:normal}.finder-results small{display:block;color:var(--text-muted,#64748b);margin-bottom:3px}
 }
 @media screen and (max-width:1000px){.word-workspace .project-toolbar,.word-workspace .document-toolbar{overflow-x:auto;overflow-y:clip}.word-workspace .project-picker{min-width:140px}.word-workspace .document-toolbar .document-insert>div,.word-workspace .project-toolbar .menu>div{position:fixed;top:92px;left:auto;right:12px;max-height:65vh}.document-status{gap:3px}.document-status label{gap:2px}.document-status label>select{max-width:220px}}
 @media screen and (pointer:coarse){.word-workspace .project-toolbar,.word-workspace .document-toolbar{height:52px;max-height:52px;min-height:52px}.word-workspace button,.word-workspace select{min-height:44px}.document-status{height:44px}}
</style>
