'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  className?: string
  loading?: boolean
}

const changeColors: Record<NonNullable<StatCardProps['changeType']>, string> = {
  increase: 'text-green-400',
  decrease: 'text-red-400',
  neutral: 'text-yellow-400',
}

export function StatCard({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  className,
  loading = false,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-cyan-500/30 transition',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-white/40 text-sm font-mono">{title}</div>
        {icon && <div className="text-cyan-400">{icon}</div>}
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-white/10 rounded animate-pulse mt-2" />
      ) : (
        <div className="text-3xl font-bold text-white mt-2">{value}</div>
      )}
      {change && (
        <div className={`text-xs font-mono mt-2 ${changeColors[changeType]}`}>
          {changeType === 'increase' ? '↑' : changeType === 'decrease' ? '↓' : '•'} {change}
        </div>
      )}
    </motion.div>
  )
}
