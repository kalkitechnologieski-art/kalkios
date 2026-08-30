'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface CosmicPromptBarProps {
  onSend: (text: string) => void
  isLoading: boolean
  placeholder?: string
  className?: string
  mode?: 'chat' | 'image' | 'video'
}

export function CosmicPromptBar({
  onSend,
  isLoading,
  placeholder = 'Ask Siddhi anything...',
  className = '',
  mode = 'chat',
}: CosmicPromptBarProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!text.trim() || isLoading) return
    onSend(text)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const buttonConfig = {
    chat: {
      label: 'Chat',
      bg: '#00d4ff',
      layerA: '#00d4ff',
      layerB: '#8b5cf6',
    },
    image: {
      label: 'Image',
      bg: '#ff0044',
      layerA: '#ff0044',
      layerB: '#ff66aa',
    },
    video: {
      label: 'Video',
      bg: '#8b5cf6',
      layerA: '#8b5cf6',
      layerB: '#00ccff',
    },
  }

  const config = buttonConfig[mode] || buttonConfig.chat

  return (
    <div className={`cosmic-wrapper relative ${className}`}>
      <div className={`galaxy-bg ${isLoading ? 'animate-twinkle' : ''}`} />

      <div id="cosmic-search-container" className="relative flex items-center">
        <div className="nebula-layer" />
        <div className="starfield-layer" />
        <div className="stardust-layer" />
        <div className="cosmic-ring-layer" />

        <div id="cosmic-main" className="relative flex items-center w-full">
          {/* Send Button – LEFT SIDE */}
          <div className="btn-wrapper flex-shrink-0 mr-2 z-10">
            <div className="light" />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '0s',
                animationDuration: '25s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '0.15s',
                animationDuration: '15.9s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '0.53s',
                animationDuration: '26.4s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '0.45s',
                animationDuration: '17.8s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '1.6s',
                animationDuration: '19.2s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '1.6s',
                animationDuration: '29.2s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '1.6s',
                animationDuration: '20.2s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA})`,
              }}
            />

            <button
              className="gradient-btn"
              onClick={handleSend}
              disabled={!text.trim() || isLoading}
              style={{
                backgroundColor: config.bg,
                boxShadow: `inset 0 0 10px 9px ${config.layerB}44`,
              }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                config.label
              )}
            </button>
            <div className="text-overlay">{isLoading ? 'Sending...' : config.label}</div>
          </div>

          {/* Input – RIGHT SIDE */}
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              className="cosmic-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'Siddhi is thinking...' : placeholder}
              disabled={isLoading}
            />
            <div id="cosmic-input-mask" />
            <div id="cosmic-glow" className={isLoading ? 'opacity-100' : 'opacity-0'} />
            <div className={`wormhole-border ${isLoading ? 'animate-rotate' : ''}`} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .cosmic-wrapper {
          width: 100%;
          position: relative;
          padding: 4px 0;
        }
        .galaxy-bg {
          position: absolute;
          inset: -20px;
          z-index: 0;
          background-image: radial-gradient(#ffffff 1px, transparent 1px),
            radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: 0 0, 25px 25px;
          opacity: 0;
          transition: opacity 0.8s ease;
          pointer-events: none;
          border-radius: 16px;
        }
        .galaxy-bg.animate-twinkle {
          opacity: 0.5;
          animation: twinkle 2s infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        #cosmic-search-container {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          width: 100%;
        }
        .nebula-layer,
        .starfield-layer,
        .stardust-layer,
        .cosmic-ring-layer {
          position: absolute;
          max-height: 70px;
          max-width: 314px;
          height: 100%;
          width: 100%;
          overflow: hidden;
          z-index: -1;
          border-radius: 12px;
          filter: blur(3px);
          pointer-events: none;
        }
        .stardust-layer {
          max-height: 63px;
          max-width: 307px;
          border-radius: 10px;
          filter: blur(2px);
        }
        .stardust-layer::before {
          content: "";
          z-index: -2;
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(83deg);
          position: absolute;
          width: 600px;
          height: 600px;
          background-repeat: no-repeat;
          background-position: 0 0;
          filter: brightness(1.4);
          background-image: conic-gradient(
            rgba(0, 0, 0, 0) 0%,
            #4d6dff,
            rgba(0, 0, 0, 0) 8%,
            rgba(0, 0, 0, 0) 50%,
            #6e8cff,
            rgba(0, 0, 0, 0) 58%
          );
          transition: all 2s;
        }
        .cosmic-ring-layer {
          max-height: 59px;
          max-width: 303px;
          border-radius: 11px;
          filter: blur(0.5px);
        }
        .cosmic-ring-layer::before {
          content: "";
          z-index: -2;
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(70deg);
          position: absolute;
          width: 600px;
          height: 600px;
          filter: brightness(1.3);
          background-repeat: no-repeat;
          background-position: 0 0;
          background-image: conic-gradient(
            #05071b,
            #4d6dff 5%,
            #05071b 14%,
            #05071b 50%,
            #6e8cff 60%,
            #05071b 64%
          );
          transition: all 2s;
        }
        .starfield-layer {
          max-height: 65px;
          max-width: 312px;
        }
        .starfield-layer::before {
          content: "";
          z-index: -2;
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(82deg);
          position: absolute;
          width: 600px;
          height: 600px;
          background-repeat: no-repeat;
          background-position: 0 0;
          background-image: conic-gradient(
            rgba(0, 0, 0, 0),
            #1c2452,
            rgba(0, 0, 0, 0) 10%,
            rgba(0, 0, 0, 0) 50%,
            #2a3875,
            rgba(0, 0, 0, 0) 60%
          );
          transition: all 2s;
        }
        .nebula-layer {
          overflow: hidden;
          filter: blur(30px);
          opacity: 0.4;
          max-height: 130px;
          max-width: 354px;
        }
        .nebula-layer::before {
          content: "";
          z-index: -2;
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(60deg);
          position: absolute;
          width: 999px;
          height: 999px;
          background-repeat: no-repeat;
          background-position: 0 0;
          background-image: conic-gradient(
            #000,
            #4d6dff 5%,
            #000 38%,
            #000 50%,
            #6e8cff 60%,
            #000 87%
          );
          transition: all 2s;
        }
        #cosmic-search-container:hover .starfield-layer::before {
          transform: translate(-50%, -50%) rotate(-98deg);
        }
        #cosmic-search-container:hover .nebula-layer::before {
          transform: translate(-50%, -50%) rotate(-120deg);
        }
        #cosmic-search-container:hover .stardust-layer::before {
          transform: translate(-50%, -50%) rotate(-97deg);
        }
        #cosmic-search-container:hover .cosmic-ring-layer::before {
          transform: translate(-50%, -50%) rotate(-110deg);
        }
        #cosmic-search-container:focus-within .starfield-layer::before {
          transform: translate(-50%, -50%) rotate(442deg);
          transition: all 4s;
        }
        #cosmic-search-container:focus-within .nebula-layer::before {
          transform: translate(-50%, -50%) rotate(420deg);
          transition: all 4s;
        }
        #cosmic-search-container:focus-within .stardust-layer::before {
          transform: translate(-50%, -50%) rotate(443deg);
          transition: all 4s;
        }
        #cosmic-search-container:focus-within .cosmic-ring-layer::before {
          transform: translate(-50%, -50%) rotate(430deg);
          transition: all 4s;
        }
        #cosmic-main {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }
        .cosmic-input {
          background-color: #05071b;
          border: none;
          width: 100%;
          height: 56px;
          border-radius: 10px;
          color: #a9c7ff;
          padding-inline: 16px;
          font-size: 18px;
          font-family: inherit;
          position: relative;
          z-index: 2;
          outline: none;
          min-width: 0;
        }
        .cosmic-input::placeholder {
          color: #6e8cff;
        }
        .cosmic-input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        #cosmic-input-mask {
          display: none;
        }
        #cosmic-glow {
          pointer-events: none;
          width: 30px;
          height: 20px;
          position: absolute;
          background: #4d6dff;
          top: 50%;
          transform: translateY(-50%);
          left: 5px;
          filter: blur(20px);
          transition: all 2s;
          z-index: 1;
          opacity: 0;
        }
        #cosmic-glow.opacity-100 {
          opacity: 0.4;
        }
        .wormhole-border {
          height: 42px;
          width: 40px;
          position: absolute;
          overflow: hidden;
          top: 50%;
          transform: translateY(-50%);
          right: 7px;
          border-radius: 10px;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .wormhole-border::before {
          content: "";
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(90deg);
          position: absolute;
          width: 600px;
          height: 600px;
          background-repeat: no-repeat;
          background-position: 0 0;
          filter: brightness(1.35);
          background-image: conic-gradient(
            rgba(0, 0, 0, 0),
            #4d6dff,
            rgba(0, 0, 0, 0) 50%,
            rgba(0, 0, 0, 0) 50%,
            #6e8cff,
            rgba(0, 0, 0, 0) 100%
          );
        }
        .wormhole-border.animate-rotate {
          opacity: 0.8;
        }
        .wormhole-border.animate-rotate::before {
          animation: cosmic-rotate 4s linear infinite;
        }
        @keyframes cosmic-rotate {
          100% { transform: translate(-50%, -50%) rotate(450deg); }
        }
        /* Gradient Button */
        .btn-wrapper {
          --rad: 20px;
          --color-wrapper-border: transparent;
          --color-btn-bg: #00d4ff;
          --color-btn-text: #000;
          --color-btn-text-shadow: #fff;
          --color-btn-inset-shadow: #558;
          --color-layer-a: #00d4ff;
          --color-layer-b: #8b5cf6;
          --color-overlay-text: #000;
          --color-overlay-glow: #fff;
          --color-overlay-shadow: #0004;
          --color-overlay-highlight: #fff5;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: clip;
          overflow-clip-margin: 4px;
          border: 2px solid var(--color-wrapper-border);
          border-radius: var(--rad);
          font-family: "Inter", sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          filter: saturate(0.65) brightness(1.8);
          width: 70px;
          height: 40px;
          flex-shrink: 0;
        }
        .gradient-btn {
          position: relative;
          z-index: -1;
          padding: 4px 8px;
          border: none;
          border-radius: var(--rad);
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: 0.05rem;
          color: var(--color-btn-text);
          background-color: var(--color-btn-bg);
          background-size: 200% 200%;
          box-shadow: inset 0 0 10px 9px var(--color-btn-inset-shadow);
          text-shadow: 0 1px 3px var(--color-btn-text-shadow);
          cursor: pointer;
          mix-blend-mode: color-dodge;
          transition: color 0.3s ease, text-shadow 0.3s ease;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gradient-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .gradient-btn::after {
          content: "";
          position: absolute;
          pointer-events: none;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          border-radius: var(--rad);
          background-size: 200% 200%;
          mix-blend-mode: difference;
          z-index: 1;
        }
        .gradient-layer {
          position: absolute;
          pointer-events: none;
          left: -160px;
          width: 500%;
          aspect-ratio: 1;
          background: radial-gradient(
            ellipse at 65% 180%,
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a)
          );
          mix-blend-mode: difference;
          animation: rotate 8s linear infinite;
        }
        .gradient-layer:last-child {
          mix-blend-mode: color-dodge;
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .text-overlay {
          position: absolute;
          pointer-events: none;
          z-index: 2;
          padding: 4px 8px;
          border-radius: var(--rad);
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: 0.05rem;
          color: var(--color-overlay-text);
          text-shadow: 0 0 4px var(--color-overlay-glow);
          box-shadow:
            inset 0 -4px 4px 0 var(--color-overlay-shadow),
            inset 0 4px 4px 0 var(--color-overlay-highlight);
          mix-blend-mode: multiply;
          transition: transform 0.3s ease;
          animation: opacityPulse 5s ease infinite;
          white-space: nowrap;
        }
        .btn-wrapper:hover .text-overlay {
          transform: scale(1.05);
        }
        .btn-wrapper:active .text-overlay {
          transform: scale(0.95);
        }
        .btn-wrapper:hover .gradient-btn {
          color: #0000;
          text-shadow: 0 0 0 #0000;
        }
        .btn-wrapper:active .gradient-btn {
          color: #0000;
          text-shadow: 0 0 0 #0000;
        }
        .light {
          position: absolute;
          pointer-events: none;
          z-index: 1;
          border-radius: 50px;
          width: 80%;
          height: 1.2rem;
          aspect-ratio: 1;
          background-color: #fff5;
          filter: blur(5px);
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.1; }
        }
        @keyframes opacityPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 640px) {
          .cosmic-input {
            font-size: 14px;
            padding-inline: 12px;
            height: 48px;
          }
          .btn-wrapper {
            width: 60px;
            height: 36px;
            font-size: 0.7rem;
            margin-right: 6px;
          }
          .gradient-layer {
            left: -100px;
          }
          .text-overlay {
            font-size: 0.7rem;
            padding: 2px 6px;
          }
          .gradient-btn {
            padding: 2px 6px;
          }
          .nebula-layer, .starfield-layer, .stardust-layer, .cosmic-ring-layer {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .btn-wrapper {
            width: 50px;
            height: 32px;
          }
          .cosmic-input {
            height: 40px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}
