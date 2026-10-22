"""Faithful PDF text conversion of the supplied DOCX, preserving numbered clauses."""
from pathlib import Path
from xml.sax.saxutils import escape
from docx import Document
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import sys
doc=Document(sys.argv[1])
pdfmetrics.registerFont(TTFont('Body','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('BodyBold','C:/Windows/Fonts/arialbd.ttf'))
story=[]; counts=[0]*9; numbered=[]
for p in doc.paragraphs:
    value=p.text.strip()
    if not value: continue
    num=p._p.pPr.numPr if p._p.pPr is not None else None
    prefix=''; level=0
    if num is not None:
        level=int(num.ilvl.val); counts[level]+=1
        for i in range(level+1,9):counts[i]=0
        prefix='.'.join(str(c) for c in counts[:level+1])+'. '
    title=len(story)==0
    heading=num is not None and level==0
    style=ParagraphStyle('p',fontName='BodyBold' if title or heading else 'Body',fontSize=14 if title else 10,leading=18 if title else 14,spaceAfter=8 if heading else 6,spaceBefore=10 if heading else 0,leftIndent=level*12,keepWithNext=heading or title)
    story.append(Paragraph(escape(prefix+value),style));numbered.append(prefix+value)
def footer(c,d):
    c.setFont('Body',9);c.drawRightString(A4[0]-45,28,str(d.page))
SimpleDocTemplate(sys.argv[2],pagesize=A4,rightMargin=45,leftMargin=45,topMargin=40,bottomMargin=45,title='Friends of Denton Dene Constitution — April 2026').build(story,onFirstPage=footer,onLaterPages=footer)
Path('../research/constitution-numbered.txt').write_text('\n'.join(numbered),encoding='utf8')
