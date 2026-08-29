import { Metadata } from 'next'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Building, Users, Globe, Zap, Award, Clock, Sparkles, Shield, BarChart3, Code, Rocket } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About KALKI Intelligence — Temple of Technology',
  description: 'KALKI Intelligence is India\'s future – a team of innovators delivering Digital Marketing, AI Automation, Data Analytics, and Development services.',
  keywords: 'about, KALKI Intelligence, AI, digital marketing, India, Indore, technology',
}

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <ScrollReveal direction="up">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
            About KALKI Intelligence
          </h1>
          <p className="text-cyan-400/40 text-lg mt-4 max-w-2xl mx-auto font-mono">
            Temple of Technology — Building India's Future
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up">
        <div className="bg-white/5 border border-cyan-500/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white font-mono">We are India's Future</h2>
              <p className="text-white/60 text-lg mt-4 leading-relaxed">
                KALKI Intelligence is a collective of innovators, engineers, and visionaries 
                dedicated to building the next generation of digital solutions. We deliver 
                <span className="text-cyan-400"> Digital Marketing</span>, 
                <span className="text-purple-400"> AI Automation</span>, 
                <span className="text-pink-400"> Data Analytics</span>, and 
                <span className="text-blue-400"> Development</span> services to enterprises worldwide.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollReveal direction="up">
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 text-center hover:border-cyan-500/30 transition">
            <Building className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <h4 className="text-white font-bold">500+</h4>
            <p className="text-cyan-400/40 text-sm">Clients Worldwide</p>
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 text-center hover:border-cyan-500/30 transition">
            <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h4 className="text-white font-bold">50+</h4>
            <p className="text-cyan-400/40 text-sm">Team Members</p>
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 text-center hover:border-cyan-500/30 transition">
            <Globe className="w-8 h-8 text-pink-400 mx-auto mb-3" />
            <h4 className="text-white font-bold">20+</h4>
            <p className="text-cyan-400/40 text-sm">Countries</p>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal direction="up">
        <div className="bg-white/5 border border-cyan-500/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white font-mono text-center mb-8">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <Rocket className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold">Innovation</h4>
                <p className="text-cyan-400/40 text-sm">Pushing boundaries with cutting-edge technology</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Award className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold">Excellence</h4>
                <p className="text-cyan-400/40 text-sm">Delivering world-class solutions</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold">Integrity</h4>
                <p className="text-cyan-400/40 text-sm">Building trust with every client</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Zap className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold">Speed</h4>
                <p className="text-cyan-400/40 text-sm">Delivering results faster</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up">
        <div className="bg-gradient-to-br from-cyan-600/10 to-purple-600/10 border border-cyan-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Ready to Work Together?</h2>
          <p className="text-cyan-400/40 mt-2">Let's build the future together.</p>
          <Link href="/contact">
            <LuxuryButton variant="primary" size="lg" label="Get in Touch" className="mt-6" />
          </Link>
        </div>
      </ScrollReveal>
    </div>
  )
}
