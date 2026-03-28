import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files } = body;

    if (!files || files.length < 2) {
      return NextResponse.json({ error: 'At least 2 PDF files are required' }, { status: 400 });
    }

    const mergedPdf = await PDFDocument.create();

    for (const fileBase64 of files) {
      const pdfBytes = Buffer.from(fileBase64, 'base64');
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const mergedBase64 = Buffer.from(mergedBytes).toString('base64');

    return NextResponse.json({ success: true, file: mergedBase64 });
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
