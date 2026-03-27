'use client'

import { useEffect, useState, useRef } from 'react'
import { toolConfig } from '@/lib/toolConfig'
import { processFiles } from '@/lib/pdfProcessor'
import { loadAllPDFLibraries, checkLibrariesLoaded } from '@/lib/loadScripts'

interface ToolModalProps {
  currentTool: string | null
  onClose: () => void
}

export default function ToolModal({ currentTool, onClose }: ToolModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Blob | null>(null)
  const [options, setOptions] = useState<any>({})
  const [librariesLoaded, setLibrariesLoaded] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load PDF libraries when component mounts
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

  useEffect(() => {
    if (!currentTool) {
      setUploadedFiles([])
      setProcessing(false)
      setProgress(0)
      setResult(null)
      setOptions({})
    }
  }, [currentTool])

  if (!currentTool) return null

  const config = toolConfig[currentTool]
  
  if (!config) {
    return (
      <div className={`modal ${currentTool ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>&times;</button>
          <p>Tool configuration not found.</p>
        </div>
      </div>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      // For merge and other multiple file tools, add to existing files
      if (config.multiple) {
        setUploadedFiles([...uploadedFiles, ...files])
      } else {
        // For single file tools, replace
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
    // Check if libraries are loaded
    if (!librariesLoaded || !checkLibrariesLoaded()) {
      alert('PDF libraries are still loading. Please wait a moment and try again.')
      return
    }
    
    // Validate compression target size
    if (currentTool === 'compress' && options.targetSize) {
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
    
    // Validate protect PDF passwords match
    if (currentTool === 'protect') {
      if (!options.password) {
        alert('Password is required to protect PDF')
        return
      }
      if (options.password !== options.confirmPassword) {
        alert('Passwords do not match!')
        return
      }
    }
    
    // Validate unlock PDF password provided
    if (currentTool === 'unlock' && !options.password) {
      alert('Password is required to unlock the PDF')
      return
    }
    
    setProcessing(true)
    setProgress(0)
    
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90))
    }, 200)

    try {
      const blob = await processFiles(currentTool, uploadedFiles, options)
      setResult(blob)
      setProgress(100)
    } catch (error: any) {
      console.error('Processing error:', error)
      // Show the actual error message from processing
      const errorMessage = error.message || 'An error occurred while processing your files. Please try again.'
      alert(errorMessage)
    } finally {
      clearInterval(interval)
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const url = URL.createObjectURL(result)
    const a = document.createElement('a')
    a.href = url
    
    let extension = 'pdf'
    if (currentTool === 'pdf-to-jpg') extension = 'zip'
    if (currentTool === 'pdf-to-word') extension = 'docx'
    if (currentTool === 'pdf-to-powerpoint') extension = 'pptx'
    if (currentTool === 'pdf-to-excel') extension = 'xlsx'
    if (currentTool === 'compare') extension = 'pdf'
    if (currentTool === 'quality-report') extension = 'pdf'
    
    a.download = `processed_${currentTool}_${Date.now()}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`modal ${currentTool ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <div className={`modal-icon tool-icon ${config.icon}`}>
            <i className={`fas fa-${config.icon === 'merge' ? 'object-group' : config.icon === 'split' ? 'scissors' : 'file-pdf'}`}></i>
          </div>
          <h2>{config.title}</h2>
        </div>

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
                {currentTool === 'merge' && uploadedFiles.length > 1 && (
                  <div className="merge-instructions">
                    <i className="fas fa-info-circle"></i>
                    <p>Drag and drop to reorder PDFs. Files will be merged in this order.</p>
                  </div>
                )}
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="file-item" draggable={currentTool === 'merge'}>
                    {currentTool === 'merge' && (
                      <div className="file-number">{idx + 1}</div>
                    )}
                    <div className="file-info">
                      <i className="fas fa-file-pdf"></i>
                      <div className="file-details">
                        <h4>{file.name}</h4>
                        <p>{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    {currentTool === 'merge' && (
                      <div className="file-actions">
                        {idx > 0 && (
                          <button 
                            className="btn-move-up" 
                            onClick={() => moveFile(idx, idx - 1)}
                            title="Move up"
                          >
                            <i className="fas fa-arrow-up"></i>
                          </button>
                        )}
                        {idx < uploadedFiles.length - 1 && (
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
                    )}
                  </div>
                ))}
              </div>
            )}

            {config.options && uploadedFiles.length > 0 && (
              <div className="options-area">
                {currentTool === 'compress' && (
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
                    <div style={{background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '10px', padding: '1rem', marginTop: '1rem'}}>
                      <p style={{color: '#92400e', fontSize: '0.9rem', margin: 0}}>
                        <i className="fas fa-info-circle"></i> <strong>Note:</strong> Minimum target size is 30 KB. The system will compress as close to your target as possible.
                      </p>
                    </div>
                  </>
                )}
                {currentTool === 'split' && (
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
                {currentTool === 'rotate' && (
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
                {currentTool === 'watermark' && (
                  <>
                    <div className="option-group">
                      <label>Watermark Text</label>
                      <input 
                        type="text" 
                        placeholder="Enter watermark text"
                        value={options.watermarkText || ''}
                        onChange={(e) => setOptions({...options, watermarkText: e.target.value})}
                      />
                    </div>
                    <div className="option-group">
                      <label>Position</label>
                      <select 
                        value={options.watermarkPosition || 'center'}
                        onChange={(e) => setOptions({...options, watermarkPosition: e.target.value})}
                      >
                        <option value="center">Center</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                  </>
                )}
                {currentTool === 'pdf-to-jpg' && (
                  <div className="option-group">
                    <label>Image Quality</label>
                    <select 
                      value={options.imageQuality || 'medium'}
                      onChange={(e) => setOptions({...options, imageQuality: e.target.value})}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                )}
                {currentTool === 'edit' && (
                  <>
                    <div className="option-group">
                      <label>Text Content</label>
                      <input 
                        type="text" 
                        placeholder="Enter text to add"
                        value={options.textContent || ''}
                        onChange={(e) => setOptions({...options, textContent: e.target.value, addText: true})}
                      />
                    </div>
                    <div className="option-group">
                      <label>Font Size</label>
                      <input 
                        type="number" 
                        placeholder="12"
                        value={options.fontSize || '12'}
                        onChange={(e) => setOptions({...options, fontSize: e.target.value})}
                      />
                    </div>
                  </>
                )}
                {currentTool === 'sign' && (
                  <>
                    <div className="option-group">
                      <label>Signature Text</label>
                      <input 
                        type="text" 
                        placeholder="Your signature"
                        value={options.signatureText || ''}
                        onChange={(e) => setOptions({...options, signatureText: e.target.value})}
                      />
                    </div>
                    <div className="option-group">
                      <label>Position</label>
                      <select 
                        value={options.signaturePosition || 'bottom-right'}
                        onChange={(e) => setOptions({...options, signaturePosition: e.target.value})}
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                      </select>
                    </div>
                  </>
                )}
                {currentTool === 'unlock' && (
                  <div className="option-group">
                    <label>Password (if required)</label>
                    <input 
                      type="password" 
                      placeholder="Enter password"
                      value={options.password || ''}
                      onChange={(e) => setOptions({...options, password: e.target.value})}
                    />
                  </div>
                )}
                {currentTool === 'protect' && (
                  <>
                    <div className="option-group">
                      <label>Set Password</label>
                      <div className="password-input-wrapper">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter password"
                          value={options.password || ''}
                          onChange={(e) => setOptions({...options, password: e.target.value})}
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
                          onChange={(e) => setOptions({...options, confirmPassword: e.target.value})}
                        />
                        <button 
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>
                    {options.password && options.confirmPassword && options.password !== options.confirmPassword && (
                      <div style={{background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '10px', padding: '1rem', marginTop: '1rem'}}>
                        <p style={{color: '#dc2626', fontSize: '0.9rem', margin: 0}}>
                          <i className="fas fa-exclamation-triangle"></i> <strong>Passwords do not match!</strong>
                        </p>
                      </div>
                    )}
                  </>
                )}
                {currentTool === 'page-numbers' && (
                  <div className="option-group">
                    <label>Position</label>
                    <select 
                      value={options.numberPosition || 'bottom-center'}
                      onChange={(e) => setOptions({...options, numberPosition: e.target.value})}
                    >
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-center">Top Center</option>
                    </select>
                  </div>
                )}
                {currentTool === 'scan' && (
                  <div className="option-group">
                    <label>Enhance Quality</label>
                    <select 
                      value={options.enhance || 'false'}
                      onChange={(e) => setOptions({...options, enhance: e.target.value === 'true'})}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                )}
                {currentTool === 'ocr' && (
                  <div className="option-group">
                    <label>Language</label>
                    <select 
                      value={options.language || 'eng'}
                      onChange={(e) => setOptions({...options, language: e.target.value})}
                    >
                      <option value="eng">English</option>
                      <option value="spa">Spanish</option>
                      <option value="fra">French</option>
                      <option value="deu">German</option>
                    </select>
                  </div>
                )}
                {currentTool === 'redact' && (
                  <div className="option-group">
                    <label>Text to Redact</label>
                    <input 
                      type="text" 
                      placeholder="Enter text to redact"
                      value={options.redactText || ''}
                      onChange={(e) => setOptions({...options, redactText: e.target.value})}
                    />
                  </div>
                )}
                {currentTool === 'crop' && (
                  <div className="option-group">
                    <label>Crop Margin (pixels)</label>
                    <input 
                      type="number" 
                      placeholder="50"
                      value={options.cropMargin || '50'}
                      onChange={(e) => setOptions({...options, cropMargin: e.target.value})}
                    />
                  </div>
                )}
                {currentTool === 'translate' && (
                  <div className="option-group">
                    <label>Target Language</label>
                    <select 
                      value={options.targetLanguage || 'es'}
                      onChange={(e) => setOptions({...options, targetLanguage: e.target.value})}
                    >
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
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
            <p className="progress-text">Processing...</p>
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
              <button className="btn-secondary-action" onClick={onClose}>
                <i className="fas fa-redo"></i> Process Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
