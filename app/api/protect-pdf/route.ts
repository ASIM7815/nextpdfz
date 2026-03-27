import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { file, password, confirmPassword } = body
    
    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to protect PDF' },
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
    
    // For local development, return error message
    // On Vercel, the Python API at /api/protect-pdf.py will be used instead
    return NextResponse.json(
      { 
        error: 'PDF encryption requires deployment to Vercel. The Python API will handle encryption in production. For local testing, please deploy to Vercel.' 
      },
      { status: 501 }
    )
    
  } catch (error: any) {
    console.error('Protect PDF error:', error)
    
    return NextResponse.json(
      { error: `Failed to protect PDF: ${error.message}` },
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
