import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file } = body;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const pdfBytes = Buffer.from(file, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    const compressedBase64 = Buffer.from(compressedBytes).toString('base64');

    return NextResponse.json({ success: true, file: compressedBase64 });
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
