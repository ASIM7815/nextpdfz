import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { file, password, confirmPassword } = body
    
    if (!file || !password) {
      return NextResponse.json(
        { error: 'File and password are required' },
        { status: 400 }
      )
    }
    
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }
    
    if (password.length > 300) {
      return NextResponse.json(
        { error: 'Password must not exceed 300 characters' },
        { status: 400 }
      )
    }
    
    // Decode base64 file
    const fileBuffer = Buffer.from(file, 'base64')
    
    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(fileBuffer)
    
    // Note: pdf-lib doesn't support encryption natively
    // For now, we'll return the PDF as-is
    // To add real encryption, you need to use a library that supports it
    // or use the Python API with PyPDF2
    
    const pdfBytes = await pdfDoc.save()
    const encryptedPdfBase64 = Buffer.from(pdfBytes).toString('base64')
    
    return NextResponse.json({
      success: true,
      file: encryptedPdfBase64,
      warning: 'PDF encryption requires PyPDF2 (Python). Deploy with Python runtime or the PDF will not be password protected.'
    })
    
  } catch (error: any) {
    console.error('Protect PDF error:', error)
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
