// == KALKI ENTERPRISE HOMEPAGE - SEO/AEO/GEO OPTIMIZED ==
// Industry-grade layout with comprehensive search engine optimization
// -----------------------------------------------------------------------------

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, Globe, Brain, Building2, TrendingUp, Clock, CheckCircle2, Sparkles, MapPin } from 'lucide-react'
import { fetchServices } from '@/lib/services'
import { categoryHref, serviceHref } from '@/lib/services/href'
import { INDUSTRY_HUBS } from '@/lib/services/phase3-services'
import { fetchTestimonials } from '@/lib/testimonials'
import ServiceCard from '@/components/ui/ServiceCard'
import { Testimonials } from '@/components/trust/Testimonials'
import { BannerSlideshow } from '@/components/home/BannerSlideshow'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { AnimatedHeadline } from '@/components/motion/AnimatedHeadline'
import { AnimatedEyebrow } from '@/components/motion/AnimatedEyebrow'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { CapabilityMarquee } from '@/components/motion/CapabilityMarquee'
import { buildHomepageMetadata } from '@/lib/seo/enhanced-metadata'
import { siteOrigin } from '@/lib/seo/site-url'
import { FAQStructuredData } from '@/components/seo/FAQStructuredData'
import { FAQ_PRESETS } from '@/lib/seo/faq-presets'
import type { Metadata } from 'next'

// Generate metadata for homepage (SEO)
export const metadata: Metadata = buildHomepageMetadata()

// Catalog and testimonials are read at build time; refresh them hourly without
// waiting on a deploy.
export const revalidate = 3600

export default async function Homepage() {
  const services = await fetchServices()
  const testimonials = await fetchTestimonials()
  const prioritySlugs = [
    'saas-mvp-development',
    'voice-ai-agent-development',
    'shopify-store-development',
    'rag-chatbot-development',
    'meta-ads-management',
    'clinic-booking-website',
    'whatsapp-commerce-catalog',
    'business-intelligence-dashboard',
  ]
  const featured = prioritySlugs
    .map((slug) => services.find((service) => service.slug === slug))
    .filter((service): service is (typeof services)[number] => Boolean(service))
  const shownServices = featured.length > 0 ? featured : services.slice(0, 8)
  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean))).sort()

  return (
    <>
      {/* JSON-LD Structured Data for Search Engines */}
      <script
        type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': 'https://www.kalki-intelligence.in/#website',
          name: 'KALKI Intelligence',
          url: siteOrigin(),
          description: 'KALKI Intelligence is an AI and development company for businesses in every industry. Studio in Indore. Delivery worldwide.',
          publisher: { '@id': 'https://www.kalki-intelligence.in/#organization' },
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteOrigin()}/explore?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }) }}
      />

      {/* Hero Section - AEO Optimized with Question Format */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden kalki-hero px-4">
        {/* Animated background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Brand badge */}
          <div className="flex justify-center mb-8">
            <AnimatedEyebrow label="Temple of technology" icon={<Sparkles className="w-3.5 h-3.5" />} />
          </div>

          <AnimatedHeadline
            as="h1"
            text="AI and development partner for businesses in every industry"
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-white font-mono leading-[1.05] tracking-tight"
            delay={0.1}
          />

          <AnimatedHeadline
            as="p"
            text="Websites, products, automation, data, and marketing. One catalog, chosen by the job."
            className="text-cyan-400/85 text-lg sm:text-xl md:text-2xl mt-4 md:mt-6 font-light max-w-3xl mx-auto"
            delay={0.42}
            stagger={0.03}
          />

          <p className="text-white/65 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
            Written scope, fixed price, ₹0 advance. AI-assisted, with a person accountable for the quote. Delivery is worldwide.
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

          {/* Stats bar - verifiable commitments, not invented metrics */}
          <div className="mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-xs md:text-sm text-white/55">
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-5 h-5 text-cyan-400/80" />
              <span className="font-semibold text-white">
                <AnimatedNumber to={24} suffix=" hours" />
              </span>
              <span>Quote turnaround</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Shield className="w-5 h-5 text-purple-400/80" />
              <span className="font-semibold text-white">₹0 to start</span>
              <span>Approve the quote first</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="w-5 h-5 text-pink-400/80" />
              <span className="font-semibold text-white">Fixed scope</span>
              <span>Every deliverable in writing</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MapPin className="w-5 h-5 text-green-400/80" />
              <span className="font-semibold text-white">Worldwide</span>
              <span>Remote delivery from Indore</span>
            </div>
          </div>
        </div>
      </section>

      {/* Prime banner slideshow — slim, horizontal, industry-grade */}
      <div className="py-8 md:py-10 -mt-10 relative z-20">
        <BannerSlideshow />
      </div>

      {/* Trust Bar */}
      <section className="py-6 md:py-8 border-y border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-6 md:gap-10 lg:gap-14 text-xs md:text-sm text-white/60">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400/80" />
            Fixed-scope quotes, ₹0 to start
          </span>
          <span className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-yellow-400/80" />
            AI-assisted, human-delivered
          </span>
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400/80" />
            A person owns the quote
          </span>
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-400/80" />
            Hindi &amp; English support
          </span>
        </div>
        {categories.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <CapabilityMarquee items={categories.slice(0, 12)} durationSec={38} />
          </div>
        )}
      </section>

      {/* Social proof */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16" id="testimonials">
        <div className="text-center mb-8 md:mb-10">
          <div className="flex justify-center mb-4">
            <AnimatedEyebrow label={testimonials.length > 0 ? 'Client voices' : 'Our guarantees'} />
          </div>
          <AnimatedHeadline
            as="h2"
            text={testimonials.length > 0 ? 'What clients say' : 'Why you can trust the quote'}
            className="text-2xl md:text-4xl font-bold text-white font-mono"
            inView
          />
          <p className="text-white/50 text-base md:text-lg mt-3 max-w-2xl mx-auto">
            {testimonials.length > 0
              ? 'Reviews left on projects that shipped.'
              : 'Everything below is something you can hold us to before you spend a rupee.'}
          </p>
        </div>
        <Testimonials items={testimonials} />
      </section>

      {/* Features Showcase - Entity-based content for GEO */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 md:mb-14">
          <div className="flex justify-center mb-4">
            <AnimatedEyebrow label="Why KALKI Intelligence" />
          </div>
          <AnimatedHeadline
            as="h2"
            text="Why teams hire KALKI Intelligence"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono"
            inView
          />
          <p className="text-cyan-400/70 text-base md:text-lg mt-3 max-w-2xl mx-auto">AI-assisted delivery and a named owner, for spiritual practices and for every other industry</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: Brain,
              title: 'AI-Powered Business Automation',
              desc: 'Siddhi AI concierge answers customer queries around the clock, SETU surfaces verified B2B leads from public sources, and workflows take the repeated steps off your team. We time-save the tasks you list, and show you which ones.',
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
              title: 'Security you can ask us about',
              desc: 'Data lives in Supabase with Postgres Row Level Security, so a user can only read their own rows. Secrets stay in server environment variables and never reach the browser. Access is per-project and logged.',
              color: 'purple',
              keywords: ['row level security', 'data protection', 'environment secrets'],
            },
            {
              icon: Globe,
              title: 'Infrastructure that grows with you',
              desc: 'Built on Next.js and Postgres from day one, so a launch-week site and a high-traffic catalog run on the same stack. Hosting, CDN and database tiers scale without a rewrite — you pay for the traffic you actually get.',
              color: 'green',
              keywords: ['scalable platform', 'Next.js', 'Postgres', 'startup solutions'],
            },
            {
              icon: TrendingUp,
              title: 'Growth work you can measure',
              desc: 'SEO, conversion and lead-nurturing work ships with the numbers attached — rankings, enquiries and traffic sources, reported to you in writing so you can see what the spend returned.',
              color: 'pink',
              keywords: ['ROI', 'business growth', 'conversion optimization', 'lead nurturing'],
            },
            {
              icon: Building2,
              title: 'A named owner, in English or Hindi',
              desc: 'One person is accountable from the quote to handover. The studio is in Indore and the work is remote. English is the default. Hindi is included when the quote says so.',
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
              <ScrollReveal key={idx} direction="up" delay={idx * 0.07} className="h-full">
                <div
                  className={`group relative h-full p-6 md:p-8 rounded-2xl bg-gradient-to-br ${colorMap[feature.color]} border backdrop-blur-sm hover:scale-105 transition-all duration-300`}
                >
                  <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5">
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white/80" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/65 text-sm md:text-base leading-relaxed">{feature.desc}</p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </section>

      {/* Services Overview - Product Schema */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 md:mb-14">
          <div className="flex justify-center mb-4">
            <AnimatedEyebrow label="What we deliver" icon={<Zap className="w-3.5 h-3.5" />} />
          </div>
          <AnimatedHeadline
            as="h2"
            text="Services for practices and every industry"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono"
            inView
          />
          <p className="text-cyan-400/70 text-base md:text-lg mt-3 max-w-2xl mx-auto">Web development, SEO and automation engagements with a written scope, a fixed price and a delivery date.</p>
        </div>
        <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><div className="animate-pulse bg-white/5 rounded-xl h-48" /></div>}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {shownServices.map(service => (
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
                {`View all ${services.length} services`}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
        </div>
      </section>

      {/* Browse by category — internal linking hub for SEO/AEO/GEO */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8 md:mb-10">
            <div className="flex justify-center mb-4">
              <AnimatedEyebrow label="Find it faster" />
            </div>
            <AnimatedHeadline
              as="h2"
              text="Browse Services by Category"
              className="text-2xl md:text-3xl font-bold text-white font-mono"
              inView
            />
            <p className="text-cyan-400/70 text-sm md:text-base mt-2 max-w-2xl mx-auto">
              {categories.length} categories, counted from the catalog, for practitioners and for every other industry.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {categories.map((c) => (
              <Link
                key={c}
                href={categoryHref(c)}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-cyan-500/10 hover:border-cyan-500/40 text-sm text-white/70 hover:text-cyan-200 transition"
              >
                {c} Services
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <AnimatedHeadline as="h2" text="Browse by industry" className="text-2xl md:text-3xl font-bold text-white font-mono" inView />
          <p className="text-cyan-400/70 text-sm mt-2 max-w-2xl mx-auto">Each hub is a different deliverable. Astrology and vastu are one hub.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {INDUSTRY_HUBS.map((hub) => (
            <Link key={hub.slug} href={`/industries/${hub.slug}`} className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 hover:text-cyan-200">
              {hub.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <AnimatedHeadline
              as="h2"
              text="For astrologers, vastu consultants, and every other business"
              className="text-3xl font-bold text-white mb-4"
              inView
              stagger={0.035}
            />
            <p className="text-white/70 mb-6">
              KALKI Intelligence keeps both offers on the same site. A practice can start with a website, search work, WhatsApp, or a video package. A business in any other field uses the same quote process and the rest of the catalog. The office is in Indore. The work is delivered remotely, worldwide.
            </p>
            <ul className="space-y-2 mb-6 text-sm">
              {[
                ['Astrology website development', serviceHref({ category: 'Web Development', slug: 'astrology-website-development' })],
                ['SEO for astrologers', serviceHref({ category: 'Marketing', slug: 'seo-for-astrologers' })],
                ['Vastu consultant website', serviceHref({ category: 'Web Development', slug: 'vastu-consultant-website' })],
                ['Vastu consultant marketing', serviceHref({ category: 'Marketing', slug: 'vastu-consultant-marketing' })],
                ['WhatsApp Business API setup', serviceHref({ category: 'AI Automation', slug: 'whatsapp-business-api-setup' })],
                ['Omnichannel DM CRM', serviceHref({ category: 'Development', slug: 'omnichannel-dm-crm' })],
                ['AEO and GEO services', serviceHref({ category: 'Marketing', slug: 'aeo-geo-services' })],
                ['YouTube content for astrologers', serviceHref({ category: 'Media', slug: 'youtube-content-for-astrologers' })],
                ['Custom AI agent development', serviceHref({ category: 'AI', slug: 'custom-ai-development' })],
                ['WhatsApp chatbot for business', serviceHref({ category: 'AI Chatbots', slug: 'whatsapp-chatbot-for-business' })],
                ['n8n workflow automation', serviceHref({ category: 'AI Automation', slug: 'n8n-workflow-automation' })],
                ['Astrology app development', serviceHref({ category: 'App Development', slug: 'astrology-app-development' })],
                ['Notes and articles', '/insights'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-cyan-300 hover:text-cyan-200">{label}</Link>
                </li>
              ))}
            </ul>
            <div className="mb-6 text-white/70 text-sm leading-relaxed">
              <p className="text-white font-semibold">KALKI INTELLIGENCE</p>
              <p>52, MOG Lines, Swastik Nagar, Indore, Madhya Pradesh 452002</p>
              <p>
                Phone{' '}
                <a href="tel:+916261031710" className="text-cyan-300 hover:text-cyan-200">
                  062610 31710
                </a>
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=KALKI+INTELLIGENCE+52+MOG+Lines+Swastik+Nagar+Indore"
                className="text-cyan-300 hover:text-cyan-200"
              >
                View on Google Maps
              </a>
            </div>
            <Link href="/contact">
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all">
                Contact the studio
              </button>
            </Link>
          </div>
          <div className="aspect-square bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl overflow-hidden">
            <iframe
              title="Map of KALKI INTELLIGENCE, 52 MOG Lines, Swastik Nagar, Indore"
              src="https://www.google.com/maps?q=KALKI+INTELLIGENCE,+52+MOG+Lines,+Swastik+Nagar,+Indore+452002&output=embed"
              loading="lazy"
              className="w-full h-full border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
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
          <div className="flex justify-center mb-5">
            <AnimatedEyebrow label="Next step" icon={<Sparkles className="w-3.5 h-3.5" />} />
          </div>
          <AnimatedHeadline
            as="h2"
            text="Ready to Grow Your Business with AI?"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono mb-4"
            inView
          />
          <p className="text-white/65 text-base md:text-lg mb-8 max-w-2xl mx-auto">Send us the brief — you get a written scope, a fixed price and a delivery date back within 24 hours. Nothing to pay to start.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/request">
              <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105">
                Get a written quote
              </button>
            </Link>
            <Link href="/chat">
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-white/90 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
                Talk to Siddhi AI
              </button>
            </Link>
          </div>
          <p className="text-white/55 text-sm mt-4">✓ No payment to enquire &nbsp; ✓ Written quote in 24 hours &nbsp; ✓ You approve before work starts</p>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
