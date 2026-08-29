'use client'

import { Search, X } from 'lucide-react'
import { useState } from 'react'

interface ChatSearchProps {
  onSearch: (query: string) => void
  className?: string
}

export function ChatSearch({ onSearch, className = '' }: ChatSearchProps) {
  const [query, setQuery] = useState('')

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    onSearch(e.target.value)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search messages..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
