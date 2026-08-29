'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CinematicHero } from '@/components/ui/CinematicHero'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { AEOContent } from '@/components/AEOContent'
import Link from 'next/link'
import { Star, TrendingUp, Award, Clock, Sparkles, ChevronRight, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.category}/${service.slug}`}
      className="group bg-white/5 border border-border hover:border-primary/30 rounded-xl overflow-hidden transition hover:bg-white/5"
    >
      <div className="aspect-square bg-gradient-to-br from-primary/10 to-purple-900/10 flex items-center justify-center relative">
        <span className="text-6xl opacity-30">{service.icon || '📦'}</span>
        <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-text-secondary text-xs px-2 py-1 rounded flex items-center gap-1">
          <Star className="w-3 h-3 fill-primary text-primary" />
          {service.rating || '4.5'}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs text-text-muted uppercase tracking-wider">{service.category}</p>
        <h3 className="text-text font-medium text-sm mt-1 line-clamp-2 group-hover:text-primary transition">
          {service.name}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-text font-bold">₹{service.price?.toLocaleString()}</span>
          <span className="text-xs text-green-400 ml-auto">In Stock</span>
        </div>
      </div>
    </Link>
  )
}

export default function Homepage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)
  const supabase = createClient()
  const isMounted = useRef(true)

  const fetchServices = useCallback(async () => {
    if (!isMounted.current) return
    try {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .limit(6)
      if (isMounted.current) {
        setServices((data || []) as Service[])
        setHasFetched(true)
        setLoading(false)
      }
    } catch (e) {
      if (isMounted.current) {
        setServices([
          { id: '1', name: 'Enterprise SEO', slug: 'enterprise-seo', category: 'Marketing', description: 'Rank #1 on Google', price: 50000, icon: '📈', rating: 4.8, review_count: 120, is_active: true } as any,
          { id: '2', name: 'AI Chatbot Development', slug: 'ai-chatbot', category: 'AI', description: 'Custom LLM chatbot', price: 75000, icon: '🤖', rating: 4.9, review_count: 85, is_active: true } as any,
          { id: '3', name: 'E-commerce Website', slug: 'ecommerce-website', category: 'Development', description: 'Full online store', price: 100000, icon: '🛒', rating: 4.7, review_count: 210, is_active: true } as any,
        ])
        setHasFetched(true)
        setLoading(false)
      }
    }
  }, [supabase])

  useEffect(() => {
    if (!hasFetched) {
      fetchServices()
    }
    return () => {
      isMounted.current = false
    }
  }, [fetchServices, hasFetched])

  const faqs = [
    { question: 'What is KALKI OS?', answer: 'KALKI OS is an AI-powered digital services marketplace offering premium marketing, development, and cognitive solutions for enterprises.' },
    { question: 'How does the AI concierge work?', answer: 'Siddhi, our quantum pendulum AI, understands your needs through conversation and recommends the perfect service package for your business.' },
    { question: 'What services are available?', answer: 'We offer Enterprise SEO, AI Development, E-commerce Solutions, Social Media Marketing, Predictive Analytics, and Mobile App Development.' },
  ]

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-[80vh] bg-gradient-to-br from-primary/10 to-blue-900/10 rounded-3xl" />
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <CinematicHero />

      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-wrap justify-center gap-8 border-t border-border">
        <div className="flex items-center gap-2 text-text-muted text-sm"><Award className="w-5 h-5 text-primary" /> Trusted by 500+ businesses</div>
        <div className="flex items-center gap-2 text-text-muted text-sm"><Clock className="w-5 h-5 text-primary" /> Delivery in 30-60 days</div>
        <div className="flex items-center gap-2 text-text-muted text-sm"><Sparkles className="w-5 h-5 text-primary" /> AI-powered matching</div>
        <div className="flex items-center gap-2 text-text-muted text-sm"><Shield className="w-5 h-5 text-primary" /> 100% Secure</div>
      </div>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <ScrollReveal direction="up">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-text flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Featured Services
            </h2>
            <Link href="/marketplace" className="text-sm text-primary hover:text-primary/80 transition flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      <ScrollReveal direction="up">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="glass-strong rounded-3xl p-12 border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-text mb-4">Ready to Elevate Your Business?</h3>
              <p className="text-text-secondary text-lg mb-6 max-w-2xl mx-auto">
                Let Siddhi guide you to the perfect digital solution. Start with a free consultation.
              </p>
              <LuxuryButton
                variant="primary"
                size="lg"
                label="Get Started Now"
                icon={<Sparkles className="w-4 h-4" />}
                iconPosition="right"
                onClick={() => { window.location.href = '/chat' }}
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      <AEOContent
        title="Frequently Asked Questions"
        answer="KALKI OS provides enterprise-grade AI and digital services. Our quantum pendulum AI, Siddhi, helps you discover the perfect solution for your business needs."
        faqs={faqs}
      />
    </>
  )
}
