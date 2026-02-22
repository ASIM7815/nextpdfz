import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink, readFile } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  let inputPath = ''
  let outputPath = ''

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Create temporary file paths
    const timestamp = Date.now()
    const tempDir = tmpdir()
    inputPath = path.join(tempDir, `input-${timestamp}.pptx`)
    outputPath = path.join(tempDir, `input-${timestamp}.pdf`)

    // Save uploaded file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(inputPath, buffer)

    // Convert PPTX to PDF using LibreOffice headless
    const command = `soffice --headless --convert-to pdf --outdir "${tempDir}" "${inputPath}"`
    
    try {
      await execAsync(command, { 
        timeout: 60000,
        encoding: 'buffer', // Handle binary output properly
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })
    } catch (execError: any) {
      console.error('LibreOffice conversion error:', execError)
      throw new Error('Failed to convert PowerPoint to PDF. Make sure LibreOffice is installed.')
    }

    // Read the converted PDF
    const pdfBuffer = await readFile(outputPath)

    // Clean up temporary files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${file.name.replace('.pptx', '.pdf')}"`,
      },
    })

  } catch (error: any) {
    console.error('PowerPoint to PDF conversion error:', error)
    
    // Clean up on error
    if (inputPath) await unlink(inputPath).catch(() => {})
    if (outputPath) await unlink(outputPath).catch(() => {})

    return NextResponse.json(
      { error: error.message || 'Failed to convert PowerPoint to PDF' },
      { status: 500 }
    )
  }
}
