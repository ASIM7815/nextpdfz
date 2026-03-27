import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'

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
    await writeFile(inputPath, pdfBuffer)
    
    // Use qpdf to encrypt the PDF
    const { encrypt } = await import('node-qpdf2')
    
    const options = {
      input: inputPath,
      output: outputPath,
      password: password,
      keyLength: 256,
      restrictions: {
        print: 'full',
        modify: 'none',
        extract: 'n',
        annotate: 'y',
        fillForms: 'y',
        accessibility: 'y',
        assemble: 'n'
      }
    }
    
    await encrypt(options)
    
    // Read encrypted file
    const fs = await import('fs/promises')
    const encryptedBuffer = await fs.readFile(outputPath)
    const encryptedBase64 = encryptedBuffer.toString('base64')
    
    // Clean up temp files
    await unlink(inputPath)
    await unlink(outputPath)
    
    return NextResponse.json({
      success: true,
      file: encryptedBase64
    })
    
  } catch (error: any) {
    console.error('Protect PDF error:', error)
    
    // Clean up temp files on error
    try {
      if (inputPath) await unlink(inputPath)
      if (outputPath) await unlink(outputPath)
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
