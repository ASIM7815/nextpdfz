'use client'

import { useRouter } from 'next/navigation'

interface ToolsSectionProps {
  onToolClick?: (tool: string) => void
  searchQuery?: string
}

export default function ToolsSection({ onToolClick, searchQuery = '' }: ToolsSectionProps) {
  const router = useRouter()
  
  const handleToolClick = (toolId: string) => {
    router.push(`/tools/${toolId}`)
  }
  
  const tools = [
    { id: 'merge', icon: 'fa-object-group', title: 'Merge PDF', desc: 'Combine multiple PDFs into one', iconClass: 'merge' },
    { id: 'split', icon: 'fa-scissors', title: 'Split PDF', desc: 'Extract pages from your PDF', iconClass: 'split' },
    { id: 'compress', icon: 'fa-compress', title: 'Compress PDF', desc: 'Reduce file size', iconClass: 'compress' },
    { id: 'pdf-to-word', icon: 'fa-file-word', title: 'PDF to Word', desc: 'Convert PDF to DOCX', iconClass: 'convert' },
    { id: 'pdf-to-powerpoint', icon: 'fa-file-powerpoint', title: 'PDF to PowerPoint', desc: 'Convert PDF to PPTX', iconClass: 'convert' },
    { id: 'pdf-to-excel', icon: 'fa-file-excel', title: 'PDF to Excel', desc: 'Convert PDF to XLSX', iconClass: 'convert' },
    { id: 'word-to-pdf', icon: 'fa-file-pdf', title: 'Word to PDF', desc: 'Convert DOCX to PDF', iconClass: 'convert' },
    { id: 'powerpoint-to-pdf', icon: 'fa-file-pdf', title: 'PowerPoint to PDF', desc: 'Convert PPTX to PDF', iconClass: 'convert' },
    { id: 'excel-to-pdf', icon: 'fa-file-pdf', title: 'Excel to PDF', desc: 'Convert XLSX to PDF', iconClass: 'convert' },
    { id: 'pdf-to-jpg', icon: 'fa-image', title: 'PDF to JPG', desc: 'Convert PDF pages to images', iconClass: 'convert' },
    { id: 'jpg-to-pdf', icon: 'fa-images', title: 'JPG to PDF', desc: 'Convert images to PDF', iconClass: 'convert' },
    { id: 'rotate', icon: 'fa-sync', title: 'Rotate PDF', desc: 'Rotate pages in your PDF', iconClass: 'rotate' },
    { id: 'unlock', icon: 'fa-unlock', title: 'Unlock PDF', desc: 'Remove PDF restrictions', iconClass: 'unlock' },
    { id: 'protect', icon: 'fa-lock', title: 'Protect PDF', desc: 'Add password protection', iconClass: 'protect' },
    { id: 'organize', icon: 'fa-sort', title: 'Organize PDF', desc: 'Reorder PDF pages', iconClass: 'organize' },
  ]

  // Filter tools based on search query
  const filteredTools = tools.filter(tool => 
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section id="tools" className="tools-section">
      <div className="container">
        {!searchQuery && (
          <header className="tools-header">
            <h2>All PDF Tools - Free & Online</h2>
            <p>Convert, edit, merge, split, compress PDF files online. No watermark, secure, works on mobile.</p>
          </header>
        )}
        {searchQuery && (
          <div className="search-results-header">
            <h2>Search Results for "{searchQuery}"</h2>
            <p>{filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found</p>
          </div>
        )}
        <div className="tools-grid">
          {filteredTools.map(tool => (
            <article 
              key={tool.id} 
              className="tool-card" 
              onClick={() => handleToolClick(tool.id)}
            >
              <div className={`tool-icon ${tool.iconClass}`}>
                <i className={`fas ${tool.icon}`}></i>
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.desc}</p>
              <div className="tool-trust-icons">
                <i className="fas fa-lock" title="Secure & Private"></i>
                <i className="fas fa-bolt" title="Fast Processing"></i>
                <i className="fas fa-check-circle" title="Verified"></i>
              </div>
            </article>
          ))}
        </div>
        {filteredTools.length === 0 && (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No tools found</h3>
            <p>Try searching with different keywords</p>
          </div>
        )}
      </div>
    </section>
  )
}
