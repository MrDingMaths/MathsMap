import {mount,unmount} from 'svelte';
import 'katex/dist/katex.min.css';
import '../../src/app.css';
const frozen=new URLSearchParams(location.search).get('frozen');
const componentPath=frozen?frozen+'/src/components/TranscribedBookletPage.svelte':'/src/components/TranscribedBookletPage.svelte';
const {default:TranscribedBookletPage}=await import(/* @vite-ignore */ componentPath);
let instance;
window.renderCandidate=async({pages,pageNumber,mode='student',theory=true})=>{
 if(instance)await unmount(instance);
 const page=pages.find(p=>p.pageNumber===pageNumber);
 instance=mount(TranscribedBookletPage,{target:document.getElementById('app'),props:{page,bookletPages:pages,runId:'linear-relationships-studio-v1',solutionMode:mode,showTheorySolutions:theory}});
};
const style=document.createElement('style');style.textContent='body{margin:0;background:white!important;color:#222}#app{width:210mm}.preview-frame{width:210mm!important;height:297mm!important;overflow:visible!important}.preview-page{left:0!important;transform:none!important}@media print{@page{size:A4;margin:0}body,#app{width:210mm}.preview-frame{break-after:page}}';document.head.append(style);
