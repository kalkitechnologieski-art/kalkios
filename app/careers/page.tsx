import { createClient } from '@/lib/supabase/server'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import Link from 'next/link'
import { Briefcase, MapPin, Clock, DollarSign, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers at KALKI OS — Join the Temple of Technology',
  description: 'Explore career opportunities at KALKI OS in Indore, MP. Join our AI, development, and digital marketing teams. Apply today!',
  keywords: 'careers, jobs, KALKI OS, AI jobs, development jobs, Indore, Madhya Pradesh',
  openGraph: {
    title: 'Careers at KALKI OS — Temple of Technology',
    description: 'Join our team of innovators. Explore open positions and apply now.',
  },
}

export default async function CareersPage() {
  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('job_postings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const typedJobs = (jobs || []) as any[]

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <ScrollReveal direction="up">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
            Join the Temple of Technology
          </h1>
          <p className="text-cyan-400/40 text-lg mt-4 max-w-2xl mx-auto font-mono">
            Build the future with KALKI OS. We're hiring innovators in Indore, MP.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white/5 border border-cyan-500/10 rounded-xl text-center">
          <Briefcase className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
          <h3 className="text-white font-bold">Cutting‑edge AI</h3>
          <p className="text-cyan-400/40 text-sm">Work with quantum technology</p>
        </div>
        <div className="p-6 bg-white/5 border border-cyan-500/10 rounded-xl text-center">
          <Users className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
          <h3 className="text-white font-bold">Flexible Culture</h3>
          <p className="text-cyan-400/40 text-sm">Remote & hybrid options</p>
        </div>
        <div className="p-6 bg-white/5 border border-cyan-500/10 rounded-xl text-center">
          <DollarSign className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
          <h3 className="text-white font-bold">Competitive Pay</h3>
          <p className="text-cyan-400/40 text-sm">Top-tier compensation</p>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-white font-mono mb-6 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-cyan-400" />
          Open Positions
        </h2>
        {typedJobs.length === 0 ? (
          <div className="text-cyan-400/30 text-center py-12 font-mono">No open positions at the moment. Check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {typedJobs.map((job) => (
              <div key={job.id} className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 hover:border-cyan-500/30 transition">
                <h3 className="text-white font-bold text-lg">{job.title}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-cyan-400/40 font-mono">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location || 'Indore, MP'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.employment_type || 'Full-time'}</span>
                  {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary_range}</span>}
                </div>
                <p className="text-cyan-400/60 text-sm mt-3 line-clamp-2">{job.description}</p>
                <Link href={`/careers/${job.id}`} className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition">
                  Apply Now →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <ScrollReveal direction="up">
        <div className="bg-gradient-to-br from-cyan-600/10 to-purple-600/10 border border-cyan-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Don't see the right role?</h2>
          <p className="text-cyan-400/40 mt-2">Send us your resume anyway. We're always looking for great talent.</p>
          <LuxuryButton
            variant="primary"
            size="lg"
            label="Submit General Application"
            className="mt-6"
            onClick={() => window.location.href = '/careers/apply'}
          />
        </div>
      </ScrollReveal>
    </div>
  )
}
