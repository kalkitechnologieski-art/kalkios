'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SparkleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SparkleButton({ children, onClick, href, className = '', size = 'md' }: SparkleButtonProps) {
  const [active, setActive] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const sizeClasses = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4',
  }

  const content = (
    <button
      ref={buttonRef}
      className={cn(
        'sparkle-button relative',
        'bg-red-600/90 hover:bg-red-700',
        'border-0 cursor-pointer',
        'flex items-center justify-center gap-2',
        'rounded-full',
        'font-medium',
        'transition-all duration-300',
        'shadow-[0_0_2em_rgba(220,38,38,0.5)] hover:shadow-[0_0_3em_rgba(220,38,38,0.7)]',
        'hover:scale-105 active:scale-95',
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      style={{
        '--active': active ? '1' : '0',
        '--bg': active
          ? 'radial-gradient(40% 50% at center 100%, hsl(0 90% 50% / 0.8), transparent), radial-gradient(80% 100% at center 120%, hsl(0 80% 45% / 0.6), transparent), hsl(0 85% 35%)'
          : 'radial-gradient(40% 50% at center 100%, hsl(0 70% 40% / 0.3), transparent), radial-gradient(80% 100% at center 120%, hsl(0 60% 35% / 0.2), transparent), hsl(0 75% 25%)',
        '--transition': '0.3s',
        '--spark': '2s',
        '--cut': '0.1em',
      } as React.CSSProperties}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {/* Spark ring */}
      <span className="spark absolute inset-0 rounded-full overflow-hidden mask-[linear-gradient(white,transparent_50%)] rotate-0 animate-[flip_2s_infinite_steps(2,end)]">
        <span className="spark-before absolute w-[200%] aspect-square top-0 left-1/2 -translate-x-1/2 -translate-y-[15%] rotate-0 opacity-[calc(var(--active)+0.4)] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-[rotate_2s_linear_infinite_both]" />
      </span>

      {/* Backdrop */}
      <span className="backdrop absolute inset-[0.1em] rounded-full bg-[var(--bg)] transition-[background] duration-300" />

      {/* Button text and icon */}
      <span className="relative z-10 flex items-center gap-2 text-white">
        <svg className="sparkle-icon w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {children}
      </span>

      {/* Particles (only when active) */}
      <span className="particle-pen absolute w-[200%] aspect-square top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mask-[radial-gradient(white,transparent_65%)] z-[-1] opacity-[var(--active,0)] transition-opacity duration-300 pointer-events-none">
        {[...Array(12)].map((_, i) => {
          const size = 0.15 + Math.random() * 0.2
          const x = 10 + Math.random() * 80
          const y = 10 + Math.random() * 80
          const duration = 1 + Math.random() * 2
          const delay = Math.random() * 2
          return (
            <svg
              key={i}
              className="particle absolute fill-white/80"
              style={{
                width: `${size}rem`,
                aspectRatio: '1/1',
                top: `${y}%`,
                left: `${x}%`,
                opacity: 1,
                animation: `float-out ${duration}s ${-delay}s infinite linear`,
                transformOrigin: `${x + 20}% ${y + 20}%`,
                animationPlayState: active ? 'running' : 'paused',
                zIndex: -1,
              }}
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6.937 3.846L7.75 1L8.563 3.846C8.77313 4.58114 9.1671 5.25062 9.70774 5.79126C10.2484 6.3319 10.9179 6.72587 11.653 6.936L14.5 7.75L11.654 8.563C10.9189 8.77313 10.2494 9.1671 9.70874 9.70774C9.1681 10.2484 8.77413 10.9179 8.564 11.653L7.75 14.5L6.937 11.654C6.72687 10.9189 6.3329 10.2494 5.79226 9.70874C5.25162 9.1681 4.58214 8.77413 3.847 8.564L1 7.75L3.846 6.937C4.58114 6.72687 5.25062 6.3329 5.79126 5.79226C6.3319 5.25162 6.72587 4.58214 6.936 3.847L6.937 3.846Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        })}
      </span>
    </button>
  )

  if (href) {
    return <a href={href}>{content}</a>
  }
  return content
}
