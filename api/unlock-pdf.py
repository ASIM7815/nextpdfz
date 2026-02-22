from http.server import BaseHTTPRequestHandler
from PyPDF2 import PdfReader, PdfWriter
import json
import io
import base64

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get content length
            content_length = int(self.headers['Content-Length'])
            
            # Read the POST data
            post_data = self.rfile.read(content_length)
            
            # Parse JSON data
            data = json.loads(post_data.decode('utf-8'))
            
            # Get file data and password
            file_data_base64 = data.get('file')
            password = data.get('password', '')
            
            if not file_data_base64:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'File is required'
                }).encode())
                return
            
            # Decode base64 file data
            file_data = base64.b64decode(file_data_base64)
            
            # Create PDF reader with password if provided
            try:
                if password:
                    pdf_reader = PdfReader(io.BytesIO(file_data), password=password)
                else:
                    pdf_reader = PdfReader(io.BytesIO(file_data))
            except Exception as e:
                error_msg = str(e).lower()
                if 'password' in error_msg or 'encrypted' in error_msg:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': 'Incorrect password or PDF is encrypted. Please provide the correct password.'
                    }).encode())
                    return
                else:
                    raise
            
            # Check if PDF is encrypted
            if pdf_reader.is_encrypted:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'PDF is still encrypted. Please provide the correct password.'
                }).encode())
                return
            
            # Create PDF writer
            pdf_writer = PdfWriter()
            
            # Copy all pages to writer (this removes encryption)
            for page in pdf_reader.pages:
                pdf_writer.add_page(page)
            
            # Write to bytes (without encryption)
            output_buffer = io.BytesIO()
            pdf_writer.write(output_buffer)
            unlocked_pdf = output_buffer.getvalue()
            
            # Encode to base64 for JSON response
            unlocked_pdf_base64 = base64.b64encode(unlocked_pdf).decode('utf-8')
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'file': unlocked_pdf_base64
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': f'An error occurred: {str(e)}'
            }).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
