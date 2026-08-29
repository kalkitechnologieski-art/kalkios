'use client'

import { format } from 'date-fns'

interface DateTagProps {
  date: Date
}

export function DateTag({ date }: DateTagProps) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label = format(date, 'EEEE, MMM d, yyyy')
  if (date.toDateString() === today.toDateString()) label = 'Today'
  else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday'

  return (
    <div className="flex items-center gap-4 my-4">
      <div className="h-px flex-1 bg-white/5" />
      <span className="text-xs text-white/20 font-mono tracking-wider">{label}</span>
      <div className="h-px flex-1 bg-white/5" />
    </div>
  )
}
