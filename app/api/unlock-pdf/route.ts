import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

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
    
    // Create temporary file paths
    const tempId = randomBytes(16).toString('hex');
    inputPath = join(tmpdir(), `input-${tempId}.pdf`);
    outputPath = join(tmpdir(), `output-${tempId}.pdf`);

    // Write input PDF to temp file
    await writeFile(inputPath, pdfBytes);

    // Use node-qpdf2 to decrypt the PDF
    const qpdf = require('node-qpdf2');
    
    try {
      await qpdf.decrypt(inputPath, {
        password: password,
        output: outputPath
      });

      // Read the decrypted PDF
      const { readFile } = require('fs/promises');
      const unlockedBytes = await readFile(outputPath);
      const unlockedBase64 = unlockedBytes.toString('base64');

      return NextResponse.json({ success: true, file: unlockedBase64 });
    } catch (decryptError: any) {
      if (decryptError.message?.includes('password') || decryptError.message?.includes('invalid')) {
        return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
      }
      throw decryptError;
    }
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  } finally {
    // Clean up temporary files
    try {
      if (inputPath) await unlink(inputPath);
      if (outputPath) await unlink(outputPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}
