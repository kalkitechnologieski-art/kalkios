'use client'

import { useState } from 'react'
import { CyberpunkForm, CyberpunkInput, CyberpunkTextarea, CyberpunkButton } from '@/components/ui/CyberpunkForm'

export function ContactFormClient() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate sending
    setSubmitted(true)
    alert('Message sent! (demo)')
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <p className="text-green-400 text-lg font-mono">✅ Message sent successfully!</p>
        <p className="text-white/40 text-sm mt-2">We'll get back to you within 24 hours.</p>
      </div>
    )
  }

  return (
    <CyberpunkForm onSubmit={handleSubmit}>
      <CyberpunkInput type="text" placeholder="Full Name" required />
      <CyberpunkInput type="email" placeholder="Email" required />
      <CyberpunkInput type="text" placeholder="Subject" />
      <CyberpunkTextarea placeholder="Message" rows={4} required />
      <CyberpunkButton type="submit">Send Message</CyberpunkButton>
    </CyberpunkForm>
  )
}
