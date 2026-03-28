import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file, pageOrder = [] } = body;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const pdfBytes = Buffer.from(file, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();

    if (pageOrder.length > 0) {
      const copiedPages = await newPdf.copyPages(pdfDoc, pageOrder);
      copiedPages.forEach(page => newPdf.addPage(page));
    } else {
      const allPages = pdfDoc.getPageIndices();
      const copiedPages = await newPdf.copyPages(pdfDoc, allPages);
      copiedPages.forEach(page => newPdf.addPage(page));
    }

    const organizedBytes = await newPdf.save();
    const organizedBase64 = Buffer.from(organizedBytes).toString('base64');

    return NextResponse.json({ success: true, file: organizedBase64 });
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
