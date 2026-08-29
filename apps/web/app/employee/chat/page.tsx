'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  sender_id: string
  channel: string
  created_at: string
}

export default function ChatPage() {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) {
        toast.error('Failed to load messages')
        return
      }
      setMessages(data || [])
    }
    fetchMessages()

    const channel = supabase
      .channel('chat:team')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: { new: Message }) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return
    try {
      await supabase.from('messages').insert({
        content: input,
        sender_id: user?.id,
        channel: 'team',
      })
      setInput('')
    } catch {
      toast.error('Failed to send message')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-xl px-4 py-2 ${msg.sender_id === user?.id ? 'bg-cyan-600/30' : 'bg-white/5'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-2 border-t border-white/5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
        />
        <button onClick={sendMessage} className="p-2 bg-cyan-600 rounded-xl">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
