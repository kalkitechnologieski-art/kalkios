import { create } from 'zustand'
import type { Lead, LeadSearchSession } from '@/types/lead'

interface LeadState {
  leads: Lead[]
  session: LeadSearchSession | null
  isProcessing: boolean
  progress: number
  error: string | null
  setLeads: (leads: Lead[]) => void
  addLead: (lead: Lead) => void
  setSession: (session: LeadSearchSession | null | ((prev: LeadSearchSession | null) => LeadSearchSession | null)) => void
  setIsProcessing: (isProcessing: boolean) => void
  setProgress: (progress: number | ((prev: number) => number)) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useLeadStore = create<LeadState>()((set) => ({
  leads: [],
  session: null,
  isProcessing: false,
  progress: 0,
  error: null,

  setLeads: (leads) => set({ leads }),

  addLead: (lead) =>
    set((state) => ({ leads: [...state.leads, lead] })),

  setSession: (session) =>
    set((state) => ({
      session: typeof session === 'function' ? session(state.session) : session,
    })),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setProgress: (progress) =>
    set((state) => ({
      progress: typeof progress === 'function' ? progress(state.progress) : progress,
    })),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      leads: [],
      session: null,
      isProcessing: false,
      progress: 0,
      error: null,
    }),
}))
