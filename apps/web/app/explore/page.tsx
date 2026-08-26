'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Mic, X, ArrowRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'

type Service = Database['public']['Tables']['services']['Row']

declare global { interface Window { webkitSpeechRecognition: any; SpeechRecognition: any } }

const suggestions = ['Enterprise SEO', 'AI Chatbot Development', 'E‑commerce Website', 'Social Media Marketing', 'Predictive Analytics', 'Mobile App Development']

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('services')
        .select('*')
        .or(`name.ilike.%${searchQuery}%, description.ilike.%${searchQuery}%, category.ilike.%${searchQuery}%`)
        .eq('is_active', true)
        .limit(20)
      setResults((data || []) as Service[])
    } catch (e) {
      console.error('Search error:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    // Set new timer
    debounceTimer.current = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, performSearch])

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice search not supported.'); return }
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = false
    rec.interimResults = false
    setIsListening(true)
    rec.start()
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript
      setQuery(t)
      setIsListening(false)
      inputRef.current?.focus()
    }
    rec.onerror = () => setIsListening(false)
  }

  return (
    <div className="max-w-3xl mx-auto py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3"><Sparkles className="w-8 h-8 text-purple-400" /><div><h1 className="text-3xl font-bold text-white">Explore Services</h1><p className="text-white/40 text-sm">AI-powered search across our entire catalog</p></div></div>
      <div className="relative group"><div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl blur-xl opacity-20 group-focus-within:opacity-60 transition" /><div className="relative flex items-center bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50"><Search className="ml-4 w-5 h-5 text-white/40 flex-shrink-0" /><input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Type or speak what you need..." className="w-full bg-transparent py-4 px-3 text-white placeholder-white/30 outline-none text-base" />{query && <button onClick={() => setQuery('')} className="p-2 mr-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-white/40" /></button>}<button onClick={startVoice} className={`p-2 mr-2 rounded-full transition ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/10 text-white/60'}`}><Mic className="w-5 h-5" fill={isListening ? 'currentColor' : 'none'} /></button></div></div>
      <div className="flex flex-wrap gap-2">{suggestions.map(k => <button key={k} onClick={() => setQuery(k)} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-purple-600/20 hover:border-purple-500/50 transition flex items-center gap-1">{k} <ArrowRight className="w-3 h-3 opacity-50" /></button>)}</div>
      {loading && <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /><span className="ml-3 text-white/40">Searching...</span></div>}
      {!loading && results.length === 0 && query && <div className="text-center py-12"><div className="text-4xl mb-3">🔍</div><p className="text-white/40">No services found for &quot;{query}&quot;</p></div>}
      {results.length > 0 && <div className="grid gap-3 mt-2">{results.map(s => <Link key={s.id} href={`/services/${s.category}/${s.slug}`} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition group"><div className="text-3xl">{s.icon || '📦'}</div><div className="flex-1"><h3 className="text-white font-medium group-hover:text-purple-400 transition">{s.name}</h3><p className="text-white/40 text-sm">{s.category} • {s.description?.slice(0, 60) || 'Premium service'}</p></div><div className="text-right"><p className="text-white font-bold">₹{s.price?.toLocaleString()}</p><span className="text-xs text-white/30 group-hover:text-white/60 transition">View →</span></div></Link>)}</div>}
    </div>
  )
}
