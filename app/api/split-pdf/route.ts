import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const pages: number[] = [];
  const parts = rangeStr.split(',');
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim()));
      for (let i = start - 1; i < Math.min(end, totalPages); i++) {
        pages.push(i);
      }
    } else {
      const page = parseInt(part.trim()) - 1;
      if (page < totalPages) {
        pages.push(page);
      }
    }
  }
  
  return pages;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file, mode = 'all', pageRange = '' } = body;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const pdfBytes = Buffer.from(file, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    const resultFiles: string[] = [];

    if (mode === 'all') {
      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);
        const bytes = await newPdf.save();
        resultFiles.push(Buffer.from(bytes).toString('base64'));
      }
    } else {
      const pages = parsePageRange(pageRange, totalPages);
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, pages);
      copiedPages.forEach(page => newPdf.addPage(page));
      const bytes = await newPdf.save();
      resultFiles.push(Buffer.from(bytes).toString('base64'));
    }

    return NextResponse.json({ success: true, files: resultFiles });
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
