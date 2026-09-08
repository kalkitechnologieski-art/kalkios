'use client'

import { ReactNode } from 'react'

export interface ChartWrapperProps {
  children: ReactNode
  loading: boolean
  empty?: boolean
  emptyMessage?: string
}

export function ChartWrapper({ children, loading, empty = false, emptyMessage = 'No data available' }: ChartWrapperProps) {
  if (loading) {
    return <div className="h-64 bg-white/5 animate-pulse rounded-lg" />
  }
  if (empty) {
    return <div className="h-64 flex items-center justify-center text-white/30 text-sm">{emptyMessage}</div>
  }
  return <div className="h-64 w-full">{children}</div>
}
