import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright-core';

const repository=fileURLToPath(new URL('../',import.meta.url));

function fixture(id,top) {
  const width=207.859375;
  const heights=[204.375,196.59375,200.09375];
  return `<article id="${id}" class="booklet-page" style="top:${top}px">${heights.map((height,index)=>{
    const clipped=`${id}-${index}-clip`,masked=`${id}-${index}-mask`;
    const protrudes=index!==1;
    const labelY=protrudes?-2:80;
    const backgroundY=protrudes?-(index===0?12.105:14.765):65;
    return `<p>Before diagram ${index+1}</p><div class="tikz-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs><clipPath id="${clipped}"><rect x="20" y="30" width="20" height="20"/></clipPath><mask id="${masked}"><rect x="20" y="30" width="20" height="20" fill="white"/></mask></defs>
      <path d="M 12 20 L 190 20 L 160 ${height-20} Z" fill="none" stroke="black" stroke-width="0.6666666667" data-graph-stroke-pt="0.5"/>
      ${protrudes?`<path d="M 0 0 H ${width}" fill="none" stroke="black" stroke-width="1.3333333333" data-graph-stroke-pt="1"/>`:''}
      <path d="M -100 -100 L 400 400" fill="none" stroke="black" stroke-width="2" clip-path="url(#${clipped})"/>
      <path d="M -100 -100 L 400 400" fill="none" stroke="black" stroke-width="2" mask="url(#${masked})"/>
      <rect data-diagram-label-background="1" x="70" y="${backgroundY}" width="45" height="16" fill="white"/>
      <g data-diagram-label="1" data-label-font="13.333333333333334" data-label-anchor="base west" data-tick-target="8.5"><text x="80" y="${labelY}" font-family="Arial" font-size="10pt">g</text></g>
      <rect data-diagram-label-background="1" x="110" y="${protrudes?height-8:110}" width="45" height="16" fill="white"/>
      <g data-diagram-label="1" data-label-font="13.333333333333334" data-label-anchor="base west" data-tick-target="8.5"><text x="120" y="${protrudes?height+5:120}" font-family="Arial" font-size="10pt">g</text></g>
      <text data-test-tick="1" x="55" y="70" font-family="Arial" font-size="8.5pt">0</text>
    </svg></div><p>Following diagram ${index+1}</p>`;
  }).join('')}</article>`;
}

const html=`<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;min-height:314000px}
  .booklet-page{position:absolute;left:30px;width:210mm;transform-origin:top left}
  p{margin:0;height:18px;font:9pt Arial}
  .tikz-wrap{box-sizing:content-box;width:207.859375px;padding:3.25px 6px 5.5px 4px;overflow-x:auto;margin:0}
  svg{display:block;width:100%;height:auto;overflow:visible}
  @media print{.booklet-page{transform:none!important}}
</style></head><body>${fixture('near',30)}${fixture('far-a',279723.53125)}${fixture('far-b',311870.59375)}</body></html>`;

test('large document coordinates reserve stable local ink across calibration, settling, zoom, print and cache reuse',{timeout:180000},async()=>{
  // Import the actual acceptance function through isolated Vite, including its
  // real dependencies. Do not duplicate or weaken settleBooklet in this test.
  const lib=path.join(repository,'src/lib');
  const qaFiles=fs.readdirSync(lib).filter(name=>name.endsWith('.js')&&/export\s+async\s+function\s+settleBooklet\s*\(/.test(fs.readFileSync(path.join(lib,name),'utf8')));
  assert.equal(qaFiles.length,1,'Locate the actual settleBooklet module uniquely');
  const server=await createServer({configFile:false,root:repository,cacheDir:path.join(repository,'.booklet-work/test-cache/diagram-large-coordinate'),logLevel:'error',appType:'custom',optimizeDeps:{entries:[]},server:{host:'127.0.0.1',port:0,strictPort:false,watch:{ignored:['**/.booklet-work/**','**/output/**','**/booklets/**']}}});
  let browser;
  try {
    server.middlewares.use((req,res,next)=>{
      if(req.url?.split('?')[0]!=='/__diagram_large_coordinate_test__')return next();
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.end(html);
    });
    await server.listen();
    const address=server.httpServer.address();
    assert.ok(address&&typeof address==='object');
    browser=await chromium.launch({headless:true,channel:'chrome'});
    for(const deviceScaleFactor of [1,2]) {
      const context=await browser.newContext({deviceScaleFactor,viewport:{width:1400,height:900}});
      try {
        const page=await context.newPage();
        await page.goto(`http://127.0.0.1:${address.port}/__diagram_large_coordinate_test__`);
        await page.evaluate(async qaFile=>{
          const [typography,space,strokes,qa,paint]=await Promise.all([
            import('/src/lib/diagram-typography.js'),
            import('/src/lib/diagram-label-space.js'),
            import('/src/lib/graph-strokes.js'),
            import('/src/lib/'+qaFile),
            import('/src/lib/svg-paint-scope.js')
          ]);
          await document.fonts.ready;
          window.diagramTest={fit:typography.calibrateDiagramTypography,reserve:space.reserveDiagramLabelSpace,strokes:strokes.calibrateGraphStrokes,settle:qa.settleBooklet};
          window.diagramNative=root=>JSON.parse(paint.normaliseSvgPaintScopes(JSON.stringify([...root.querySelectorAll('svg')].map(svg=>({
            viewBox:svg.getAttribute('viewBox'),width:svg.getAttribute('width'),height:svg.getAttribute('height'),
            definitions:svg.querySelector('defs')?.outerHTML,
            geometry:[...svg.querySelectorAll('path,rect,text')].filter(n=>!n.closest('defs')).map(n=>[n.tagName,...['d','x','y','width','height','transform','clip-path','mask'].map(key=>n.getAttribute(key))])
          })))));
          window.diagramOriginals=Object.fromEntries([...document.querySelectorAll('article')].map(root=>[root.id,JSON.stringify(window.diagramNative(root))]));
        },qaFiles[0]);
        for(const media of ['screen','print']) {
          await page.emulateMedia({media});
          for(const zoom of [1,0.65,2]) {
            const report=await page.evaluate(async({zoom,media})=>{
              const api=window.diagramTest;
              const roots=[...document.querySelectorAll('article')];
              const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              const check=(condition,message)=>{if(!condition)throw Error(message);};
              const cycle=root=>{api.fit(root);api.strokes(root);api.reserve(root);};
              const reservation=root=>[...root.querySelectorAll('.tikz-wrap')].map(wrapper=>({
                padding:['paddingTop','paddingRight','paddingBottom','paddingLeft'].map(key=>wrapper.style[key]),
                space:['labelSpaceTop','strokeSpaceRight','labelSpaceBottom','strokeSpaceLeft'].map(key=>Number(wrapper.dataset[key]))
              }));
              const state=root=>JSON.stringify([...root.querySelectorAll('svg')].map(svg=>{
                const rect=svg.getBoundingClientRect(),matrix=svg.getScreenCTM(),wrapper=svg.closest('.tikz-wrap');
                return [rect.width,rect.height,[matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f],wrapper.style.cssText,
                  [...svg.querySelectorAll('g[data-diagram-label="1"],[data-diagram-label-background="1"],[data-graph-stroke-pt]')].map(n=>[n.getAttribute('transform'),n.style.strokeWidth,n.dataset.labelTargetPt])];
              }));
              const dimensions=root=>[...root.querySelectorAll('svg')].map(svg=>{
                const style=getComputedStyle(svg);
                return [style.width,style.height,svg.getAttribute('viewBox')];
              });
              const paintedInk=root=>{
                const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
                for(const wrapper of root.querySelectorAll('.tikz-wrap')) {
                  const svg=wrapper.querySelector('svg'),outer=wrapper.getBoundingClientRect();
                  const style=getComputedStyle(wrapper);
                  const borderWidth=parseFloat(style.width)+['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth'].reduce((sum,key)=>sum+(parseFloat(style[key])||0),0);
                  const scale=outer.width/borderWidth;
                  check(scale>0,'Fixture has a measurable page scale');
                  for(const shape of svg.querySelectorAll('path,rect,text')) {
                    if(shape.closest('defs'))continue;
                    let clipped=false;
                    for(let n=shape;n&&n!==svg;n=n.parentElement) {
                      const paint=getComputedStyle(n);
                      if(paint.clipPath!=='none'||paint.maskImage!=='none'){clipped=true;break;}
                    }
                    if(clipped)continue;
                    const paint=getComputedStyle(shape);
                    if(paint.display==='none'||Number(paint.opacity)===0||paint.fill==='none'&&paint.stroke==='none')continue;
                    let box=shape.getBBox();
                    if(shape.tagName==='text') {
                      context.font=`${paint.fontStyle} ${paint.fontWeight} ${paint.fontSize} ${paint.fontFamily}`;
                      const ink=context.measureText(shape.textContent);
                      box={x:shape.x.baseVal[0].value-ink.actualBoundingBoxLeft,y:shape.y.baseVal[0].value-ink.actualBoundingBoxAscent,width:ink.actualBoundingBoxLeft+ink.actualBoundingBoxRight,height:ink.actualBoundingBoxAscent+ink.actualBoundingBoxDescent};
                    }
                    const matrix=shape.getScreenCTM();
                    const ordinaryStroke=paint.stroke!=='none'&&!shape.closest('g[data-diagram-label="1"],[data-diagram-label-background="1"]');
                    const raster=ordinaryStroke?1/window.devicePixelRatio:0;
                    const halfY=ordinaryStroke?parseFloat(paint.strokeWidth)*Math.hypot(matrix.b,matrix.d)/2:0;
                    const halfX=ordinaryStroke?parseFloat(paint.strokeWidth)*Math.hypot(matrix.a,matrix.c)/2:0;
                    for(const [x,y] of [[box.x,box.y],[box.x+box.width,box.y],[box.x+box.width,box.y+box.height],[box.x,box.y+box.height]]) {
                      const point=new DOMPoint(x,y).matrixTransform(matrix);
                      // Large-coordinate DOM rectangles have up to a float32
                      // raster step of error; this tolerance is exclusively for
                      // this independent screen-space containment assertion.
                      // Reservation and settle comparisons below remain exact.
                      const tolerance=0.065;
                      check(point.y-halfY-raster>=outer.top-tolerance,'Top painted ink is clipped');
                      check(point.y+halfY+raster<=outer.bottom+tolerance,'Bottom painted ink is clipped');
                      check(point.x-halfX-raster>=outer.left-tolerance,'Left painted ink is clipped');
                      check(point.x+halfX+raster<=outer.right+tolerance,'Right painted ink is clipped');
                    }
                  }
                  const amounts=[Number(wrapper.dataset.labelSpaceTop),Number(wrapper.dataset.strokeSpaceRight),Number(wrapper.dataset.labelSpaceBottom),Number(wrapper.dataset.strokeSpaceLeft)];
                  const manual=[3.25,6,5.5,4];
                  ['paddingTop','paddingRight','paddingBottom','paddingLeft'].forEach((key,index)=>{
                    const expectedStyle=document.createElement('div').style;
                    expectedStyle[key]=(manual[index]+amounts[index])+'px';
                    check(wrapper.style[key]===expectedStyle[key],'Manual padding changed or reservation accumulated: '+JSON.stringify({root:root.id,key,style:wrapper.style[key],expected:expectedStyle[key],manual:manual[index],amount:amounts[index],difference:parseFloat(wrapper.style[key])-manual[index]-amounts[index]}));
                    check(Number.isInteger(amounts[index]*64),'Reservation lost its outward 1/64px grid');
                    check(amounts[index]>=0&&amounts[index]<40,'Clipped/masked source geometry incorrectly expanded flow');
                  });
                  const previous=wrapper.previousElementSibling.getBoundingClientRect(),next=wrapper.nextElementSibling.getBoundingClientRect();
                  check(previous.bottom<=outer.top+0.065&&next.top>=outer.bottom-0.065,'Reserved flow overlaps adjacent content');
                  for(const label of svg.querySelectorAll('g[data-diagram-label="1"]')) {
                    check(label.dataset.labelTargetPt==='10','Whole-label target is no longer 10pt');
                    const text=label.querySelector('text'),matrix=text.getScreenCTM();
                    const pt=parseFloat(getComputedStyle(text).fontSize)*Math.hypot(matrix.a,matrix.b)/scale*72/96;
                    check(Math.abs(pt-10)<=0.1,`Whole-label final size changed: ${pt}pt`);
                  }
                  // This explicit native graph tick is not a whole TeX label.
                  // Its source 8.5pt typography must survive reservation and zoom.
                  for(const text of svg.querySelectorAll('[data-test-tick]')) {
                    const matrix=text.getScreenCTM();
                    const pt=parseFloat(getComputedStyle(text).fontSize)*Math.hypot(matrix.a,matrix.b)/scale*72/96;
                    check(Math.abs(pt-8.5)<=0.1,`Graph tick final size changed: ${pt}pt`);
                  }
                }
              };
              for(const root of roots)root.style.transform=`scale(${zoom})`;
              const nativeDimensions=dimensions(roots[0]);
              for(const root of roots){cycle(root);await api.settle(root);}
              const reference=JSON.stringify(reservation(roots[0]));
              check(reservation(roots[0])[0].space[0]>0&&reservation(roots[0])[2].space[0]>0,'Both diagnosed-position examples must reserve top ink');
              check(reservation(roots[0])[1].space[0]===0,'Following contained diagram must not inherit preceding reservation');
              const offsets=[0,1/64,2/64,3/64,0.125,0.25,0.5,63/64];
              for(const offset of offsets) {
                roots[1].style.top=(279723.53125+offset)+'px';
                roots[2].style.top=(311870.59375+offset)+'px';
                window.scrollTo(0,0);
                for(const root of roots) {
                  cycle(root);
                  await api.settle(root);
                  check(JSON.stringify(reservation(root))===reference,`Reservation depends on document translation (${root.id}, ${offset}, ${zoom}, ${media})`);
                  check(JSON.stringify(dimensions(root))===JSON.stringify(nativeDimensions),'Reservation changed native dimensions');
                  const stable=state(root);
                  for(let repeat=0;repeat<4;repeat++) {
                    cycle(root);
                    await frame();
                    check(state(root)===stable,`Reservation/typography oscillated on repeat ${repeat} (${root.id})`);
                  }
                  await api.settle(root);
                  check(state(root)===stable,'Repeated actual settle changed the settled diagram');
                  paintedInk(root);
                  check(JSON.stringify(window.diagramNative(root))===window.diagramOriginals[root.id],'Native source geometry, dimensions, clip paths or masks changed');
                }
              }
              for(const root of roots) {
                const expected=JSON.stringify(reservation(root));
                // Cached SVG reopening retains its calibrated editable metadata.
                for(const wrapper of root.querySelectorAll('.tikz-wrap'))wrapper.innerHTML=wrapper.innerHTML;
                cycle(root);await api.settle(root);
                check(JSON.stringify(reservation(root))===expected,'Cached reopening changed flow');
                // Cold offscreen measurement must match visible print geometry.
                for(const wrapper of root.querySelectorAll('.tikz-wrap')) {
                  wrapper.style.padding='3.25px 6px 5.5px 4px';
                  for(const key of ['labelSpaceOriginalTop','labelSpaceOriginalBottom','labelSpaceOriginalLeft','labelSpaceOriginalRight'])delete wrapper.dataset[key];
                }
                root.classList.add('flow-measure');root.style.visibility='hidden';
                cycle(root);await api.settle(root);
                check(JSON.stringify(reservation(root))===expected,'Cold hidden pagination omitted ink');
                root.classList.remove('flow-measure');root.style.visibility='';
                cycle(root);await api.settle(root);
                check(JSON.stringify(reservation(root))===expected,'Visible surface differs from offscreen measurement');
                const hiddenPadding=[...root.querySelectorAll('.tikz-wrap')].map(n=>n.style.cssText);
                root.style.display='none';cycle(root);
                check(JSON.stringify([...root.querySelectorAll('.tikz-wrap')].map(n=>n.style.cssText))===JSON.stringify(hiddenPadding),'Hidden print copy lost its last valid reservation');
                root.style.display='';cycle(root);await api.settle(root);
                check(JSON.stringify(reservation(root))===expected,'Revealed print copy changed reservation');
                paintedInk(root);
              }
              return {media,zoom,offsets:offsets.length,reference:JSON.parse(reference)};
            },{zoom,media});
            assert.equal(report.offsets,8);
            assert.equal(report.reference.length,3);
          }
        }
        await page.emulateMedia({media:'screen'});
        const contained=await page.evaluate(async()=>{
          const root=document.querySelector('#near'),wrapper=root.querySelector('.tikz-wrap'),api=window.diagramTest;
          root.style.transform='';
          wrapper.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="207.859375" height="200" viewBox="0 0 207.859375 200"><g data-diagram-label="1" data-label-font="13.333333333333334" data-label-anchor="base west" data-tick-target="8.5"><text x="80" y="100" font-family="Arial" font-size="10pt">g</text></g></svg>';
          api.fit(root);api.reserve(root);await api.settle(root);api.reserve(root);
          return {padding:[wrapper.style.paddingTop,wrapper.style.paddingRight,wrapper.style.paddingBottom,wrapper.style.paddingLeft],space:[wrapper.dataset.labelSpaceTop,wrapper.dataset.strokeSpaceRight,wrapper.dataset.labelSpaceBottom,wrapper.dataset.strokeSpaceLeft]};
        });
        assert.deepEqual(contained.padding,['3.25px','6px','5.5px','4px'],'Removing overhang must release reservation, retaining manual padding');
        assert.deepEqual(contained.space,['0','0','0','0'],'Reservation must not become a cumulative high-water mark');
      }finally{await context.close();}
    }
  }finally{
    try{await browser?.close();}finally{await server.close();}
  }
});
