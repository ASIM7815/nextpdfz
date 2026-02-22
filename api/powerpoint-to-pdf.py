from http.server import BaseHTTPRequestHandler
import subprocess
import tempfile
import os
import json
from pathlib import Path

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get content length
            content_length = int(self.headers['Content-Length'])
            
            # Read the file data
            boundary = self.headers['Content-Type'].split('boundary=')[1]
            body = self.rfile.read(content_length)
            
            # Parse multipart form data
            parts = body.split(f'--{boundary}'.encode())
            file_data = None
            filename = 'input.pptx'
            
            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    # Extract filename
                    header_end = part.find(b'\r\n\r\n')
                    if header_end != -1:
                        header = part[:header_end].decode('utf-8', errors='ignore')
                        if 'filename=' in header:
                            filename = header.split('filename=')[1].split('"')[1]
                        file_data = part[header_end + 4:]
                        # Remove trailing boundary markers
                        if file_data.endswith(b'\r\n'):
                            file_data = file_data[:-2]
                        break
            
            if not file_data:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No file provided'}).encode())
                return
            
            # Create temporary directory
            with tempfile.TemporaryDirectory() as temp_dir:
                # Save input file
                input_path = os.path.join(temp_dir, filename)
                with open(input_path, 'wb') as f:
                    f.write(file_data)
                
                # Output PDF path
                output_filename = filename.replace('.pptx', '.pdf').replace('.ppt', '.pdf')
                output_path = os.path.join(temp_dir, output_filename)
                
                # Convert using LibreOffice
                try:
                    result = subprocess.run(
                        ['soffice', '--headless', '--convert-to', 'pdf', '--outdir', temp_dir, input_path],
                        capture_output=True,
                        timeout=60,
                        check=False
                    )
                    
                    # Check if conversion was successful
                    if not os.path.exists(output_path):
                        # Try alternative output name (LibreOffice sometimes uses input filename base)
                        base_name = Path(filename).stem
                        output_path = os.path.join(temp_dir, f'{base_name}.pdf')
                    
                    if not os.path.exists(output_path):
                        error_msg = result.stderr.decode('utf-8', errors='ignore') if result.stderr else 'Unknown error'
                        raise Exception(f'Conversion failed: {error_msg}')
                    
                    # Read the PDF file as binary
                    with open(output_path, 'rb') as f:
                        pdf_data = f.read()
                    
                    # Send response
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/pdf')
                    self.send_header('Content-Disposition', f'attachment; filename="{output_filename}"')
                    self.send_header('Content-Length', str(len(pdf_data)))
                    self.end_headers()
                    self.wfile.write(pdf_data)
                    
                except subprocess.TimeoutExpired:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Conversion timeout. File may be too large.'}).encode())
                    
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': f'Conversion failed: {str(e)}'}).encode())
        
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'Server error: {str(e)}'}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
