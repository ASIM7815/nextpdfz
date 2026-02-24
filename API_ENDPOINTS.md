# PDF Tools API Endpoints

## Base URL
```
https://your-domain.com/api
```

## All Available APIs

### 1. PDF to Word
**Endpoint:** `POST /api/pdf-to-word`

**Request:**
```json
{
  "file": "base64_encoded_pdf"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_docx"
}
```

**Example (JavaScript):**
```javascript
const response = await fetch('/api/pdf-to-word', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file: base64PdfString
  })
});
const result = await response.json();
```

---

### 2. Word to PDF
**Endpoint:** `POST /api/word-to-pdf`

**Request:**
```json
{
  "file": "base64_encoded_docx"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_pdf"
}
```

---

### 3. Merge PDF
**Endpoint:** `POST /api/merge-pdf`

**Request:**
```json
{
  "files": ["base64_pdf_1", "base64_pdf_2", "base64_pdf_3"]
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_merged_pdf"
}
```

**Example:**
```javascript
const response = await fetch('/api/merge-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    files: [pdf1Base64, pdf2Base64, pdf3Base64]
  })
});
```

---

### 4. Compress PDF
**Endpoint:** `POST /api/compress-pdf`

**Request:**
```json
{
  "file": "base64_encoded_pdf",
  "quality": "medium"
}
```

**Parameters:**
- `quality`: "low" | "medium" | "high" (optional, default: "medium")

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_compressed_pdf"
}
```

---

### 5. PDF to Excel
**Endpoint:** `POST /api/pdf-to-excel`

**Request:**
```json
{
  "file": "base64_encoded_pdf"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_xlsx"
}
```

---

### 6. Excel to PDF
**Endpoint:** `POST /api/excel-to-pdf`

**Request:**
```json
{
  "file": "base64_encoded_xlsx"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_pdf"
}
```

---

### 7. PDF to PowerPoint
**Endpoint:** `POST /api/pdf-to-powerpoint`

**Request:**
```json
{
  "file": "base64_encoded_pdf"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_pptx"
}
```

---

### 8. PowerPoint to PDF
**Endpoint:** `POST /api/powerpoint-to-pdf`

**Request:**
```json
{
  "file": "base64_encoded_pptx"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_pdf"
}
```

---

### 9. PDF to JPG
**Endpoint:** `POST /api/pdf-to-jpg`

**Request:**
```json
{
  "file": "base64_encoded_pdf",
  "quality": "medium"
}
```

**Parameters:**
- `quality`: "low" | "medium" | "high" (optional, default: "medium")

**Response:**
```json
{
  "success": true,
  "files": ["base64_jpg_page1", "base64_jpg_page2", "..."]
}
```

---

### 10. JPG to PDF
**Endpoint:** `POST /api/jpg-to-pdf`

**Request:**
```json
{
  "files": ["base64_jpg_1", "base64_jpg_2", "base64_jpg_3"]
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_pdf"
}
```

---

### 11. Split PDF
**Endpoint:** `POST /api/split-pdf`

**Request:**
```json
{
  "file": "base64_encoded_pdf",
  "mode": "all",
  "pageRange": "1-3,5,7-9"
}
```

**Parameters:**
- `mode`: "all" (split all pages) | "range" (split specific pages)
- `pageRange`: "1-3,5,7-9" (only when mode is "range")

**Response:**
```json
{
  "success": true,
  "files": ["base64_pdf_page1", "base64_pdf_page2", "..."]
}
```

---

### 12. Rotate PDF
**Endpoint:** `POST /api/rotate-pdf`

**Request:**
```json
{
  "file": "base64_encoded_pdf",
  "rotationAngle": 90
}
```

**Parameters:**
- `rotationAngle`: 90 | 180 | 270 (degrees)

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_rotated_pdf"
}
```

---

### 13. Unlock PDF
**Endpoint:** `POST /api/unlock-pdf`

**Request:**
```json
{
  "file": "base64_encoded_pdf",
  "password": "user_password"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_unlocked_pdf"
}
```

**Error Response:**
```json
{
  "error": "Incorrect password. Please try again."
}
```

---

### 14. Protect PDF
**Endpoint:** `POST /api/protect-pdf`

**Request:**
```json
{
  "file": "base64_encoded_pdf",
  "password": "user_password",
  "confirmPassword": "user_password"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_protected_pdf"
}
```

---

## Complete Integration Example

### React/Next.js Example

```javascript
// Helper function to convert File to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

// Helper function to download base64 as file
const downloadBase64File = (base64, filename, mimeType) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Example: PDF to Word
async function convertPdfToWord(pdfFile) {
  try {
    const base64Pdf = await fileToBase64(pdfFile);
    
    const response = await fetch('/api/pdf-to-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64Pdf })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Conversion failed');
    }
    
    const result = await response.json();
    downloadBase64File(result.file, 'converted.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
}

// Example: Merge PDFs
async function mergePdfs(pdfFiles) {
  try {
    const base64Files = await Promise.all(
      pdfFiles.map(file => fileToBase64(file))
    );
    
    const response = await fetch('/api/merge-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: base64Files })
    });
    
    const result = await response.json();
    downloadBase64File(result.file, 'merged.pdf', 'application/pdf');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example: Unlock PDF
async function unlockPdf(pdfFile, password) {
  try {
    const base64Pdf = await fileToBase64(pdfFile);
    
    const response = await fetch('/api/unlock-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        file: base64Pdf,
        password: password
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const result = await response.json();
    downloadBase64File(result.file, 'unlocked.pdf', 'application/pdf');
    
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
}

// Example: Split PDF
async function splitPdf(pdfFile, mode = 'all', pageRange = '') {
  try {
    const base64Pdf = await fileToBase64(pdfFile);
    
    const response = await fetch('/api/split-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        file: base64Pdf,
        mode: mode,
        pageRange: pageRange
      })
    });
    
    const result = await response.json();
    
    // Download each page
    result.files.forEach((fileBase64, index) => {
      downloadBase64File(fileBase64, `page_${index + 1}.pdf`, 'application/pdf');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Python Example

```python
import requests
import base64

def pdf_to_word(pdf_path, output_path):
    # Read PDF file
    with open(pdf_path, 'rb') as f:
        pdf_base64 = base64.b64encode(f.read()).decode('utf-8')
    
    # Call API
    response = requests.post('https://your-domain.com/api/pdf-to-word', 
        json={'file': pdf_base64}
    )
    
    result = response.json()
    
    # Save DOCX file
    docx_data = base64.b64decode(result['file'])
    with open(output_path, 'wb') as f:
        f.write(docx_data)

def merge_pdfs(pdf_paths, output_path):
    # Read all PDF files
    files_base64 = []
    for path in pdf_paths:
        with open(path, 'rb') as f:
            files_base64.append(base64.b64encode(f.read()).decode('utf-8'))
    
    # Call API
    response = requests.post('https://your-domain.com/api/merge-pdf',
        json={'files': files_base64}
    )
    
    result = response.json()
    
    # Save merged PDF
    pdf_data = base64.b64decode(result['file'])
    with open(output_path, 'wb') as f:
        f.write(pdf_data)

# Usage
pdf_to_word('input.pdf', 'output.docx')
merge_pdfs(['file1.pdf', 'file2.pdf', 'file3.pdf'], 'merged.pdf')
```

### cURL Examples

```bash
# PDF to Word
curl -X POST https://your-domain.com/api/pdf-to-word \
  -H "Content-Type: application/json" \
  -d '{"file":"BASE64_ENCODED_PDF"}'

# Merge PDFs
curl -X POST https://your-domain.com/api/merge-pdf \
  -H "Content-Type: application/json" \
  -d '{"files":["PDF1_BASE64","PDF2_BASE64"]}'

# Unlock PDF
curl -X POST https://your-domain.com/api/unlock-pdf \
  -H "Content-Type: application/json" \
  -d '{"file":"BASE64_PDF","password":"mypassword"}'

# Compress PDF
curl -X POST https://your-domain.com/api/compress-pdf \
  -H "Content-Type: application/json" \
  -d '{"file":"BASE64_PDF","quality":"medium"}'
```

## Error Handling

All APIs return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing parameters, validation error)
- `401` - Unauthorized (incorrect password)
- `500` - Server Error (processing failed)

## Rate Limits

- No rate limits currently implemented
- File size limit: 4.5MB (Vercel free tier)
- Timeout: 10 seconds per request

## CORS

All APIs support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## Notes

1. All file data must be base64 encoded
2. Response files are also base64 encoded
3. For multiple file outputs (split, pdf-to-jpg), response contains `files` array
4. For single file outputs, response contains `file` string
5. Always check `success` field in response before processing
