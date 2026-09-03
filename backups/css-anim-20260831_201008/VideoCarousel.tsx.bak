'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { LuxuryButton } from './LuxuryButton'
import { ClientOnly } from './ClientOnly'

const slides = [
  {
    id: 1,
    video: '/videos/hero.mp4',
    title: 'Welcome to KALKI Intelligence',
    subtitle: 'The Temple of Technology',
    cta: 'Chat with Siddhi',
    link: '/chat',
  },
  {
    id: 2,
    video: '/videos/ai.mp4',
    title: 'AI-Powered Solutions',
    subtitle: 'Siddhi — Your Quantum AI Concierge',
    cta: 'Explore Services',
    link: '/marketplace',
  },
  {
    id: 3,
    video: '/videos/services.mp4',
    title: 'Enterprise Services',
    subtitle: 'Digital Marketing • AI Automation • Development',
    cta: 'Learn More',
    link: '/about',
  },
]

const FALLBACK_SLIDE = slides[0] || {
  id: 0,
  video: '',
  title: 'Loading...',
  subtitle: '',
  cta: '',
  link: '#',
}

function CarouselContent() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }

    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [currentIndex])

  useEffect(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [currentIndex, isPlaying])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const currentSlide = slides[currentIndex] ?? FALLBACK_SLIDE

  return (
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        key={currentSlide.id}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        src={currentSlide.video}
        autoPlay
        muted
        playsInline
        loop={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 max-w-3xl mx-auto">
        <p className="text-cyan-400/60 text-sm font-mono tracking-[0.3em] mb-2">● KALKI INTELLIGENCE</p>
        <motion.h1
          key={currentSlide.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold text-white font-mono leading-tight"
        >
          {currentSlide.title}
        </motion.h1>
        <motion.p
          key={`sub-${currentSlide.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/60 text-lg md:text-xl mt-4 font-light"
        >
          {currentSlide.subtitle}
        </motion.p>
        <motion.div
          key={`btn-${currentSlide.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <LuxuryButton
            variant="primary"
            size="lg"
            label={currentSlide.cta}
            onClick={() => (window.location.href = currentSlide.link)}
          />
        </motion.div>
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/70 transition z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
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
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition ${
              index === currentIndex ? 'bg-cyan-400 w-6' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function VideoCarousel() {
  return (
    <ClientOnly fallback={
      <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden bg-gradient-to-br from-cyan-900/30 via-black to-purple-900/30 flex items-center justify-center">
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <p className="text-cyan-400/60 text-sm font-mono tracking-[0.3em] mb-2">● KALKI INTELLIGENCE</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white font-mono leading-tight">
            Welcome to the Temple of Technology
          </h1>
          <p className="text-white/60 text-lg md:text-xl mt-4 font-light">Loading experience...</p>
        </div>
      </div>
    }>
      <CarouselContent />
    </ClientOnly>
  )
}
