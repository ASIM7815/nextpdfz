import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

// Force fresh build - updated favicon and removed dynamic routes

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: 'Free PDF Tools Online - Convert, Merge, Split, Compress PDF | PDFZ',
  description: 'Free PDF tools online - Convert PDF to Word, Excel, PPT. Merge, split, compress PDF. No watermark, secure, mobile-friendly.',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  keywords: 'pdf to word, word to pdf, merge pdf, split pdf, compress pdf, pdf to excel, pdf to jpg, free pdf tools',
  authors: [{ name: 'PDFZ' }],
  robots: 'index, follow',
  openGraph: {
    title: 'PDFZ - Free PDF Tools Online | Convert, Merge, Split, Compress PDF',
    description: 'Free online PDF converter - Convert PDF to Word, Excel, PPT. Merge, split, compress PDF. No watermark, secure, fast. Works on mobile. Best free alternative to Adobe Acrobat.',
    type: 'website',
    url: 'https://pdfz.asimsaad.com/',
    siteName: 'PDFZ',
    locale: 'en_US',
    images: [
      {
        url: 'https://pdfz.asimsaad.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PDFZ - Free PDF Tools Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDFZ - Free PDF Tools Online | No Watermark',
    description: 'Convert PDF to Word, Excel, PPT. Merge, split, compress PDF online free. Secure, fast, works on mobile.',
  },
  alternates: {
    canonical: 'https://pdfz.asimsaad.com/',
  },
  other: {
    'google-site-verification': 'your-verification-code-here',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="_O3lEjhavcM1E7PLtfB2Jw1hCBQQ_EQVLUCtnIm0RRI" />
        
        {/* Preconnect for faster loading */}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js" defer></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" defer></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pizzip/3.1.4/pizzip.min.js" defer></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.37.11/docxtemplater.min.js" defer></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js" defer></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" defer></script>
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "PDFZ - Free PDF Tools Online",
              "url": "https://pdfz.asimsaad.com",
              "description": "Free online PDF converter and editor. Convert PDF to Word, Excel, PPT. Merge, split, compress PDF. No watermark, secure, works on mobile.",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Convert PDF to Word",
                "Convert PDF to Excel",
                "Convert PDF to PowerPoint",
                "Merge PDF files",
                "Split PDF pages",
                "Compress PDF size",
                "Rotate PDF pages",
                "Protect PDF with password",
                "Unlock PDF",
                "Edit PDF online",
                "PDF to JPG converter",
                "JPG to PDF converter",
                "Word to PDF",
                "Excel to PDF",
                "PowerPoint to PDF"
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "15420"
              }
            })
          }}
        />
        
        {/* FAQ Schema for long-tail keywords */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How to convert PDF to Word in mobile without app?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use PDFZ free online PDF to Word converter. Open pdfz.asimsaad.com on your mobile browser, select PDF to Word tool, upload your PDF file, and download the converted Word document. No app installation required, works on any mobile device."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How to reduce PDF size for job application?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use PDFZ Compress PDF tool to reduce PDF file size. Upload your PDF, select compression level (200kb, 500kb, or custom), and download the compressed file. Perfect for job applications with file size limits."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How to send large PDF on WhatsApp?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Compress your PDF using PDFZ Compress PDF tool. Select 'Compress for WhatsApp' option to reduce file size below WhatsApp's 16MB limit while maintaining quality. Then send the compressed PDF via WhatsApp."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Best free alternative to Adobe Acrobat?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PDFZ is the best free alternative to Adobe Acrobat. It offers PDF conversion, merging, splitting, compression, editing, and protection tools - all free, online, with no watermark, and works on any device."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How to edit PDF without Adobe Acrobat?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use PDFZ Edit PDF tool for free. Upload your PDF, add text, images, or annotations directly in your browser. No Adobe Acrobat needed, completely free, and works on mobile and desktop."
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className={poppins.className}>{children}</body>
    </html>
  )
}
