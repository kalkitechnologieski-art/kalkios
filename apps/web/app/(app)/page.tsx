import { Suspense } from 'react'
import Link from 'next/link'
import { SparkleButton } from '@/components/ui/SparkleButton'
import AEOContent from '@/components/AEOContent'
import ServiceCard from '@/components/ui/ServiceCard'
import { fetchServices } from '@/lib/services'
import { ArrowRight, Zap, Shield, Globe, Brain, Building2, Users, TrendingUp, Award, Clock } from 'lucide-react'

export default async function Homepage() {
  const services = await fetchServices()
  const featured = services.slice(0, 6)

  return (
    <>
      {/* Hero Section - Luxury Enterprise Design */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-slate-950 to-black px-4">
        {/* Animated background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-5" />
        
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Logo badge */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-cyan-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                <span className="text-3xl md:text-4xl font-black text-white">KI</span>
              </div>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono leading-tight tracking-tight">
            Temple of Technology
          </h1>
          
          <p className="text-cyan-400/70 text-lg sm:text-xl md:text-2xl mt-4 md:mt-6 font-light max-w-3xl mx-auto">
            AI‑Powered Digital Services for Indian Enterprises
          </p>
          
          <p className="text-white/50 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
            Web Development · Mobile Apps · Social Media · AI Automation · Design · Lead Generation
          </p>

          {/* CTA buttons */}
          <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/marketplace">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105">
                <span className="flex items-center gap-2">
                  Explore Services
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <Link href="/chat">
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-white/90 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
                Chat with Siddhi AI
              </button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-xs md:text-sm text-white/40">
            <div className="flex flex-col items-center gap-1">
              <Users className="w-5 h-5 text-cyan-400/60" />
              <span className="font-semibold text-white/70">500+</span>
              <span>Clients Served</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-5 h-5 text-purple-400/60" />
              <span className="font-semibold text-white/70">30-60 Days</span>
              <span>Delivery Time</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Award className="w-5 h-5 text-pink-400/60" />
              <span className="font-semibold text-white/70">4.8/5</span>
              <span>Client Rating</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Globe className="w-5 h-5 text-green-400/60" />
              <span className="font-semibold text-white/70">🇮🇳 Indore</span>
              <span>Made in India</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 md:py-8 border-y border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-6 md:gap-10 lg:gap-14 text-xs md:text-sm text-white/50">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400/60" />
            Trusted by 500+ businesses
          </span>
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400/60" />
            AI‑powered solutions
          </span>
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400/60" />
            Enterprise-grade quality
          </span>
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400/60" />
            24/7 support & monitoring
          </span>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono">Why Choose KALKI OS?</h2>
          <p className="text-cyan-400/50 text-base md:text-lg mt-3 max-w-2xl mx-auto">Enterprise-grade digital transformation powered by cutting-edge AI</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: Brain,
              title: 'Siddhi AI Assistant',
              desc: 'Intelligent AI concierge that understands your business needs and provides instant solutions.',
              color: 'cyan',
            },
            {
              icon: Zap,
              title: 'Lightning Fast Delivery',
              desc: '30-60 day turnaround with our streamlined development process and AI-powered workflows.',
              color: 'yellow',
            },
            {
              icon: Shield,
              title: 'Enterprise Security',
              desc: 'Bank-grade security with encrypted data, secure authentication, and compliance-ready infrastructure.',
              color: 'purple',
            },
            {
              icon: Globe,
              title: 'Global Standards',
              desc: 'World-class quality built in India, serving clients across the globe with 24/7 support.',
              color: 'green',
            },
            {
              icon: TrendingUp,
              title: 'Lead Generation',
              desc: 'AI-powered web scraping and lead discovery to grow your business pipeline automatically.',
              color: 'pink',
            },
            {
              icon: Building2,
              title: 'Scalable Architecture',
              desc: 'Built on modern cloud infrastructure that scales seamlessly as your business grows.',
              color: 'blue',
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

      {/* Services Overview */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono">Our Services</h2>
          <p className="text-cyan-400/50 text-base md:text-lg mt-3 max-w-2xl mx-auto">Comprehensive digital solutions tailored for Indian businesses</p>
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
                View All Services
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono mb-4">Ready to Transform Your Business?</h2>
          <p className="text-white/60 text-base md:text-lg mb-8 max-w-2xl mx-auto">Join 500+ enterprises already using KALKI OS to accelerate their digital growth</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105">
                Get Started Free
              </button>
            </Link>
            <Link href="/chat">
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-white/90 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
                Talk to Siddhi
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ / AEO Content */}
      <AEOContent
        title="KALKI OS – Enterprise AI & Digital Services for India"
        answer="KALKI OS provides AI-powered web development, mobile app development, social media marketing, design, automation, and lead generation services for Indian enterprises."
        faqs={[
          { question: 'What is KALKI OS?', answer: 'KALKI OS is an AI-powered digital services platform built in Indore, India, providing enterprise-grade solutions including web development, mobile apps, AI automation, and lead generation.' },
          { question: 'How does Siddhi AI work?', answer: 'Siddhi is our intelligent AI concierge that understands your business needs through natural conversation, provides instant answers, generates images/videos, finds leads, and orchestrates complex workflows across multiple AI providers.' },
          { question: 'What industries do you serve?', answer: 'We serve diverse industries including astrology, real estate, e-commerce, retail, fintech, healthcare, education, fitness, fashion, technology, SaaS, manufacturing, and professional services across India.' },
          { question: 'How fast can you deliver projects?', answer: 'Our streamlined AI-powered development process enables 30-60 day delivery for most projects, compared to industry standard of 3-6 months.' },
          { question: 'Do you offer lead generation services?', answer: 'Yes! Our AI-powered lead generation engine searches the web, scrapes company websites, extracts contact information, and delivers ready-to-use CSV files with verified leads.' },
        ]}
      />
    </>
  )
}
