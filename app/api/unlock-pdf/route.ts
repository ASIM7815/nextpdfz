import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { file, password } = body
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to unlock the PDF' },
        { status: 400 }
      )
    }
    
    // This route is a fallback for Next.js runtime
    // The actual unlock functionality requires PyPDF2 (Python)
    // which is handled by api/unlock-pdf.py
    
    return NextResponse.json({
      error: 'PDF unlocking requires PyPDF2 (Python). Please ensure the Python API is deployed.'
    }, { status: 501 })
    
  } catch (error: any) {
    console.error('Unlock PDF error:', error)
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
