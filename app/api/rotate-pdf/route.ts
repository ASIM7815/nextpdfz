import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, degrees } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file, rotation = 90, pages = [] } = body;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const pdfBytes = Buffer.from(file, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    const pagesToRotate = pages.length > 0 ? pages : Array.from({ length: totalPages }, (_, i) => i);

    for (const pageIndex of pagesToRotate) {
      if (pageIndex >= 0 && pageIndex < totalPages) {
        const page = pdfDoc.getPage(pageIndex);
        page.setRotation(degrees(rotation));
      }
    }

    const rotatedBytes = await pdfDoc.save();
    const rotatedBase64 = Buffer.from(rotatedBytes).toString('base64');

    return NextResponse.json({ success: true, file: rotatedBase64 });
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
