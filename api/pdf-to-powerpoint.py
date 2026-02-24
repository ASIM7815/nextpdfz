from http.server import BaseHTTPRequestHandler
import json
import base64
from io import BytesIO
import zipfile

try:
    from PyPDF2 import PdfReader
except ImportError:
    from pypdf import PdfReader

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            file_base64 = body.get('file')
            
            if not file_base64:
                self.send_error_response(400, 'File is required')
                return
            
            pdf_data = base64.b64decode(file_base64)
            pdf_stream = BytesIO(pdf_data)
            reader = PdfReader(pdf_stream)
            
            # Extract text
            slides_text = []
            for page in reader.pages:
                text = page.extract_text()
                slides_text.append(text)
            
            # Create PPTX
            pptx_content = self.create_pptx(slides_text)
            pptx_base64 = base64.b64encode(pptx_content).decode('utf-8')
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'success': True, 'file': pptx_base64}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
    def create_pptx(self, slides_text):
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as pptx:
            # Presentation XML
            pres_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<p:sldIdLst>'''
            
            for idx in range(len(slides_text)):
                pres_xml += f'<p:sldId id="{256 + idx}" r:id="rId{idx + 1}"/>'
            
            pres_xml += '</p:sldIdLst><p:sldSz cx="9144000" cy="6858000"/></p:presentation>'
            pptx.writestr('ppt/presentation.xml', pres_xml)
            
            # Create slides
            for idx, text in enumerate(slides_text, 1):
                slide_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
<p:nvPr/></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>{self.escape_xml(text[:500])}</a:t></a:r></a:p></p:txBody></p:sp>
</p:spTree></p:cSld></p:sld>'''
                pptx.writestr(f'ppt/slides/slide{idx}.xml', slide_xml)
            
            # Content types
            content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'''
            
            for idx in range(len(slides_text)):
                content_types += f'<Override PartName="/ppt/slides/slide{idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
            
            content_types += '</Types>'
            pptx.writestr('[Content_Types].xml', content_types)
            
            # Relationships
            pptx.writestr('_rels/.rels', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>''')
            
            pres_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'''
            for idx in range(len(slides_text)):
                pres_rels += f'<Relationship Id="rId{idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{idx + 1}.xml"/>'
            pres_rels += '</Relationships>'
            pptx.writestr('ppt/_rels/presentation.xml.rels', pres_rels)
        
        zip_buffer.seek(0)
        return zip_buffer.read()
    
    def escape_xml(self, text):
        return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&apos;')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {'error': message}
        self.wfile.write(json.dumps(response).encode('utf-8'))
