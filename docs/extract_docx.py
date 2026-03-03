"""Extract text from Word .docx (OOXML) to plain .txt with paragraph breaks."""
import zipfile
import xml.etree.ElementTree as ET
import re

path = r'C:\Users\USER\Projects\clinguard-ai-shield\docs\Research Proposal Notes-Titus.docx'
out_path = r'C:\Users\USER\Projects\clinguard-ai-shield\docs\Research Proposal Notes-Titus.txt'

NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS_W = '{%s}' % NS

def para_text(p_elem):
    parts = []
    for t_elem in p_elem.iter(NS_W + 't'):
        if t_elem.text:
            parts.append(t_elem.text)
    return ' '.join(parts).strip()

with zipfile.ZipFile(path, 'r') as z:
    with z.open('word/document.xml') as f:
        tree = ET.parse(f)
        root = tree.getroot()
        paragraphs = []
        for p in root.iter(NS_W + 'p'):
            pt = para_text(p)
            if pt:
                paragraphs.append(pt)
        text = '\n\n'.join(paragraphs)
text = re.sub(r' +', ' ', text)
text = re.sub(r'\n\n\n+', '\n\n', text)
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Wrote', out_path, 'paragraphs', len(paragraphs), 'length', len(text))
