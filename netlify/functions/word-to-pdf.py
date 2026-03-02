from http.server import BaseHTTPRequestHandler
import json
import base64
from io import BytesIO
import zipfile
import re

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
            
            docx_data = base64.b64decode(file_base64)
            text = self.extract_text_from_docx(docx_data)
            
            # Return error - this feature requires client-side processing
            self.send_error_response(501, 'Word to PDF conversion is best done client-side. Please use the frontend implementation.')
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
    def extract_text_from_docx(self, docx_data):
        try:
            with zipfile.ZipFile(BytesIO(docx_data)) as docx:
                xml_content = docx.read('word/document.xml').decode('utf-8')
                text = re.findall(r'<w:t[^>]*>([^<]+)</w:t>', xml_content)
                return ' '.join(text)
        except:
            return "Unable to extract text from document"
    
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
