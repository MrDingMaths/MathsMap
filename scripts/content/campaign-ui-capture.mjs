import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { readSkill, hashValue } from './campaign-support.mjs';
import {THEORY_UI_SAMPLING_PROFILE,theoryExampleLayout} from './campaign-ui-sampling.mjs';
const root = process.cwd(), campaign = 'worked-examples-2026-09';
const baseURL = (process.env.MATHSMAP_CAMPAIGN_BASE_URL || 'http://127.0.0.1:5202').replace(/\/$/, '');
const requiredFiles = ['src/components/TheoryView.svelte', 'src/lib/theory-content.js', 'src/components/InlineContent.svelte', 'src/components/Math.svelte', 'src/lib/inline-content.js', 'src/lib/render-math.js', 'src/lib/document-content.js', 'public/libs/maths-editor/document-model.mjs', 'src/app.css', 'src/views/SkillDetail.svelte'];
const snapshotAppFiles = () => requiredFiles.map(file => ({ path: file, hash: hashValue(fs.readFileSync(path.join(root, file))) }));
const sameAppFiles = (before, after) => JSON.stringify(before) === JSON.stringify(after);
const representative = process.argv.includes('--sample');
const targetOption = process.argv.find(arg => arg.startsWith('--example='));
const targetIndex = targetOption === undefined ? null : Number(targetOption.slice('--example='.length));
if (targetIndex !== null && (!Number.isInteger(targetIndex) || targetIndex < 0)) throw new Error('Target example needs a nonnegative integer index');
const hintsOption=process.argv.find(arg=>arg.startsWith('--selection-hints='));
const auditOnly=process.argv.includes('--audit-only');
if(!auditOnly&&!hintsOption)throw Error('Use --audit-only for genuine measurements, then --selection-hints=exact-reference-list.json for cohort screenshots');
const ids = process.argv.slice(2).filter(arg => arg !== '--sample' && arg !== targetOption && arg !== '--audit-only' && arg !== hintsOption), browser = await chromium.launch({ headless: true, channel: 'chrome' });
// Previous actual measurements are selection hints only. This run re-renders and
// checks every current example; the verifier independently requires dense membership.
const hints=hintsOption?JSON.parse(fs.readFileSync(hintsOption.slice('--selection-hints='.length))):[];
const measured=[];for(const reference of hints){const bytes=fs.readFileSync(reference.path);if(hashValue(bytes)!==reference.hash)throw Error('Selection measurement artifact changed');const old=JSON.parse(bytes),id=old.skillId;if(!ids.includes(id))throw Error('Foreign selection hints');const state=readSkill(root,campaign,id),pair=JSON.parse(fs.readFileSync(state.stage.candidatePath));for(const r of old.rows){const e=pair.content.theory.workedExamples[r.index];if(hashValue(e)!==r.itemHash)throw Error('Selection hint candidate changed');measured.push({...r,skillId:id,layoutHash:theoryExampleLayout(e)});}}
const planned=new Map(ids.map(id=>[id,[]]));const family=new Map();for(const r of measured){const k=r.name+':'+r.layoutHash;if(!family.has(k))family.set(k,[]);family.get(k).push(r);}
for(const f of family.values())for(const r of [f[0],f.reduce((a,b)=>a.height>=b.height?a:b),f.reduce((a,b)=>a.mathWidth>=b.mathWidth?a:b)])if(!planned.get(r.skillId).some(x=>x.name===r.name&&x.index===r.index))planned.get(r.skillId).push(r);
const context = await browser.newContext({ deviceScaleFactor: 1 });
try {
  for (const id of ids) {
    const state = readSkill(root, campaign, id), pair = JSON.parse(fs.readFileSync(path.join(root, state.stage.candidatePath)));
    const out = path.join(root, '.agywork/content-campaign', campaign, id, 'ui-' + Date.now()); fs.mkdirSync(out, { recursive: true });
    const appFilesBefore = snapshotAppFiles();
    fs.writeFileSync(path.join(out, 'app-files-before.json'), JSON.stringify(appFilesBefore, null, 2));
    const checks = [], artifacts = [], rows=[];
    const assetPaths=['src/main.js','src/lib/math-writing-box.js','public/libs/maths-editor/equation-spacing.mjs','node_modules/katex/dist/katex.mjs','node_modules/katex/dist/katex.min.css',...fs.readdirSync('node_modules/katex/dist/fonts').sort().map(f=>'node_modules/katex/dist/fonts/'+f)];
    const fileRef=p=>({path:p,hash:hashValue(fs.readFileSync(p))});
    const browserBinding={browserVersion:browser.version(),executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'};browserBinding.executableHash=hashValue(fs.readFileSync(browserBinding.executablePath));
    const mechanism={profile:THEORY_UI_SAMPLING_PROFILE,container:'.theory .worked-example',browserVersion:browser.version(),browserBinding,viewports:[{name:'desktop',width:1280,height:900},{name:'mobile',width:390,height:844}],appFiles:appFilesBefore,assets:assetPaths.map(fileRef),systemFonts:['segoeui.ttf','segoeuib.ttf','segoeuii.ttf','segoeuiz.ttf'].map(f=>fileRef('C:/Windows/Fonts/'+f)),producerFiles:[fileRef('scripts/content/campaign-ui-capture.mjs'),fileRef('scripts/content/campaign-ui-sampling.mjs')]};
    for(const e of pair.content.theory.workedExamples)theoryExampleLayout(e);
    const mf=path.join(out,'sampling-mechanism.json');fs.writeFileSync(mf,JSON.stringify(mechanism,null,2));
    for (const [name, width, height] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
      const page = await context.newPage(); await page.setViewportSize({ width, height });
      await page.route(`**/content/${id}.json`, route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(pair.content) }));
      await page.goto(`${baseURL}/#/skill/${id}`, { waitUntil: 'domcontentloaded' });
      await page.locator('.worked-example').first().waitFor();
      const diagrams = page.locator('.theory .tikz-wrap');
      for (let index = 0; index < await diagrams.count(); index++) {
        const diagram = diagrams.nth(index);
        await diagram.evaluate(el => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 180, behavior: 'instant' }));
        await diagram.locator('svg.tikz-svg').waitFor({ state: 'attached', timeout: 180000 });
      }
      const examples = page.locator('.worked-example');
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.querySelectorAll('.theory img')].map(image => image.complete ? Promise.resolve() : new Promise((resolve, reject) => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', () => reject(new Error('Theory image failed')), { once: true }); })));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const count = await examples.count();
      const heights = await examples.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
      const densest = heights.indexOf(Math.max(...heights));
      if (targetIndex !== null && targetIndex >= count) throw new Error('Target example does not exist');
      const actualRows=await examples.evaluateAll((elements,name)=>elements.map((el,index)=>{const q=el.querySelector('.example-question'),s=el.querySelector('.example-solution'),r=el.getBoundingClientRect(),math=[...el.querySelectorAll('.katex')].map(n=>n.getBoundingClientRect());return{index,name,viewport:{name,width:innerWidth,height:innerHeight},container:'.theory .worked-example',actualRender:true,questionVisible:!!q&&q.getBoundingClientRect().height>0,solutionVisible:!!s&&s.getBoundingClientRect().height>0,workingEmpty:!s?.textContent.trim(),fontsReady:document.fonts.status==='loaded',katexErrors:el.querySelectorAll('.katex-error').length,diagramCount:[...el.querySelectorAll('svg,img,.tikz-wrap,.diagram-wrap,canvas')].filter(n=>!n.closest('.katex')).length,overflow:document.documentElement.scrollWidth>innerWidth||el.scrollWidth>el.clientWidth+1,mathOutsideExample:math.filter(m=>m.left<r.left-1||m.right>r.right+1).length,width:r.width,height:r.height,mathWidth:Math.max(1,...math.map(m=>m.width))};}),name);
      for(const row of actualRows){const e=pair.content.theory.workedExamples[row.index];rows.push({...row,itemHash:hashValue(e),layoutHash:theoryExampleLayout(e)});}
      const selectedIndices=planned.get(id).filter(r=>r.name===name).map(r=>r.index);
      for (const index of selectedIndices) {
        const example = examples.nth(index);
        await example.evaluate(el => {
          const obstructionBottom = Math.max(0, ...['nav.top', '.page-head'].flatMap(selector => [...document.querySelectorAll(selector)].map(node => { const r = node.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? r.bottom : 0; })));
          window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - obstructionBottom - 24, behavior: 'instant' });
        });
        await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
        const box = await example.boundingBox(), nav = await page.locator('.mobile-nav').boundingBox();
        const obstructionBottom = await page.evaluate(() => Math.max(0, ...['nav.top', '.page-head'].flatMap(selector => [...document.querySelectorAll(selector)].map(node => { const r = node.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight ? r.bottom : 0; }))));
        const wholeViewport = targetIndex === null && box.y >= obstructionBottom + 24 && box.y + box.height <= (nav?.y || height) - 16;
        const file = path.join(out, `${name}-example-${index + 1}.png`);
        let documentClip = null;
        if (!wholeViewport) {
          // Element screenshots crop native glyph ink outside the element box.
          // Keep the actual viewport/layout and capture its document rectangle
          // with a 16px ink margin, including portions beyond this viewport.
          documentClip = await example.evaluate(el => {
            const r = el.getBoundingClientRect(), left = r.left + scrollX, top = r.top + scrollY;
            const x = Math.max(0, Math.floor(left - 16)), y = Math.max(0, Math.floor(top - 16));
            return { x, y, width: Math.ceil(left + r.width + 16) - x, height: Math.ceil(top + r.height + 16) - y };
          });
          await page.screenshot({ path: file, fullPage: true, clip: documentClip, style: 'nav.top, .mobile-nav, .page-head { visibility: hidden !important; }' });
        } else await page.screenshot({ path: file });
        artifacts.push({ name, index, path: path.relative(root, file).replaceAll('\\', '/'), hash: hashValue(fs.readFileSync(file)), bounds: box, wholeViewport, framing: { obstructionBottom, topMargin: 24, bottomMargin: 16, targetedFullComponent: targetIndex !== null, documentClip, inkMargin: documentClip ? 16 : null, captureMode: documentClip ? 'padded-page-rectangle' : 'viewport' } });
      }
      checks.push({ ...await page.evaluate(name => ({ name, examples: document.querySelectorAll('.worked-example').length, katexErrors: document.querySelectorAll('.katex-error').length, diagramErrors: document.querySelectorAll('.theory .tikz-error').length, diagramsReady: [...document.querySelectorAll('.theory .tikz-wrap')].every(el => el.querySelector('svg.tikz-svg') && !el.querySelector('svg animate')), overflow: document.documentElement.scrollWidth > window.innerWidth, solutionsVisible: [...document.querySelectorAll('.example-solution')].every(el => el.getBoundingClientRect().height > 0) }), name), capturedIndices: selectedIndices });
      await page.close();
    }
    if(rows.some(r=>!r.questionVisible||!r.solutionVisible||r.workingEmpty||!r.fontsReady||r.katexErrors||r.diagramCount||r.overflow||r.mathOutsideExample))throw new Error('Per-example actual render checks failed: '+JSON.stringify(rows));
    if (checks.some(row => row.katexErrors || row.diagramErrors || !row.diagramsReady || row.overflow || !row.solutionsVisible)) throw new Error('UI mechanism failure: ' + id + JSON.stringify(checks));
    const appFilesAfter = snapshotAppFiles();
    fs.writeFileSync(path.join(out, 'app-files-after.json'), JSON.stringify(appFilesAfter, null, 2));
    if (!sameAppFiles(appFilesBefore, appFilesAfter)) throw new Error('App dependencies changed during UI capture; original PNGs and hash snapshots preserved: ' + out);
    const current = readSkill(root, campaign, id);
    if (current.stage.hash !== state.stage.hash || current.stage.candidateHash !== state.stage.candidateHash) throw new Error('Candidate changed during UI capture: ' + out);
    const result = {profile:THEORY_UI_SAMPLING_PROFILE,rows,mechanism:fileRef(path.relative(root,mf).replaceAll('\\','/')), skillId: id, stageHash: state.stage.hash, candidateHash: state.stage.candidateHash, baseURL, capturedAt: new Date().toISOString(), browserVersion: browser.version(), appFiles: appFilesAfter, appFilesBefore, appFilesAfter, checks, artifacts, selection: targetIndex !== null ? 'Targeted full component, index ' + targetIndex + ', both viewports.' : representative ? 'First and tallest actual example per viewport; distinct indices deduplicated.' : 'First/tallest/widest per exact layout family; all examples automatically checked.', note: 'Actual preview capture; independent visual observations remain separate. Representative UI sampling does not replace full content review or actual inspection of every new/changed diagram.' };
    const captureFile = path.join(out, 'ui-capture.json');
    fs.writeFileSync(captureFile, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ skillId: id, out, checks, capture: { path: path.relative(root, captureFile).replaceAll('\\', '/'), hash: hashValue(fs.readFileSync(captureFile)) } }));
  }
} finally { await browser.close(); }
