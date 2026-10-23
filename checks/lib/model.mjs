// The one model path of the checks and the polish steps: GPT-6.1 Sol at low reasoning through the
// existing worker path (first-pass/review.mjs callWorker, the per-booklet three-worker lease). Read-only
// workers cannot open files or run commands, so everything they need is in the prompt (and the attached
// images). Returns the parsed JSON object the worker answered with.
import {callWorker,defaultRunner,defaultLease,canonicalRunDir} from '../../first-pass/review.mjs';

export async function askJson({prompt,project,workDir,name,images=[],runner=defaultRunner,lease=defaultLease}){
 const started=Date.now();
 const {result,usage}=await callWorker({runner,lease,canonicalRunDir:canonicalRunDir(project),workDir,name,prompt,images});
 return {result,usage:usage??null,elapsedMs:Date.now()-started};
}
