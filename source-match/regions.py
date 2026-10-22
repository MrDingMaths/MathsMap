"""Source page geometry for source-match: word boxes with style, vector drawings,
embedded images, and page crops. A thin reader: classification, alignment and
arrow detection live in regions.mjs so they can be tested without PyMuPDF.

  python -I source-match/regions.py words  <pdf> <page> [<page> ...]   -> JSON on stdout
  python -I source-match/regions.py crop   <pdf> <page> x0 y0 x1 y1 <out.png> [zoom]
  python -I source-match/regions.py pages  <pdf>                       -> page count and size

Pages are 1-based; coordinates are PDF points from the page's top-left corner.
PyMuPDF is looked up as scripts/booklet/pdf-diagram-geometry.py does it:
BOOKLET_PYTHON_LIBS, else .booklet-work/python.
"""
import json
import os
import sys
from pathlib import Path

if os.environ.get('BOOKLET_PYTHON_LIBS'):
    sys.path.insert(0, os.environ['BOOKLET_PYTHON_LIBS'])
try:
    import pymupdf
except ModuleNotFoundError:
    sys.path.insert(0, str(Path('.booklet-work/python').resolve()))
    import pymupdf

sys.stdout.reconfigure(encoding='utf-8')


def hexcolour(value):
    if value is None:
        return None
    if isinstance(value, int):
        return '#%06x' % (value & 0xFFFFFF)
    if isinstance(value, (tuple, list)):
        if len(value) == 1:
            value = (value[0],) * 3
        if len(value) == 3:
            return '#%02x%02x%02x' % tuple(max(0, min(255, round(c * 255))) for c in value)
    return None


def r2(value):
    return round(float(value), 2)


def page_spans(page):
    spans = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            for span in line['spans']:
                spans.append({
                    'bbox': span['bbox'], 'size': span['size'], 'colour': hexcolour(span['color']),
                    'bold': bool(span['flags'] & 16) or 'bold' in span['font'].lower(),
                    'italic': bool(span['flags'] & 2) or 'italic' in span['font'].lower(),
                })
    return spans


def style_of(spans, cx, cy):
    for span in spans:
        x0, y0, x1, y1 = span['bbox']
        if x0 - .5 <= cx <= x1 + .5 and y0 - .5 <= cy <= y1 + .5:
            return span
    return None


def simplify_items(items):
    out = []
    for item in items:
        op = item[0]
        if op == 'l':
            out.append(['l', [r2(item[1].x), r2(item[1].y)], [r2(item[2].x), r2(item[2].y)]])
        elif op == 'c':
            out.append(['c'] + [[r2(p.x), r2(p.y)] for p in item[1:5]])
        elif op == 're':
            rect = item[1]
            out.append(['re', r2(rect.x0), r2(rect.y0), r2(rect.x1), r2(rect.y1)])
        elif op == 'qu':
            quad = item[1]
            out.append(['qu'] + [[r2(p.x), r2(p.y)] for p in (quad.ul, quad.ur, quad.lr, quad.ll)])
    return out


def read_words(document, number):
    page = document[number - 1]
    spans = page_spans(page)
    words = []
    for x0, y0, x1, y1, text, *_ in page.get_text('words'):
        span = style_of(spans, (x0 + x1) / 2, (y0 + y1) / 2)
        words.append({
            't': text, 'x0': r2(x0), 'y0': r2(y0), 'x1': r2(x1), 'y1': r2(y1),
            'b': bool(span and span['bold']), 'i': bool(span and span['italic']),
            'c': span['colour'] if span else None, 's': r2(span['size']) if span else None,
        })
    drawings = []
    for d in page.get_drawings():
        rect = d['rect']
        drawings.append({
            'type': d['type'], 'rect': [r2(rect.x0), r2(rect.y0), r2(rect.x1), r2(rect.y1)],
            'fill': hexcolour(d.get('fill')), 'stroke': hexcolour(d.get('color')),
            'width': r2(d.get('width') or 0), 'closed': bool(d.get('closePath')),
            'items': simplify_items(d['items']),
        })
    images = [{'bbox': [r2(v) for v in info['bbox']], 'w': info['width'], 'h': info['height']}
              for info in page.get_image_info() if info['width'] > 10 and info['height'] > 10]
    return {'page': number, 'width': r2(page.rect.width), 'height': r2(page.rect.height),
            'words': words, 'drawings': drawings, 'images': images, 'textLayer': len(words) > 0}


def main(argv):
    command = argv[1]
    with pymupdf.open(argv[2]) as document:
        if command == 'pages':
            print(json.dumps({'pages': len(document), 'width': document[0].rect.width, 'height': document[0].rect.height}))
        elif command == 'words':
            numbers = [int(n) for n in argv[3:]]
            print(json.dumps({'pages': {str(n): read_words(document, n) for n in numbers if 1 <= n <= len(document)}}, ensure_ascii=False))
        elif command == 'crop':
            number = int(argv[3])
            x0, y0, x1, y1 = (float(v) for v in argv[4:8])
            out = argv[8]
            zoom = float(argv[9]) if len(argv) > 9 else 2.0
            page = document[number - 1]
            clip = pymupdf.Rect(max(0, x0), max(0, y0), min(page.rect.width, x1), min(page.rect.height, y1))
            pixmap = page.get_pixmap(clip=clip, matrix=pymupdf.Matrix(zoom, zoom))
            Path(out).parent.mkdir(parents=True, exist_ok=True)
            pixmap.save(out)
            print(json.dumps({'out': out, 'width': pixmap.width, 'height': pixmap.height}))
        else:
            raise SystemExit('unknown command ' + command)


main(sys.argv)
