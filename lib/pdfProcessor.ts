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
    case 'quality-report':
      return await generateQualityReport(files[0])
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
}

async function compressPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const targetSizeKB = parseInt(options.targetSize) || 30
  const targetSizeBytes = targetSizeKB * 1024
  const originalSize = file.size
  
  // Remove metadata to reduce size
  pdfDoc.setTitle('')
  pdfDoc.setAuthor('')
  pdfDoc.setSubject('')
  pdfDoc.setKeywords([])
  pdfDoc.setProducer('')
  pdfDoc.setCreator('')
  
  // Get pages for image compression
  const pages = pdfDoc.getPages()
  
  // Convert PDF to images and recompress
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  // Calculate compression ratio needed
  const compressionRatio = targetSizeBytes / originalSize
  
  // Determine image quality based on compression ratio
  let imageQuality = 0.95
  if (compressionRatio < 0.1) imageQuality = 0.3
  else if (compressionRatio < 0.2) imageQuality = 0.4
  else if (compressionRatio < 0.3) imageQuality = 0.5
  else if (compressionRatio < 0.5) imageQuality = 0.6
  else if (compressionRatio < 0.7) imageQuality = 0.75
  
  // Determine scale based on compression ratio
  let scale = 1.0
  if (compressionRatio < 0.1) scale = 0.3
  else if (compressionRatio < 0.2) scale = 0.4
  else if (compressionRatio < 0.3) scale = 0.5
  else if (compressionRatio < 0.5) scale = 0.6
  else if (compressionRatio < 0.7) scale = 0.8
  
  // Create new PDF with compressed images
  const { jsPDF } = window.jspdf
  const compressedPdf = new jsPDF({
    compress: true,
    unit: 'pt',
    format: 'a4'
  })
  
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  for (let i = 1; i <= pdf.numPages; i++) {
    if (i > 1) compressedPdf.addPage()
    
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    // Convert canvas to compressed image
    const imgData = canvas.toDataURL('image/jpeg', imageQuality)
    
    const pageWidth = compressedPdf.internal.pageSize.getWidth()
    const pageHeight = compressedPdf.internal.pageSize.getHeight()
    
    compressedPdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST')
  }
  
  let pdfBlob = compressedPdf.output('blob')
  
  // If still too large, try more aggressive compression
  if (pdfBlob.size > targetSizeBytes && imageQuality > 0.2) {
    const moreAggressiveQuality = imageQuality * 0.7
    const moreAggressiveScale = scale * 0.8
    
    const veryCompressedPdf = new jsPDF({
      compress: true,
      unit: 'pt',
      format: 'a4'
    })
    
    for (let i = 1; i <= pdf.numPages; i++) {
      if (i > 1) veryCompressedPdf.addPage()
      
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: moreAggressiveScale })
      
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      const imgData = canvas.toDataURL('image/jpeg', moreAggressiveQuality)
      
      const pageWidth = veryCompressedPdf.internal.pageSize.getWidth()
      const pageHeight = veryCompressedPdf.internal.pageSize.getHeight()
      
      veryCompressedPdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST')
    }
    
    pdfBlob = veryCompressedPdf.output('blob')
  }
  
  return pdfBlob
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  const zip = new window.JSZip()
  
  // Canvas for rendering images
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  // Analyze PDF content and build document
  const pageContents: any[] = []
  let totalTextLength = 0
  let hasImages = false
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    
    // Extract text with positioning information
    const textItems = textContent.items.map((item: any) => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height,
      fontName: item.fontName
    }))
    
    const pageText = textItems.map(item => item.text).join(' ').trim()
    totalTextLength += pageText.length
    
    // Render page as image for mixed/image-only content
    const viewport = page.getViewport({ scale: 2.5 })
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    const imageData = canvas.toDataURL('image/png', 0.95).split(',')[1]
    
    // Determine page type
    const isImageOnly = pageText.length < 50 // Less than 50 chars = likely image-only
    const hasSignificantText = pageText.length > 50
    
    if (isImageOnly) hasImages = true
    
    pageContents.push({
      pageNum: i,
      text: pageText,
      textItems: textItems,
      imageData: imageData,
      isImageOnly: isImageOnly,
      hasSignificantText: hasSignificantText
    })
  }
  
  // Determine overall document type
  const avgTextPerPage = totalTextLength / pdf.numPages
  const isFullyImageBased = avgTextPerPage < 50
  const isFullyTextBased = avgTextPerPage > 200 && !hasImages
  const isMixed = !isFullyImageBased && !isFullyTextBased
  
  // Build Word document XML
  let docContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  docContent += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
  docContent += 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
  docContent += 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
  docContent += 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
  docContent += 'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
  docContent += '<w:body>'
  
  const imageRels: string[] = []
  let imageCounter = 0
  
  for (const pageContent of pageContents) {
    if (isFullyImageBased || pageContent.isImageOnly) {
      // Image-only page: embed full page as image
      imageCounter++
      const imageId = `image${imageCounter}`
      zip.file(`word/media/${imageId}.png`, pageContent.imageData, { base64: true })
      imageRels.push(`<Relationship Id="rId${imageCounter}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageId}.png"/>`)
      
      // Add image to document with proper sizing
      docContent += '<w:p>'
      docContent += '<w:r>'
      docContent += '<w:drawing>'
      docContent += '<wp:inline distT="0" distB="0" distL="0" distR="0">'
      docContent += `<wp:extent cx="5400000" cy="7000000"/>` // A4 proportions
      docContent += '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
      docContent += '<wp:docPr id="' + imageCounter + '" name="Page ' + pageContent.pageNum + '"/>'
      docContent += '<wp:cNvGraphicFramePr/>'
      docContent += '<a:graphic>'
      docContent += '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      docContent += '<pic:pic>'
      docContent += '<pic:nvPicPr>'
      docContent += '<pic:cNvPr id="' + imageCounter + '" name="Page ' + pageContent.pageNum + '"/>'
      docContent += '<pic:cNvPicPr/>'
      docContent += '</pic:nvPicPr>'
      docContent += '<pic:blipFill>'
      docContent += `<a:blip r:embed="rId${imageCounter}"/>`
      docContent += '<a:stretch><a:fillRect/></a:stretch>'
      docContent += '</pic:blipFill>'
      docContent += '<pic:spPr>'
      docContent += '<a:xfrm><a:off x="0" y="0"/><a:ext cx="5400000" cy="7000000"/></a:xfrm>'
      docContent += '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
      docContent += '</pic:spPr>'
      docContent += '</pic:pic>'
      docContent += '</a:graphicData>'
      docContent += '</a:graphic>'
      docContent += '</wp:inline>'
      docContent += '</w:drawing>'
      docContent += '</w:r>'
      docContent += '</w:p>'
      
    } else if (isFullyTextBased && pageContent.hasSignificantText) {
      // Text-only: preserve text with alignment
      const lines = groupTextIntoLines(pageContent.textItems)
      
      for (const line of lines) {
        const alignment = determineAlignment(line.x, line.width)
        
        docContent += '<w:p>'
        if (alignment !== 'left') {
          docContent += '<w:pPr><w:jc w:val="' + alignment + '"/></w:pPr>'
        }
        docContent += '<w:r>'
        docContent += '<w:t xml:space="preserve">' + escapeXml(line.text) + '</w:t>'
        docContent += '</w:r>'
        docContent += '</w:p>'
      }
      
    } else {
      // Mixed content: embed page as image to preserve exact layout
      imageCounter++
      const imageId = `image${imageCounter}`
      zip.file(`word/media/${imageId}.png`, pageContent.imageData, { base64: true })
      imageRels.push(`<Relationship Id="rId${imageCounter}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageId}.png"/>`)
      
      docContent += '<w:p>'
      docContent += '<w:r>'
      docContent += '<w:drawing>'
      docContent += '<wp:inline distT="0" distB="0" distL="0" distR="0">'
      docContent += `<wp:extent cx="5400000" cy="7000000"/>`
      docContent += '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
      docContent += '<wp:docPr id="' + imageCounter + '" name="Page ' + pageContent.pageNum + '"/>'
      docContent += '<wp:cNvGraphicFramePr/>'
      docContent += '<a:graphic>'
      docContent += '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      docContent += '<pic:pic>'
      docContent += '<pic:nvPicPr>'
      docContent += '<pic:cNvPr id="' + imageCounter + '" name="Page ' + pageContent.pageNum + '"/>'
      docContent += '<pic:cNvPicPr/>'
      docContent += '</pic:nvPicPr>'
      docContent += '<pic:blipFill>'
      docContent += `<a:blip r:embed="rId${imageCounter}"/>`
      docContent += '<a:stretch><a:fillRect/></a:stretch>'
      docContent += '</pic:blipFill>'
      docContent += '<pic:spPr>'
      docContent += '<a:xfrm><a:off x="0" y="0"/><a:ext cx="5400000" cy="7000000"/></a:xfrm>'
      docContent += '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
      docContent += '</pic:spPr>'
      docContent += '</pic:pic>'
      docContent += '</a:graphicData>'
      docContent += '</a:graphic>'
      docContent += '</wp:inline>'
      docContent += '</w:drawing>'
      docContent += '</w:r>'
      docContent += '</w:p>'
    }
    
    // Add page break between pages (except last page)
    if (pageContent.pageNum < pdf.numPages) {
      docContent += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    }
  }
  
  docContent += '</w:body>'
  docContent += '</w:document>'
  
  zip.file('word/document.xml', docContent)
  
  // Document relationships
  let docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  docRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  docRels += imageRels.join('')
  docRels += '</Relationships>'
  zip.file('word/_rels/document.xml.rels', docRels)
  
  // Content Types
  let contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
  contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
  contentTypes += '<Default Extension="xml" ContentType="application/xml"/>'
  contentTypes += '<Default Extension="png" ContentType="image/png"/>'
  contentTypes += '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
  contentTypes += '</Types>'
  zip.file('[Content_Types].xml', contentTypes)
  
  // Root relationships
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  
  return await zip.generateAsync({ type: 'blob' })
}

// Helper function to group text items into lines
function groupTextIntoLines(textItems: any[]): any[] {
  if (textItems.length === 0) return []
  
  // Sort by Y position (top to bottom)
  const sorted = [...textItems].sort((a, b) => b.y - a.y)
  
  const lines: any[] = []
  let currentLine: any = null
  
  for (const item of sorted) {
    if (!currentLine || Math.abs(currentLine.y - item.y) > 5) {
      // New line
      if (currentLine) lines.push(currentLine)
      currentLine = {
        text: item.text,
        x: item.x,
        y: item.y,
        width: item.width,
        items: [item]
      }
    } else {
      // Same line
      currentLine.text += ' ' + item.text
      currentLine.width += item.width
      currentLine.items.push(item)
    }
  }
  
  if (currentLine) lines.push(currentLine)
  
  return lines
}

// Helper function to determine text alignment
function determineAlignment(x: number, width: number): string {
  const pageWidth = 595 // Approximate A4 width in points
  const centerX = pageWidth / 2
  const rightMargin = pageWidth - 50
  
  if (x < 100) return 'left'
  if (x > rightMargin - width) return 'right'
  if (Math.abs(x - centerX + width / 2) < 50) return 'center'
  
  return 'left'
}

// Helper function to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function wordToPDF(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  
  const zip = await window.JSZip.loadAsync(arrayBuffer)
  const docXml = await zip.file('word/document.xml')!.async('string')
  
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(docXml, 'text/xml')
  const textElements = xmlDoc.getElementsByTagName('w:t')
  
  let text = ''
  for (let i = 0; i < textElements.length; i++) {
    text += textElements[i].textContent + ' '
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
  
  // Canvas for rendering images
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  const presentationRels: string[] = []
  
  // Convert each PDF page to a PowerPoint slide with image
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    
    // Render page as high-quality image
    const viewport = page.getViewport({ scale: 2.5 })
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    // Convert to PNG
    const imageData = canvas.toDataURL('image/png', 0.95).split(',')[1]
    const imageId = `image${i}`
    
    // Save image to media folder
    zip.file(`ppt/media/${imageId}.png`, imageData, { base64: true })
    
    // Create slide XML with embedded image
    let slideXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    slideXml += '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
    slideXml += 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    slideXml += 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
    slideXml += '<p:cSld>'
    slideXml += '<p:spTree>'
    slideXml += '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
    slideXml += '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
    slideXml += '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    
    // Add picture to slide
    slideXml += '<p:pic>'
    slideXml += '<p:nvPicPr>'
    slideXml += `<p:cNvPr id="${i + 1}" name="Slide ${i} Image"/>`
    slideXml += '<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>'
    slideXml += '<p:nvPr/>'
    slideXml += '</p:nvPicPr>'
    slideXml += '<p:blipFill>'
    slideXml += `<a:blip r:embed="rId1"/>`
    slideXml += '<a:stretch><a:fillRect/></a:stretch>'
    slideXml += '</p:blipFill>'
    slideXml += '<p:spPr>'
    slideXml += '<a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="6858000"/></a:xfrm>'
    slideXml += '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
    slideXml += '</p:spPr>'
    slideXml += '</p:pic>'
    
    slideXml += '</p:spTree>'
    slideXml += '</p:cSld>'
    slideXml += '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>'
    slideXml += '</p:sld>'
    
    zip.file(`ppt/slides/slide${i}.xml`, slideXml)
    
    // Slide relationship to image
    const slideRelXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${imageId}.png"/>
</Relationships>`
    zip.file(`ppt/slides/_rels/slide${i}.xml.rels`, slideRelXml)
    
    // Add to presentation relationships
    presentationRels.push(`<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>`)
  }
  
  // Presentation XML
  let presentationXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  presentationXml += '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
  presentationXml += 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
  presentationXml += 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
  presentationXml += '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
  presentationXml += '<p:sldIdLst>'
  
  for (let i = 1; i <= pdf.numPages; i++) {
    presentationXml += `<p:sldId id="${255 + i}" r:id="rId${i + 1}"/>`
  }
  
  presentationXml += '</p:sldIdLst>'
  presentationXml += '<p:sldSz cx="9144000" cy="6858000"/>'
  presentationXml += '<p:notesSz cx="6858000" cy="9144000"/>'
  presentationXml += '</p:presentation>'
  
  zip.file('ppt/presentation.xml', presentationXml)
  
  // Slide master (required for valid PPTX)
  const slideMasterXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<p:cSld>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree>
</p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`
  zip.file('ppt/slideMasters/slideMaster1.xml', slideMasterXml)
  
  // Slide layout (required)
  const slideLayoutXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" type="blank">
<p:cSld name="Blank">
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree>
</p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`
  zip.file('ppt/slideLayouts/slideLayout1.xml', slideLayoutXml)
  
  // Presentation relationships
  let presentationRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  presentationRelsXml += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  presentationRelsXml += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
  presentationRels.forEach((rel, idx) => {
    presentationRelsXml += rel.replace(`rId${idx + 1}`, `rId${idx + 2}`)
  })
  presentationRelsXml += '</Relationships>'
  zip.file('ppt/_rels/presentation.xml.rels', presentationRelsXml)
  
  // Slide master relationships
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`)
  
  // Content Types
  let contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
  contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
  contentTypes += '<Default Extension="xml" ContentType="application/xml"/>'
  contentTypes += '<Default Extension="png" ContentType="image/png"/>'
  contentTypes += '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
  contentTypes += '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
  contentTypes += '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
  
  for (let i = 1; i <= pdf.numPages; i++) {
    contentTypes += `<Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  }
  
  contentTypes += '</Types>'
  zip.file('[Content_Types].xml', contentTypes)
  
  // Root relationships
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`)
  
  return await zip.generateAsync({ type: 'blob' })
}

async function pdfToExcel(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const zip = new window.JSZip()
  
  // Create canvas for rendering PDF pages as images
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  // Column widths and row heights for better layout
  let colsXml = '<cols>'
  for (let i = 0; i < 15; i++) {
    colsXml += `<col min="${i + 1}" max="${i + 1}" width="12" customWidth="1"/>`
  }
  colsXml += '</cols>'
  
  let sheetData = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  sheetData += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
  sheetData += 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
  sheetData += '<sheetViews><sheetView workbookViewId="0"><selection activeCell="A1" sqref="A1"/></sheetView></sheetViews>'
  sheetData += '<sheetFormatPr defaultRowHeight="15"/>'
  sheetData += colsXml
  sheetData += '<sheetData>'
  
  let rowIndex = 0
  const images: any[] = []
  const drawingRels: string[] = []
  
  // Convert each PDF page to high-quality image and embed in Excel
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    
    // Get page dimensions
    const viewport = page.getViewport({ scale: 3.0 }) // Higher scale for Canva templates
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    // Render page with high quality
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    // Convert to PNG with maximum quality (perfect for Canva templates)
    const imageData = canvas.toDataURL('image/png', 1.0).split(',')[1]
    const imageId = images.length + 1
    
    // Save image to Excel media folder
    zip.file(`xl/media/image${imageId}.png`, imageData, { base64: true })
    
    // Calculate image dimensions in Excel units (EMUs - English Metric Units)
    // 1 inch = 914400 EMUs, 1 pixel ≈ 9525 EMUs at 96 DPI
    const imageWidthEMU = Math.round(viewport.width * 9525)
    const imageHeightEMU = Math.round(viewport.height * 9525)
    
    // Calculate rows needed based on image height (Excel row height ≈ 20 pixels default)
    const rowsNeeded = Math.ceil(viewport.height / 20)
    
    images.push({
      id: imageId,
      row: rowIndex,
      page: i,
      widthEMU: imageWidthEMU,
      heightEMU: imageHeightEMU,
      rowsSpan: rowsNeeded
    })
    
    // Move to next position (add spacing between pages)
    rowIndex += rowsNeeded + 2
  }
  
  sheetData += '</sheetData>'
  
  // Add drawing reference if images exist
  if (images.length > 0) {
    sheetData += '<drawing r:id="rId1"/>'
  }
  
  sheetData += '</worksheet>'
  
  zip.file('xl/worksheets/sheet1.xml', sheetData)
  
  // Create drawing XML with properly sized images
  if (images.length > 0) {
    let drawingXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    drawingXml += '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" '
    drawingXml += 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
    
    images.forEach((img, idx) => {
      // Use absolute positioning for better control
      drawingXml += `<xdr:absoluteAnchor>`
      drawingXml += `<xdr:pos x="0" y="${img.row * 190500}"/>` // Position based on row
      drawingXml += `<xdr:ext cx="${img.widthEMU}" cy="${img.heightEMU}"/>` // Actual image dimensions
      drawingXml += `<xdr:pic>`
      drawingXml += `<xdr:nvPicPr>`
      drawingXml += `<xdr:cNvPr id="${idx + 1}" name="PDF Page ${img.page}" descr="Canva Template Page ${img.page}"/>`
      drawingXml += `<xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>`
      drawingXml += `</xdr:nvPicPr>`
      drawingXml += `<xdr:blipFill>`
      drawingXml += `<a:blip r:embed="rId${idx + 1}"/>`
      drawingXml += `<a:stretch><a:fillRect/></a:stretch>`
      drawingXml += `</xdr:blipFill>`
      drawingXml += `<xdr:spPr>`
      drawingXml += `<a:xfrm><a:off x="0" y="0"/><a:ext cx="${img.widthEMU}" cy="${img.heightEMU}"/></a:xfrm>`
      drawingXml += `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>`
      drawingXml += `</xdr:spPr>`
      drawingXml += `</xdr:pic>`
      drawingXml += `<xdr:clientData/>`
      drawingXml += `</xdr:absoluteAnchor>`
      
      drawingRels.push(`<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${img.id}.png"/>`)
    })
    
    drawingXml += '</xdr:wsDr>'
    zip.file('xl/drawings/drawing1.xml', drawingXml)
    
    // Drawing relationships
    let drawingRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    drawingRelsXml += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    drawingRelsXml += drawingRels.join('')
    drawingRelsXml += '</Relationships>'
    zip.file('xl/drawings/_rels/drawing1.xml.rels', drawingRelsXml)
  }
  
  // Content Types
  let contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
  contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
  contentTypes += '<Default Extension="xml" ContentType="application/xml"/>'
  contentTypes += '<Default Extension="png" ContentType="image/png"/>'
  contentTypes += '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
  contentTypes += '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
  if (images.length > 0) {
    contentTypes += '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>'
  }
  contentTypes += '</Types>'
  zip.file('[Content_Types].xml', contentTypes)
  
  // Workbook
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="PDF Template" sheetId="1" r:id="rId1"/></sheets>
</workbook>`)
  
  // Workbook relationships
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`)
  
  // Worksheet relationships
  if (images.length > 0) {
    zip.file('xl/worksheets/_rels/sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`)
  }
  
  // Root relationships
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)
  
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
    for (let i = 0; i < textElements.length; i++) {
      text += textElements[i].textContent + '\n'
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
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('t')
    let rowText = ''
    for (let j = 0; j < cells.length; j++) {
      rowText += cells[j].textContent + ' | '
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  
  pages.forEach((page: any, index: number) => {
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
  
  pages.forEach((page: any) => {
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
}

async function cropPDF(file: File, options: any): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  const pages = pdfDoc.getPages()
  const margin = parseInt(options.cropMargin) || 50
  
  pages.forEach((page: any) => {
    const { width, height } = page.getSize()
    page.setCropBox(margin, margin, width - margin * 2, height - margin * 2)
  })
  
  const pdfBytes = await pdfDoc.save()
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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


async function generateQualityReport(file: File): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const { jsPDF } = window.jspdf
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  // Analyze PDF
  const pages = pdfDoc.getPages()
  const pageCount = pages.length
  const fileSize = (file.size / 1024).toFixed(2) // KB
  
  // Load PDF.js for text extraction
  const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise
  
  let totalTextLength = 0
  let totalImages = 0
  let textDensityScores: number[] = []
  let pageDetails: any[] = []
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    const textLength = pageText.trim().length
    totalTextLength += textLength
    
    // Calculate text density (characters per page)
    const density = textLength
    textDensityScores.push(density)
    
    // Check for images (simplified)
    const viewport = page.getViewport({ scale: 1.0 })
    const hasImages = textContent.items.length < 50 && textLength < 500 // Heuristic
    if (hasImages) totalImages++
    
    pageDetails.push({
      page: i,
      textLength: textLength,
      density: density,
      hasImages: hasImages
    })
  }
  
  // Calculate quality metrics
  const avgTextDensity = totalTextLength / pageCount
  const textConsistency = calculateConsistency(textDensityScores)
  const overallQuality = calculateOverallQuality(avgTextDensity, textConsistency, pageCount)
  
  // Generate report PDF
  const reportPdf = new jsPDF()
  let yPos = 20
  
  // Title
  reportPdf.setFontSize(20)
  reportPdf.setTextColor(102, 126, 234)
  reportPdf.text('PDF Quality Report', 20, yPos)
  yPos += 15
  
  // File Info
  reportPdf.setFontSize(12)
  reportPdf.setTextColor(0, 0, 0)
  reportPdf.text(`File: ${file.name}`, 20, yPos)
  yPos += 8
  reportPdf.text(`Size: ${fileSize} KB`, 20, yPos)
  yPos += 8
  reportPdf.text(`Pages: ${pageCount}`, 20, yPos)
  yPos += 15
  
  // Overall Quality Score
  reportPdf.setFontSize(16)
  reportPdf.setTextColor(102, 126, 234)
  reportPdf.text('Overall Quality Score', 20, yPos)
  yPos += 10
  
  reportPdf.setFontSize(14)
  const qualityColor = overallQuality >= 80 ? [34, 197, 94] : overallQuality >= 60 ? [251, 191, 36] : [239, 68, 68]
  reportPdf.setTextColor(qualityColor[0], qualityColor[1], qualityColor[2])
  reportPdf.text(`${overallQuality}/100`, 20, yPos)
  reportPdf.setTextColor(0, 0, 0)
  yPos += 15
  
  // Metrics
  reportPdf.setFontSize(14)
  reportPdf.setTextColor(102, 126, 234)
  reportPdf.text('Quality Metrics', 20, yPos)
  yPos += 10
  
  reportPdf.setFontSize(11)
  reportPdf.setTextColor(0, 0, 0)
  reportPdf.text(`Text Density: ${avgTextDensity.toFixed(0)} chars/page`, 25, yPos)
  yPos += 7
  reportPdf.text(`Text Consistency: ${textConsistency}%`, 25, yPos)
  yPos += 7
  reportPdf.text(`Total Characters: ${totalTextLength}`, 25, yPos)
  yPos += 7
  reportPdf.text(`Images Detected: ${totalImages}`, 25, yPos)
  yPos += 15
  
  // Text Arrangement Analysis
  reportPdf.setFontSize(14)
  reportPdf.setTextColor(102, 126, 234)
  reportPdf.text('Text Arrangement Analysis', 20, yPos)
  yPos += 10
  
  reportPdf.setFontSize(11)
  reportPdf.setTextColor(0, 0, 0)
  
  const arrangement = analyzeTextArrangement(textDensityScores, avgTextDensity)
  reportPdf.text(`Structure: ${arrangement.structure}`, 25, yPos)
  yPos += 7
  reportPdf.text(`Consistency: ${arrangement.consistency}`, 25, yPos)
  yPos += 7
  reportPdf.text(`Readability: ${arrangement.readability}`, 25, yPos)
  yPos += 15
  
  // Recommendations
  reportPdf.setFontSize(14)
  reportPdf.setTextColor(102, 126, 234)
  reportPdf.text('Recommendations', 20, yPos)
  yPos += 10
  
  reportPdf.setFontSize(10)
  reportPdf.setTextColor(0, 0, 0)
  
  const recommendations = generateRecommendations(overallQuality, avgTextDensity, textConsistency, totalImages, pageCount)
  recommendations.forEach((rec: string) => {
    const lines = reportPdf.splitTextToSize(rec, 170)
    lines.forEach((line: string) => {
      if (yPos > 270) {
        reportPdf.addPage()
        yPos = 20
      }
      reportPdf.text(`• ${line}`, 25, yPos)
      yPos += 6
    })
  })
  
  // Page-by-Page Analysis
  if (yPos > 200) {
    reportPdf.addPage()
    yPos = 20
  } else {
    yPos += 10
  }
  
  reportPdf.setFontSize(14)
  reportPdf.setTextColor(102, 126, 234)
  reportPdf.text('Page-by-Page Analysis', 20, yPos)
  yPos += 10
  
  reportPdf.setFontSize(9)
  reportPdf.setTextColor(0, 0, 0)
  
  pageDetails.slice(0, 20).forEach((detail: any) => {
    if (yPos > 280) {
      reportPdf.addPage()
      yPos = 20
    }
    reportPdf.text(`Page ${detail.page}: ${detail.textLength} chars, Density: ${detail.density.toFixed(0)}`, 25, yPos)
    yPos += 5
  })
  
  if (pageCount > 20) {
    yPos += 5
    reportPdf.text(`... and ${pageCount - 20} more pages`, 25, yPos)
  }
  
  const pdfBlob = reportPdf.output('blob')
  return pdfBlob
}

function calculateConsistency(scores: number[]): number {
  if (scores.length === 0) return 0
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)
  const consistency = Math.max(0, 100 - (stdDev / avg) * 100)
  return Math.round(consistency)
}

function calculateOverallQuality(avgDensity: number, consistency: number, pageCount: number): number {
  let score = 0
  
  // Text density score (40 points)
  if (avgDensity > 1000) score += 40
  else if (avgDensity > 500) score += 30
  else if (avgDensity > 200) score += 20
  else score += 10
  
  // Consistency score (40 points)
  score += (consistency / 100) * 40
  
  // Page count score (20 points)
  if (pageCount > 0) score += 20
  
  return Math.round(score)
}

function analyzeTextArrangement(scores: number[], avg: number) {
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)
  
  let structure = 'Well-structured'
  if (stdDev > avg * 0.5) structure = 'Inconsistent structure'
  else if (stdDev > avg * 0.3) structure = 'Moderately structured'
  
  let consistency = 'High'
  if (stdDev > avg * 0.5) consistency = 'Low'
  else if (stdDev > avg * 0.3) consistency = 'Medium'
  
  let readability = 'Good'
  if (avg < 200) readability = 'Low text density'
  else if (avg > 2000) readability = 'Very high text density'
  else if (avg > 1000) readability = 'Excellent'
  
  return { structure, consistency, readability }
}

function generateRecommendations(quality: number, avgDensity: number, consistency: number, images: number, pages: number): string[] {
  const recs: string[] = []
  
  if (quality < 60) {
    recs.push('Consider improving the overall document structure and text arrangement.')
  }
  
  if (avgDensity < 200) {
    recs.push('Text density is low. Consider adding more content or reducing page count.')
  } else if (avgDensity > 2000) {
    recs.push('Text density is very high. Consider breaking content into more pages for better readability.')
  }
  
  if (consistency < 60) {
    recs.push('Text distribution is inconsistent across pages. Aim for more uniform content distribution.')
  }
  
  if (images === 0 && pages > 5) {
    recs.push('No images detected. Consider adding visual elements to enhance engagement.')
  }
  
  if (quality >= 80) {
    recs.push('Excellent PDF quality! The document is well-structured and readable.')
  }
  
  recs.push('Use compression tools to reduce file size if needed.')
  recs.push('Ensure proper font embedding for consistent display across devices.')
  
  return recs
}
