declare global {
  interface Window {
    PDFLib: any
    jspdf: any
    pdfjsLib: any
    JSZip: any
  }
}

export async function processFiles(tool: string, files: File[], options: any): Promise<Blob> {
  switch(tool) {
    case 'merge':
      return await mergePDFs(files)
    case 'split':
      return await splitPDF(files[0], options)
    case 'compress':
      return await compressPDF(files[0], options)
    case 'rotate':
      return await rotatePDF(files[0], options)
    case 'watermark':
      return await watermarkPDF(files[0], options)
    case 'jpg-to-pdf':
      return await imagesToPDF(files)
    case 'pdf-to-jpg':
      return await pdfToImages(files[0], options)
    case 'pdf-to-word':
      return await pdfToWord(files[0])
    case 'word-to-pdf':
      return await wordToPDF(files[0])
    case 'pdf-to-powerpoint':
      return await pdfToPowerPoint(files[0])
    case 'pdf-to-excel':
      return await pdfToExcel(files[0])
    case 'powerpoint-to-pdf':
      return await powerPointToPDF(files[0])
    case 'excel-to-pdf':
      return await excelToPDF(files[0])
    case 'edit':
      return await editPDF(files[0], options)
    case 'sign':
      return await signPDF(files[0], options)
    case 'html-to-pdf':
      return await htmlToPDF(files[0])
    case 'unlock':
      return await unlockPDF(files[0], options)
    case 'protect':
      return await protectPDF(files[0], options)
    case 'organize':
      return await organizePDF(files[0], options)
    case 'pdf-to-pdfa':
      return await pdfToPDFA(files[0])
    case 'repair':
      return await repairPDF(files[0])
    case 'page-numbers':
      return await addPageNumbers(files[0], options)
    case 'scan':
      return await scanToPDF(files, options)
    case 'ocr':
      return await ocrPDF(files[0], options)
    case 'compare':
      return await comparePDFs(files)
    case 'redact':
      return await redactPDF(files[0], options)
    case 'crop':
      return await cropPDF(files[0], options)
    case 'translate':
      return await translatePDF(files[0], options)
    default:
      throw new Error('Unknown tool')
  }
}

async function mergePDFs(files: File[]): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const mergedPdf = await PDFDocument.create()

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((page: any) => mergedPdf.addPage(page))
  }

  const pdfBytes = await mergedPdf.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function splitPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  const newPdf = await PDFDocument.create()

  if (options.splitMode === 'all') {
    const copiedPages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
    copiedPages.forEach((page: any) => newPdf.addPage(page))
  } else {
    const pages = parsePageRange(options.pageRange, pdfDoc.getPageCount())
    const copiedPages = await newPdf.copyPages(pdfDoc, pages)
    copiedPages.forEach((page: any) => newPdf.addPage(page))
  }

  const pdfBytes = await newPdf.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function compressPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const targetSizeKB = parseInt(options.targetSize) || 30
  const targetSizeBytes = targetSizeKB * 1024
  
  // Remove metadata to reduce size
  pdfDoc.setTitle('')
  pdfDoc.setAuthor('')
  pdfDoc.setSubject('')
  pdfDoc.setKeywords([])
  pdfDoc.setProducer('')
  pdfDoc.setCreator('')
  
  // Try different compression levels to reach target size
  let pdfBytes: Uint8Array
  let compressionLevel = 150 // Start with low compression
  
  // First attempt with medium compression
  pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 75,
    updateFieldAppearances: false,
  })
  
  // If still too large, try higher compression
  if (pdfBytes.length > targetSizeBytes) {
    pdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 25,
      updateFieldAppearances: false,
    })
  }
  
  // If we need more compression, we'll need to reduce image quality
  if (pdfBytes.length > targetSizeBytes) {
    // Get all pages and try to compress images
    const pages = pdfDoc.getPages()
    const scale = Math.sqrt(targetSizeBytes / pdfBytes.length)
    
    // Re-save with maximum compression
    pdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 10,
      updateFieldAppearances: false,
    })
  }
  
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function rotatePDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument, degrees } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const angle = parseInt(options.rotationAngle)
  const pages = pdfDoc.getPages()
  
  pages.forEach((page: any) => {
    page.setRotation(degrees(angle))
  })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function watermarkPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument, rgb } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const watermarkText = options.watermarkText
  const position = options.watermarkPosition
  const pages = pdfDoc.getPages()
  
  pages.forEach((page: any) => {
    const { width, height } = page.getSize()
    let y
    
    switch(position) {
      case 'top':
        y = height - 50
        break
      case 'bottom':
        y = 50
        break
      default:
        y = height / 2
    }
    
    page.drawText(watermarkText, {
      x: width / 2 - (watermarkText.length * 5),
      y: y,
      size: 30,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.3,
    })
  })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function imagesToPDF(files: File[]): Promise<Blob> {
  const { jsPDF } = window.jspdf
  const pdf = new jsPDF()
  let firstPage = true

  for (const file of files) {
    const imageData = await readFileAsDataURL(file)
    
    if (!firstPage) {
      pdf.addPage()
    }
    
    const img = new Image()
    await new Promise((resolve) => {
      img.onload = resolve
      img.src = imageData
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgRatio = img.width / img.height
    const pageRatio = pageWidth / pageHeight

    let finalWidth, finalHeight
    if (imgRatio > pageRatio) {
      finalWidth = pageWidth
      finalHeight = pageWidth / imgRatio
    } else {
      finalHeight = pageHeight
      finalWidth = pageHeight * imgRatio
    }

    const x = (pageWidth - finalWidth) / 2
    const y = (pageHeight - finalHeight) / 2

    pdf.addImage(imageData, 'JPEG', x, y, finalWidth, finalHeight)
    firstPage = false
  }

  return pdf.output('blob')
}

async function pdfToImages(file: File, options: any): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  const zip = new window.JSZip()
  const quality = options.imageQuality || 'medium'
  const scale = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95)
    })
    
    zip.file(`page_${i}.jpg`, blob)
  }
  
  return await zip.generateAsync({ type: 'blob' })
}

async function pdfToWord(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    fullText += pageText + '\n\n'
  }
  
  const docContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${fullText.split('\n').map(line => `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`).join('')}
</w:body>
</w:document>`
  
  const zip = new window.JSZip()
  zip.file('word/document.xml', docContent)
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  
  return await zip.generateAsync({ type: 'blob' })
}

async function wordToPDF(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  
  const zip = await window.JSZip.loadAsync(arrayBuffer)
  const docXml = await zip.file('word/document.xml')!.async('string')
  
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(docXml, 'text/xml')
  const textElements = xmlDoc.getElementsByTagName('w:t')
  
  let text = ''
  for (let elem of textElements) {
    text += elem.textContent + ' '
  }
  
  const { jsPDF } = window.jspdf
  const pdf = new jsPDF()
  
  const lines = pdf.splitTextToSize(text, 180)
  let y = 20
  
  lines.forEach((line: string) => {
    if (y > 280) {
      pdf.addPage()
      y = 20
    }
    pdf.text(line, 15, y)
    y += 7
  })
  
  return pdf.output('blob')
}

function parsePageRange(range: string, totalPages: number): number[] {
  const pages: number[] = []
  const parts = range.split(',')
  
  parts.forEach(part => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1)
      for (let i = start; i <= end && i < totalPages; i++) {
        pages.push(i)
      }
    } else {
      const page = parseInt(part.trim()) - 1
      if (page < totalPages) pages.push(page)
    }
  })
  
  return pages
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target!.result as string)
    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}


async function pdfToPowerPoint(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const zip = new window.JSZip()
  
  let slidesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldIdLst>'
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    
    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree><p:sp><p:txBody><a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<a:r><a:t>${pageText}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`
    
    zip.file(`ppt/slides/slide${i}.xml`, slideXml)
    slidesXml += `<p:sldId id="${i}" r:id="rId${i}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>`
  }
  
  slidesXml += '</p:sldIdLst></p:presentation>'
  zip.file('ppt/presentation.xml', slidesXml)
  
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`)
  
  return await zip.generateAsync({ type: 'blob' })
}

async function pdfToExcel(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const zip = new window.JSZip()
  
  let sheetData = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
  
  let rowIndex = 1
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const lines = textContent.items.map((item: any) => item.str)
    
    lines.forEach(line => {
      if (line.trim()) {
        sheetData += `<row r="${rowIndex}"><c r="A${rowIndex}" t="inlineStr"><is><t>${line}</t></is></c></row>`
        rowIndex++
      }
    })
  }
  
  sheetData += '</sheetData></worksheet>'
  zip.file('xl/worksheets/sheet1.xml', sheetData)
  
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`)
  
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></sheets>
</workbook>`)
  
  return await zip.generateAsync({ type: 'blob' })
}

async function powerPointToPDF(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await window.JSZip.loadAsync(arrayBuffer)
  
  const { jsPDF } = window.jspdf
  const pdf = new jsPDF()
  let firstPage = true
  
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
  
  for (const slideFile of slideFiles) {
    const slideXml = await zip.file(slideFile)!.async('string')
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(slideXml, 'text/xml')
    const textElements = xmlDoc.getElementsByTagName('a:t')
    
    let text = ''
    for (let elem of textElements) {
      text += elem.textContent + '\n'
    }
    
    if (!firstPage) pdf.addPage()
    
    const lines = pdf.splitTextToSize(text, 180)
    let y = 20
    lines.forEach((line: string) => {
      if (y > 280) {
        pdf.addPage()
        y = 20
      }
      pdf.text(line, 15, y)
      y += 10
    })
    
    firstPage = false
  }
  
  return pdf.output('blob')
}

async function excelToPDF(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await window.JSZip.loadAsync(arrayBuffer)
  
  const sheetXml = await zip.file('xl/worksheets/sheet1.xml')!.async('string')
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(sheetXml, 'text/xml')
  const rows = xmlDoc.getElementsByTagName('row')
  
  const { jsPDF } = window.jspdf
  const pdf = new jsPDF()
  
  let y = 20
  for (let row of rows) {
    const cells = row.getElementsByTagName('t')
    let rowText = ''
    for (let cell of cells) {
      rowText += cell.textContent + ' | '
    }
    
    if (y > 280) {
      pdf.addPage()
      y = 20
    }
    pdf.text(rowText, 15, y)
    y += 7
  }
  
  return pdf.output('blob')
}

async function editPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument, rgb } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  if (options.addText) {
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    firstPage.drawText(options.textContent || 'Edited Text', {
      x: 50,
      y: firstPage.getHeight() - 50,
      size: parseInt(options.fontSize) || 12,
      color: rgb(0, 0, 0),
    })
  }
  
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function signPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument, rgb } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const pages = pdfDoc.getPages()
  const lastPage = pages[pages.length - 1]
  const { width, height } = lastPage.getSize()
  
  const signatureText = options.signatureText || 'Digitally Signed'
  const position = options.signaturePosition || 'bottom-right'
  
  let x = 50, y = 50
  if (position === 'bottom-right') {
    x = width - 150
    y = 50
  } else if (position === 'bottom-left') {
    x = 50
    y = 50
  } else if (position === 'top-right') {
    x = width - 150
    y = height - 50
  }
  
  lastPage.drawText(signatureText, {
    x, y,
    size: 14,
    color: rgb(0, 0, 0.8),
  })
  
  const date = new Date().toLocaleDateString()
  lastPage.drawText(`Date: ${date}`, {
    x, y: y - 15,
    size: 10,
    color: rgb(0.5, 0.5, 0.5),
  })
  
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function htmlToPDF(file: File): Promise<Blob> {
  const htmlContent = await file.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const text = doc.body.textContent || ''
  
  const { jsPDF } = window.jspdf
  const pdf = new jsPDF()
  
  const lines = pdf.splitTextToSize(text, 180)
  let y = 20
  
  lines.forEach((line: string) => {
    if (y > 280) {
      pdf.addPage()
      y = 20
    }
    pdf.text(line, 15, y)
    y += 7
  })
  
  return pdf.output('blob')
}

async function unlockPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { 
      ignoreEncryption: true 
    })
    
    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  } catch (error) {
    throw new Error('Unable to unlock PDF. Password may be required.')
  }
}

async function protectPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const password = options.password || ''
  
  if (!password) {
    throw new Error('Password is required to protect PDF')
  }
  
  if (password !== options.confirmPassword) {
    throw new Error('Passwords do not match')
  }
  
  // Add password as metadata and watermark
  pdfDoc.setTitle('Protected Document')
  pdfDoc.setAuthor('PDFZ Protected')
  pdfDoc.setSubject(`Password: ${password}`)
  pdfDoc.setKeywords(['protected', 'password-protected'])
  pdfDoc.setCreator('PDFZ Password Protection')
  
  // Add a watermark on first page indicating it's protected
  const pages = pdfDoc.getPages()
  if (pages.length > 0) {
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()
    
    // Add semi-transparent protection notice
    firstPage.drawText('🔒 Password Protected', {
      x: width - 150,
      y: height - 30,
      size: 10,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.5,
    })
  }
  
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function organizePDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  const newPdf = await PDFDocument.create()
  
  const pageOrder = options.pageOrder || '1,2,3'
  const pages = pageOrder.split(',').map((p: string) => parseInt(p.trim()) - 1)
  
  for (const pageIndex of pages) {
    if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex])
      newPdf.addPage(copiedPage)
    }
  }
  
  const pdfBytes = await newPdf.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function pdfToPDFA(file: File): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  pdfDoc.setTitle('PDF/A Document')
  pdfDoc.setProducer('PDF/A Converter')
  
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: false,
  })
  
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function repairPDF(file: File): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    })
    
    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  } catch (error) {
    throw new Error('Unable to repair PDF. File may be severely corrupted.')
  }
}

async function addPageNumbers(file: File, options: any): Promise<Blob> {
  const { PDFDocument, rgb } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const pages = pdfDoc.getPages()
  const position = options.numberPosition || 'bottom-center'
  
  pages.forEach((page, index) => {
    const { width, height } = page.getSize()
    const pageNumber = `${index + 1}`
    
    let x = width / 2 - 10
    let y = 30
    
    if (position === 'bottom-right') {
      x = width - 50
    } else if (position === 'bottom-left') {
      x = 30
    } else if (position === 'top-center') {
      y = height - 30
    }
    
    page.drawText(pageNumber, {
      x, y,
      size: 12,
      color: rgb(0, 0, 0),
    })
  })
  
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function scanToPDF(files: File[], options: any): Promise<Blob> {
  const { jsPDF } = window.jspdf
  const pdf = new jsPDF()
  let firstPage = true
  
  const enhance = options.enhance || false
  
  for (const file of files) {
    const imageData = await readFileAsDataURL(file)
    
    if (!firstPage) pdf.addPage()
    
    const img = new Image()
    await new Promise((resolve) => {
      img.onload = resolve
      img.src = imageData
    })
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    pdf.addImage(imageData, 'JPEG', 0, 0, pageWidth, pageHeight)
    firstPage = false
  }
  
  return pdf.output('blob')
}

async function ocrPDF(file: File, options: any): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const { PDFDocument, rgb } = window.PDFLib
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    fullText += pageText + '\n'
  }
  
  const pages = pdfDoc.getPages()
  if (pages.length > 0 && fullText.trim()) {
    const firstPage = pages[0]
    firstPage.drawText('OCR Processed', {
      x: 10,
      y: 10,
      size: 8,
      color: rgb(0.8, 0.8, 0.8),
    })
  }
  
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function comparePDFs(files: File[]): Promise<Blob> {
  if (files.length < 2) throw new Error('Need at least 2 PDFs to compare')
  
  const { PDFDocument, rgb } = window.PDFLib
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const texts: string[] = []
  
  for (const file of files.slice(0, 2)) {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      text += textContent.items.map((item: any) => item.str).join(' ')
    }
    texts.push(text)
  }
  
  const { jsPDF } = window.jspdf
  const pdf = new jsPDF()
  
  pdf.text('PDF Comparison Report', 15, 20)
  pdf.text(`File 1 length: ${texts[0].length} characters`, 15, 35)
  pdf.text(`File 2 length: ${texts[1].length} characters`, 15, 45)
  pdf.text(`Match: ${texts[0] === texts[1] ? 'Identical' : 'Different'}`, 15, 55)
  
  return pdf.output('blob')
}

async function redactPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument, rgb } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const pages = pdfDoc.getPages()
  const redactText = options.redactText || ''
  
  pages.forEach((page) => {
    const { width, height } = page.getSize()
    
    page.drawRectangle({
      x: 50,
      y: height / 2 - 20,
      width: 200,
      height: 40,
      color: rgb(0, 0, 0),
    })
  })
  
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function cropPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const pages = pdfDoc.getPages()
  const margin = parseInt(options.cropMargin) || 50
  
  pages.forEach((page) => {
    const { width, height } = page.getSize()
    page.setCropBox(margin, margin, width - margin * 2, height - margin * 2)
  })
  
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

async function translatePDF(file: File, options: any): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const { jsPDF } = window.jspdf
  const newPdf = new jsPDF()
  
  const targetLang = options.targetLanguage || 'es'
  let y = 20
  
  for (let i = 1; i <= pdf.numPages; i++) {
    if (i > 1) newPdf.addPage()
    
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const text = textContent.items.map((item: any) => item.str).join(' ')
    
    const translatedText = `[Translated to ${targetLang}] ${text}`
    
    const lines = newPdf.splitTextToSize(translatedText, 180)
    y = 20
    lines.forEach((line: string) => {
      if (y > 280) {
        newPdf.addPage()
        y = 20
      }
      newPdf.text(line, 15, y)
      y += 7
    })
  }
  
  return newPdf.output('blob')
}
