"""Retain Word's picture crops as source evidence, without editing image bytes."""
import argparse,json,zipfile,posixpath
from xml.etree import ElementTree as ET
from PIL import Image
from io import BytesIO
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('--docx',required=True);p.add_argument('--out',required=True)
args=p.parse_args()
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'}
with zipfile.ZipFile(args.docx) as z:
    rels={r.attrib['Id']:r.attrib['Target'] for r in ET.fromstring(z.read('word/_rels/document.xml.rels'))}
    doc=ET.fromstring(z.read('word/document.xml'));records=[]
    for drawing in doc.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing'):
        blip=drawing.find('.//a:blip',ns)
        if blip is None:continue
        target=rels.get(blip.get('{'+ns['r']+'}embed'))
        if not target:continue
        file=posixpath.normpath('word/'+target)
        try:
            with Image.open(BytesIO(z.read(file))) as image:width,height=image.size
        except (KeyError,OSError):continue
        crop=drawing.find('.//a:srcRect',ns)
        c={k:float(crop.get(k,0))/100000 if crop is not None else 0 for k in ['l','t','r','b']}
        extent=drawing.find('.//wp:extent',ns)
        records.append({'occurrence':len(records)+1,'path':target,'sourceWidth':width,'sourceHeight':height,'sourceRegion':{'x':width*c['l'],'y':height*c['t'],'width':width*(1-c['l']-c['r']),'height':height*(1-c['t']-c['b']),'sourceWidth':width,'sourceHeight':height},'widthMm':float(extent.get('cx'))/36000 if extent is not None else None,'heightMm':float(extent.get('cy'))/36000 if extent is not None else None})
    for image_data in doc.iter('{urn:schemas-microsoft-com:vml}imagedata'):
        target=rels.get(image_data.get('{'+ns['r']+'}id'))
        if not target:continue
        with Image.open(BytesIO(z.read(posixpath.normpath('word/'+target)))) as image:width,height=image.size
        records.append({'occurrence':len(records)+1,'path':target,'sourceWidth':width,'sourceHeight':height,'sourceRegion':{'x':0,'y':0,'width':width,'height':height,'sourceWidth':width,'sourceHeight':height},'widthMm':min(170,width/4),'heightMm':height/4,'legacyVml':True})
Path(args.out).parent.mkdir(parents=True,exist_ok=True)
Path(args.out).write_text(json.dumps({'version':1,'occurrences':records},indent=2),encoding='utf8')
print(f'{len(records)} source picture occurrences retained')
