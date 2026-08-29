import { create } from 'zustand'
import { ChatMessage } from '@/types/chat'

interface ChatState {
  messages: ChatMessage[]
  isSetuMode: boolean
  isDeepThink: boolean
  isLoading: boolean
  addMessage: (msg: ChatMessage) => void
  setMessages: (msgs: ChatMessage[]) => void
  toggleSetu: () => void
  toggleDeepThink: () => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isSetuMode: false,
  isDeepThink: false,
  isLoading: false,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  toggleSetu: () => set((state) => ({ isSetuMode: !state.isSetuMode })),
  toggleDeepThink: () => set((state) => ({ isDeepThink: !state.isDeepThink })),
  setLoading: (loading) => set({ isLoading: loading }),
  clear: () => set({ messages: [] }),
}))
