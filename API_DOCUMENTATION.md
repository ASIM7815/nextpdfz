# PDFZ API Documentation

Complete API documentation for all PDF tools and features available on PDFZ.

## Base URL
```
https://pdfz.asimsaad.com/api
```

## Authentication
No authentication required. All endpoints are publicly accessible.

---

## Available APIs

### 1. Merge PDF
**Endpoint:** `/api/merge-pdf`  
**Method:** `POST`  
**Description:** Merge multiple PDF files into a single document

**Request Body:**
```json
{
  "files": ["base64_encoded_pdf_1", "base64_encoded_pdf_2", "..."]
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_merged_pdf"
}
```

---

### 2. Split PDF
**Endpoint:** `/api/split-pdf`  
**Method:** `POST`  
**Description:** Extract specific pages or split PDF into separate pages

**Request Body:**
```json
{
  "file": "base64_encoded_pdf",
  "splitMode": "range",
  "pageRange": "1-3,5,7-9"
}
```

**Options:**
- `splitMode`: "range" | "all"
- `pageRange`: String (e.g., "1-3,5,7-9") - required when splitMode is "range"

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_split_pdf"
}
```

---

### 3. Compress PDF
**Endpoint:** `/api/compress-pdf`  
**Method:** `POST`  
**Description:** Reduce PDF file size without losing quality

**Request Body:**
```json
{
  "file": "base64_encoded_pdf",
  "targetSize": 200
}
```

**Options:**
- `targetSize`: Number (in KB, minimum 30 KB)

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_compressed_pdf"
}
```

---

### 4. Rotate PDF
**Endpoint:** `/api/rotate-pdf`  
**Method:** `POST`  
**Description:** Rotate PDF pages to correct orientation

**Request Body:**
```json
{
  "file": "base64_encoded_pdf",
  "rotationAngle": "90"
}
```

**Options:**
- `rotationAngle`: "90" | "180" | "270"

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_rotated_pdf"
}
```

---

### 5. Protect PDF
**Endpoint:** `/api/protect-pdf`  
**Method:** `POST`  
**Description:** Add password protection to PDF documents

**Request Body:**
```json
{
  "file": "base64_encoded_pdf",
  "password": "your_password",
  "confirmPassword": "your_password"
}
```

**Validation:**
- Password required
- Passwords must match
- Maximum 300 characters

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_protected_pdf"
}
```

---

### 6. Unlock PDF
**Endpoint:** `/api/unlock-pdf`  
**Method:** `POST`  
**Description:** Remove password protection from secured PDF files

**Request Body:**
```json
{
  "file": "base64_encoded_pdf",
  "password": "current_password"
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
  "error": "Incorrect password or PDF is not encrypted"
}
```

---

### 7. PDF to Word
**Endpoint:** `/api/pdf-to-word`  
**Method:** `POST`  
**Description:** Convert PDF files to editable Word (DOCX) documents

**Request Body:**
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

---

### 8. Word to PDF
**Endpoint:** `/api/word-to-pdf`  
**Method:** `POST`  
**Description:** Convert Word (DOCX) documents to PDF files

**Request Body:**
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

### 9. PDF to Excel
**Endpoint:** `/api/pdf-to-excel`  
**Method:** `POST`  
**Description:** Convert PDF tables to editable Excel (XLSX) spreadsheets

**Request Body:**
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

### 10. Excel to PDF
**Endpoint:** `/api/excel-to-pdf`  
**Method:** `POST`  
**Description:** Convert Excel (XLSX) spreadsheets to PDF documents

**Request Body:**
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

### 11. PDF to PowerPoint
**Endpoint:** `/api/pdf-to-powerpoint`  
**Method:** `POST`  
**Description:** Convert PDF files to editable PowerPoint (PPTX) presentations

**Request Body:**
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

### 12. PowerPoint to PDF
**Endpoint:** `/api/powerpoint-to-pdf`  
**Method:** `POST`  
**Description:** Convert PowerPoint (PPTX) presentations to PDF files

**Request Body:**
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

### 13. PDF to JPG
**Endpoint:** `/api/pdf-to-jpg`  
**Method:** `POST`  
**Description:** Convert PDF pages to high-resolution JPG images

**Request Body:**
```json
{
  "file": "base64_encoded_pdf"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_zip_with_images"
}
```

---

### 14. JPG to PDF
**Endpoint:** `/api/jpg-to-pdf`  
**Method:** `POST`  
**Description:** Convert JPG/PNG images to PDF files

**Request Body:**
```json
{
  "files": ["base64_encoded_image_1", "base64_encoded_image_2", "..."]
}
```

**Supported Formats:** JPG, JPEG, PNG

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_pdf"
}
```

---

### 15. Organize PDF
**Endpoint:** `/api/organize-pdf`  
**Method:** `POST`  
**Description:** Rearrange, delete, or extract PDF pages

**Request Body:**
```json
{
  "file": "base64_encoded_pdf",
  "pageOrder": [1, 3, 2, 5]
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_organized_pdf"
}
```

---

### 16. Repair PDF
**Endpoint:** `/api/repair-pdf`  
**Method:** `POST`  
**Description:** Attempt to repair corrupted or damaged PDF files

**Request Body:**
```json
{
  "file": "base64_encoded_pdf"
}
```

**Response:**
```json
{
  "success": true,
  "file": "base64_encoded_repaired_pdf"
}
```

---

## Frontend Features (Client-Side Processing)

The following features are processed entirely in the browser using JavaScript libraries:

### 17. Edit PDF
- Add text, images, annotations
- Draw shapes and lines
- Highlight and underline text

### 18. Sign PDF
- Add digital signatures
- Draw signature
- Upload signature image

### 19. Watermark PDF
- Add text watermark
- Add image watermark
- Customize position and opacity

### 20. HTML to PDF
- Convert HTML content to PDF
- Preserve styling and layout

### 21. PDF to PDF/A
- Convert to archival format
- Long-term preservation

### 22. Page Numbers
- Add page numbers to PDF
- Customize position and format

### 23. Scan to PDF
- Convert scanned images to PDF
- OCR text recognition

### 24. OCR PDF
- Extract text from scanned PDFs
- Make PDFs searchable

### 25. Compare PDF
- Compare two PDF documents
- Highlight differences

### 26. Redact PDF
- Remove sensitive information
- Permanent redaction

### 27. Crop PDF
- Crop PDF pages
- Remove margins

### 28. Translate PDF
- Translate PDF content
- Multiple languages support

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `500` - Internal Server Error

---

## Rate Limits

No rate limits currently enforced. Fair use policy applies.

---

## File Size Limits

- Maximum file size: 100 MB per file
- Large files (>50 MB) use chunked processing
- Files automatically deleted after 1 hour

---

## CORS

All API endpoints support CORS with the following headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Security

- All files are processed securely
- Files automatically deleted after processing
- No data is stored permanently
- HTTPS encryption for all requests

---

## Example Usage (JavaScript)

```javascript
// Example: Merge PDF files
async function mergePDFs(file1Base64, file2Base64) {
  const response = await fetch('https://pdfz.asimsaad.com/api/merge-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [file1Base64, file2Base64]
    })
  });
  
  const result = await response.json();
  return result.file; // base64 encoded merged PDF
}

// Example: Protect PDF with password
async function protectPDF(fileBase64, password) {
  const response = await fetch('https://pdfz.asimsaad.com/api/protect-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: fileBase64,
      password: password,
      confirmPassword: password
    })
  });
  
  const result = await response.json();
  return result.file; // base64 encoded protected PDF
}

// Example: Convert PDF to Word
async function pdfToWord(fileBase64) {
  const response = await fetch('https://pdfz.asimsaad.com/api/pdf-to-word', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: fileBase64
    })
  });
  
  const result = await response.json();
  return result.file; // base64 encoded DOCX file
}
```

---

## Support

For issues or questions:
- Website: https://pdfz.asimsaad.com
- Check browser console for detailed error messages

---

## Technologies Used

**Backend:**
- Python 3.11
- PyPDF2 / pypdf
- Netlify Functions

**Frontend:**
- Next.js 14
- React 18
- pdf-lib
- jsPDF
- PDF.js

---

## License

Free to use for personal and commercial projects.
