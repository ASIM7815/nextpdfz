from http.server import BaseHTTPRequestHandler
import json
import io
import base64
import pikepdf

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
            password = data.get('password')
            confirm_password = data.get('confirmPassword')
            
            if not file_data_base64 or not password:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'File and password are required'
                }).encode())
                return
            
            if password != confirm_password:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Passwords do not match'
                }).encode())
                return
            
            if len(password) > 300:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Password must not exceed 300 characters'
                }).encode())
                return
            
            # Decode base64 file data
            file_data = base64.b64decode(file_data_base64)
            
            # Open PDF with pikepdf
            pdf = pikepdf.open(io.BytesIO(file_data))
            
            # Save with encryption
            output_buffer = io.BytesIO()
            pdf.save(
                output_buffer,
                encryption=pikepdf.Encryption(
                    owner=password,
                    user=password,
                    R=6  # Use AES-256 encryption (strongest)
                )
            )
            pdf.close()
            
            encrypted_pdf = output_buffer.getvalue()
            
            # Encode to base64 for JSON response
            encrypted_pdf_base64 = base64.b64encode(encrypted_pdf).decode('utf-8')
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'file': encrypted_pdf_base64
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
