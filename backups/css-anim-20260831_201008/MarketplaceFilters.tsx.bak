'use client'

import { useState, useCallback, useRef } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => { fn(...args); timeoutRef.current = null }, delay)
    },
    [fn, delay]
  ) as T
  return debouncedFn
}

export default function MarketplaceFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const updateSearch = useDebounce((value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('q', value)
    else params.delete('q')
    router.push(`/marketplace?${params.toString()}`)
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    updateSearch(e.target.value)
  }

  return (
    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative flex-1 md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="AI‑powered search..."
          className="w-full bg-white/5 border border-cyan-500/10 rounded-xl px-10 py-2.5 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); updateSearch('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <button
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="p-2.5 bg-white/5 border border-cyan-500/10 rounded-xl text-white/60 hover:text-white transition"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>
    </div>
  )
}
