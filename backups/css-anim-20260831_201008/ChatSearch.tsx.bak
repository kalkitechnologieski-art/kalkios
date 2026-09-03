'use client'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

export function ChatSearch({ onSearch, className = '' }: { onSearch: (q: string) => void; className?: string }) {
  const [query, setQuery] = useState('')
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    onSearch(e.target.value)
  }
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search messages..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2 text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition text-sm"
      />
      {query && (
        <button onClick={() => { setQuery(''); onSearch('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
