import { createPublicClient } from '@/lib/supabase/public-client'
import { notFound } from 'next/navigation'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import Link from 'next/link'
import { MapPin, Clock, DollarSign, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'

interface JobPosting {
  id: string
  title: string
  location: string | null
  employment_type: string | null
  salary_range: string | null
  description: string | null
  requirements: string[] | null
  status: string
  created_at: string
  updated_at: string
}

type PageProps = { params: Promise<{ id: string }> }

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id')
    .eq('status', 'active')

  if (!jobs || jobs.length === 0) {
    return [{ id: 'none' }]
  }

  return jobs.map((job: { id: string }) => ({ id: job.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  if (id === 'none') return { title: 'Careers | KALKI OS' }

  const supabase = createPublicClient()
  const { data: job } = await supabase
    .from('job_postings')
    .select('*')
    .eq('id', id)
    .single() as { data: JobPosting | null }

  if (!job) return { title: 'Job Not Found' }
  return { title: `${job.title} — KALKI OS Careers` }
}

async function getJob(id: string): Promise<JobPosting | null> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('job_postings')
    .select('*')
    .eq('id', id)
    .single() as { data: JobPosting | null }
  return data
}

async function JobDetailContent({ id }: { id: string }) {
  if (id === 'none') notFound()
  const job = await getJob(id)
  if (!job) notFound()

  return (
    <>
      <Link href="/careers" className="text-cyan-400/60 hover:text-cyan-400 text-sm font-mono flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Careers
      </Link>
      <div className="mt-6 space-y-6">
        <h1 className="text-4xl font-bold text-white font-mono">{job.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-cyan-400/40 font-mono">
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location || 'Indore, MP'}</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.employment_type || 'Full-time'}</span>
          {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{job.salary_range}</span>}
        </div>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg">Description</h2>
          <p className="text-cyan-400/60 mt-2 leading-relaxed">{job.description || 'No description provided.'}</p>
        </div>
        {job.requirements && job.requirements.length > 0 && (
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
            <h2 className="text-white font-bold text-lg">Requirements</h2>
            <ul className="list-disc list-inside text-cyan-400/60 mt-2 space-y-1">
              {job.requirements.map((req: string) => <li key={req}>{req}</li>)}
            </ul>
          </div>
        )}
        <div className="text-center">
          <Link href={`/careers/apply?job=${job.id}`}>
            <LuxuryButton variant="primary" size="lg" label="Apply Now" />
          </Link>
        </div>
      </div>
    </>
  )
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<div className="text-cyan-400/40 text-center py-20 font-mono">Loading job details...</div>}>
      <JobDetailContent id={id} />
    </Suspense>
  )
}
