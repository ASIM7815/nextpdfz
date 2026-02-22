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
  
  const toolSections = [
    {
      title: '⭐ Most Popular Tools',
      subtitle: 'Our most-used PDF tools for everyday tasks',
      tools: [
        { id: 'pdf-to-word', icon: 'fa-file-word', title: 'PDF to Word', desc: 'Convert PDF files to editable Word (DOCX) documents instantly.', iconClass: 'convert' },
        { id: 'word-to-pdf', icon: 'fa-file-pdf', title: 'Word to PDF', desc: 'Convert Word (DOCX) documents to high-quality PDF files instantly.', iconClass: 'convert' },
        { id: 'merge', icon: 'fa-object-group', title: 'Merge PDF', desc: 'Merge multiple PDF files into a single document quickly and securely.', iconClass: 'merge' },
        { id: 'compress', icon: 'fa-compress', title: 'Compress PDF', desc: 'Reduce PDF file size without losing quality.', iconClass: 'compress' },
        { id: 'pdf-to-excel', icon: 'fa-file-excel', title: 'PDF to Excel', desc: 'Convert PDF tables to editable Excel (XLSX) spreadsheets.', iconClass: 'convert' },
        { id: 'excel-to-pdf', icon: 'fa-file-pdf', title: 'Excel to PDF', desc: 'Convert Excel (XLSX) spreadsheets to professional PDF documents easily.', iconClass: 'convert' },
      ]
    },
    {
      title: '🔄 Convert PDF',
      subtitle: 'Transform your PDFs to different formats',
      tools: [
        { id: 'pdf-to-powerpoint', icon: 'fa-file-powerpoint', title: 'PDF to PowerPoint', desc: 'Convert PDF files to editable PowerPoint (PPTX) presentations instantly.', iconClass: 'convert' },
        { id: 'powerpoint-to-pdf', icon: 'fa-file-pdf', title: 'PowerPoint to PDF', desc: 'Convert PowerPoint (PPTX) presentations to high-quality PDFs instantly.', iconClass: 'convert' },
        { id: 'pdf-to-jpg', icon: 'fa-image', title: 'PDF to JPG', desc: 'Convert PDF pages to high-resolution JPG images online.', iconClass: 'convert' },
        { id: 'jpg-to-pdf', icon: 'fa-images', title: 'JPG to PDF', desc: 'Convert JPG images to PDF files quickly and securely.', iconClass: 'convert' },
      ]
    },
    {
      title: '🛠 Organize & Protect PDF',
      subtitle: 'Professional tools to manage your documents',
      tools: [
        { id: 'split', icon: 'fa-scissors', title: 'Split PDF', desc: 'Extract specific pages from your PDF file instantly.', iconClass: 'split' },
        { id: 'rotate', icon: 'fa-sync', title: 'Rotate PDF', desc: 'Rotate PDF pages to the correct orientation easily.', iconClass: 'rotate' },
        { id: 'unlock', icon: 'fa-unlock', title: 'Unlock PDF', desc: 'Remove password protection from secured PDF files online.', iconClass: 'unlock' },
        { id: 'protect', icon: 'fa-lock', title: 'Protect PDF', desc: 'Add password protection to your PDF documents securely.', iconClass: 'protect' },
      ]
    }
  ]

  // Flatten all tools for search
  const allTools = toolSections.flatMap(section => section.tools)
  
  // Filter tools based on search query
  const filteredTools = allTools.filter(tool => 
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // If searching, show filtered results in a single grid
  if (searchQuery) {
    return (
      <section id="tools" className="tools-section">
        <div className="container">
          <div className="search-results-header">
            <h2>Search Results for "{searchQuery}"</h2>
            <p>{filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="tools-grid">
            {filteredTools.map((tool, toolIndex) => (
              <article 
                key={tool.id} 
                className="tool-card" 
                style={{ animationDelay: `${toolIndex * 0.1}s` }}
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

  // Default view with sections
  return (
    <section id="tools" className="tools-section">
      <div className="container">
        <header className="tools-header">
          <h2>All PDF Tools - Free & Online</h2>
          <p>Convert, edit, merge, split, compress PDF files online. No watermark, secure, works on mobile.</p>
        </header>
        
        {toolSections.map((section, index) => (
          <div key={index} className={`tool-section-group ${index === 0 ? 'popular-section' : ''}`}>
            <div className="section-header">
              <h3 className="section-title">{section.title}</h3>
              <p className="section-subtitle">{section.subtitle}</p>
            </div>
            <div className="tools-grid">
              {section.tools.map((tool, toolIndex) => (
                <article 
                  key={tool.id} 
                  className="tool-card" 
                  style={{ animationDelay: `${toolIndex * 0.1}s` }}
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
          </div>
        ))}
      </div>
    </section>
  )
}
