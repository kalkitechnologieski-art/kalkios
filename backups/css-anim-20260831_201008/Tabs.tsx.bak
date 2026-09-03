'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

const TabsContext = createContext<{
  activeTab: string
  setActiveTab: (v: string) => void
}>({ activeTab: '', setActiveTab: () => {} })

export function Tabs({ children, defaultValue }: { children: ReactNode; defaultValue: string }) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children, className = '' }: { value: string; children: ReactNode; className?: string }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`${className} ${isActive ? 'bg-purple-600/20 text-white' : 'text-white/60 hover:text-white/80'} transition`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = '' }: { value: string; children: ReactNode; className?: string }) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null
  return <div className={className}>{children}</div>
}
