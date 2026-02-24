from http.server import BaseHTTPRequestHandler
import json
import base64
from io import BytesIO

try:
    from PyPDF2 import PdfReader, PdfWriter
except ImportError:
    from pypdf import PdfReader, PdfWriter

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            file_base64 = body.get('file')
            split_mode = body.get('mode', 'all')
            page_range = body.get('pageRange', '')
            
            if not file_base64:
                self.send_error_response(400, 'File is required')
                return
            
            pdf_data = base64.b64decode(file_base64)
            pdf_stream = BytesIO(pdf_data)
            reader = PdfReader(pdf_stream)
            
            result_files = []
            
            if split_mode == 'all':
                # Split into individual pages
                for i, page in enumerate(reader.pages):
                    writer = PdfWriter()
                    writer.add_page(page)
                    output = BytesIO()
                    writer.write(output)
                    output.seek(0)
                    result_files.append(base64.b64encode(output.read()).decode('utf-8'))
            else:
                # Extract specific pages
                pages = self.parse_page_range(page_range, len(reader.pages))
                writer = PdfWriter()
                for page_num in pages:
                    writer.add_page(reader.pages[page_num])
                output = BytesIO()
                writer.write(output)
                output.seek(0)
                result_files.append(base64.b64encode(output.read()).decode('utf-8'))
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'success': True, 'files': result_files}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
    def parse_page_range(self, range_str, total_pages):
        pages = []
        parts = range_str.split(',')
        for part in parts:
            if '-' in part:
                start, end = part.split('-')
                start = int(start.strip()) - 1
                end = int(end.strip())
                pages.extend(range(start, min(end, total_pages)))
            else:
                page = int(part.strip()) - 1
                if page < total_pages:
                    pages.append(page)
        return pages
    
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
