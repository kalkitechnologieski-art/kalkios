import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { AEOContent } from '@/components/AEOContent'
import { AIFAQChat } from '@/components/home/AIFAQChat'
import Link from 'next/link'
import { 
  TrendingUp, Sparkles, Shield, Zap, 
  Building, Users, Globe, CheckCircle,
  Code, Brain, BarChart3, Rocket,
  ChevronRight, Star
} from 'lucide-react'

// ── Features data ──
const features = [
  { icon: Brain, title: 'AI-Powered Intelligence', desc: 'Siddhi AI understands your needs and recommends solutions in real-time.' },
  { icon: Code, title: 'Enterprise Development', desc: 'Custom web, mobile, and enterprise applications built with cutting-edge tech.' },
  { icon: BarChart3, title: 'Data Analytics', desc: 'Predictive insights and data-driven strategies to grow your business.' },
  { icon: Rocket, title: 'Digital Marketing', desc: 'SEO, social media, and content marketing that delivers measurable results.' },
]

const services = [
  { id: '1', name: 'Enterprise SEO', category: 'Marketing', icon: '📈', description: 'Rank #1 on Google', price: 50000 },
  { id: '2', name: 'AI Chatbot Development', category: 'AI', icon: '🤖', description: 'Custom LLM chatbot', price: 75000 },
  { id: '3', name: 'E-commerce Website', category: 'Development', icon: '🛒', description: 'Full online store', price: 100000 },
  { id: '4', name: 'Predictive Analytics', category: 'Data', icon: '📊', description: 'AI-driven forecasting', price: 80000 },
  { id: '5', name: 'Social Media Marketing', category: 'Marketing', icon: '📱', description: 'Grow your audience', price: 40000 },
  { id: '6', name: 'Mobile App Development', category: 'Development', icon: '📲', description: 'iOS & Android apps', price: 120000 },
]

const faqs = [
  { question: 'What is KALKI OS?', answer: 'KALKI OS is an AI-powered digital services marketplace offering premium marketing, development, and cognitive solutions for enterprises.' },
  { question: 'How does the AI concierge work?', answer: 'Siddhi, our quantum pendulum AI, understands your needs through conversation and recommends the perfect service package.' },
  { question: 'What services are available?', answer: 'We offer Enterprise SEO, AI Development, E-commerce, Social Media Marketing, Predictive Analytics, and Mobile App Development.' },
]

export default function Homepage() {
  return (
    <>
      {/* ─── H1 Hero ─── */}
      <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden bg-gradient-to-br from-cyan-900/20 via-black to-purple-900/20 flex items-center justify-center">
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-2xl animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                <span className="text-3xl font-black text-white">KI</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-7xl font-bold text-white font-mono leading-tight">
            KALKI Intelligence
          </h1>
          <p className="text-cyan-400/60 text-lg md:text-xl mt-4 font-light max-w-2xl mx-auto">
            AI-Powered Digital Services for the Future of Business
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/chat"><LuxuryButton variant="primary" size="lg" label="Chat with Siddhi" icon={<Sparkles className="w-4 h-4" />} iconPosition="right" /></Link>
            <Link href="/marketplace"><LuxuryButton variant="secondary" size="lg" label="Explore Services" /></Link>
          </div>
        </div>
      </div>

      {/* ─── H2: Features Section ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <ScrollReveal direction="up">
          <h2 className="text-3xl font-bold text-white font-mono text-center mb-4">Why Choose KALKI OS</h2>
          <p className="text-white/40 text-center max-w-2xl mx-auto mb-12">Enterprise-grade AI solutions designed to scale your business</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-6 text-center hover:border-cyan-500/30 transition group">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/20 transition">
                  <f.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-white font-bold text-lg">{f.title}</h3>
                <p className="text-white/40 text-sm mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ─── H2: Services ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <ScrollReveal direction="up">
          <h2 className="text-3xl font-bold text-white font-mono text-center mb-4">Our Services</h2>
          <p className="text-white/40 text-center max-w-2xl mx-auto mb-12">Comprehensive digital solutions powered by AI</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((s) => (
              <Link key={s.id} href="/marketplace" className="group bg-white/5 border border-white/5 hover:border-cyan-500/30 rounded-xl overflow-hidden transition hover:bg-white/10">
                <div className="aspect-square bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center relative">
                  <span className="text-6xl opacity-30">{s.icon}</span>
                  <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-xs px-2 py-1 rounded">{s.category}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium text-sm mt-1 line-clamp-2 group-hover:text-cyan-400 transition">{s.name}</h3>
                  <p className="text-cyan-400/40 text-xs mt-1">{s.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white font-bold">₹{s.price.toLocaleString()}</span>
                    <span className="text-xs text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">Learn More</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ─── H3: About KALKI Intelligence ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <ScrollReveal direction="up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-3xl font-bold text-white font-mono">About KALKI Intelligence</h3>
              <p className="text-white/60 text-lg mt-4 leading-relaxed">
                We are India's future – a collective of innovators, engineers, and visionaries building the next generation of digital solutions.
              </p>
              <p className="text-white/40 mt-4">
                We deliver <span className="text-cyan-400">Digital Marketing</span>, <span className="text-purple-400">AI Automations</span>, <span className="text-pink-400">Data Analytics</span>, and <span className="text-blue-400">Development</span> services to enterprises worldwide.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm flex items-center gap-1"><CheckCircle className="w-3 h-3 text-cyan-400" /> AI-Powered</span>
                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm flex items-center gap-1"><CheckCircle className="w-3 h-3 text-cyan-400" /> Enterprise-Grade</span>
                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm flex items-center gap-1"><CheckCircle className="w-3 h-3 text-cyan-400" /> 24/7 Support</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-6 text-center"><Building className="w-8 h-8 text-cyan-400 mx-auto mb-3" /><h4 className="text-white font-bold">500+</h4><p className="text-white/40 text-sm">Clients</p></div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-6 text-center"><Users className="w-8 h-8 text-purple-400 mx-auto mb-3" /><h4 className="text-white font-bold">50+</h4><p className="text-white/40 text-sm">Team Members</p></div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-6 text-center"><Globe className="w-8 h-8 text-pink-400 mx-auto mb-3" /><h4 className="text-white font-bold">20+</h4><p className="text-white/40 text-sm">Countries</p></div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-6 text-center"><Zap className="w-8 h-8 text-blue-400 mx-auto mb-3" /><h4 className="text-white font-bold">100%</h4><p className="text-white/40 text-sm">Satisfaction</p></div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── H2: AI FAQ Chat Section ─── */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/5">
        <ScrollReveal direction="up">
          <h2 className="text-3xl font-bold text-white font-mono text-center mb-4">AI-Powered FAQ</h2>
          <p className="text-white/40 text-center max-w-2xl mx-auto mb-8">Get instant answers with Siddhi — our quantum AI concierge</p>
          <AIFAQChat />
        </ScrollReveal>
      </section>

      {/* ─── H2: FAQ (AEO) ─── */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/5">
        <ScrollReveal direction="up">
          <h2 className="text-3xl font-bold text-white font-mono text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden transition hover:border-purple-500/30">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-white font-medium hover:text-purple-400 transition text-sm">
                  <span>{faq.question}</span>
                  <span className="text-white/30 group-open:rotate-180 transition">▼</span>
                </summary>
                <div className="px-4 pb-4 text-white/60 text-sm leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ─── H2: CTA ─── */}
      <ScrollReveal direction="up">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="glass-strong rounded-3xl p-12 border-white/5 relative overflow-hidden">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Elevate Your Business?</h2>
            <p className="text-white/60 text-lg mb-6 max-w-2xl mx-auto">Let Siddhi guide you to the perfect digital solution.</p>
            <Link href="/chat">
              <LuxuryButton variant="primary" size="lg" label="Get Started Now" icon={<Sparkles className="w-4 h-4" />} iconPosition="right" />
            </Link>
          </div>
        </div>
      </ScrollReveal>

      <AEOContent title="KALKI OS — Enterprise AI Services" answer="KALKI OS provides enterprise-grade AI and digital services." faqs={faqs.slice(0, 3)} />
    </>
  )
}
