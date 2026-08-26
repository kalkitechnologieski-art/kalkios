'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import type { Database } from '@/lib/supabase/types'

type Message = Database['public']['Tables']['messages']['Row']

export function ChatWidget({ projectId }: { projectId: string }) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    const fetch = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
      setMessages(data || [])
    }
    fetch()

    const sub = supabase
      .channel(`messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: { new: Message }) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe()

    return () => {
      sub.unsubscribe()
    }
  }, [open, projectId, supabase])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || !user) return
    setLoading(true)
    await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: user.id,
        content: input,
      } as any)
    setInput('')
    setLoading(false)
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 md:right-8">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full shadow-2xl shadow-purple-500/30 transition"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      ) : (
        <div className="w-80 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
          <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
            <h4 className="text-white font-bold text-sm">Project Chat</h4>
            <button
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-64">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] ${m.sender_id === user?.id ? 'ml-auto' : ''}`}
              >
                <div
                  className={`px-3 py-2 rounded-xl text-sm ${
                    m.sender_id === user?.id
                      ? 'bg-purple-600/30 text-white'
                      : 'bg-white/10 text-white/80'
                  }`}
                >
                  {m.content}
                </div>
                <div className="text-[10px] text-white/30 mt-1">
                  {new Date(m.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-4 border-t border-white/10 flex gap-2 bg-white/5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 rounded-full px-3 py-2 text-white placeholder-white/30 outline-none text-sm"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="p-2 bg-purple-600 rounded-full disabled:opacity-50 hover:bg-purple-700 transition"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
