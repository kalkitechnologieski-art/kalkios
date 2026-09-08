'use client'

import { ReactNode, FormEvent } from 'react'
import { cn } from '@/lib/utils'

interface CyberpunkFormProps {
  children: ReactNode
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
  className?: string
  id?: string
}

export function CyberpunkForm({ children, onSubmit, className = '', id }: CyberpunkFormProps) {
  return (
    <form 
      id={id}
      onSubmit={onSubmit}
      className={cn('cyberpunk-form-container', className)}
    >
      <div className="cyberpunk-input-container">
        <div className="cyberpunk-input-content">
          <div className="cyberpunk-input-dist">
            {children}
          </div>
        </div>
      </div>
    </form>
  )
}

interface CyberpunkInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function CyberpunkInput({ className, label, ...props }: CyberpunkInputProps) {
  return (
    <div className="cyberpunk-input-wrapper">
      {label && <label className="cyberpunk-input-label">{label}</label>}
      <input 
        className={cn('cyberpunk-input-is', className)} 
        {...props} 
      />
    </div>
  )
}

interface CyberpunkTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function CyberpunkTextarea({ className, label, ...props }: CyberpunkTextareaProps) {
  return (
    <div className="cyberpunk-input-wrapper">
      {label && <label className="cyberpunk-input-label">{label}</label>}
      <textarea 
        className={cn('cyberpunk-input-is cyberpunk-textarea', className)} 
        {...props} 
      />
    </div>
  )
}

interface CyberpunkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function CyberpunkButton({ children, className, ...props }: CyberpunkButtonProps) {
  return (
    <button 
      className={cn('cyberpunk-submit', className)} 
      {...props}
    >
      {children}
    </button>
  )
}
