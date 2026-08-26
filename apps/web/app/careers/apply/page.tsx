'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function ApplyContent() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('job')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (jobId) {
      supabase
        .from('job_postings')
        .select('title')
        .eq('id', jobId)
        .single()
        .then(({ data }: { data: { title: string } | null }) => {
          setJobTitle(data?.title || '')
        })
    }
  }, [jobId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let resumeUrl = ''
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const { error } = await supabase.storage.from('resumes').upload(fileName, resumeFile)
        if (error) throw error
        resumeUrl = fileName
      }
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: jobId || null,
          applicant_name: name,
          applicant_email: email,
          applicant_phone: phone || null,
          cover_letter: coverLetter || null,
          resume_url: resumeUrl || null,
          status: 'pending',
        })
      if (insertError) throw insertError
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Application failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white">Application Submitted!</h2>
        <p className="text-cyan-400/40 mt-2">We'll be in touch shortly.</p>
        <Link href="/careers" className="text-cyan-400 hover:text-cyan-300 text-sm font-mono mt-6 inline-block">
          ← Back to Careers
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/careers" className="text-cyan-400/60 hover:text-cyan-400 text-sm font-mono flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Careers
      </Link>
      <h1 className="text-3xl font-bold text-white font-mono mt-6">
        Apply for {jobTitle || 'this position'}
      </h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          required
          className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional)"
          className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono"
        />
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Cover Letter (optional)"
          rows={4}
          className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono resize-none"
        />
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
          className="w-full text-cyan-400/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-mono file:bg-cyan-600/20 file:text-cyan-400 hover:file:bg-cyan-600/30"
        />
        {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 shadow-[0_0_30px_rgba(0,255,255,0.2)] hover:shadow-[0_0_40px_rgba(0,255,255,0.3)] px-6 py-3 text-base min-w-[120px]"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="text-cyan-400/40 text-center py-20 font-mono">Loading...</div>}>
      <ApplyContent />
    </Suspense>
  )
}
