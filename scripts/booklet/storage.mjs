import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {archiveFiles, inside, noLinks, revisionCandidates, restoreArchive, sha256, walkFiles, withArchiveLock} from './storage-archive.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const archiveRoot = path.join(root, 'booklets/.storage-archives');
const args = process.argv.slice(2), command = args.shift();
const values = {}, flags = new Set();
while (args.length) {
  const arg = args.shift();
  if (['--apply','--retired'].includes(arg)) flags.add(arg);
  else if (['--tree','--manifest','--out','--only'].includes(arg) && args[0] && !args[0].startsWith('--')) values[arg] = args.shift();
  else throw Error('Unknown or incomplete argument: '+arg);
}
const allowedTrees = [
  '.booklet-work/recovery', 'booklets/archives',
  '.booklet-work/trig-bank/stage', '.booklet-work/trig-bank/stage-final',
  '.booklet-work/volume-bank/staged', '.booklet-work/volume-bank/sync-roundtrip',
  '.booklet-work/studio-load/verification',
];
const tracked = () => new Set(execFileSync('git',['ls-files','-z'],{cwd:root,maxBuffer:32*1024**2}).toString().split('\0').filter(Boolean));
async function assertNoLiveReferences(tree) {
  const references=[];
  for(const directory of ['booklets/projects','booklets/question-bank','booklets/module-bank','src','public/content','public/quizzes']) {
    const inventory=await walkFiles(root,directory);
    for(const file of inventory.files) {
      if(file.includes('/.revisions/') || !/\.(json|js|svelte)$/.test(file)) continue;
      const text=(await fs.readFile(inside(root,file),'utf8')).replaceAll('\\','/').replaceAll(/\/{2,}/g,'/');
      if(text.includes(tree)) references.push(file);
    }
  }
  if(references.length) throw Error('Archive candidate has live content/code references: '+references.join(', '));
}
async function run() {
  if (command === 'verify' || command === 'restore') {
    if (!values['--manifest']) throw Error('--manifest is required');
    if (command === 'restore' && !values['--out']) throw Error('Restore requires a new --out directory; never restore over live projects');
    const manifestPath = inside(root, values['--manifest']);
    if (!manifestPath.startsWith(path.join(archiveRoot,'manifests')+path.sep)) throw Error('Manifest must be in the local archive store');
    const outputRoot = values['--out'] ? inside(root, values['--out']) : undefined;
    if (outputRoot && !outputRoot.startsWith(path.join(root,'.booklet-work')+path.sep)) throw Error('Restore into a new .booklet-work directory for review');
    return restoreArchive({archiveRoot,manifestPath,outputRoot:command==='restore'?outputRoot:undefined,only:values['--only']});
  }
  if (!['revisions','archive'].includes(command)) throw Error('Usage: storage.mjs revisions [--retired] [--apply] | archive --tree PATH [--apply] | verify --manifest PATH | restore --manifest PATH --out .booklet-work/NEW [--only PATH]');
  let plan;
  if (command === 'revisions') {
    plan = await revisionCandidates(path.join(root,'booklets/projects'), {retired:flags.has('--retired')});
  } else {
    const tree = values['--tree'];
    if (!allowedTrees.includes(tree)) throw Error('Tree is not a reviewed storage candidate: '+tree);
    await assertNoLiveReferences(tree);
    const inventory = await walkFiles(root, tree);
    // Keep sources and small decision/receipt/report files readily accessible.
    const preserved = inventory.files.filter(file=>/\.(pdf|docx?|md|log|mjs|py)$/i.test(file) || /(?:report|receipt|manifest|decision|review|snapshot|correction|assessment)[^/]*\.json$/i.test(file));
    const keep = new Set(preserved);
    plan = {sourceRoot:root,files:inventory.files.filter(file=>!keep.has(file)),preserved,skippedLinks:inventory.skippedLinks};
  }
  // Never remove anything versioned by Git, even if it appears in an archive tree.
  const versioned = tracked(), protectedFiles = [];
  plan.files = plan.files.filter(file=>{
    const relative = path.relative(root,inside(plan.sourceRoot,file)).replaceAll(path.sep,'/');
    if (versioned.has(relative)) { protectedFiles.push(relative); return false; } return true;
  });
  const metadata = {histories:plan.summary,tree:values['--tree'],preserved:plan.preserved,protectedFiles,skippedLinks:plan.skippedLinks};
  let bytes = 0;
  for (const file of plan.files) bytes += (await fs.stat(inside(plan.sourceRoot,file))).size;
  if (!flags.has('--apply')) return {dryRun:true,files:plan.files.length,bytes,...metadata};
  // Hash the kept receipts so the archive records its publication/recovery context.
  metadata.evidence = [];
  for (const file of plan.preserved??[]) if (/\.json$/i.test(file)) metadata.evidence.push({path:file,sha256:sha256(await fs.readFile(inside(root,file)))});
  await noLinks(archiveRoot);
  return archiveFiles({...plan,archiveRoot,label:command==='revisions'?'Project revision retention':values['--tree'],prune:true,metadata});
}
console.log(JSON.stringify(flags.has('--apply') ? await withArchiveLock(archiveRoot,run) : await run(), null, 2));
