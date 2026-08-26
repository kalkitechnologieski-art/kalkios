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
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const scanlineRef = useRef<HTMLDivElement>(null)
  const [displayText, setDisplayText] = useState('KALKI OS')
  const [tagline] = useState('WELCOME TO TEMPLE OF TECHNOLOGY')

  // Lenis smooth scroll
  useEffect(() => {
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
  }, [])

  // Glitch text loop for KALKI OS
  useEffect(() => {
    const interval = setInterval(() => {
      const glitched = scrambleText('KALKI OS', 600)
      setDisplayText(glitched)
      setTimeout(() => {
        setDisplayText('KALKI OS')
      }, 800)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // GSAP animations with scroll scrub
  useEffect(() => {
    if (!containerRef.current) return

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

      // Tagline fade in (stays visible)
      if (textRef.current) {
        const taglineEl = textRef.current.querySelector('.tagline')
        const titleEl = textRef.current.querySelector('.title')
        const subtitleEl = textRef.current.querySelector('.subtitle')

        if (taglineEl) {
          tl.fromTo(taglineEl,
            { opacity: 0, y: 20, filter: 'blur(5px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.3 }
          )
        }
        if (titleEl) {
          tl.fromTo(titleEl,
            { opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' },
            { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.4 },
            '+=0.1'
          )
        }
        if (subtitleEl) {
          tl.fromTo(subtitleEl,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.3 },
            '+=0.2'
          )
        }

        // Subtle parallax — keep everything visible, just slight movement
        tl.to(taglineEl, { y: -10, opacity: 0.8, duration: 0.3 }, '+=0.3')
        tl.to(titleEl, { y: -15, opacity: 0.9, duration: 0.3 }, '-=0.2')
        tl.to(subtitleEl, { y: -5, opacity: 0.7, duration: 0.3 }, '-=0.1')
      }

      // Glow pulse
      if (glowRef.current) {
        tl.fromTo(glowRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 0.6, scale: 1.2, duration: 0.3 }
        )
      }

      // Scanline
      if (scanlineRef.current) {
        tl.fromTo(scanlineRef.current,
          { opacity: 0 },
          { opacity: 0.3, duration: 0.2 }
        )
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-[#0A0A0F] flex items-center justify-center"
    >
      {/* Neon glow */}
      <div
        ref={glowRef}
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-600/20 to-pink-500/20 opacity-0 pointer-events-none"
      />
      
      {/* Scanline overlay */}
      <div
        ref={scanlineRef}
        className="absolute inset-0 pointer-events-none opacity-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)',
        }}
      />

      {/* Digital rain particles */}
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

      {/* Main content */}
      <div ref={textRef} className="relative z-10 text-center px-6 max-w-4xl">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-2xl animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 relative">
              <Image src="/images/logo.svg" alt="KALKI OS" width={48} height={48} className="object-contain" />
            </div>
          </div>
        </div>

        {/* Tagline — WELCOME TO TEMPLE OF TECHNOLOGY */}
        <p className="tagline text-xs md:text-sm font-mono tracking-[0.4em] text-cyan-400/60 mb-4">
          {tagline.split('').map((char, i) => (
            <span
              key={i}
              className="inline-block"
              style={{
                animation: `fade-in-char ${0.05}s ${0.1 + i * 0.03}s ease-out both`,
              }}
            >
              {char}
            </span>
          ))}
        </p>

        {/* Main title — KALKI OS with glitch */}
        <h1 className="title text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]">
          {displayText}
        </h1>

        {/* Subtitle */}
        <p className="subtitle text-2xl md:text-3xl font-light mt-4 tracking-wider text-cyan-300/80 drop-shadow-[0_0_20px_rgba(0,255,255,0.2)]">
          <span className="inline-block border-r-2 border-cyan-400 pr-2 animate-pulse">█</span>
          Universe-Class AI Platform
        </p>

        {/* Scroll indicator */}
        <p className="text-cyan-400/40 text-lg mt-6 max-w-2xl mx-auto font-mono tracking-wider">
          &lt; scroll to initialize /&gt;
        </p>

        <div className="mt-8 flex justify-center">
          <div className="w-0.5 h-12 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse" />
        </div>
      </div>

      <style jsx>{`
        @keyframes cyber-rain {
          0% { transform: translateY(-100px) scaleY(1); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh) scaleY(0.5); opacity: 0; }
        }
        @keyframes fade-in-char {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
