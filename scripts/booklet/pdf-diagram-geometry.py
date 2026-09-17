"""Check native SVG text and strokes in the actual PDF against final-size DOM measurements."""
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


def inspect(pdf, expected):
    issues, pages = [], []
    with pymupdf.open(pdf) as document:
        if len(document) != len(expected['pages']):
            issues.append({'kind': 'page-count', 'actual': len(document),
                           'expected': len(expected['pages'])})
        for page, wanted in zip(document, expected['pages']):
            fonts = wanted['fonts']
            spans = [span for block in page.get_text('dict')['blocks']
                     if 'lines' in block for line in block['lines']
                     for span in line['spans'] if span['font'] in fonts]
            for span in spans:
                if min(abs(span['size'] - size) for size in fonts[span['font']]) > .1:
                    issues.append({'page': page.number + 1, 'kind': 'pdf-diagram-font',
                                   'font': span['font'], 'sizePt': span['size'],
                                   'expectedPt': fonts[span['font']]})
            if fonts and not spans:
                issues.append({'page': page.number + 1, 'kind': 'missing-native-text'})
            drawings = [drawing for drawing in page.get_drawings()
                        if drawing['type'] in ('s', 'fs')]
            checked = 0
            for stroke in wanted['strokes']:
                matches = [drawing for drawing in drawings
                           # Chromium rounds page placement at device pixels.
                           if max(abs(a - b) for a, b in zip(drawing['rect'], stroke['rect'])) < .5]
                if not matches:
                    issues.append({'page': page.number + 1, 'kind': 'missing-pdf-stroke', 'expected': stroke})
                elif not any(abs(drawing['width'] - stroke['pt']) <= .05 for drawing in matches):
                    issues.append({'page': page.number + 1, 'kind': 'pdf-diagram-stroke',
                                   'widthsPt': [drawing['width'] for drawing in matches],
                                   'expectedPt': stroke['pt'], 'rect': stroke['rect']})
                else:
                    checked += 1
            pages.append({'page': page.number + 1, 'nativeTextRuns': len(spans),
                          'strokesChecked': checked,
                          'fontSizesPt': sorted(set(round(span['size'], 4) for span in spans))})
    return {'pages': pages, 'issues': issues}


if __name__ == '__main__':
    result = inspect(sys.argv[1], json.loads(Path(sys.argv[2]).read_text(encoding='utf-8-sig')))
    print(json.dumps(result))
    sys.exit(bool(result['issues']))
