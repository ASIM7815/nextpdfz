'use client'

import { useState } from 'react'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="logo">
          <i className="fas fa-file-pdf"></i>
          <span>PDFZ</span>
        </div>
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <a onClick={() => scrollToSection('tools')}>Tools</a>
          <a onClick={() => scrollToSection('features')}>Features</a>
        </div>
        <div className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </div>
      </div>
    </nav>
  )
}
