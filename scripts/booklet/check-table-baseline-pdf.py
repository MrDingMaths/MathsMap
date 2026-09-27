"""Check actual printed equality glyphs against fraction-rule axes; no DOM probes."""
import json, sys
from pathlib import Path
try:
    import pymupdf
except ModuleNotFoundError:
    sys.path.insert(0, str(Path('.booklet-work/python').resolve()))
    import pymupdf
pdf_file, geometry_file, output_file = map(Path, sys.argv[1:4])
g = json.loads(geometry_file.read_text(encoding='utf-8-sig'))
if 'pages' in g:
    pages = g['pages']
else:
    pages = [{'pdfPage':1, 'groups':[{'id':group[0]['cellId'], 'equalities':[{**e, 'left':e['left']*.75, 'top':c['cell']['top']*.75, 'bottom':c['cell']['bottom']*.75} for c in group for e in c['equalities']], 'fractionBars':[{k:b[k]*.75 for k in ['left','top','right','bottom','width','height']} for c in group for b in c['fractionBars']]} for group in g['baseline']['groups']]}]
issues, results = [], []
with pymupdf.open(pdf_file) as document:
    for wanted in pages:
        page = document[wanted['pdfPage']-1]
        equals, labels = [], []
        for block in page.get_text('rawdict')['blocks']:
            for line in block.get('lines', []):
                for span in line['spans']:
                    text = ''.join(ch['c'] for ch in span['chars'])
                    if 'Position' in text:
                        start = text.index('Position')
                        word = span['chars'][start:start+8]
                        labels.append({'text':'Position', 'font':span['font'], 'sizePt':span['size'], 'bbox':[min(c['bbox'][0] for c in word), min(c['bbox'][1] for c in word), max(c['bbox'][2] for c in word), max(c['bbox'][3] for c in word)], 'baseline':word[0]['origin'][1]})
                    for ch in span['chars']:
                        if ch['c'] == '=':
                            equals.append({'origin':ch['origin'], 'bbox':ch['bbox'], 'font':span['font'], 'sizePt':span['size']})
        lines = [list(d['rect']) for d in page.get_drawings() if d['rect'].height < 1.5 and d['rect'].width > 5]
        for group in wanted['groups']:
            bars, glyphs = [], []
            for b in group['fractionBars']:
                found = [r for r in lines if abs(r[0]-b['left']) < 1.2 and abs(r[2]-b['right']) < 1.2 and abs(r[1]-b['top']) < 1.2]
                if len(found) != 1:
                    issues.append({'id':group['id'],'kind':'missing-or-ambiguous-printed-fraction-rule','matches':len(found)})
                else:
                    bars.append({'rect':found[0], 'axisPt':(found[0][1]+found[0][3])/2})
            for e in group['equalities']:
                found = [x for x in equals if abs(x['origin'][0]-e['left']) < 1.2 and e['top']-1 <= x['origin'][1] <= e['bottom']+1]
                if len(found) != 1:
                    issues.append({'id':group['id'],'kind':'missing-or-ambiguous-printed-equality','matches':len(found)})
                else:
                    x=found[0]
                    glyphs.append({**x,'axisPt':x['origin'][1]+e['axisFromBaselineEm']*x['sizePt']})
            clearance = None
            if glyphs:
                first = min(glyphs, key=lambda x:x['origin'][0])
                candidates = [label for label in labels if abs(label['baseline']-first['origin'][1]) < 2 and label['bbox'][0] < first['origin'][0]]
                if not candidates:
                    issues.append({'id':group['id'],'kind':'missing-printed-position-label'})
                else:
                    label = min(candidates, key=lambda x:abs(first['origin'][0]-x['bbox'][2]))
                    gap = first['bbox'][0]-label['bbox'][2]
                    clearance = {'label':label, 'equality':first, 'gapPt':gap, 'gapMm':gap*25.4/72}
                    if gap <= 0:
                        issues.append({'id':group['id'],'kind':'printed-label-equality-overlap','gapPt':gap})
            axes=[x['axisPt'] for x in bars+glyphs]
            if not bars or not glyphs:
                issues.append({'id':group['id'],'kind':'incomplete-printed-axis-evidence'})
            elif max(axes)-min(axes) > .8:
                issues.append({'id':group['id'],'kind':'printed-math-axis-offset','spreadPt':max(axes)-min(axes)})
            results.append({'id':group['id'],'pdfPage':wanted['pdfPage'],'bars':bars,'equalities':glyphs,'axisSpreadPt':max(axes)-min(axes) if axes else None, 'labelEqualityClearance':clearance})
result={'kind':'actual-printed-table-math-axis-check','pdf':str(pdf_file.resolve()),'geometry':str(geometry_file.resolve()),'tolerancePt':.8,'minimumLabelEqualityClearancePt':0,'groups':results,'issues':issues,'passed':not issues,'visualAcceptance':False}
output_file.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'passed':not issues,'groups':len(results),'maximumAxisSpreadPt':max((x['axisSpreadPt'] or 0) for x in results),'issues':issues}))
sys.exit(bool(issues))
