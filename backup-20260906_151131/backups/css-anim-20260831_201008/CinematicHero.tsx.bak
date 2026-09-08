'use client'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Image from 'next/image'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const GLITCH_CHARS = '!@#$%^&*()_+{}:<>?~ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function scrambleText(text: string, duration: number = 800): string {
  const chars = text.split('')
  let result = chars.map(() => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join('')
  for (let i = 0; i < chars.length; i++) {
    setTimeout(() => {
      const newChars = chars.map((c, idx) => {
        if (idx <= i) return c
        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      })
      result = newChars.join('')
    }, (duration / chars.length) * i)
  }
  return result
}

export function CinematicHero() {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const scanlineRef = useRef<HTMLDivElement>(null)
  const [displayText, setDisplayText] = useState('KALKI OS')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Mount guard
  useEffect(() => {
    setMounted(true)
  }, [])

  // Glitch text loop — only if mounted
  useEffect(() => {
    if (!mounted) return
    intervalRef.current = setInterval(() => {
      const glitched = scrambleText('KALKI OS', 600)
      setDisplayText(glitched)
      timeoutRef.current = setTimeout(() => {
        setDisplayText('KALKI OS')
      }, 800)
    }, 4000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [mounted])

  // GSAP animations — only if mounted
  useEffect(() => {
    if (!mounted || !containerRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        defaults: { ease: 'power1.inOut' },
      })

      if (textRef.current) {
        tl.fromTo(textRef.current,
          { opacity: 0, y: 40, scale: 0.98, filter: 'blur(8px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.4 }
        )
        tl.to(textRef.current, {
          y: -20,
          opacity: 0.9,
          duration: 0.3,
        }, '+=0.1')
      }

      if (glowRef.current) {
        tl.fromTo(glowRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 0.6, scale: 1.2, duration: 0.3 }
        )
      }

      if (scanlineRef.current) {
        tl.fromTo(scanlineRef.current,
          { opacity: 0 },
          { opacity: 0.3, duration: 0.2 }
        )
      }
    }, containerRef)

    return () => ctx.revert()
    // Also kill all ScrollTriggers to prevent removeChild errors
    ScrollTrigger.getAll().forEach(st => st.kill());
  }, [mounted])

  // Lenis smooth scroll — only if mounted
  useEffect(() => {
    if (!mounted) return
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => lenis.destroy()
  }, [mounted])

  if (!mounted) {
    return (
      <section className="relative h-screen w-full overflow-hidden bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-cyan-400/40 mt-4 font-mono">Loading experience...</p>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-[#0A0A0F] flex items-center justify-center"
    >
      <div ref={glowRef} className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-600/20 to-pink-500/20 opacity-0 pointer-events-none" />
      <div ref={scanlineRef} className="absolute inset-0 pointer-events-none opacity-0" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 bg-gradient-to-b from-cyan-400 to-transparent"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              height: `${20 + Math.random() * 80}px`,
              animation: `cyber-rain ${1 + Math.random() * 3}s ${Math.random() * 2}s infinite linear`,
              opacity: 0.1 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>
      <div ref={textRef} className="relative z-10 text-center px-6 max-w-4xl">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-2xl animate-pulse" />
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 relative">
              <Image src="/images/logo.svg" alt="KALKI OS" width={56} height={56} className="object-contain" />
            </div>
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]">
          {displayText}
        </h1>
        <p className="text-2xl md:text-3xl font-light mt-4 tracking-wider text-cyan-300/80 drop-shadow-[0_0_20px_rgba(0,255,255,0.2)]">
          <span className="inline-block border-r-2 border-cyan-400 pr-2 animate-pulse">█</span>
          Universe-Class AI Platform
        </p>
        <p className="text-cyan-400/40 text-lg mt-6 max-w-2xl mx-auto font-mono tracking-wider">
          &lt; scroll to initialize /&gt;
        </p>
      </div>
      <style jsx>{`
        @keyframes cyber-rain {
          0% { transform: translateY(-100px) scaleY(1); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh) scaleY(0.5); opacity: 0; }
        }
      `}</style>
    </section>
  )
}
