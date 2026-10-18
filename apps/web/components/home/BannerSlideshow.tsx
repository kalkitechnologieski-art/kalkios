// == KALKI HOMEPAGE BANNER SLIDESHOW ==
// Slim, horizontal, premium. Auto-advancing glass banners with spring crossfade,
// swipe, arrows + dots, pause-on-hover and reduced-motion respect.
// -----------------------------------------------------------------------------

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { FEATURED_BANNERS } from '@/lib/services/service-image'

const SLIDES = FEATURED_BANNERS as unknown as Array<{
  image: string
  eyebrow: string
  title: string
  subtitle: string
  href: string
  cta: string
}>

const INTERVAL_MS = 6000

export function BannerSlideshow() {
  const [[index, dir], setIndex] = useState<[number, number]>([0, 0])
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback(
    (next: number, direction: number) => {
      setIndex(([cur]) => {
        const target = (next + SLIDES.length) % SLIDES.length
        return [target, direction]
      })
    },
    []
  )

  const next = useCallback(() => setIndex(([cur]) => [(cur + 1) % SLIDES.length, 1]), [])
  const prev = useCallback(
    () => setIndex(([cur]) => [(cur - 1 + SLIDES.length) % SLIDES.length, -1]),
    []
  )

  useEffect(() => {
    if (paused || reduce) return
    timer.current = setInterval(next, INTERVAL_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [paused, reduce, next])

  const slide = SLIDES[index]

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 48 : -48, scale: 1.03 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -48 : 48, scale: 0.99 }),
  }

  return (
    <section className="max-w-7xl mx-auto px-4">
      <div
        className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-black/40 group"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative h-[220px] sm:h-[260px] md:h-[300px]">
          <AnimatePresence custom={dir} initial={false} mode="popLayout">
            <motion.div
              key={index}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 220, damping: 28, opacity: { duration: 0.4 } }}
              drag={reduce ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) next()
                else if (info.offset.x > 80) prev()
              }}
              className="absolute inset-0"
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
                draggable={false}
              />
              {/* Brand gradient scrim keeps text legible on any banner */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              <div className="absolute inset-0 flex items-center">
                <div className="px-6 sm:px-10 md:px-14 max-w-xl">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-cyan-300 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                    {slide.eyebrow}
                  </span>
                  <h2 className="mt-3 text-xl sm:text-2xl md:text-4xl font-bold text-white leading-tight drop-shadow-lg">
                    {slide.title}
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-white/70 line-clamp-2">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.href}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 transition"
                  >
                    {slide.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Arrows */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous banner"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/70 hover:text-white transition flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next banner"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/70 hover:text-white transition flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i, i > index ? 1 : -1)}
              aria-label={`Go to banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-7 bg-cyan-400' : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
