'use client'

interface MediaGenerationLoaderProps {
  type: 'image' | 'video'
  className?: string
}

export function MediaGenerationLoader({ type, className = '' }: MediaGenerationLoaderProps) {
  const word = 'Generating...'
  const letters = word.split('')

  return (
    <div className={`relative flex items-center justify-center py-4 px-6 ${className}`}>
      <div className="loader-wrapper-dexter">
        <span className="loader-letter-dexter">G</span>
        <span className="loader-letter-dexter">e</span>
        <span className="loader-letter-dexter">n</span>
        <span className="loader-letter-dexter">e</span>
        <span className="loader-letter-dexter">r</span>
        <span className="loader-letter-dexter">a</span>
        <span className="loader-letter-dexter">t</span>
        <span className="loader-letter-dexter">i</span>
        <span className="loader-letter-dexter">n</span>
        <span className="loader-letter-dexter">g</span>
        <span className="loader-letter-dexter">.</span>
        <span className="loader-letter-dexter">.</span>
        <span className="loader-letter-dexter">.</span>
        <div className="loader-dexter"></div>
      </div>

      <style jsx>{`
        .loader-wrapper-dexter {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80px;
          width: auto;
          font-family: 'Poppins', sans-serif;
          font-size: 1.2em;
          font-weight: 600;
          user-select: none;
          color: #00ffff;
          scale: 1.2;
          padding: 0 20px;
        }
        .loader-dexter {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          z-index: 1;
          background-color: transparent;
          mask: repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent 6px,
            black 7px,
            black 8px
          );
        }
        .loader-dexter::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(circle at 50% 50%, #00ffff 0%, transparent 50%),
            radial-gradient(circle at 45% 45%, #8b5cf6 0%, transparent 45%),
            radial-gradient(circle at 55% 55%, #ff0066 0%, transparent 45%),
            radial-gradient(circle at 45% 55%, #00ff88 0%, transparent 45%),
            radial-gradient(circle at 55% 45%, #00aaff 0%, transparent 45%);
          mask: radial-gradient(
            circle at 50% 50%,
            transparent 0%,
            transparent 10%,
            black 25%
          );
          animation: transform-animation 2s infinite alternate,
            opacity-animation 4s infinite;
          animation-timing-function: cubic-bezier(0.6, 0.8, 0.5, 1);
        }
        @keyframes transform-animation {
          0% { transform: translate(-55%); }
          100% { transform: translate(55%); }
        }
        @keyframes opacity-animation {
          0%, 100% { opacity: 0; }
          15% { opacity: 1; }
          65% { opacity: 0; }
        }
        .loader-letter-dexter {
          display: inline-block;
          opacity: 0;
          animation: loader-letter-anim 4s infinite linear;
          z-index: 2;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }
        .loader-letter-dexter:nth-child(1) { animation-delay: 0.1s; }
        .loader-letter-dexter:nth-child(2) { animation-delay: 0.205s; }
        .loader-letter-dexter:nth-child(3) { animation-delay: 0.31s; }
        .loader-letter-dexter:nth-child(4) { animation-delay: 0.415s; }
        .loader-letter-dexter:nth-child(5) { animation-delay: 0.521s; }
        .loader-letter-dexter:nth-child(6) { animation-delay: 0.626s; }
        .loader-letter-dexter:nth-child(7) { animation-delay: 0.731s; }
        .loader-letter-dexter:nth-child(8) { animation-delay: 0.837s; }
        .loader-letter-dexter:nth-child(9) { animation-delay: 0.942s; }
        .loader-letter-dexter:nth-child(10) { animation-delay: 1.047s; }
        .loader-letter-dexter:nth-child(11) { animation-delay: 1.152s; }
        .loader-letter-dexter:nth-child(12) { animation-delay: 1.257s; }
        .loader-letter-dexter:nth-child(13) { animation-delay: 1.362s; }
        @keyframes loader-letter-anim {
          0% { opacity: 0; }
          5% { opacity: 1; text-shadow: 0 0 8px #00ffff; transform: scale(1.1) translateY(-2px); }
          20% { opacity: 0.2; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
