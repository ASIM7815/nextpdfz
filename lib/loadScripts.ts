export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

export async function loadAllPDFLibraries(): Promise<void> {
  const scripts = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  ]

  for (const src of scripts) {
    await loadScript(src)
  }
  
  // Wait a bit for libraries to initialize
  await new Promise(resolve => setTimeout(resolve, 100))
}

export function checkLibrariesLoaded(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    (window as any).PDFLib &&
    (window as any).jspdf &&
    (window as any).pdfjsLib &&
    (window as any).JSZip
  )
}
