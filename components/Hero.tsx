export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">PDFZ</div>
          <h1 className="hero-title">FREE PDF CONVERTER</h1>
          <h1 className="hero-title"> No Watermark • Easy to Use</h1>
          <p className="hero-subtitle">
Convert PDF to Word, Excel, PowerPoint and more in seconds. Merge, split and compress PDFs easily — fast, secure and mobile-friendly.          </p>
          <div className="hero-features">
            <div className="hero-feature-item">
              <i className="fas fa-shield-alt"></i>
              <span>Files are automatically deleted after processing. We never store your documents.</span>
            </div>
          </div>
          <div className="hero-cta">
            <a onClick={() => scrollToSection('tools')} className="btn-hero-primary">
              <i className="fas fa-rocket"></i> Convert Now
            </a>
            <a onClick={() => scrollToSection('features')} className="btn-hero-secondary">
              <i className="fas fa-play-circle"></i> Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
