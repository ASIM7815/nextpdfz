from http.server import BaseHTTPRequestHandler
import json
import base64

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            self.send_error_response(501, 'PowerPoint to PDF conversion requires client-side processing. Please use the frontend implementation.')
            
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
