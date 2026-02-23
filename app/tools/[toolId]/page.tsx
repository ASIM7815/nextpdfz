'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { toolConfig } from '@/lib/toolConfig'
import { processFiles } from '@/lib/pdfProcessor'
import { loadAllPDFLibraries, checkLibrariesLoaded } from '@/lib/loadScripts'
import { 
  checkFileSystemSupport, 
  requestSaveFileAccess, 
  writeFileInChunks,
  needsChunkedProcessing 
} from '@/lib/fileSystemStorage'
import { ChunkProgress } from '@/lib/chunkedProcessor'

export default function ToolPage() {
  const params = useParams()
  const router = useRouter()
  const toolId = params.toolId as string
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Blob | null>(null)
  const [options, setOptions] = useState<any>({})
  const [librariesLoaded, setLibrariesLoaded] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress | null>(null)
  const [useFileSystem, setUseFileSystem] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = toolConfig[toolId]

  useEffect(() => {
    if (!checkLibrariesLoaded()) {
      loadAllPDFLibraries().then(() => {
        setLibrariesLoaded(true)
      }).catch(err => {
        console.error('Failed to load PDF libraries:', err)
      })
    } else {
      setLibrariesLoaded(true)
    }
  }, [])

  if (!config) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Tool not found</h2>
            <button onClick={() => router.push('/')} className="btn-process" style={{ marginTop: '2rem' }}>
              Go Back Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      if (config.multiple) {
        setUploadedFiles([...uploadedFiles, ...files])
      } else {
        if (files.length > 1) {
          alert('This tool only accepts one file at a time')
          return
        }
        setUploadedFiles(files)
      }
    }
  }

  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...uploadedFiles]
    const [movedFile] = newFiles.splice(fromIndex, 1)
    newFiles.splice(toIndex, 0, movedFile)
    setUploadedFiles(newFiles)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== index))
  }

  const handleProcess = async () => {
    if (!librariesLoaded || !checkLibrariesLoaded()) {
      alert('PDF libraries are still loading. Please wait a moment and try again.')
      return
    }
    
    // Clear previous errors
    setPasswordError('')
    setUnlockError('')
    setChunkProgress(null)
    
    // Check if file is large and needs special handling
    const file = uploadedFiles[0]
    const isLargeFile = file && needsChunkedProcessing(file.size)
    
    if (isLargeFile) {
      const fsSupport = checkFileSystemSupport()
      if (fsSupport.supported) {
        const userConfirm = confirm(
          `This is a large file (${(file.size / 1024 / 1024).toFixed(2)} MB). ` +
          `Would you like to use advanced processing for better performance? ` +
          `This will require permission to save the file to your device.`
        )
        setUseFileSystem(userConfirm)
      } else {
        alert(
          `This is a large file (${(file.size / 1024 / 1024).toFixed(2)} MB). ` +
          `Processing may take longer. ${fsSupport.reason || ''}`
        )
      }
    }
    
    // Validate passwords for protect tool
    if (toolId === 'protect') {
      if (!options.password) {
        setPasswordError('Password is required to protect PDF')
        return
      }
      if (options.password !== options.confirmPassword) {
        setPasswordError('Please match the password')
        return
      }
      if (options.password.length > 300) {
        setPasswordError('Password must not exceed 300 characters')
        return
      }
    }
    
    // Validate password for unlock tool
    if (toolId === 'unlock') {
      if (!options.password) {
        setUnlockError('Password is required to unlock the PDF')
        return
      }
    }
    
    if (toolId === 'compress' && options.targetSize) {
      const targetSize = parseInt(options.targetSize)
      if (targetSize < 30) {
        alert('Target size must be at least 30 KB')
        return
      }
      if (uploadedFiles[0] && targetSize >= (uploadedFiles[0].size / 1024)) {
        alert('Target size must be smaller than the current file size')
        return
      }
    }
    
    setProcessing(true)
    setProgress(0)
    
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 85))
    }, 500)

    try {
      const blob = await processFiles(toolId, uploadedFiles, options, (chunkProg) => {
        setChunkProgress(chunkProg)
        setProgress(chunkProg.percentage)
      })
      
      setResult(blob)
      setProgress(100)
      setChunkProgress(null)
    } catch (error: any) {
      console.error('Processing error:', error)
      
      // Handle unlock-specific errors
      if (toolId === 'unlock') {
        setUnlockError(error.message || 'An error occurred while unlocking the PDF. Please try again.')
      } else {
        alert('An error occurred while processing your files. Please try again.')
      }
    } finally {
      clearInterval(interval)
      setProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!result) return
    
    let extension = 'pdf'
    let mimeType = 'application/pdf'
    
    if (toolId === 'pdf-to-jpg') {
      extension = 'zip'
      mimeType = 'application/zip'
    }
    if (toolId === 'pdf-to-word') {
      extension = 'docx'
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    if (toolId === 'pdf-to-powerpoint') {
      extension = 'pptx'
      mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }
    if (toolId === 'pdf-to-excel') {
      extension = 'xlsx'
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    
    // Get original filename without extension and add 'pdfz' before the extension
    const originalFile = uploadedFiles[0]
    let filename = 'processed'
    
    if (originalFile) {
      const originalName = originalFile.name
      const lastDotIndex = originalName.lastIndexOf('.')
      const nameWithoutExt = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName
      filename = `${nameWithoutExt}pdfz`
    }
    
    // Create a new blob with the correct MIME type
    const blob = new Blob([result], { type: mimeType })
    
    // Try File System Access API for large files
    if (useFileSystem && checkFileSystemSupport().supported) {
      try {
        const fileHandle = await requestSaveFileAccess(
          `${filename}.${extension}`,
          mimeType,
          `.${extension}`
        )
        
        if (fileHandle) {
          await writeFileInChunks(fileHandle, blob, (progress) => {
            console.log(`Writing file: ${progress}%`)
          })
          alert('File saved successfully!')
          return
        }
      } catch (error) {
        console.error('File System Access API failed, falling back to regular download:', error)
      }
    }
    
    // Fallback to regular download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.${extension}`
    
    document.body.appendChild(a)
    a.click()
    
    // Keep anchor in DOM longer for mobile compatibility
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 1000)
  }

  const handleReset = () => {
    setUploadedFiles([])
    setProcessing(false)
    setProgress(0)
    setResult(null)
    setOptions({})
    setPasswordError('')
    setUnlockError('')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="tool-page" style={{ flex: 1 }}>
        <div className="container">
          <div className="tool-page-header">
            <button onClick={() => router.push('/')} className="back-button">
              <i className="fas fa-arrow-left"></i> Back to Tools
            </button>
            <div className="tool-page-title">
              <div className={`tool-icon ${config.icon}`}>
                <i className={`fas fa-${config.icon === 'merge' ? 'object-group' : config.icon === 'split' ? 'scissors' : 'file-pdf'}`}></i>
              </div>
              <h1>{config.title}</h1>
            </div>
          </div>

          <div className="tool-page-content">
            {!processing && !result && (
              <>
                <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                  <i className="fas fa-cloud-upload-alt"></i>
                  <h3>Drop files here or click to upload</h3>
                  {config.multiple ? (
                    <p>Select multiple files (Ctrl/Cmd + Click or Shift + Click)</p>
                  ) : (
                    <p>Supports PDF, DOCX, JPG, PNG</p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    multiple={config.multiple}
                    accept={config.accept}
                    onChange={handleFileSelect}
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="file-list">
                    {toolId === 'merge' && uploadedFiles.length > 1 && (
                      <div className="merge-instructions">
                        <i className="fas fa-info-circle"></i>
                        <p>Drag and drop to reorder PDFs. Files will be merged in this order.</p>
                      </div>
                    )}
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="file-item" draggable={toolId === 'merge'}>
                        {toolId === 'merge' && (
                          <div className="file-number">{idx + 1}</div>
                        )}
                        <div className="file-info">
                          <i className="fas fa-file-pdf"></i>
                          <div className="file-details">
                            <h4>{file.name}</h4>
                            <p>{(file.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        <div className="file-actions">
                          {toolId === 'merge' && idx > 0 && (
                            <button 
                              className="btn-move-up" 
                              onClick={() => moveFile(idx, idx - 1)}
                              title="Move up"
                            >
                              <i className="fas fa-arrow-up"></i>
                            </button>
                          )}
                          {toolId === 'merge' && idx < uploadedFiles.length - 1 && (
                            <button 
                              className="btn-move-down" 
                              onClick={() => moveFile(idx, idx + 1)}
                              title="Move down"
                            >
                              <i className="fas fa-arrow-down"></i>
                            </button>
                          )}
                          <button 
                            className="btn-remove" 
                            onClick={() => removeFile(idx)}
                            title="Remove"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {config.options && uploadedFiles.length > 0 && (
                  <div className="options-area">
                    {toolId === 'compress' && (
                      <>
                        <div className="option-group">
                          <label>Target File Size (KB)</label>
                          <input 
                            type="number" 
                            placeholder="Enter target size (min: 30 KB)"
                            min="30"
                            value={options.targetSize || ''}
                            onChange={(e) => setOptions({...options, targetSize: e.target.value})}
                          />
                        </div>
                        {uploadedFiles[0] && (
                          <div style={{background: '#e0f2fe', border: '1px solid #0284c7', borderRadius: '10px', padding: '1rem', marginTop: '1rem'}}>
                            <p style={{color: '#075985', fontSize: '0.9rem', margin: 0}}>
                              <i className="fas fa-info-circle"></i> <strong>Current size:</strong> {(uploadedFiles[0].size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {toolId === 'split' && (
                      <>
                        <div className="option-group">
                          <label>Split Mode</label>
                          <select 
                            value={options.splitMode || 'range'}
                            onChange={(e) => setOptions({...options, splitMode: e.target.value})}
                          >
                            <option value="range">Page Range</option>
                            <option value="all">Extract All Pages</option>
                          </select>
                        </div>
                        {options.splitMode !== 'all' && (
                          <div className="option-group">
                            <label>Page Range (e.g., 1-3, 5, 7-9)</label>
                            <input 
                              type="text" 
                              placeholder="1-3"
                              value={options.pageRange || ''}
                              onChange={(e) => setOptions({...options, pageRange: e.target.value})}
                            />
                          </div>
                        )}
                      </>
                    )}
                    {toolId === 'rotate' && (
                      <div className="option-group">
                        <label>Rotation Angle</label>
                        <select 
                          value={options.rotationAngle || '90'}
                          onChange={(e) => setOptions({...options, rotationAngle: e.target.value})}
                        >
                          <option value="90">90° Clockwise</option>
                          <option value="180">180°</option>
                          <option value="270">270° Clockwise (90° Counter)</option>
                        </select>
                      </div>
                    )}
                    {toolId === 'protect' && (
                      <>
                        <div className="option-group">
                          <label>Set Password</label>
                          <div className="password-input-wrapper">
                            <input 
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password (max 300 characters)"
                              value={options.password || ''}
                              onChange={(e) => {
                                setOptions({...options, password: e.target.value})
                                setPasswordError('')
                              }}
                              maxLength={300}
                              title="Password can be up to 300 characters"
                              required
                            />
                            <button 
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                        </div>
                        <div className="option-group">
                          <label>Confirm Password</label>
                          <div className="password-input-wrapper">
                            <input 
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm password"
                              value={options.confirmPassword || ''}
                              onChange={(e) => {
                                setOptions({...options, confirmPassword: e.target.value})
                                setPasswordError('')
                              }}
                              maxLength={300}
                              title="Password can be up to 300 characters"
                              required
                            />
                            <button 
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                          {passwordError && (
                            <div style={{
                              color: '#dc2626',
                              fontSize: '0.875rem',
                              marginTop: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <i className="fas fa-exclamation-circle"></i>
                              {passwordError}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {toolId === 'unlock' && (
                      <>
                        <div className="option-group">
                          <label>Password (required)</label>
                          <div className="password-input-wrapper">
                            <input 
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password to unlock PDF"
                              value={options.password || ''}
                              onChange={(e) => {
                                setOptions({...options, password: e.target.value})
                                setUnlockError('')
                              }}
                              maxLength={300}
                              title="Enter the password to unlock the PDF"
                              required
                            />
                            <button 
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                          {unlockError && (
                            <div style={{
                              color: '#dc2626',
                              fontSize: '0.875rem',
                              marginTop: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <i className="fas fa-exclamation-circle"></i>
                              {unlockError}
                            </div>
                          )}
                        </div>
                        <div style={{background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '10px', padding: '1rem', marginTop: '1rem'}}>
                          <p style={{color: '#92400e', fontSize: '0.9rem', margin: 0}}>
                            <i className="fas fa-info-circle"></i> Enter the correct password to unlock and remove all restrictions from the PDF.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  className="btn-process"
                  disabled={uploadedFiles.length === 0}
                  onClick={handleProcess}
                >
                  <i className="fas fa-magic"></i> Process Files
                </button>
              </>
            )}

            {processing && (
              <div className="progress-area">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                {chunkProgress ? (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <p className="progress-text">{chunkProgress.message}</p>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                      Chunk {chunkProgress.currentChunk} of {chunkProgress.totalChunks} 
                      {' • '}
                      Page {chunkProgress.currentPage} of {chunkProgress.totalPages}
                    </p>
                  </div>
                ) : (
                  <p className="progress-text">Processing...</p>
                )}
              </div>
            )}

            {result && (
              <div className="result-area">
                <div className="success-animation">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Processing Complete!</h3>
                <p className="success-message">Your file is ready to download</p>
                <div className="result-actions">
                  <button className="btn-download" onClick={handleDownload}>
                    <i className="fas fa-download"></i> Download File
                  </button>
                  <button className="btn-secondary-action" onClick={handleReset}>
                    <i className="fas fa-redo"></i> Process Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
