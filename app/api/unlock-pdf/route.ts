import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file, password } = body;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required to unlock the PDF' }, { status: 400 });
    }

    const pdfBytes = Buffer.from(file, 'base64');
    
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, { 
        ignoreEncryption: false,
        password: password 
      });
      
      const unlockedBytes = await pdfDoc.save();
      const unlockedBase64 = Buffer.from(unlockedBytes).toString('base64');

      return NextResponse.json({ success: true, file: unlockedBase64 });
    } catch (decryptError: any) {
      if (decryptError.message.includes('password') || decryptError.message.includes('decrypt')) {
        return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
      }
      throw decryptError;
    }
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
