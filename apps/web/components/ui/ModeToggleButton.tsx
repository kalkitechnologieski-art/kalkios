'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface ModeToggleButtonProps {
  active: boolean
  onToggle: () => void
  label: string
  tooltip: string
  colorScheme: 'gold' | 'red'
  className?: string
}

export function ModeToggleButton({
  active,
  onToggle,
  label,
  tooltip,
  colorScheme = 'gold',
  className = '',
}: ModeToggleButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Colors based on scheme
  const colors = {
    gold: {
      radialInner: '#ffd215',
      radialOuter: '#fff172',
      shadow: 'rgba(255, 223, 87, 0.5)',
      shadowInsetTop: 'rgba(255, 223, 52, 0.9)',
      shadowInsetBottom: 'rgba(255, 250, 215, 0.8)',
      cColor1: 'rgba(255, 163, 26, 0.7)',
      cColor2: '#1a23ff',
      cColor3: '#e21bda',
      cColor4: 'rgba(255, 232, 26, 0.7)',
    },
    red: {
      radialInner: '#ff0044',
      radialOuter: '#ff3366',
      shadow: 'rgba(255, 0, 68, 0.5)',
      shadowInsetTop: 'rgba(255, 0, 68, 0.9)',
      shadowInsetBottom: 'rgba(255, 100, 120, 0.8)',
      cColor1: 'rgba(255, 0, 68, 0.7)',
      cColor2: '#cc0033',
      cColor3: '#ff66aa',
      cColor4: 'rgba(255, 100, 120, 0.7)',
    },
  }

  const c = colors[colorScheme]

  // Handle hover with delay for tooltip
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 2000)
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setShowTooltip(false)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  // Animation only runs when active (add class 'active' to trigger animation)
  // The button itself uses CSS transitions; we'll control the 'active' class.
  // For the circle animations, they are always running via CSS, but we can pause them.
  // We'll use a wrapper to toggle animation-play-state.

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        ref={buttonRef}
        className={`uiverse-mode-btn ${active ? 'active' : ''} ${className}`}
        onClick={onToggle}
        style={
          {
            '--c-radial-inner': c.radialInner,
            '--c-radial-outer': c.radialOuter,
            '--c-shadow': c.shadow,
            '--c-shadow-inset-top': c.shadowInsetTop,
            '--c-shadow-inset-bottom': c.shadowInsetBottom,
            '--c-color-1': c.cColor1,
            '--c-color-2': c.cColor2,
            '--c-color-3': c.cColor3,
            '--c-color-4': c.cColor4,
            '--duration': active ? '1400ms' : '0s',
          } as React.CSSProperties
        }
      >
        <div className="wrapper">
          <span>{label}</span>
          <div className={`circle circle-12 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-11 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-10 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-9 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-8 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-7 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-6 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-5 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-4 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-3 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-2 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-1 ${active ? 'animate' : ''}`}></div>
        </div>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="mode-tooltip">
          {tooltip}
        </div>
      )}

      <style jsx>{`
        .uiverse-mode-btn {
          --duration: 0s;
          --easing: linear;
          --c-color-1: rgba(255, 163, 26, 0.7);
          --c-color-2: #1a23ff;
          --c-color-3: #e21bda;
          --c-color-4: rgba(255, 232, 26, 0.7);
          --c-shadow: rgba(255, 223, 87, 0.5);
          --c-shadow-inset-top: rgba(255, 223, 52, 0.9);
          --c-shadow-inset-bottom: rgba(255, 250, 215, 0.8);
          --c-radial-inner: #ffd215;
          --c-radial-outer: #fff172;
          --c-color: #fff;
          -webkit-tap-highlight-color: transparent;
          -webkit-appearance: none;
          outline: none;
          position: relative;
          cursor: pointer;
          border: none;
          display: table;
          border-radius: 24px;
          padding: 0;
          margin: 0;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.02em;
          line-height: 1.5;
          color: var(--c-color);
          background: radial-gradient(
            circle,
            var(--c-radial-inner),
            var(--c-radial-outer) 80%
          );
          box-shadow: 0 0 14px var(--c-shadow);
          transition: all 0.3s ease;
          min-width: 100px;
          height: 42px;
        }

        .uiverse-mode-btn.active {
          --duration: 1400ms;
        }

        .uiverse-mode-btn:before {
          content: "";
          pointer-events: none;
          position: absolute;
          z-index: 3;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          box-shadow:
            inset 0 3px 12px var(--c-shadow-inset-top),
            inset 0 -3px 4px var(--c-shadow-inset-bottom);
        }

        .uiverse-mode-btn .wrapper {
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          overflow: hidden;
          border-radius: 24px;
          min-width: 100px;
          padding: 10px 16px;
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .uiverse-mode-btn .wrapper span {
          display: inline-block;
          position: relative;
          z-index: 1;
        }

        .uiverse-mode-btn .wrapper .circle {
          position: absolute;
          left: 0;
          top: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          filter: blur(var(--blur, 8px));
          background: var(--background, transparent);
          transform: translate(var(--x, 0), var(--y, 0)) translateZ(0);
          animation: none;
          opacity: 0.6;
        }

        .uiverse-mode-btn.active .wrapper .circle {
          animation: var(--animation, none) var(--duration) var(--easing) infinite;
          opacity: 1;
        }

        .uiverse-mode-btn .wrapper .circle.circle-1,
        .uiverse-mode-btn .wrapper .circle.circle-9,
        .uiverse-mode-btn .wrapper .circle.circle-10 {
          --background: var(--c-color-4);
        }
        .uiverse-mode-btn .wrapper .circle.circle-3,
        .uiverse-mode-btn .wrapper .circle.circle-4 {
          --background: var(--c-color-2);
          --blur: 14px;
        }
        .uiverse-mode-btn .wrapper .circle.circle-5,
        .uiverse-mode-btn .wrapper .circle.circle-6 {
          --background: var(--c-color-3);
          --blur: 16px;
        }
        .uiverse-mode-btn .wrapper .circle.circle-2,
        .uiverse-mode-btn .wrapper .circle.circle-7,
        .uiverse-mode-btn .wrapper .circle.circle-8,
        .uiverse-mode-btn .wrapper .circle.circle-11,
        .uiverse-mode-btn .wrapper .circle.circle-12 {
          --background: var(--c-color-1);
          --blur: 12px;
        }

        /* Circle positions and animations */
        .uiverse-mode-btn .wrapper .circle.circle-1 { --x: 0; --y: -40px; --animation: circle-1; }
        .uiverse-mode-btn .wrapper .circle.circle-2 { --x: 92px; --y: 8px; --animation: circle-2; }
        .uiverse-mode-btn .wrapper .circle.circle-3 { --x: -12px; --y: -12px; --animation: circle-3; }
        .uiverse-mode-btn .wrapper .circle.circle-4 { --x: 80px; --y: -12px; --animation: circle-4; }
        .uiverse-mode-btn .wrapper .circle.circle-5 { --x: 12px; --y: -4px; --animation: circle-5; }
        .uiverse-mode-btn .wrapper .circle.circle-6 { --x: 56px; --y: 16px; --animation: circle-6; }
        .uiverse-mode-btn .wrapper .circle.circle-7 { --x: 8px; --y: 28px; --animation: circle-7; }
        .uiverse-mode-btn .wrapper .circle.circle-8 { --x: 28px; --y: -4px; --animation: circle-8; }
        .uiverse-mode-btn .wrapper .circle.circle-9 { --x: 20px; --y: -12px; --animation: circle-9; }
        .uiverse-mode-btn .wrapper .circle.circle-10 { --x: 64px; --y: 16px; --animation: circle-10; }
        .uiverse-mode-btn .wrapper .circle.circle-11 { --x: 4px; --y: 4px; --animation: circle-11; }
        .uiverse-mode-btn .wrapper .circle.circle-12 { --blur: 14px; --x: 52px; --y: 4px; --animation: circle-12; }

        @keyframes circle-1 {
          33% { transform: translate(0px, 16px) translateZ(0); }
          66% { transform: translate(12px, 64px) translateZ(0); }
        }
        @keyframes circle-2 {
          33% { transform: translate(80px, -10px) translateZ(0); }
          66% { transform: translate(72px, -48px) translateZ(0); }
        }
        @keyframes circle-3 {
          33% { transform: translate(20px, 12px) translateZ(0); }
          66% { transform: translate(12px, 4px) translateZ(0); }
        }
        @keyframes circle-4 {
          33% { transform: translate(76px, -12px) translateZ(0); }
          66% { transform: translate(112px, -8px) translateZ(0); }
        }
        @keyframes circle-5 {
          33% { transform: translate(84px, 28px) translateZ(0); }
          66% { transform: translate(40px, -32px) translateZ(0); }
        }
        @keyframes circle-6 {
          33% { transform: translate(28px, -16px) translateZ(0); }
          66% { transform: translate(76px, -56px) translateZ(0); }
        }
        @keyframes circle-7 {
          33% { transform: translate(8px, 28px) translateZ(0); }
          66% { transform: translate(20px, -60px) translateZ(0); }
        }
        @keyframes circle-8 {
          33% { transform: translate(32px, -4px) translateZ(0); }
          66% { transform: translate(56px, -20px) translateZ(0); }
        }
        @keyframes circle-9 {
          33% { transform: translate(20px, -12px) translateZ(0); }
          66% { transform: translate(80px, -8px) translateZ(0); }
        }
        @keyframes circle-10 {
          33% { transform: translate(68px, 20px) translateZ(0); }
          66% { transform: translate(100px, 28px) translateZ(0); }
        }
        @keyframes circle-11 {
          33% { transform: translate(4px, 4px) translateZ(0); }
          66% { transform: translate(68px, 20px) translateZ(0); }
        }
        @keyframes circle-12 {
          33% { transform: translate(56px, 0px) translateZ(0); }
          66% { transform: translate(60px, -32px) translateZ(0); }
        }

        /* Tooltip */
        .mode-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a2e;
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 14px;
          color: #a9c7ff;
          font-size: 12px;
          font-weight: 400;
          white-space: nowrap;
          max-width: 220px;
          white-space: normal;
          text-align: center;
          z-index: 50;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          pointer-events: none;
          animation: tooltipFade 0.2s ease-out;
        }

        .mode-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #1a1a2e;
        }

        @keyframes tooltipFade {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .uiverse-mode-btn {
            font-size: 12px;
            min-width: 80px;
            height: 36px;
          }
          .uiverse-mode-btn .wrapper {
            padding: 6px 12px;
            min-width: 80px;
          }
          .uiverse-mode-btn .wrapper .circle {
            width: 22px;
            height: 22px;
          }
          .mode-tooltip {
            font-size: 10px;
            max-width: 160px;
            padding: 6px 10px;
          }
        }
      `}</style>
    </div>
  )
}
