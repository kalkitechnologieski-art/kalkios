'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { CinematicHero } from '@/components/ui/CinematicHero'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { AEOContent } from '@/components/AEOContent'
import Link from 'next/link'
import {
  Star,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  Users,
  Briefcase,
  Rocket,
  Shield,
  Globe,
  Layers,
  Cpu,
  Infinity,
  Crown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// ============================================================
// SECTION: Cyberpunk Stats Counter with safe entries[0]
// ============================================================
function CyberpunkCounter({ target, label, suffix = '+' }: { target: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          let start = 0
          const duration = 2000
          const step = Math.max(1, Math.floor(target / (duration / 16)))
          const interval = setInterval(() => {
            start += step
            if (start >= target) {
              setCount(target)
              clearInterval(interval)
            } else {
              setCount(start)
            }
          }, 16)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="text-center group">
      <div className="text-4xl font-bold text-white group-hover:text-cyan-300 transition font-mono">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-cyan-400/40 text-sm mt-1 tracking-wider">{label}</div>
    </div>
  )
}

// ============================================================
// SECTION: Service Card with Cyberpunk Hover
// ============================================================
function ServiceCard({ service }: { service: Service }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!cardRef.current) return
    const card = cardRef.current
    const tl = gsap.timeline({ paused: true })
    tl.to(card, { scale: 1.03, borderColor: 'rgba(0,255,255,0.3)', boxShadow: '0 0 30px rgba(0,255,255,0.1)', duration: 0.3 })
    tl.to(card.querySelector('.glow-hover'), { opacity: 1, duration: 0.3 }, 0)

    card.addEventListener('mouseenter', () => tl.play())
    card.addEventListener('mouseleave', () => tl.reverse())
  }, [])

  return (
    <Link href={`/services/${service.category}/${service.slug}`}>
      <div
        ref={cardRef}
        className="relative bg-white/5 border border-white/5 rounded-xl overflow-hidden transition-all duration-300 group"
      >
        <div className="glow-hover absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 pointer-events-none" />
        <div className="aspect-square bg-gradient-to-br from-cyan-900/20 to-purple-900/20 flex items-center justify-center relative">
          <span className="text-6xl opacity-30">{service.icon || '📦'}</span>
          <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-cyan-300 text-xs px-2 py-1 rounded flex items-center gap-1 border border-cyan-500/20">
            <Star className="w-3 h-3 fill-cyan-400 text-cyan-400" />
            {service.rating || '4.5'}
          </span>
        </div>
        <div className="p-4">
          <p className="text-xs text-cyan-400/60 uppercase tracking-wider">{service.category}</p>
          <h3 className="text-white font-medium text-sm mt-1 line-clamp-2 group-hover:text-cyan-300 transition">
            {service.name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-white font-bold">₹{service.price?.toLocaleString()}</span>
            <span className="text-xs text-cyan-400 ml-auto border border-cyan-500/20 px-2 py-0.5 rounded-full">In Stock</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ============================================================
// MAIN: Cyberpunk Luxury Homepage
// ============================================================
export default function Homepage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .limit(6)
        setServices((data || []) as Service[])
      } catch (e) {
        setServices([
          { id: '1', name: 'Enterprise SEO', slug: 'enterprise-seo', category: 'Marketing', description: 'Rank #1 on Google', price: 50000, icon: '📈', rating: 4.8, review_count: 120, is_active: true } as any,
          { id: '2', name: 'AI Chatbot Development', slug: 'ai-chatbot', category: 'AI', description: 'Custom LLM chatbot', price: 75000, icon: '🤖', rating: 4.9, review_count: 85, is_active: true } as any,
          { id: '3', name: 'E-commerce Website', slug: 'ecommerce-website', category: 'Development', description: 'Full online store', price: 100000, icon: '🛒', rating: 4.7, review_count: 210, is_active: true } as any,
          { id: '4', name: 'Social Media Marketing', slug: 'social-media-marketing', category: 'Marketing', description: 'Dominate social media', price: 30000, icon: '📢', rating: 4.6, review_count: 95, is_active: true } as any,
          { id: '5', name: 'Predictive Analytics', slug: 'predictive-analytics', category: 'AI', description: 'Data-driven forecasts', price: 90000, icon: '📊', rating: 4.8, review_count: 67, is_active: true } as any,
          { id: '6', name: 'Mobile App Development', slug: 'mobile-app-development', category: 'Development', description: 'iOS & Android apps', price: 150000, icon: '📱', rating: 4.9, review_count: 143, is_active: true } as any,
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [supabase])

  const faqs = [
    { question: 'What is KALKI OS?', answer: 'KALKI OS is an AI-powered digital services marketplace offering premium marketing, development, and cognitive solutions for enterprises.' },
    { question: 'How does the AI concierge work?', answer: 'Siddhi, our quantum pendulum AI, understands your needs through conversation and recommends the perfect service package for your business.' },
    { question: 'What services are available?', answer: 'We offer Enterprise SEO, AI Development, E-commerce Solutions, Social Media Marketing, Predictive Analytics, and Mobile App Development.' },
  ]

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-screen bg-gradient-to-br from-cyan-900/20 to-purple-900/20" />
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

      <section className="min-h-screen flex items-center justify-center border-t border-cyan-500/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 w-full relative z-10">
          <CyberpunkCounter target={500} label="Businesses Trust Us" />
          <CyberpunkCounter target={98} label="Satisfaction Rate" suffix="%" />
          <CyberpunkCounter target={48} label="Average Rating" />
          <CyberpunkCounter target={30} label="Expert Services" />
        </div>
      </section>

      <section className="min-h-[40vh] flex items-center justify-center border-t border-cyan-500/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-8 py-6">
          {[
            { icon: Award, label: 'Trusted by 500+ businesses' },
            { icon: Clock, label: 'Delivery in 30-60 days' },
            { icon: Sparkles, label: 'AI-powered matching' },
            { icon: Shield, label: '100% Secure' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-cyan-400/40 text-sm group hover:text-cyan-300 transition">
              <item.icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center border-t border-cyan-500/10">
        <div className="max-w-6xl mx-auto px-6 py-16 w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2 font-mono">
              <span className="text-cyan-400">$</span>
              Featured Services
              <span className="text-cyan-400/30 text-sm font-light ml-2 animate-pulse">█</span>
            </h2>
            <Link href="/marketplace" className="text-sm text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {services.length === 0 ? (
            <div className="text-center py-12 text-cyan-400/40">
              <p className="text-lg">No services available yet</p>
              <p className="text-sm mt-1">Check back soon for our curated offerings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center border-t border-cyan-500/10">
        <div className="max-w-6xl mx-auto px-6 py-16 w-full">
          <h2 className="text-3xl font-bold text-white text-center mb-12 flex items-center justify-center gap-2 font-mono">
            <Crown className="w-8 h-8 text-cyan-400" />
            <span className="text-cyan-400">//</span> Why Choose KALKI OS <span className="text-cyan-400">//</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Briefcase className="w-7 h-7 text-cyan-400" />, title: 'Curated Excellence', desc: 'Hand-picked services from verified experts.' },
              { icon: <Rocket className="w-7 h-7 text-cyan-400" />, title: 'Fast Delivery', desc: 'Results delivered in 30-60 days, guaranteed.' },
              { icon: <Users className="w-7 h-7 text-cyan-400" />, title: 'Dedicated Support', desc: 'Your success is our priority, 24/7.' },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 transition hover:bg-white/10 group">
                <div className="w-14 h-14 mx-auto bg-cyan-600/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                  {item.icon}
                </div>
                <h4 className="text-white font-bold text-lg">{item.title}</h4>
                <p className="text-cyan-400/40 text-sm mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center border-t border-cyan-500/10">
        <div className="max-w-6xl mx-auto px-6 py-16 w-full">
          <h2 className="text-3xl font-bold text-white text-center mb-12 flex items-center justify-center gap-2 font-mono">
            <Users className="w-8 h-8 text-cyan-400" />
            <span className="text-cyan-400">//</span> What Our Clients Say <span className="text-cyan-400">//</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', role: 'CEO, TechStart', text: 'KALKI OS transformed our digital presence. The AI chatbot increased our conversions by 40%.' },
              { name: 'Rahul Verma', role: 'Founder, EcomHub', text: 'The enterprise SEO service got us to #1 on Google in just 45 days. Incredible results.' },
              { name: 'Ananya Patel', role: 'CTO, DataWise', text: 'The predictive analytics solution gave us insights we never had before. Game-changer.' },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 transition hover:bg-white/10">
                <div className="flex gap-1 text-yellow-400 mb-3">★★★★★</div>
                <p className="text-white/70 text-sm">{t.text}</p>
                <p className="text-white font-medium mt-3">{t.name}</p>
                <p className="text-cyan-400/40 text-xs">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="min-h-[60vh] flex items-center justify-center border-t border-cyan-500/10">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center w-full">
          <div className="glass rounded-3xl p-12 border border-cyan-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-4">Ready to Elevate Your Business?</h3>
              <p className="text-cyan-400/60 text-lg mb-6 max-w-2xl mx-auto">
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
      </section>

      <section className="min-h-[60vh] flex items-center justify-center border-t border-cyan-500/10">
        <div className="max-w-6xl mx-auto px-6 py-16 w-full">
          <h2 className="text-3xl font-bold text-white text-center mb-12 flex items-center justify-center gap-2 font-mono">
            <Cpu className="w-8 h-8 text-cyan-400" />
            <span className="text-cyan-400">//</span> Powered by Enterprise Tech <span className="text-cyan-400">//</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Globe className="w-8 h-8" />, label: 'Global Scale' },
              { icon: <Shield className="w-8 h-8" />, label: 'Enterprise Security' },
              { icon: <Layers className="w-8 h-8" />, label: 'Modular Architecture' },
              { icon: <Infinity className="w-8 h-8" />, label: 'Infinite Scalability' },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 transition group">
                <div className="text-cyan-400 flex justify-center mb-2 group-hover:scale-110 transition">{item.icon}</div>
                <span className="text-cyan-400/60 text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="min-h-[60vh] flex items-center justify-center border-t border-cyan-500/10">
        <div className="w-full">
          <AEOContent
            title="Frequently Asked Questions"
            answer="KALKI OS provides enterprise-grade AI and digital services. Our quantum pendulum AI, Siddhi, helps you discover the perfect solution for your business needs."
            faqs={faqs}
          />
        </div>
      </section>
    </>
  )
}
