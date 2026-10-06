// == KALKI ENTERPRISE HOMEPAGE - SEO/AEO/GEO OPTIMIZED ==
// Industry-grade layout with comprehensive search engine optimization
// -----------------------------------------------------------------------------

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, Globe, Brain, Building2, Users, TrendingUp, Award, Clock, CheckCircle2, Sparkles, Star, MapPin } from 'lucide-react'
import { fetchServices } from '@/lib/services'
import ServiceCard from '@/components/ui/ServiceCard'
import { buildHomepageMetadata } from '@/lib/seo/enhanced-metadata'
import { FAQStructuredData } from '@/components/seo/FAQStructuredData'
import { FAQ_PRESETS } from '@/lib/seo/faq-presets'
import type { Metadata } from 'next'

// Generate metadata for homepage (SEO)
export const metadata: Metadata = buildHomepageMetadata()

export default async function Homepage() {
  const services = await fetchServices()
  const featured = services.slice(0, 6)

  return (
    <>
      {/* JSON-LD Structured Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'KALKI OS',
          url: 'https://kalkios.com',
          description: 'India\'s leading AI platform for web development, SEO, and lead generation',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://kalkios.com/explore?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }) }}
      />

      {/* Hero Section - AEO Optimized with Question Format */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-slate-950 to-black px-4">
        {/* Animated background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Brand badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white/70 font-medium">KALKI Intelligence</span>
            </div>
          </div>

          {/* Main headline - SEO keyword rich + AEO question format */}
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent font-mono leading-tight tracking-tight">
            Best AI Platform for Indian Businesses
          </h1>
          
          <p className="text-cyan-400/70 text-lg sm:text-xl md:text-2xl mt-4 md:mt-6 font-light max-w-3xl mx-auto">
            Web Development, SEO & Lead Generation Services in Indore, Madhya Pradesh
          </p>
          
          <p className="text-white/50 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
            Serving 500+ businesses across India with AI-powered solutions starting at ₹499
          </p>

          {/* CTA buttons with structured intent */}
          <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/marketplace">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105">
                <span className="flex items-center gap-2">
                  Explore AI Services
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <Link href="/chat">
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-white/90 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
                Chat with Siddhi AI Assistant
              </button>
            </Link>
          </div>

          {/* Stats bar - E-E-A-T signals */}
          <div className="mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-xs md:text-sm text-white/40">
            <div className="flex flex-col items-center gap-1">
              <Users className="w-5 h-5 text-cyan-400/60" />
              <span className="font-semibold text-white/70">500+</span>
              <span>Clients Served Across India</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-5 h-5 text-purple-400/60" />
              <span className="font-semibold text-white/70">30-60 Days</span>
              <span>Fast Project Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Award className="w-5 h-5 text-pink-400/60" />
              <span className="font-semibold text-white/70">4.8/5 Rating</span>
              <span>Client Satisfaction</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MapPin className="w-5 h-5 text-green-400/60" />
              <span className="font-semibold text-white/70">🇮🇳 Indore, MP</span>
              <span>Made in India, Serving Nationally</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 md:py-8 border-y border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-6 md:gap-10 lg:gap-14 text-xs md:text-sm text-white/50">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400/60" />
            Trusted by 500+ Indian businesses
          </span>
          <span className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-yellow-400/60" />
            AI-powered automation
          </span>
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400/60" />
            Enterprise-grade quality
          </span>
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-400/60" />
            24/7 Hindi & English support
          </span>
        </div>
      </section>

      {/* Features Showcase - Entity-based content for GEO */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono">Why Choose KALKI OS for Your Business?</h2>
          <p className="text-cyan-400/50 text-base md:text-lg mt-3 max-w-2xl mx-auto">Enterprise-grade AI solutions built specifically for Indian businesses, startups, and enterprises</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: Brain,
              title: 'AI-Powered Business Automation',
              desc: 'Siddhi AI concierge handles customer queries 24/7, SETU generates verified B2B leads through intelligent web scraping, and smart workflows automate your operations. Reduce manual work by 80%.',
              color: 'cyan',
              keywords: ['AI automation', 'business automation', 'AI concierge', 'lead generation'],
            },
            {
              icon: Zap,
              title: 'Lightning Fast Web Development',
              desc: 'Professional web development, mobile apps, and digital solutions delivered in 30-60 days using Next.js, React, Node.js. Agile methodology ensures rapid deployment without compromising quality.',
              color: 'yellow',
              keywords: ['web development', 'mobile apps', 'fast delivery', 'Next.js'],
            },
            {
              icon: Shield,
              title: 'Enterprise Security & GDPR Compliance',
              desc: 'Bank-grade AES-256 encryption, Row Level Security policies, GDPR-compliant data handling, and regular security audits protect your business data 24/7. ISO 27001 standards.',
              color: 'purple',
              keywords: ['enterprise security', 'GDPR compliant', 'data protection', 'encryption'],
            },
            {
              icon: Globe,
              title: 'Scalable Cloud Infrastructure',
              desc: 'From solo entrepreneurs to Fortune 500 companies, our cloud-native platform scales with your business. AWS, Google Cloud, Azure integration. Pay only for what you use.',
              color: 'green',
              keywords: ['cloud infrastructure', 'scalable platform', 'AWS', 'startup solutions'],
            },
            {
              icon: TrendingUp,
              title: 'Proven 3x ROI in 6 Months',
              desc: 'Average 3x return on investment within 6 months. Data-driven SEO optimization, conversion rate improvement, and automated lead nurturing ensure continuous business growth.',
              color: 'pink',
              keywords: ['ROI', 'business growth', 'conversion optimization', 'lead nurturing'],
            },
            {
              icon: Building2,
              title: 'End-to-End Support in Hindi & English',
              desc: 'Dedicated project managers, 24/7 technical support in Hindi and English, comprehensive documentation, video tutorials, and knowledge base. Local team based in Indore.',
              color: 'blue',
              keywords: ['customer support', 'Hindi support', 'project management', 'Indore team'],
            },
          ].map((feature, idx) => {
            const Icon = feature.icon
            const colorMap: Record<string, string> = {
              cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
              yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
              purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
              green: 'from-green-500/20 to-green-600/20 border-green-500/30',
              pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
              blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
            }
            
            return (
              <div
                key={idx}
                className={`group relative p-6 md:p-8 rounded-2xl bg-gradient-to-br ${colorMap[feature.color]} border backdrop-blur-sm hover:scale-105 transition-all duration-300`}
              >
                <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5">
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-white/80" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm md:text-base leading-relaxed">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Services Overview - Product Schema */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono">Top AI-Powered Digital Services in India</h2>
          <p className="text-cyan-400/50 text-base md:text-lg mt-3 max-w-2xl mx-auto">Discover our most popular web development, SEO, and automation solutions for Indian businesses</p>
        </div>
        <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><div className="animate-pulse bg-white/5 rounded-xl h-48" /></div>}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map(service => (
              <div key={service.id} className="hover:scale-105 transition-transform duration-300">
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        </Suspense>
        <div className="text-center mt-8 md:mt-10">
          <Link href="/marketplace">
            <button className="group px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-white hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                View All 50+ Services
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
        </div>
      </section>

      {/* Local SEO Section - Indore Focus for GEO */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Leading AI & Web Development Company in Indore, Madhya Pradesh
            </h2>
            <p className="text-white/60 mb-6">
              Based in the heart of Indore's tech hub, KALKI Intelligence serves businesses across Madhya Pradesh and all of India. Our local presence means personalized service, face-to-face consultations, and deep understanding of Indian market dynamics.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-white/70">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5" />
                <span>Local team based in Indore, MP - Available for in-person meetings</span>
              </li>
              <li className="flex items-start gap-2 text-white/70">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5" />
                <span>Serving all major cities: Mumbai, Delhi, Bangalore, Pune, Hyderabad</span>
              </li>
              <li className="flex items-start gap-2 text-white/70">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5" />
                <span>Hindi and English support - We speak your language</span>
              </li>
              <li className="flex items-start gap-2 text-white/70">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5" />
                <span>Affordable pricing in INR starting at ₹499 - No hidden fees</span>
              </li>
            </ul>
            <Link href="/contact">
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all">
                Schedule Free Consultation in Indore
              </button>
            </Link>
          </div>
          <div className="aspect-square bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center">
            <MapPin className="w-32 h-32 text-cyan-400/30" />
          </div>
        </div>
      </section>

      {/* FAQ / AEO Content - Optimized for People Also Ask */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <FAQStructuredData 
          questions={FAQ_PRESETS.aiServices}
          className="max-w-4xl mx-auto"
        />
      </section>

      {/* CTA Section - Conversion Optimized */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono mb-4">Ready to Transform Your Business with AI?</h2>
          <p className="text-white/60 text-base md:text-lg mb-8 max-w-2xl mx-auto">Join 500+ Indian businesses already using KALKI OS. Get started today with a free consultation.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105">
                Start Free 14-Day Trial
              </button>
            </Link>
            <Link href="/chat">
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-white/90 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
                Talk to Siddhi AI
              </button>
            </Link>
          </div>
          <p className="text-white/40 text-sm mt-4">✓ No credit card required &nbsp; ✓ Free consultation &nbsp; ✓ Cancel anytime</p>
        </div>
      </section>
    </>
  )
}
