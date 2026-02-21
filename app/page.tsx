'use client'

import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import ToolsSection from '@/components/ToolsSection'
import FeaturesSection from '@/components/FeaturesSection'
import Footer from '@/components/Footer'
import ToolModal from '@/components/ToolModal'
import { useState } from 'react'

export default function Home() {
  const [currentTool, setCurrentTool] = useState<string | null>(null)

  return (
    <>
      <Navbar />
      <Hero />
      <ToolsSection onToolClick={setCurrentTool} />
      <FeaturesSection />
      <Footer />
      <ToolModal currentTool={currentTool} onClose={() => setCurrentTool(null)} />
    </>
  )
}
