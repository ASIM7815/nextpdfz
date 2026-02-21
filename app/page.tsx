'use client'

import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import ToolsSection from '@/components/ToolsSection'
import FeaturesSection from '@/components/FeaturesSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <ToolsSection />
      <FeaturesSection />
      <Footer />
    </>
  )
}
