import { Suspense } from 'react'
import Link from 'next/link'
import { SparkleButton } from '@/components/ui/SparkleButton'
import AEOContent from '@/components/AEOContent'
import ServiceCard from '@/components/ui/ServiceCard'
import { fetchServices } from '@/lib/services'

export default async function Homepage() {
  const services = await fetchServices()
  const featured = services.slice(0, 6)

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-cyan-900/20 via-black to-purple-900/20 px-4">
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10" />
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-pulse-glow">
              <span className="text-2xl md:text-3xl font-black text-white">KI</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono leading-tight">
            Temple of Technology
          </h1>
          <p className="text-cyan-400/60 text-base sm:text-lg md:text-xl mt-3 md:mt-4 font-light max-w-2xl mx-auto">
            AI‑Powered Digital Services for Indian Enterprises
          </p>
          <p className="text-white/40 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Web Development · Mobile Apps · Social Media · AI Automation · Design
          </p>
          <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-4">
            <SparkleButton href="/marketplace" size="lg">Explore Services</SparkleButton>
            <SparkleButton href="/chat" size="lg" className="bg-cyan-600/90 hover:bg-cyan-700">Chat with Siddhi</SparkleButton>
          </div>
          <div className="mt-4 md:mt-6 flex flex-wrap justify-center gap-4 md:gap-6 text-[10px] md:text-xs text-white/30">
            <span>🚀 500+ Clients</span>
            <span>🇮🇳 Indore, India</span>
            <span>⭐ 4.8/5 Rating</span>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-4 md:py-6 border-y border-white/5 bg-white/5">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-4 md:gap-8 lg:gap-12 text-xs md:text-sm text-white/40">
          <span className="flex items-center gap-2">✓ Trusted by 500+ businesses</span>
          <span className="flex items-center gap-2">✓ 30‑60 day delivery</span>
          <span className="flex items-center gap-2">✓ AI‑powered solutions</span>
          <span className="flex items-center gap-2">✓ 24/7 support</span>
        </div>
      </section>

      {/* Services Overview */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="text-center mb-6 md:mb-8 lg:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white font-mono">Our Services</h2>
          <p className="text-cyan-400/40 text-sm md:text-base mt-1 md:mt-2 max-w-2xl mx-auto">Comprehensive digital solutions tailored for Indian businesses.</p>
        </div>
        <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><div className="animate-pulse bg-white/5 rounded-xl h-48" /></div>}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {featured.map(service => (
              <div key={service.id} className="hover:scale-105 transition-transform duration-300">
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        </Suspense>
        <div className="text-center mt-6 md:mt-8">
          <SparkleButton href="/marketplace" size="md">View All Services</SparkleButton>
        </div>
      </section>

      {/* FAQ etc (shortened for brevity) */}
      <AEOContent
        title="KALKI OS – Enterprise AI & Digital Services for India"
        answer="KALKI OS provides AI-powered web development, mobile app development, social media marketing, design, and automation services."
        faqs={[
          { question: 'What is KALKI OS?', answer: 'KALKI OS is an AI-powered digital services platform.' },
          { question: 'How does Siddhi AI work?', answer: 'Siddhi is our AI concierge that understands your business needs.' },
          { question: 'What industries do you serve?', answer: 'We serve astrology, real estate, e-commerce, retail, fintech, healthcare, education, fitness, fashion, technology, SaaS, and more.' },
        ]}
      />
    </>
  )
}
