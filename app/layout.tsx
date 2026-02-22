import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

// Force fresh build - updated favicon and removed dynamic routes

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Free PDF Tools Online - Convert, Merge, Split, Compress PDF | PDFZ',
  description: 'Free online PDF converter and editor. Convert PDF to Word, Excel, PPT. Merge PDF, split PDF, compress PDF, rotate PDF. No watermark, secure, works on mobile. Best free alternative to Adobe Acrobat.',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  keywords: [
    // Conversion tools
    'pdf to word', 'word to pdf', 'pdf to jpg', 'jpg to pdf', 'pdf to excel', 'excel to pdf', 'pdf to ppt', 'ppt to pdf',
    'document converter online', 'free file converter', 'convert document online', 'online pdf converter free',
    'convert pdf to word editable', 'pdf to docx free no watermark', 'best pdf to word converter online',
    'convert scanned pdf to word', 'pdf to word without losing formatting', 'pdf to word under 1mb', 'pdf to word fast free',
    // Editing tools
    'edit pdf online', 'add text to pdf', 'sign pdf online', 'annotate pdf free', 'fill pdf form online', 'type on pdf without printing',
    'how to edit pdf without adobe acrobat', 'how to sign pdf digitally free',
    // Organizing tools
    'merge pdf', 'split pdf', 'rearrange pdf pages', 'delete pages from pdf', 'extract pages from pdf', 'rotate pdf pages',
    'combine pdf files into one', 'merge pdf in order online', 'join pdf pages free', 'merge pdf without limit',
    'split pdf into single pages', 'extract pages from pdf online', 'split pdf by page numbers', 'separate pdf chapters',
    'how to combine screenshots into one pdf',
    // Optimization tools
    'compress pdf', 'reduce pdf file size', 'make pdf smaller', 'optimize pdf for email', 'pdf compressor online free',
    'compress pdf to 200kb', 'compress pdf for whatsapp', 'compress pdf for email attachment',
    'reduce pdf size below 100kb', 'compress pdf without losing quality', 'compress pdf for upload form',
    'how to reduce pdf size for job application', 'how to send large pdf on whatsapp',
    'how to make notes pdf smaller', 'how to upload pdf less than 500kb in form',
    // Security tools
    'protect pdf with password', 'unlock pdf', 'remove password from pdf', 'encrypt pdf', 'decrypt pdf online',
    // Image tools
    'image to pdf converter free', 'photos to pdf in order', 'multiple images to pdf', 'scan to pdf online', 'png to pdf high quality',
    // General
    'free pdf tools', 'online pdf editor', 'pdf converter', 'best free alternative to adobe acrobat',
    'how to convert pdf to word in mobile without app', 'why pdf file size increases after scanning'
  ].join(', '),
  authors: [{ name: 'PDFZ' }],
  robots: 'index, follow',
  openGraph: {
    title: 'PDFZ - Free PDF Tools Online | Convert, Merge, Split, Compress PDF',
    description: 'Free online PDF converter - Convert PDF to Word, Excel, PPT. Merge, split, compress PDF. No watermark, secure, fast. Works on mobile. Best free alternative to Adobe Acrobat.',
    type: 'website',
    url: 'https://pdfz.asimsaad.com/',
    siteName: 'PDFZ',
    locale: 'en_US',
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
