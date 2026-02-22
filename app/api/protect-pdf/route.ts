import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const password = formData.get('password') as string
    
    if (!file || !password) {
      return NextResponse.json(
        { error: 'File and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 3) {
      return NextResponse.json(
        { error: 'Password must be at least 3 characters long' },
        { status: 400 }
      )
    }

    // Generate unique filenames
    const tempId = randomBytes(16).toString('hex')
    const inputPath = path.join('/tmp', `input_${tempId}.pdf`)
    const outputPath = path.join('/tmp', `output_${tempId}.pdf`)

    // Save uploaded file
    const arrayBuffer = await file.arrayBuffer()
    await writeFile(inputPath, Buffer.from(arrayBuffer))

    // Use qpdf to encrypt the PDF
    // --encrypt <user-password> <owner-password> <key-length> --
    const command = `qpdf --encrypt "${password}" "${password}" 256 -- "${inputPath}" "${outputPath}"`
    
    try {
      await execAsync(command)
    } catch (error: any) {
      console.error('qpdf error:', error)
      // Clean up input file
      await unlink(inputPath).catch(() => {})
      return NextResponse.json(
        { error: 'Failed to encrypt PDF. Make sure qpdf is installed.' },
        { status: 500 }
      )
    }

    // Read the encrypted PDF
    const encryptedPdf = await readFile(outputPath)

    // Clean up temporary files
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ])

    // Return the encrypted PDF
    return new NextResponse(encryptedPdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protected_${file.name}"`,
      },
    })
  } catch (error: any) {
    console.error('Error protecting PDF:', error)
    return NextResponse.json(
      { error: 'An error occurred while protecting the PDF' },
      { status: 500 }
    )
  }
}
