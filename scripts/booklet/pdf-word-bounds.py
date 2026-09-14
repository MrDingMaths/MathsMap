# Optional PyMuPDF word bounds for environments without Poppler's -bbox.
import html, os, sys
if os.environ.get('BOOKLET_PYTHON_LIBS'): sys.path.insert(0, os.environ['BOOKLET_PYTHON_LIBS'])
import pymupdf
sys.stdout.reconfigure(encoding='utf-8')
with pymupdf.open(sys.argv[1]) as doc:
 print('<doc>')
 for page in doc:
  print(f'<page width="{page.rect.width:.6f}" height="{page.rect.height:.6f}">')
  for x0,y0,x1,y1,word,*_ in page.get_text('words'):
   print(f'<word xMin="{x0:.6f}" yMin="{y0:.6f}" xMax="{x1:.6f}" yMax="{y1:.6f}">{html.escape(word)}</word>')
  print('</page>')
 print('</doc>')
