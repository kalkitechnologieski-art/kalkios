import { Metadata } from 'next'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { AnimatedHeadline } from '@/components/motion/AnimatedHeadline'
import { AnimatedEyebrow } from '@/components/motion/AnimatedEyebrow'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Clock, Zap, Award, Shield, Code, Rocket } from 'lucide-react'
import Link from 'next/link'
import { serviceHref } from '@/lib/services/href'
import { languageAlternates } from '@/lib/seo/site-url'
import { FAQStructuredData } from '@/components/seo/FAQStructuredData'
import { fetchTestimonials } from '@/lib/testimonials'
import { Testimonials } from '@/components/trust/Testimonials'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'About KALKI Intelligence',
  description:
    'KALKI Intelligence is an AI and development partner for astrologers, vastu consultants, spiritual practitioners, and businesses in every industry. Written scope, fixed price, ₹0 advance.',
  keywords:
    'KALKI Intelligence, Temple of technology, astrology website development, vastu consultant, AI development company, AI automation agency',
  alternates: languageAlternates('/about'),
}

export default async function AboutPage() {
  const testimonials = await fetchTestimonials(6)
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <ScrollReveal direction="up">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AnimatedEyebrow label="Temple of technology" />
          </div>
          <AnimatedHeadline
            as="h1"
            text="About KALKI Intelligence"
            className="text-4xl md:text-5xl font-bold font-mono"
            gradient
          />
          <p className="text-cyan-400/80 text-lg mt-4 max-w-2xl mx-auto font-mono">
            An AI and development tech partner for astrologers, vastu consultants, and businesses in every industry
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up">
        <div className="bg-white/5 border border-cyan-500/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white font-mono">What we do</h2>
              <p className="text-white/65 text-lg mt-4 leading-relaxed">
                KALKI Intelligence is a studio of engineers and designers. The office is in Indore. Delivery is remote and worldwide.
                The work is websites, marketing, AI automation and software for two audiences at once: astrologers, vastu consultants and other spiritual practitioners, and businesses in every other industry.
                The terms do not change with the industry: a written scope, a fixed price, ₹0 advance, and a person accountable for the quote.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm">Digital Marketing</span>
                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm">AI Automation</span>
                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm">Data Analytics</span>
                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm">Development</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-cyan-500/30">
                KI
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <section id="facts" className="scroll-mt-24">
        <h2 className="text-2xl font-bold text-white font-mono mb-4">Facts an answer engine can cite</h2>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          {[
            ['Legal name', 'KALKI Intelligence LLP'],
            ['Brand', 'KALKI Intelligence'],
            ['Tagline', 'Temple of technology'],
            ['Established', '2025'],
            ['Founder', 'Nikhil Singh'],
            ['Office', '52, MOG Lines, Swastik Nagar, Indore, Madhya Pradesh 452002, India'],
            ['Delivery', 'Remote, worldwide'],
            ['Commercial terms', 'Written scope, fixed price, ₹0 advance'],
          ].map(([term, detail]) => (
            <div key={term} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <dt className="text-cyan-300/80 text-xs uppercase tracking-wider">{term}</dt>
              <dd className="text-white/80 mt-1">{detail}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8">
          <FAQStructuredData
            questions={[
              {
                question: 'When was KALKI Intelligence established?',
                answer: 'KALKI Intelligence LLP was established in 2025. The founder is Nikhil Singh. The office is in Indore, and delivery is worldwide.',
              },
              {
                question: 'Who is the founder?',
                answer: 'Nikhil Singh is the founder. Project mail goes to ceo@kalki-intelligence.in. The company mail is team@kalki-intelligence.in.',
              },
              {
                question: 'Does the quote promise a ranking or an AI citation?',
                answer: 'No. The quote lists deliverables, a price, and a date. A ranking, a view count, and a citation in an AI answer are not part of it.',
              },
            ]}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollReveal direction="up">
          <div className="kalki-panel rounded-xl p-6 text-center hover:border-cyan-500/30 transition">
            <Clock className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <h4 className="text-white font-bold">Within 24 hours</h4>
            <p className="text-cyan-400/75 text-sm">Every brief gets a written quote</p>
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <div className="kalki-panel rounded-xl p-6 text-center hover:border-purple-500/30 transition">
            <Code className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h4 className="text-white font-bold">Founder-delivered</h4>
            <p className="text-cyan-400/75 text-sm">One line, one owner, no relay</p>
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <div className="kalki-panel rounded-xl p-6 text-center hover:border-pink-500/30 transition">
            <Shield className="w-8 h-8 text-pink-400 mx-auto mb-3" />
            <h4 className="text-white font-bold">₹0 to start</h4>
            <p className="text-cyan-400/75 text-sm">Fixed scope and price before any payment</p>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal direction="up">
        <div className="bg-white/5 border border-cyan-500/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white font-mono text-center mb-3">What we will not claim</h2>
          <p className="text-white/60 text-center max-w-3xl mx-auto leading-relaxed">
            KALKI Intelligence does not publish invented client counts, unverifiable ratings, award badges,
            ranking promises, or view counts. The studio is small, the office is in Indore, and the method is the
            thing we will put in writing: a scope, one owner, a fixed price, and reviews only from accounts on work that shipped.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/request">
              <LuxuryButton variant="cyber" size="sm" label="Test us with a real brief" />
            </Link>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up">
        <div>
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <AnimatedEyebrow label="How we operate" />
            </div>
            <AnimatedHeadline as="h2" text="Our Core Values" className="text-2xl font-bold text-white font-mono" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <Rocket className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold">Craft</h4>
                <p className="text-cyan-400/75 text-sm">Current, proven tooling — chosen for the brief, not for the label</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Award className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold">Accountability</h4>
                <p className="text-cyan-400/75 text-sm">One named owner per project, from quote to handover</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold">Integrity</h4>
                <p className="text-cyan-400/75 text-sm">The scope and price in writing are what you actually get</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Zap className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold">Speed</h4>
                <p className="text-cyan-400/75 text-sm">A written quote within 24 hours of your brief</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <section>
        <h2 className="text-2xl font-bold text-white font-mono text-center mb-6">Work you can open</h2>
        <ul className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto text-sm">
          {[
            ['Astrology website development', serviceHref({ category: 'Web Development', slug: 'astrology-website-development' })],
            ['SEO for astrologers', serviceHref({ category: 'Marketing', slug: 'seo-for-astrologers' })],
            ['Vastu consultant website', serviceHref({ category: 'Web Development', slug: 'vastu-consultant-website' })],
            ['Vastu consultant marketing', serviceHref({ category: 'Marketing', slug: 'vastu-consultant-marketing' })],
            ['WhatsApp Business API setup', serviceHref({ category: 'AI Automation', slug: 'whatsapp-business-api-setup' })],
            ['Omnichannel DM CRM', serviceHref({ category: 'Development', slug: 'omnichannel-dm-crm' })],
            ['AEO and GEO services', serviceHref({ category: 'Marketing', slug: 'aeo-geo-services' })],
            ['YouTube content for astrologers', serviceHref({ category: 'Media', slug: 'youtube-content-for-astrologers' })],
            ['AI automation for astrologers and businesses', serviceHref({ category: 'AI Automation', slug: 'ai-chatbot-automation' })],
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
      </section>

      <section id="testimonials" className="scroll-mt-24">
        <ScrollReveal direction="up">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-mono text-center mb-6">
            {testimonials.length > 0 ? 'What clients say' : 'How we work, in writing'}
          </h2>
          <Testimonials items={testimonials} />
        </ScrollReveal>
      </section>

      <ScrollReveal direction="up">
        <div className="bg-gradient-to-br from-cyan-600/10 to-purple-600/10 border border-cyan-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Ready to Work Together?</h2>
          <p className="text-cyan-400/75 mt-2">Send a brief — you get a written scope and price back within 24 hours.</p>
          <Link href="/request">
            <LuxuryButton variant="cyber" size="lg" label="Start a request" className="mt-6" />
          </Link>
        </div>
      </ScrollReveal>
    </div>
  )
}
