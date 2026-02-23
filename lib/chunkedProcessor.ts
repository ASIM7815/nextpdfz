// Chunked PDF processing utilities for handling large files

declare global {
  interface Window {
    PDFLib: any
    jspdf: any
    pdfjsLib: any
    JSZip: any
  }
}

export interface ChunkProgress {
  currentChunk: number
  totalChunks: number
  currentPage: number
  totalPages: number
  percentage: number
  message: string
}

// Process PDF in chunks to avoid memory exhaustion
export async function processCompressPDFInChunks(
  file: File,
  options: any,
  onProgress?: (progress: ChunkProgress) => void
): Promise<Blob> {
  const { PDFDocument } = window.PDFLib
  const { jsPDF } = window.jspdf
  
  // Load original PDF
  const arrayBuffer = await file.arrayBuffer()
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  const totalPages = pdf.numPages
  const pageChunkSize = totalPages > 50 ? 5 : 10 // 5 pages for large PDFs, 10 for medium
  const totalChunks = Math.ceil(totalPages / pageChunkSize)
  
  // Calculate compression settings
  const targetSizeKB = parseInt(options.targetSize) || 30
  const targetSizeBytes = targetSizeKB * 1024
  const originalSize = file.size
  const compressionRatio = targetSizeBytes / originalSize
  
  let imageQuality = 0.95
  if (compressionRatio < 0.1) imageQuality = 0.3
  else if (compressionRatio < 0.2) imageQuality = 0.4
  else if (compressionRatio < 0.3) imageQuality = 0.5
  else if (compressionRatio < 0.5) imageQuality = 0.6
  else if (compressionRatio < 0.7) imageQuality = 0.75
  
  let scale = 1.0
  if (compressionRatio < 0.1) scale = 0.3
  else if (compressionRatio < 0.2) scale = 0.4
  else if (compressionRatio < 0.3) scale = 0.5
  else if (compressionRatio < 0.5) scale = 0.6
  else if (compressionRatio < 0.7) scale = 0.8
  
  // Create output PDF
  const compressedPdf = new jsPDF({
    compress: true,
    unit: 'pt',
    format: 'a4'
  })
  
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  let isFirstPage = true
  
  // Process in chunks
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startPage = chunkIndex * pageChunkSize + 1
    const endPage = Math.min(startPage + pageChunkSize - 1, totalPages)
    
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      if (onProgress) {
        onProgress({
          currentChunk: chunkIndex + 1,
          totalChunks,
          currentPage: pageNum,
          totalPages,
          percentage: Math.round((pageNum / totalPages) * 100),
          message: `Compressing page ${pageNum} of ${totalPages}...`
        })
      }
      
      if (!isFirstPage) compressedPdf.addPage()
      
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      const imgData = canvas.toDataURL('image/jpeg', imageQuality)
      const pageWidth = compressedPdf.internal.pageSize.getWidth()
      const pageHeight = compressedPdf.internal.pageSize.getHeight()
      
      compressedPdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST')
      isFirstPage = false
    }
    
    // Clear canvas to free memory
    context?.clearRect(0, 0, canvas.width, canvas.height)
  }
  
  return compressedPdf.output('blob')
}

// Process PDF to images in chunks
export async function processPDFToImagesInChunks(
  file: File,
  options: any,
  onProgress?: (progress: ChunkProgress) => void
): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer()
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  const quality = options.imageQuality || 'medium'
  const scale = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1
  
  const totalPages = pdf.numPages
  const pageChunkSize = 10
  const totalChunks = Math.ceil(totalPages / pageChunkSize)
  const imageBlobs: Blob[] = []
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startPage = chunkIndex * pageChunkSize + 1
    const endPage = Math.min(startPage + pageChunkSize - 1, totalPages)
    
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      if (onProgress) {
        onProgress({
          currentChunk: chunkIndex + 1,
          totalChunks,
          currentPage: pageNum,
          totalPages,
          percentage: Math.round((pageNum / totalPages) * 100),
          message: `Converting page ${pageNum} of ${totalPages} to JPG...`
        })
      }
      
      const page = await pdf.getPage(pageNum)
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
      
      imageBlobs.push(blob)
    }
    
    // Clear canvas to free memory
    context?.clearRect(0, 0, canvas.width, canvas.height)
  }
  
  return imageBlobs
}

// Process PDF to Word in chunks
export async function processPDFToWordInChunks(
  file: File,
  onProgress?: (progress: ChunkProgress) => void
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const zip = new window.JSZip()
  
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  const totalPages = pdf.numPages
  const pageChunkSize = 10
  const totalChunks = Math.ceil(totalPages / pageChunkSize)
  
  const pageContents: any[] = []
  const imageRels: string[] = []
  let imageCounter = 0
  
  // Process pages in chunks
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startPage = chunkIndex * pageChunkSize + 1
    const endPage = Math.min(startPage + pageChunkSize - 1, totalPages)
    
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      if (onProgress) {
        onProgress({
          currentChunk: chunkIndex + 1,
          totalChunks,
          currentPage: pageNum,
          totalPages,
          percentage: Math.round((pageNum / totalPages) * 100),
          message: `Converting page ${pageNum} of ${totalPages} to Word...`
        })
      }
      
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ').trim()
      
      const viewport = page.getViewport({ scale: 2.5 })
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      const imageData = canvas.toDataURL('image/png', 0.95).split(',')[1]
      
      imageCounter++
      const imageId = `image${imageCounter}`
      zip.file(`word/media/${imageId}.png`, imageData, { base64: true })
      imageRels.push(`<Relationship Id="rId${imageCounter}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageId}.png"/>`)
      
      pageContents.push({
        pageNum,
        imageData,
        imageId,
        imageCounter,
        hasText: pageText.length > 50
      })
    }
    
    // Clear canvas to free memory
    context?.clearRect(0, 0, canvas.width, canvas.height)
  }
  
  // Build Word document XML
  let docContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  docContent += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
  docContent += 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
  docContent += 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
  docContent += 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
  docContent += 'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
  docContent += '<w:body>'
  
  for (const pageContent of pageContents) {
    docContent += '<w:p>'
    docContent += '<w:r>'
    docContent += '<w:drawing>'
    docContent += '<wp:inline distT="0" distB="0" distL="0" distR="0">'
    docContent += `<wp:extent cx="5400000" cy="7000000"/>`
    docContent += '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
    docContent += '<wp:docPr id="' + pageContent.imageCounter + '" name="Page ' + pageContent.pageNum + '"/>'
    docContent += '<wp:cNvGraphicFramePr/>'
    docContent += '<a:graphic>'
    docContent += '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
    docContent += '<pic:pic>'
    docContent += '<pic:nvPicPr>'
    docContent += '<pic:cNvPr id="' + pageContent.imageCounter + '" name="Page ' + pageContent.pageNum + '"/>'
    docContent += '<pic:cNvPicPr/>'
    docContent += '</pic:nvPicPr>'
    docContent += '<pic:blipFill>'
    docContent += `<a:blip r:embed="rId${pageContent.imageCounter}"/>`
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
    
    if (pageContent.pageNum < totalPages) {
      docContent += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    }
  }
  
  docContent += '</w:body>'
  docContent += '</w:document>'
  
  zip.file('word/document.xml', docContent)
  
  let docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  docRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  docRels += imageRels.join('')
  docRels += '</Relationships>'
  zip.file('word/_rels/document.xml.rels', docRels)
  
  let contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
  contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
  contentTypes += '<Default Extension="xml" ContentType="application/xml"/>'
  contentTypes += '<Default Extension="png" ContentType="image/png"/>'
  contentTypes += '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
  contentTypes += '</Types>'
  zip.file('[Content_Types].xml', contentTypes)
  
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  
  return await zip.generateAsync({ 
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  })
}
