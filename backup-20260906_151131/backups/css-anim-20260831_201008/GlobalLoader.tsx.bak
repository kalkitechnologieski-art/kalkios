'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function GlobalLoader() {
  const [visible, setVisible] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const minDisplayTime = 2700 // 2.7 seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Hide after minimum display time
  const hideLoader = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setIsTransitioning(false)
      timerRef.current = null
    }, minDisplayTime)
  }

  // Show loader and set minimum display time
  const showLoader = () => {
    setVisible(true)
    setIsTransitioning(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setIsTransitioning(false)
      timerRef.current = null
    }, minDisplayTime)
  }

  // Initial load: show and hide after minDisplayTime
  useEffect(() => {
    showLoader()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Listen for route changes
  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Show loader on route change
      showLoader()
    }

    const handleRouteChangeComplete = () => {
      // The loader is already set to hide after minDisplayTime from showLoader
      // We don't need to do anything extra; it will auto-hide.
    }

    // We need to subscribe to router events. Since useRouter from next/navigation doesn't expose events directly,
    // we can use the pathname change as a trigger. However, pathname changes happen after the route completes.
    // To detect start, we can use a combination of pathname and a flag.

    // Alternative: use 'beforeunload' or intercept link clicks? Simpler: use pathname to detect route changes.
    // We'll keep track of previous pathname.
    let prevPathname = pathname
    const interval = setInterval(() => {
      if (pathname !== prevPathname) {
        // Route changed
        prevPathname = pathname
        showLoader()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [pathname])

  if (!visible && !isTransitioning) return null

  return (
    <>
      {/* Full-screen overlay with blur */}
      <div className="global-loader-overlay">
        <div className="pyramid-loader">
          <div className="wrapper">
            <span className="side side1"></span>
            <span className="side side2"></span>
            <span className="side side3"></span>
            <span className="side side4"></span>
            <span className="shadow"></span>
          </div>
        </div>
      </div>

      {/* Inject CSS */}
      <style jsx>{`
        .global-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 99999;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pyramid-loader {
          position: relative;
          width: 200px;
          height: 200px;
          display: block;
          transform-style: preserve-3d;
          transform: rotateX(-20deg);
          margin: 0 auto;
        }

        .wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          animation: spin 4s linear infinite;
        }

        @keyframes spin {
          100% {
            transform: rotateY(360deg);
          }
        }

        .pyramid-loader .wrapper .side {
          width: 70px;
          height: 70px;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          margin: auto;
          transform-origin: center top;
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }

        .pyramid-loader .wrapper .side1 {
          transform: rotateZ(-30deg) rotateY(90deg);
          background: conic-gradient(#2BDEAC, #F028FD, #D8CCE6, #2F2585);
        }

        .pyramid-loader .wrapper .side2 {
          transform: rotateZ(30deg) rotateY(90deg);
          background: conic-gradient(#2F2585, #D8CCE6, #F028FD, #2BDEAC);
        }

        .pyramid-loader .wrapper .side3 {
          transform: rotateX(30deg);
          background: conic-gradient(#2F2585, #D8CCE6, #F028FD, #2BDEAC);
        }

        .pyramid-loader .wrapper .side4 {
          transform: rotateX(-30deg);
          background: conic-gradient(#2BDEAC, #F028FD, #D8CCE6, #2F2585);
        }

        .pyramid-loader .wrapper .shadow {
          width: 60px;
          height: 60px;
          background: #8B5AD5;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          margin: auto;
          transform: rotateX(90deg) translateZ(-40px);
          filter: blur(12px);
        }

        @media (max-width: 640px) {
          .pyramid-loader {
            width: 150px;
            height: 150px;
          }
          .pyramid-loader .wrapper .side {
            width: 50px;
            height: 50px;
          }
          .pyramid-loader .wrapper .shadow {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </>
  )
}
