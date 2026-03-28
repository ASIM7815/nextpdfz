import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file, password, confirmPassword } = body;

    if (!file || !password) {
      return NextResponse.json({ error: 'File and password are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length > 300) {
      return NextResponse.json({ error: 'Password must not exceed 300 characters' }, { status: 400 });
    }

    const pdfBytes = Buffer.from(file, 'base64');
    
    // Using @pdfsmaller/pdf-encrypt-lite for encryption
    const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt-lite');
    const encryptedBytes = await encryptPDF(new Uint8Array(pdfBytes), password, password);
    const encryptedBase64 = Buffer.from(encryptedBytes).toString('base64');

    return NextResponse.json({ success: true, file: encryptedBase64 });
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
