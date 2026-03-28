# 📄 NextPDFz - Professional PDF Tools

A powerful, privacy-focused PDF manipulation platform built with Next.js and TypeScript. Process your PDFs entirely in the cloud with enterprise-grade security.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ASIM7815/nextpdfz)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🔒 Security & Protection
- **Protect PDF** - Add password encryption (up to 300 characters)
- **Unlock PDF** - Remove password protection from secured PDFs

### 📑 PDF Manipulation
- **Merge PDF** - Combine multiple PDFs into one document
- **Split PDF** - Extract specific pages or split into individual pages
- **Compress PDF** - Reduce file size with customizable target size
- **Rotate PDF** - Rotate pages by 90°, 180°, or 270°
- **Organize PDF** - Reorder, delete, or duplicate pages

### 🔄 Format Conversion
- **PDF to Word** (.docx) - Preserve text and layout
- **PDF to Excel** (.xlsx) - Extract tables and data
- **PDF to PowerPoint** (.pptx) - Convert slides
- **PDF to JPG** - Export pages as high-quality images
- **Word to PDF** - Convert .docx documents
- **Excel to PDF** - Convert .xlsx spreadsheets
- **PowerPoint to PDF** - Convert .pptx presentations
- **JPG to PDF** - Combine images into PDF

### 🛠️ Advanced Tools
- **Repair PDF** - Fix corrupted or damaged PDF files
- **Watermark** - Add text watermarks to pages
- **Page Numbers** - Add custom page numbering

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes (TypeScript)
- **PDF Libraries**: 
  - pdf-lib - PDF manipulation
  - PDF.js - PDF rendering
  - jsPDF - PDF generation
  - jszip - Office document creation
  - @pdfsmaller/pdf-encrypt-lite - PDF encryption
- **Deployment**: Vercel Edge Network
- **Styling**: CSS Modules with responsive design

## 📦 Quick Start

### Deploy to Vercel (Recommended)

The easiest way to deploy NextPDFz is using Vercel:

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Vercel will automatically:
   - Detect Next.js framework
   - Install dependencies from `package.json`
   - Deploy to global edge network

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ASIM7815/nextpdfz.git
   cd nextpdfz
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
nextpdfz/
├── app/                      # Next.js 14 App Router
│   ├── api/                 # TypeScript API routes
│   │   ├── protect-pdf/    # Password protection
│   │   ├── unlock-pdf/     # Password removal
│   │   ├── merge-pdf/      # PDF merging
│   │   ├── compress-pdf/   # PDF compression
│   │   └── ...             # Other PDF operations
│   ├── tools/[toolId]/      # Dynamic tool pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── Navbar.tsx          # Navigation bar
│   ├── Hero.tsx            # Hero section
│   ├── ToolsSection.tsx    # Tools grid
│   ├── FeaturesSection.tsx # Features showcase
│   └── Footer.tsx          # Footer
├── lib/                     # Utility libraries
│   ├── pdfProcessor.ts     # Client-side PDF processing
│   ├── toolConfig.ts       # Tool configurations
│   ├── chunkedProcessor.ts # Large file handling
│   ├── fileSystemStorage.ts # File system API
│   └── loadScripts.ts      # Dynamic script loading
├── public/                  # Static assets
│   ├── favicon.svg
│   ├── sitemap.xml
│   └── robots.txt
├── vercel.json             # Vercel configuration
├── package.json            # Node.js dependencies
└── tsconfig.json           # TypeScript configuration
```

## 🔌 API Endpoints

All PDF processing is handled by TypeScript API routes at `/api/*`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/protect-pdf` | POST | Add password encryption to PDF |
| `/api/unlock-pdf` | POST | Remove password from protected PDF |
| `/api/merge-pdf` | POST | Merge multiple PDFs into one |
| `/api/split-pdf` | POST | Split PDF by page range |
| `/api/compress-pdf` | POST | Reduce PDF file size |
| `/api/rotate-pdf` | POST | Rotate PDF pages |
| `/api/pdf-to-word` | POST | Convert PDF to DOCX |
| `/api/word-to-pdf` | POST | Convert DOCX to PDF |
| `/api/pdf-to-excel` | POST | Convert PDF to XLSX |
| `/api/excel-to-pdf` | POST | Convert XLSX to PDF |
| `/api/pdf-to-powerpoint` | POST | Convert PDF to PPTX |
| `/api/powerpoint-to-pdf` | POST | Convert PPTX to PDF |
| `/api/pdf-to-jpg` | POST | Convert PDF pages to JPG images |
| `/api/jpg-to-pdf` | POST | Convert JPG images to PDF |
| `/api/organize-pdf` | POST | Reorder/delete PDF pages |
| `/api/repair-pdf` | POST | Repair corrupted PDF files |

### Request Format

All endpoints accept JSON with base64-encoded file data:

```json
{
  "file": "base64_encoded_pdf_data",
  "password": "optional_password",
  "options": {}
}
```

### Response Format

```json
{
  "success": true,
  "file": "base64_encoded_result_data"
}
```

## ⚙️ Configuration

### vercel.json

The `vercel.json` file configures Next.js deployment:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

This configuration builds the Next.js application with all API routes automatically handled by the Next.js framework.

## 🎨 Features in Detail

### Password Protection
- Supports passwords up to 300 characters
- Uses @pdfsmaller/pdf-encrypt-lite for encryption
- Password confirmation validation
- Secure server-side processing

### Compression
- Customizable target file size
- Intelligent quality adjustment
- Preserves document structure
- Supports large files with chunked processing

### Format Conversion
- Maintains formatting and layout
- Handles text, images, and tables
- High-quality image rendering
- Batch processing support

### Large File Handling
- Chunked processing for files > 10MB
- File System Access API support
- Progress tracking
- Memory-efficient streaming

## 🛡️ Security & Privacy

- **No Data Storage**: Files are processed in memory and immediately discarded
- **Serverless Architecture**: Each request runs in isolated environment
- **HTTPS Only**: All data transmission is encrypted
- **Client-Side Processing**: Many operations run entirely in browser
- **No Tracking**: No analytics or user tracking

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Known Issues

- Large file processing (>50MB) may timeout on free Vercel tier
- Some complex PDF layouts may not convert perfectly
- Password-protected PDFs require correct password for processing

## 📧 Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/ASIM7815/nextpdfz/issues)
- Check existing issues for solutions

## 🙏 Acknowledgments

- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation in JavaScript
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [jszip](https://stuk.github.io/jszip/) - ZIP file generation
- [@pdfsmaller/pdf-encrypt-lite](https://www.npmjs.com/package/@pdfsmaller/pdf-encrypt-lite) - PDF encryption
- [Next.js](https://nextjs.org/) - React framework
- [Vercel](https://vercel.com/) - Deployment platform

---

Made with ❤️ by [ASIM7815](https://github.com/ASIM7815)
