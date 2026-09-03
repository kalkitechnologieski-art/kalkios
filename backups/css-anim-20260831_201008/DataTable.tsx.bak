'use client'

import { useState, useMemo, ReactNode } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: any, row: T) => ReactNode
  sortable?: boolean
  searchable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  searchPlaceholder?: string
  itemsPerPage?: number
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  actions?: (row: T) => ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search...',
  itemsPerPage = 10,
  loading = false,
  emptyMessage = 'No data found.',
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        if (!col.searchable) return false
        const val = row[col.key as keyof T]
        if (val == null) return false
        return String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, columns])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find(c => c.key === sortKey)
    if (!col) return filtered
    const key = col.key as keyof T
    return [...filtered].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      // Handle null/undefined
      if (aVal == null) return sortDirection === 'asc' ? -1 : 1
      if (bVal == null) return sortDirection === 'asc' ? 1 : -1
      // If both are numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      // Convert to strings for comparison
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [filtered, sortKey, sortDirection, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * itemsPerPage
  const pageData = sorted.slice(start, start + itemsPerPage)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition"
          />
        </div>
        <div className="text-sm text-white/30">{filtered.length} items</div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className="text-left px-4 py-3 text-white/60 font-mono text-xs uppercase tracking-wider cursor-pointer hover:text-white/80 transition"
                  onClick={() => col.sortable !== false && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key &&
                      (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
              ))}
              {actions && <th className="text-right px-4 py-3 text-white/60 font-mono text-xs uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-white/30">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-white/30">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map(row => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td key={String(col.key)} className="px-4 py-3 text-white/80">
                      {col.render ? col.render(row[col.key as keyof T], row) : row[col.key as keyof T]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-white/30">
            Page {safePage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
