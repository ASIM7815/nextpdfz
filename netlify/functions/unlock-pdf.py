from http.server import BaseHTTPRequestHandler
import json
import base64
from io import BytesIO

# Try importing from both PyPDF2 and pypdf for compatibility
try:
    from PyPDF2 import PdfReader, PdfWriter
    PYPDF2_VERSION = 2
except ImportError:
    try:
        from pypdf import PdfReader, PdfWriter
        PYPDF2_VERSION = 3
    except ImportError:
        raise ImportError("Neither PyPDF2 nor pypdf is installed")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            # Extract parameters
            file_base64 = body.get('file')
            password = body.get('password', '')
            
            # Validation
            if not file_base64:
                self.send_error_response(400, 'File is required')
                return
            
            if not password:
                self.send_error_response(400, 'Password is required to unlock the PDF')
                return
            
            # Decode PDF file
            pdf_data = base64.b64decode(file_base64)
            pdf_stream = BytesIO(pdf_data)
            
            # Try to read PDF with password
            try:
                reader = PdfReader(pdf_stream)
                
                # Check if PDF is encrypted
                if reader.is_encrypted:
                    # Try to decrypt with provided password
                    decrypt_result = reader.decrypt(password)
                    
                    # Check if decryption was successful
                    # decrypt() returns 0 for failure, 1 for user password, 2 for owner password
                    if decrypt_result == 0:
                        self.send_error_response(401, 'Incorrect password. Please try again.')
                        return
                else:
                    # PDF is not encrypted, just return it as-is
                    pass
                
                # Create writer and copy all pages (now decrypted)
                writer = PdfWriter()
                
                for page in reader.pages:
                    writer.add_page(page)
                
                # Write to output stream (without encryption)
                output_stream = BytesIO()
                writer.write(output_stream)
                output_stream.seek(0)
                
                # Encode to base64
                unlocked_pdf_base64 = base64.b64encode(output_stream.read()).decode('utf-8')
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'success': True,
                    'file': unlocked_pdf_base64
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
            except Exception as decrypt_error:
                # Handle decryption errors
                error_msg = str(decrypt_error)
                if 'password' in error_msg.lower() or 'decrypt' in error_msg.lower():
                    self.send_error_response(401, 'Incorrect password or unsupported encryption method.')
                else:
                    self.send_error_response(500, f'Failed to unlock PDF: {error_msg}')
            
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
