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
            
            # Try to open PDF
            try:
                # First, try to open without password
                try:
                    pdf = pikepdf.open(io.BytesIO(file_data))
                    # If it opens without password, check if it's actually encrypted
                    # (it might just have restrictions, not user password)
                    is_encrypted = False
                except pikepdf.PasswordError:
                    # PDF requires a password to open
                    is_encrypted = True
                    
                    if not password:
                        # No password provided but PDF needs one
                        self.send_response(400)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'error': 'This PDF is password-protected. Please enter the password to unlock it.'
                        }).encode())
                        return
                    
                    # Try to open with provided password
                    try:
                        pdf = pikepdf.open(io.BytesIO(file_data), password=password)
                    except pikepdf.PasswordError:
                        # Wrong password
                        self.send_response(400)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'error': 'Incorrect password. Please try again.'
                        }).encode())
                        return
                        
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': f'Failed to open PDF: {str(e)}'
                }).encode())
                return
            
            # Save the PDF without encryption/restrictions
            output_buffer = io.BytesIO()
            pdf.save(output_buffer)
            pdf.close()
            
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
