"""Read-only source label geometry. Suggestions require author review, never certify fidelity."""
import argparse, json, re
import pymupdf

parser=argparse.ArgumentParser()
parser.add_argument('--pdf',required=True)
parser.add_argument('--project',required=True)
parser.add_argument('--out',required=True)
args=parser.parse_args()
project=json.load(open(args.project,encoding='utf-8'))
pdf=pymupdf.open(args.pdf)
pages=[]
for page in pdf:
    spans=[s for b in page.get_text('dict')['blocks'] if 'lines' in b for l in b['lines'] for s in l['spans']]
    labels=[{'label':s['text'].strip(),'x':round(s['bbox'][0],1),'y':round(s['bbox'][1],1)} for s in spans if 'Bold' in s['font'] and re.fullmatch(r'(?:\d+|[a-z]|[ivx]+)',s['text'].strip())]
    pages.append(labels)
result=[]
for section in project['sections']:
    if section.get('phase')!='practice':continue
    for block in section['blocks']:
        if block['type']!='question':continue
        number=str(block.get('sourceOrder'))
        collected=[]
        for ref in block.get('sourceRefs',[]):
            page=ref['pageNumber']; labels=pages[page-1]
            starts=[x for x in labels if x['label']==number and x['x']<45]
            if not starts:continue
            top=starts[0]['y'];end=min([x['y'] for x in labels if x['label'].isdigit() and x['x']<45 and x['y']>top+2]+[790])
            parts=[{**x,'page':page} for x in labels if top+2<x['y']<end and not x['label'].isdigit()]
            collected+=parts
        result.append({'id':block['id'],'pages':[r['pageNumber'] for r in block.get('sourceRefs',[])],'labels':collected})
with open(args.out,'w',encoding='utf-8') as f:json.dump(result,f,indent=2)
print(f'{len(result)} question regions extracted; author review required')
