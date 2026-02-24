from http.server import BaseHTTPRequestHandler
import json
import base64
from io import BytesIO

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
            
            # Extract text from all pages
            text_content = []
            for page in reader.pages:
                text = page.extract_text()
                text_content.append(text)
            
            full_text = '\n\n'.join(text_content)
            
            # Create simple DOCX structure
            docx_content = self.create_docx(full_text)
            docx_base64 = base64.b64encode(docx_content).decode('utf-8')
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'success': True, 'file': docx_base64}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
    def create_docx(self, text):
        import zipfile
        
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as docx:
            doc_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t>{self.escape_xml(text)}</w:t></w:r></w:p>
</w:body>
</w:document>'''
            docx.writestr('word/document.xml', doc_xml)
            
            content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>'''
            docx.writestr('[Content_Types].xml', content_types)
            
            rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''
            docx.writestr('_rels/.rels', rels)
            
            doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>'''
            docx.writestr('word/_rels/document.xml.rels', doc_rels)
        
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
