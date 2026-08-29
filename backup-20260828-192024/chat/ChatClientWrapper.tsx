'use client'

import dynamic from 'next/dynamic'

const ChatClient = dynamic(
  () => import('./ChatClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-mono animate-pulse">Loading chat...</p>
        </div>
      </div>
    ),
  }
)

export default function ChatClientWrapper() {
  return <ChatClient />
}
