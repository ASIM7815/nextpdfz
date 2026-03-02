'use client'

import { useRouter } from 'next/navigation'

export default function FeaturesSection() {
  const router = useRouter()
  
  const features = [
    { icon: 'fa-bolt', title: 'Lightning Fast', desc: 'Process files in seconds' },
    { icon: 'fa-lock', title: 'Secure', desc: 'Files deleted after 1 hour' },
    { icon: 'fa-mobile-alt', title: 'Mobile Friendly', desc: 'Works on any device' },
    { icon: 'fa-heart', title: 'Free Forever', desc: 'No hidden charges' },
  ]

  return (
    <section id="features" className="features-section">
      <div className="container">
        <h2>Why choose PDFZ?</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <i className={`fas ${feature.icon}`}></i>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '3rem', textAlign: 'center', lineHeight: '2' }}>
          <p style={{ fontSize: '1rem', color: '#666' }}>
            Popular tools: <a href="/tools/pdf-to-word" style={{ color: '#2563eb', textDecoration: 'underline' }}>PDF to Word</a> • <a href="/tools/merge" style={{ color: '#2563eb', textDecoration: 'underline' }}>Merge PDF</a> • <a href="/tools/compress" style={{ color: '#2563eb', textDecoration: 'underline' }}>Compress PDF</a> • <a href="/tools/split" style={{ color: '#2563eb', textDecoration: 'underline' }}>Split PDF</a> • <a href="/tools/pdf-to-excel" style={{ color: '#2563eb', textDecoration: 'underline' }}>PDF to Excel</a> • <a href="/tools/word-to-pdf" style={{ color: '#2563eb', textDecoration: 'underline' }}>Word to PDF</a> • <a href="/tools/protect" style={{ color: '#2563eb', textDecoration: 'underline' }}>Protect PDF</a> • <a href="/tools/unlock" style={{ color: '#2563eb', textDecoration: 'underline' }}>Unlock PDF</a>
          </p>
        </div>
      </div>
    </section>
  )
}
