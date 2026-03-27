# NextPDFz - PDF Tools Web Application

A modern PDF manipulation tool built with Next.js and Python serverless functions.

## Features

- PDF Protection & Unlocking
- Merge & Split PDFs
- Compress & Rotate PDFs
- PDF to Word/Excel/PowerPoint conversion
- Word/Excel/PowerPoint to PDF conversion
- PDF to JPG & JPG to PDF conversion
- Organize PDF pages
- Repair corrupted PDFs

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Python serverless functions
- **PDF Processing**: PyPDF2, pypdf
- **Deployment**: Vercel

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ASIM7815/nextpdfz)

### Manual Deployment Steps

1. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your GitHub repository: `ASIM7815/nextpdfz`
   - Vercel will auto-detect Next.js and Python functions
   - Click "Deploy"

2. **Deploy via Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel
   ```

### Configuration

- **Framework**: Next.js (auto-detected)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Python Runtime**: Python 3.9 (auto-detected for `/api/*.py`)

### Environment Variables

No environment variables are required for basic functionality.

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Python dependencies** (for local API testing):
   ```bash
   pip install -r requirements.txt
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nextpdfz/
├── app/                    # Next.js app directory
│   ├── api/               # Next.js API routes (TypeScript)
│   ├── tools/             # Tool pages
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility libraries
├── api/                   # Python serverless functions
├── public/                # Static assets
├── vercel.json           # Vercel configuration
└── requirements.txt      # Python dependencies
```

## API Endpoints

All PDF processing endpoints are available at `/api/*`:

- `/api/protect-pdf` - Add password protection
- `/api/unlock-pdf` - Remove password protection
- `/api/merge-pdf` - Merge multiple PDFs
- `/api/split-pdf` - Split PDF into pages
- `/api/compress-pdf` - Compress PDF size
- `/api/rotate-pdf` - Rotate PDF pages
- `/api/pdf-to-word` - Convert PDF to Word
- `/api/word-to-pdf` - Convert Word to PDF
- `/api/pdf-to-excel` - Convert PDF to Excel
- `/api/excel-to-pdf` - Convert Excel to PDF
- `/api/pdf-to-powerpoint` - Convert PDF to PowerPoint
- `/api/powerpoint-to-pdf` - Convert PowerPoint to PDF
- `/api/pdf-to-jpg` - Convert PDF to JPG images
- `/api/jpg-to-pdf` - Convert JPG to PDF
- `/api/organize-pdf` - Organize PDF pages
- `/api/repair-pdf` - Repair corrupted PDFs

## How It Works

- **Frontend**: Next.js handles the UI and routing
- **Python Functions**: Each `/api/*.py` file is automatically deployed as a serverless function
- **Vercel Runtime**: Automatically detects Python files and uses Python 3.9 runtime
- **Dependencies**: `requirements.txt` is automatically installed for Python functions

## License

MIT
