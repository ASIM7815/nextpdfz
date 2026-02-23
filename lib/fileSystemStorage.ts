// File System Access API utilities for handling large PDFs

export interface FileSystemStorageSupport {
  supported: boolean
  reason?: string
}

// Check if File System Access API is supported
export function checkFileSystemSupport(): FileSystemStorageSupport {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Not in browser environment' }
  }

  if (!('showOpenFilePicker' in window)) {
    return { 
      supported: false, 
      reason: 'File System Access API not supported. Please use Chrome or Edge browser.' 
    }
  }

  return { supported: true }
}

// Request permission to save file to disk
export async function requestSaveFileAccess(
  suggestedName: string,
  mimeType: string,
  extension: string
): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: suggestedName,
      types: [{
        description: 'PDF Files',
        accept: { [mimeType]: [extension] }
      }]
    })
    return handle
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('User cancelled file save')
      return null
    }
    console.error('Error requesting file access:', error)
    throw error
  }
}

// Write blob to file system in chunks
export async function writeFileInChunks(
  fileHandle: FileSystemFileHandle,
  blob: Blob,
  onProgress?: (progress: number) => void
): Promise<void> {
  const writable = await fileHandle.createWritable()
  const chunkSize = 5 * 1024 * 1024 // 5MB chunks
  const totalSize = blob.size
  let written = 0

  try {
    for (let offset = 0; offset < totalSize; offset += chunkSize) {
      const chunk = blob.slice(offset, offset + chunkSize)
      await writable.write(chunk)
      written += chunk.size
      
      if (onProgress) {
        onProgress(Math.round((written / totalSize) * 100))
      }
    }
    await writable.close()
  } catch (error) {
    await writable.abort()
    throw error
  }
}

// Read file from file system in chunks
export async function readFileInChunks(
  file: File,
  chunkSize: number,
  onChunk: (chunk: ArrayBuffer, offset: number, isLast: boolean) => Promise<void>,
  onProgress?: (progress: number) => void
): Promise<void> {
  const totalSize = file.size
  let offset = 0

  while (offset < totalSize) {
    const end = Math.min(offset + chunkSize, totalSize)
    const chunk = file.slice(offset, end)
    const arrayBuffer = await chunk.arrayBuffer()
    
    const isLast = end >= totalSize
    await onChunk(arrayBuffer, offset, isLast)
    
    offset = end
    
    if (onProgress) {
      onProgress(Math.round((offset / totalSize) * 100))
    }
  }
}

// Estimate if file needs chunked processing
export function needsChunkedProcessing(fileSize: number, pageCount?: number): boolean {
  const SIZE_THRESHOLD = 10 * 1024 * 1024 // 10MB
  const PAGE_THRESHOLD = 50
  
  if (fileSize > SIZE_THRESHOLD) return true
  if (pageCount && pageCount > PAGE_THRESHOLD) return true
  
  return false
}

// Get optimal chunk size based on file size
export function getOptimalChunkSize(fileSize: number): number {
  if (fileSize < 10 * 1024 * 1024) return 5 * 1024 * 1024 // 5MB for small files
  if (fileSize < 50 * 1024 * 1024) return 10 * 1024 * 1024 // 10MB for medium files
  return 20 * 1024 * 1024 // 20MB for large files
}

// Calculate page chunk size for processing
export function getPageChunkSize(totalPages: number, fileSize: number): number {
  if (fileSize < 10 * 1024 * 1024) return totalPages // Process all at once
  if (fileSize < 50 * 1024 * 1024) return 10 // 10 pages at a time
  return 5 // 5 pages at a time for very large files
}
