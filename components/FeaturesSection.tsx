export default function FeaturesSection() {
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
      </div>
    </section>
  )
}
