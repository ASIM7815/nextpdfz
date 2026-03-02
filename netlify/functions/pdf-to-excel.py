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
            text_content = []
            for page in reader.pages:
                text = page.extract_text()
                text_content.append(text)
            
            # Create Excel
            xlsx_content = self.create_xlsx(text_content)
            xlsx_base64 = base64.b64encode(xlsx_content).decode('utf-8')
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'success': True, 'file': xlsx_base64}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
    def create_xlsx(self, text_pages):
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as xlsx:
            # Sheet data
            sheet_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>'''
            
            for idx, text in enumerate(text_pages, 1):
                lines = text.split('\n')[:50]
                for line_idx, line in enumerate(lines, 1):
                    row_num = (idx - 1) * 50 + line_idx
                    sheet_xml += f'<row r="{row_num}"><c r="A{row_num}" t="inlineStr"><is><t>{self.escape_xml(line[:100])}</t></is></c></row>'
            
            sheet_xml += '</sheetData></worksheet>'
            xlsx.writestr('xl/worksheets/sheet1.xml', sheet_xml)
            
            # Content types
            content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>'''
            xlsx.writestr('[Content_Types].xml', content_types)
            
            # Workbook
            workbook = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''
            xlsx.writestr('xl/workbook.xml', workbook)
            
            # Relationships
            xlsx.writestr('_rels/.rels', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>''')
            
            xlsx.writestr('xl/_rels/workbook.xml.rels', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>''')
        
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
