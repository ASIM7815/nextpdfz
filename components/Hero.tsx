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
          <div className="hero-badge">Welcome to PDFZ 👋</div>
          <h1 className="hero-title">Free Online PDF Converter & Editor - No Watermark</h1>
          <p className="hero-subtitle">
            Convert PDF to Word, Excel, PowerPoint online free. Merge PDF, split PDF, compress PDF, and edit PDF securely in your browser. No watermark, works on mobile, completely free. Best alternative to Adobe Acrobat.
          </p>
          <div className="hero-features">
            <div className="hero-feature-item">
              <i className="fas fa-shield-alt"></i>
              <span>100% Secure</span>
            </div>
            <div className="hero-feature-item">
              <i className="fas fa-bolt"></i>
              <span>Lightning Fast</span>
            </div>
            <div className="hero-feature-item">
              <i className="fas fa-infinity"></i>
              <span>Unlimited Use</span>
            </div>
          </div>
          <div className="hero-cta">
            <a onClick={() => scrollToSection('tools')} className="btn-hero-primary">
              <i className="fas fa-rocket"></i> Get Started Free
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
