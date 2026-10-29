import { Suspense } from 'react'
import type { Metadata } from 'next'
import ChatClient from './ChatClient'

// The chat itself is client-rendered, so it has nothing for a crawler to index;
// keep it out of the index instead of shipping a duplicate-titled thin page.
export const metadata: Metadata = {
  title: 'Chat with Siddhi AI',
  robots: { index: false, follow: true },
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-mono animate-pulse">Loading Siddhi...</p>
        </div>
      </div>
    }>
      <ChatClient />
    </Suspense>
  )
}
