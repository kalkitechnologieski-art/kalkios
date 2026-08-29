import { Suspense } from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { SparkleButton } from '@/components/ui/SparkleButton'
import AEOContent from '@/components/AEOContent'
import ServiceCard from '@/components/ui/ServiceCard'
import { fetchServices } from '@/lib/services'

// ── Metadata (unchanged) ──
export const metadata: Metadata = {
  metadataBase: new URL('https://kalkios.com'),
  title: {
    default: 'KALKI OS – Enterprise AI & Digital Services | India\'s Premier Tech Temple',
    template: '%s | KALKI OS',
  },
  description: 'AI-powered digital marketing, web & app development, social media, and automation services for Indian businesses. Trusted by 500+ clients.',
  keywords: ['AI services India', 'digital marketing agency Indore', 'web development India', 'app development India', 'social media marketing', 'AI automation', 'lead generation', 'business growth', 'Indore', 'Madhya Pradesh'],
  authors: [{ name: 'KALKI Intelligence', url: 'https://kalkios.com' }],
  openGraph: {
    title: 'KALKI OS – AI & Digital Services for Indian Enterprises',
    description: 'Accelerate your business with AI-powered solutions.',
    url: 'https://kalkios.com',
    siteName: 'KALKI OS – Temple of Technology',
    images: [{ url: 'https://kalkios.com/images/og-image.jpg', width: 1200, height: 630, alt: 'KALKI OS' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KALKI OS – Enterprise AI & Digital Services',
    description: 'India\'s future-built digital solutions.',
    images: ['https://kalkios.com/images/twitter-card.jpg'],
  },
  alternates: { canonical: 'https://kalkios.com' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  verification: { google: 'your-google-verification-code' },
  other: {
    'geo.region': 'IN-MP',
    'geo.placename': 'Indore',
    'geo.position': '22.7196;75.8577',
    'ICBM': '22.7196, 75.8577',
    'business:contact_data:address': '52, Swastik Nagar, Indore, Madhya Pradesh 452002',
    'business:contact_data:phone': '+91-98765-43210',
    'business:contact_data:email': 'team@kalki-intelligence.in',
  },
}

// ── JSON-LD ──
function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'KALKI Intelligence',
        url: 'https://kalkios.com',
        logo: 'https://kalkios.com/images/logo.svg',
        description: 'Enterprise AI and digital services provider based in Indore, India.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '52, Swastik Nagar',
          addressLocality: 'Indore',
          addressRegion: 'MP',
          postalCode: '452002',
          addressCountry: 'IN',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-98765-43210',
          contactType: 'sales',
          availableLanguage: ['English', 'Hindi'],
        },
        sameAs: [
          'https://www.facebook.com/kalkiintelligence',
          'https://twitter.com/kalki_intel',
          'https://linkedin.com/company/kalki-intelligence',
        ],
        openingHours: 'Mo-Fr 09:00-18:00',
      },
      {
        '@type': 'WebSite',
        url: 'https://kalkios.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://kalkios.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Service',
        name: 'AI & Digital Services',
        description: 'Comprehensive digital solutions: web development, app development, social media marketing, graphic design, video editing, AI automation, and custom dashboards.',
        provider: { '@type': 'Organization', name: 'KALKI Intelligence' },
        areaServed: { '@type': 'Country', name: 'India' },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Digital Services',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Web Development' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'App Development' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Social Media Marketing' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'AI Automation' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Graphic Design' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Video Production' } },
          ],
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What services does KALKI OS offer?',
            acceptedAnswer: { '@type': 'Answer', text: 'We offer web development, app development, social media marketing, graphic design, video editing, AI automation, and custom dashboards.' },
          },
          {
            '@type': 'Question',
            name: 'Where is KALKI OS located?',
            acceptedAnswer: { '@type': 'Answer', text: 'We are based in Indore, Madhya Pradesh, India.' },
          },
          {
            '@type': 'Question',
            name: 'How long does a project take?',
            acceptedAnswer: { '@type': 'Answer', text: 'Typical delivery is 30-60 days.' },
          },
        ],
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ── HOMEPAGE ──
export default async function Homepage() {
  const services = await fetchServices()
  const featured = services.slice(0, 6)

  return (
    <>
      <JsonLd />

      {/* ─── 1. Hero ─── */}
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
            <SparkleButton href="/marketplace" size="lg">
              Explore Services
            </SparkleButton>
            <SparkleButton href="/chat" size="lg" className="bg-cyan-600/90 hover:bg-cyan-700 shadow-[0_0_2em_rgba(0,200,255,0.5)] hover:shadow-[0_0_3em_rgba(0,200,255,0.7)]">
              Chat with Siddhi
            </SparkleButton>
          </div>
          <div className="mt-4 md:mt-6 flex flex-wrap justify-center gap-4 md:gap-6 text-[10px] md:text-xs text-white/30">
            <span>🚀 500+ Clients</span>
            <span>🇮🇳 Indore, India</span>
            <span>⭐ 4.8/5 Rating</span>
          </div>
        </div>
      </section>

      {/* ─── 2. Trust Bar ─── */}
      <section className="py-4 md:py-6 border-y border-white/5 bg-white/5">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-4 md:gap-8 lg:gap-12 text-xs md:text-sm text-white/40">
          <span className="flex items-center gap-2">✓ Trusted by 500+ businesses</span>
          <span className="flex items-center gap-2">✓ 30‑60 day delivery</span>
          <span className="flex items-center gap-2">✓ AI‑powered solutions</span>
          <span className="flex items-center gap-2">✓ 24/7 support</span>
        </div>
      </section>

      {/* ─── 3. Services Overview ─── */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="text-center mb-6 md:mb-8 lg:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white font-mono">Our Services</h2>
          <p className="text-cyan-400/40 text-sm md:text-base mt-1 md:mt-2 max-w-2xl mx-auto">
            Comprehensive digital solutions tailored for Indian businesses.
          </p>
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
          <SparkleButton href="/marketplace" size="md">
            View All Services
          </SparkleButton>
        </div>
      </section>

      {/* ─── 4. Why KALKI OS ─── */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12 lg:py-16 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white font-mono">Why KALKI OS?</h2>
            <p className="text-white/60 text-sm md:text-base mt-2 md:mt-4 leading-relaxed">
              We combine cutting‑edge AI with local expertise to deliver results that matter for Indian businesses.
            </p>
            <ul className="mt-4 md:mt-6 space-y-2 md:space-y-3 text-white/40 text-xs md:text-sm">
              <li className="flex items-start gap-3"><span className="text-cyan-400">✓</span> AI‑powered strategy for maximum ROI</li>
              <li className="flex items-start gap-3"><span className="text-cyan-400">✓</span> Dedicated team of experts</li>
              <li className="flex items-start gap-3"><span className="text-cyan-400">✓</span> Transparent pricing with no hidden costs</li>
              <li className="flex items-start gap-3"><span className="text-cyan-400">✓</span> 100% client satisfaction guarantee</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center hover:border-cyan-500/30 transition">
              <div className="text-2xl md:text-3xl font-bold text-cyan-400">500+</div>
              <div className="text-[10px] md:text-xs text-white/40 mt-1">Clients</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center hover:border-purple-500/30 transition">
              <div className="text-2xl md:text-3xl font-bold text-purple-400">50+</div>
              <div className="text-[10px] md:text-xs text-white/40 mt-1">Team Members</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center hover:border-pink-500/30 transition">
              <div className="text-2xl md:text-3xl font-bold text-pink-400">20+</div>
              <div className="text-[10px] md:text-xs text-white/40 mt-1">Countries</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center hover:border-blue-500/30 transition">
              <div className="text-2xl md:text-3xl font-bold text-blue-400">100%</div>
              <div className="text-[10px] md:text-xs text-white/40 mt-1">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Industries ─── */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12 lg:py-16 border-t border-white/5">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center font-mono">Industries We Serve</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mt-4 md:mt-6 lg:mt-8">
          {['Astrology', 'Real Estate', 'E‑commerce', 'Retail', 'FinTech', 'Healthcare', 'Education', 'Fitness', 'Fashion', 'Technology', 'SaaS', 'Manufacturing'].map(ind => (
            <div key={ind} className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-4 text-center text-white/70 text-[10px] md:text-sm hover:border-cyan-500/30 transition hover:bg-white/10 cursor-default">
              {ind}
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6. Metrics ─── */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12 lg:py-16 border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
          <div className="p-4 rounded-xl hover:bg-white/5 transition">
            <div className="text-2xl md:text-4xl font-bold text-cyan-400">₹10Cr+</div>
            <div className="text-[10px] md:text-xs text-white/40 mt-1">Revenue Generated</div>
          </div>
          <div className="p-4 rounded-xl hover:bg-white/5 transition">
            <div className="text-2xl md:text-4xl font-bold text-purple-400">2.5M+</div>
            <div className="text-[10px] md:text-xs text-white/40 mt-1">Leads Generated</div>
          </div>
          <div className="p-4 rounded-xl hover:bg-white/5 transition">
            <div className="text-2xl md:text-4xl font-bold text-pink-400">15K+</div>
            <div className="text-[10px] md:text-xs text-white/40 mt-1">Social Posts</div>
          </div>
          <div className="p-4 rounded-xl hover:bg-white/5 transition">
            <div className="text-2xl md:text-4xl font-bold text-blue-400">4.8★</div>
            <div className="text-[10px] md:text-xs text-white/40 mt-1">Avg Rating</div>
          </div>
        </div>
      </section>

      {/* ─── 7. Testimonials ─── */}
      <section className="max-w-4xl mx-auto px-4 py-8 md:py-12 lg:py-16 border-t border-white/5">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center font-mono">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6 lg:mt-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 hover:border-cyan-500/30 transition hover:bg-white/10">
            <p className="text-white/60 text-xs md:text-sm">"KALKI OS transformed our online presence. Our sales tripled within 3 months."</p>
            <div className="mt-3 md:mt-4 text-cyan-400/80 text-xs md:text-sm font-medium">— Rajesh Sharma, CEO, AstroVeda</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 hover:border-cyan-500/30 transition hover:bg-white/10">
            <p className="text-white/60 text-xs md:text-sm">"The AI chatbot they built handles 80% of our customer queries. Game changer."</p>
            <div className="mt-3 md:mt-4 text-cyan-400/80 text-xs md:text-sm font-medium">— Priya Patel, Founder, RealtyHub</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 hover:border-cyan-500/30 transition hover:bg-white/10">
            <p className="text-white/60 text-xs md:text-sm">"Incredible design and development work. Our app got 50K downloads in week 1."</p>
            <div className="mt-3 md:mt-4 text-cyan-400/80 text-xs md:text-sm font-medium">— Ankit Verma, CTO, EduTech India</div>
          </div>
        </div>
      </section>

      {/* ─── 8. FAQ ─── */}
      <section className="max-w-4xl mx-auto px-4 py-8 md:py-12 lg:py-16 border-t border-white/5">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center font-mono">Frequently Asked Questions</h2>
        <div className="mt-4 md:mt-6 lg:mt-8 space-y-3 md:space-y-4">
          <details className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/30 transition">
            <summary className="flex items-center justify-between p-3 md:p-4 cursor-pointer text-white font-medium hover:text-cyan-400 transition text-xs md:text-sm">
              What services do you offer?
              <span className="text-white/30 group-open:rotate-180 transition">▼</span>
            </summary>
            <div className="px-3 md:px-4 pb-3 md:pb-4 text-white/60 text-xs md:text-sm leading-relaxed">
              Web development, mobile app development, social media marketing, graphic design, video editing, AI automation, and custom dashboards.
            </div>
          </details>
          <details className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/30 transition">
            <summary className="flex items-center justify-between p-3 md:p-4 cursor-pointer text-white font-medium hover:text-cyan-400 transition text-xs md:text-sm">
              Where is KALKI OS located?
              <span className="text-white/30 group-open:rotate-180 transition">▼</span>
            </summary>
            <div className="px-3 md:px-4 pb-3 md:pb-4 text-white/60 text-xs md:text-sm leading-relaxed">
              We are headquartered in Indore, Madhya Pradesh, India.
            </div>
          </details>
          <details className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/30 transition">
            <summary className="flex items-center justify-between p-3 md:p-4 cursor-pointer text-white font-medium hover:text-cyan-400 transition text-xs md:text-sm">
              How long does a project take?
              <span className="text-white/30 group-open:rotate-180 transition">▼</span>
            </summary>
            <div className="px-3 md:px-4 pb-3 md:pb-4 text-white/60 text-xs md:text-sm leading-relaxed">
              Typical delivery is 30‑60 days, depending on complexity.
            </div>
          </details>
          <details className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/30 transition">
            <summary className="flex items-center justify-between p-3 md:p-4 cursor-pointer text-white font-medium hover:text-cyan-400 transition text-xs md:text-sm">
              Do you offer custom solutions?
              <span className="text-white/30 group-open:rotate-180 transition">▼</span>
            </summary>
            <div className="px-3 md:px-4 pb-3 md:pb-4 text-white/60 text-xs md:text-sm leading-relaxed">
              Yes, we specialize in tailor‑made solutions. Contact us for a custom quote.
            </div>
          </details>
        </div>
      </section>

      {/* ─── 9. Final CTA ─── */}
      <section className="max-w-4xl mx-auto px-4 py-8 md:py-12 lg:py-16 text-center">
        <div className="glass-strong rounded-2xl md:rounded-3xl p-6 md:p-12 border-white/5 relative overflow-hidden group hover:border-cyan-500/30 transition">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition duration-700" />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-4 relative z-10">Ready to Elevate Your Business?</h2>
          <p className="text-white/60 text-sm md:text-lg mb-4 md:mb-6 max-w-2xl mx-auto relative z-10">
            Let Siddhi guide you to the perfect digital solution. Start with a free consultation.
          </p>
          <SparkleButton href="/chat" size="lg">
            Get Started Now
          </SparkleButton>
        </div>
      </section>

      {/* ─── 10. AEO Content ─── */}
      <AEOContent
        title="KALKI OS – Enterprise AI & Digital Services for India"
        answer="KALKI OS provides AI-powered web development, mobile app development, social media marketing, design, and automation services for Indian businesses. Based in Indore, we serve clients across India and globally."
        faqs={[
          { question: 'What is KALKI OS?', answer: 'KALKI OS is an AI-powered digital services platform offering web development, app development, marketing, design, and AI automation.' },
          { question: 'How does Siddhi AI work?', answer: 'Siddhi is our AI concierge that understands your business needs and recommends the best services through conversation.' },
          { question: 'What industries do you serve?', answer: 'We serve astrology, real estate, e-commerce, retail, fintech, healthcare, education, fitness, fashion, technology, SaaS, and more.' },
        ]}
      />

      {/* ─── 11. Footer ─── */}
      <footer className="border-t border-white/5 py-6 md:py-8 text-center text-white/30 text-xs md:text-sm">
        <p>© {new Date().getFullYear()} KALKI Intelligence. All rights reserved.</p>
        <p className="mt-1">Built with ❤️ in Indore, India</p>
      </footer>
    </>
  )
}
