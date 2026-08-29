'use client'

import { useEffect, useState, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { LuxuryButton } from './LuxuryButton'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'

const slides = [
  {
    id: 1,
    video: '/videos/intro.mp4',
    title: 'Welcome to KALKI Intelligence',
    subtitle: 'The Temple of Technology',
    cta: 'Explore Our World',
    link: '/about',
  },
  {
    id: 2,
    video: '/videos/ai.mp4',
    title: 'AI-Powered Solutions',
    subtitle: 'Siddhi — Your Quantum AI Concierge',
    cta: 'Chat with Siddhi',
    link: '/chat',
  },
  {
    id: 3,
    video: '/videos/services.mp4',
    title: 'Enterprise Services',
    subtitle: 'Digital Marketing • AI Automation • Development',
    cta: 'View Services',
    link: '/services',
  },
]

export function VideoSlideshowHero() {
  const [mounted, setMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 8000, stopOnInteraction: false }),
  ])

  // ✅ Mount guard – only runs on client
  useEffect(() => {
    setMounted(true)
  }, [])

  const togglePlay = () => {
    if (emblaApi) {
      if (isPlaying) {
        emblaApi.plugins()?.autoplay?.stop()
      } else {
        emblaApi.plugins()?.autoplay?.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  // ✅ Show skeleton on server
  if (!mounted) {
    return (
      <div className="h-[70vh] min-h-[500px] w-full bg-gradient-to-br from-cyan-900/20 to-purple-900/20 animate-pulse rounded-3xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/40 mt-4 font-mono">Loading experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden bg-black rounded-3xl">
      <div className="embla h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="relative flex-[0_0_100%] h-full flex items-center justify-center"
            >
              <video
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                src={slide.video}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="relative z-10 text-center px-6 max-w-3xl">
                <p className="text-cyan-400/60 text-sm font-mono tracking-[0.3em] mb-2">
                  ● KALKI INTELLIGENCE
                </p>
                <h1 className="text-4xl md:text-6xl font-bold text-white font-mono leading-tight">
                  {slide.title}
                </h1>
                <p className="text-white/60 text-lg md:text-xl mt-4 font-light">
                  {slide.subtitle}
                </p>
                <div className="mt-8">
                  <LuxuryButton
                    variant="primary"
                    size="lg"
                    label={slide.cta}
                    onClick={() => (window.location.href = slide.link)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/70 transition z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/70 transition z-20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <button
        onClick={togglePlay}
        className="absolute bottom-6 right-6 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/70 transition z-20"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition ${
              emblaApi?.selectedScrollSnap() === index
                ? 'bg-cyan-400 w-6'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
