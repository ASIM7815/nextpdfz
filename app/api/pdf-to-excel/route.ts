import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function createXlsx(textPages: string[]): Promise<Buffer> {
  const zip = new JSZip();

  let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>`;

  textPages.forEach((text, idx) => {
    const lines = text.split('\n').slice(0, 50);
    lines.forEach((line, lineIdx) => {
      const rowNum = idx * 50 + lineIdx + 1;
      sheetXml += `<row r="${rowNum}"><c r="A${rowNum}" t="inlineStr"><is><t>${escapeXml(line.slice(0, 100))}</t></is></c></row>`;
    });
  });

  sheetXml += '</sheetData></worksheet>';
  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
  zip.file('[Content_Types].xml', contentTypes);

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
  zip.file('xl/workbook.xml', workbook);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);

  return await zip.generateAsync({ type: 'nodebuffer' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file } = body;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Note: Text extraction requires client-side processing with pdf.js
    const textContent = ['Text extraction requires client-side processing with pdf.js'];
    
    const xlsxBuffer = await createXlsx(textContent);
    const xlsxBase64 = xlsxBuffer.toString('base64');

    return NextResponse.json({ success: true, file: xlsxBase64 });
  } catch (error: any) {
    return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
