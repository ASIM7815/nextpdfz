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
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            # Extract parameters
            file_base64 = body.get('file')
            password = body.get('password')
            confirm_password = body.get('confirmPassword')
            
            # Validation
            if not file_base64 or not password:
                self.send_error_response(400, 'File and password are required')
                return
            
            if password != confirm_password:
                self.send_error_response(400, 'Passwords do not match')
                return
            
            if len(password) > 300:
                self.send_error_response(400, 'Password must not exceed 300 characters')
                return
            
            # Decode PDF file
            pdf_data = base64.b64decode(file_base64)
            pdf_stream = BytesIO(pdf_data)
            
            # Read PDF
            reader = PdfReader(pdf_stream)
            writer = PdfWriter()
            
            # Copy all pages
            for page in reader.pages:
                writer.add_page(page)
            
            # Encrypt with password (256-bit AES)
            writer.encrypt(user_password=password, owner_password=password, algorithm="AES-256")
            
            # Write to output stream
            output_stream = BytesIO()
            writer.write(output_stream)
            output_stream.seek(0)
            
            # Encode to base64
            encrypted_pdf_base64 = base64.b64encode(output_stream.read()).decode('utf-8')
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'file': encrypted_pdf_base64
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
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
