// ═══ SIDDHI v4.0 BATCH 3 ═══
// Chat UI store. Mirrors useStreamingChat's ChatMessage shape (not the
// canonical @/types/chat ChatMessage — those are different concerns).
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';

export interface ChatUIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
  traces?: Array<{ id?: string; type?: string; status?: string; message?: string; duration?: number }>;
  artifacts?: Array<{ type: string; language?: string; title: string; content: string }>;
  toolCalls?: Array<{ name: string; args: unknown; result: unknown }>;
}

interface ChatState {
  messages: ChatUIMessage[];
  isSetuMode: boolean;
  isDeepThink: boolean;
  isLoading: boolean;
  addMessage: (msg: ChatUIMessage) => void;
  setMessages: (msgs: ChatUIMessage[]) => void;
  toggleSetu: () => void;
  toggleDeepThink: () => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
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
}));
