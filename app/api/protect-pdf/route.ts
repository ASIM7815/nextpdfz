import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      file: body.file
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to protect PDF' },
      { status: 500 }
    )
  }
}
