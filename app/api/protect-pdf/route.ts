import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import muhammara from 'muhammara'

export async function POST(request: NextRequest) {
  let inputPath: string | null = null
  let outputPath: string | null = null

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
    
    // Decode base64 PDF
    const pdfBuffer = Buffer.from(file, 'base64')
    
    // Create temporary files
    const tempId = randomBytes(16).toString('hex')
    inputPath = join(tmpdir(), `input-${tempId}.pdf`)
    outputPath = join(tmpdir(), `output-${tempId}.pdf`)
    
    // Write input file
    writeFileSync(inputPath, pdfBuffer)
    
    // Encrypt PDF using muhammara
    const pdfWriter = muhammara.createWriterToModify(inputPath, {
      modifiedFilePath: outputPath,
      userPassword: password,
      ownerPassword: password,
      userProtectionFlag: 4 // No copying, no modifying
    })
    
    pdfWriter.end()
    
    // Read encrypted file
    const encryptedBuffer = readFileSync(outputPath)
    const encryptedBase64 = encryptedBuffer.toString('base64')
    
    // Clean up temp files
    unlinkSync(inputPath)
    unlinkSync(outputPath)
    
    return NextResponse.json({
      success: true,
      file: encryptedBase64
    })
    
  } catch (error: any) {
    console.error('Protect PDF error:', error)
    
    // Clean up temp files on error
    try {
      if (inputPath) unlinkSync(inputPath)
      if (outputPath) unlinkSync(outputPath)
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError)
    }
    
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
