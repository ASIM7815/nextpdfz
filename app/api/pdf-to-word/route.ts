import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function createDocx(text: string): Promise<Buffer> {
  const zip = new JSZip();

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>
</w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  zip.file('word/document.xml', docXml);
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/_rels/document.xml.rels', docRels);

  return await zip.generateAsync({ type: 'nodebuffer' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file } = body;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const pdfBytes = Buffer.from(file, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Note: pdf-lib doesn't have text extraction. This is a placeholder.
    // For real text extraction, you'd need pdf.js or similar on the client side
    const textContent = 'Text extraction requires client-side processing with pdf.js';
    
    const docxBuffer = await createDocx(textContent);
    const docxBase64 = docxBuffer.toString('base64');

    return NextResponse.json({ success: true, file: docxBase64 });
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
