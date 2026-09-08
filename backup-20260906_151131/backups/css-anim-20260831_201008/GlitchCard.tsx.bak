'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[]
  long_description?: string | null
}

interface GlitchCardProps {
  service: Service
}

export default function GlitchCard({ service }: GlitchCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const features = Array.isArray(service.features) ? service.features.slice(0, 4) : []
  const hasFeatures = features.length > 0

  return (
    <Link
      href={`/marketplace/${encodeURIComponent(service.category)}/${encodeURIComponent(service.slug)}`}
      className="block no-underline"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="glitch-card-container">
        <div className="glitch-card-content">
          {/* Title */}
          <div className="glitch-card-title">
            <span className="glitch-title">{service.name}</span>
          </div>

          {/* Body – show points on hover, else show icon */}
          <div className="glitch-card-body">
            {isHovered && hasFeatures ? (
              <ul className="glitch-features-list">
                {features.map((f, i) => (
                  <li key={i} className="glitch-feature-item">✦ {String(f)}</li>
                ))}
              </ul>
            ) : (
              <div className="glitch-icon-large">{service.icon || '📦'}</div>
            )}
          </div>

          {/* Footer – price */}
          <div className="glitch-card-footer">
            <span className="glitch-title">₹{(service.price ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glitch-card-container {
          filter: drop-shadow(0 4px 20px rgba(0, 255, 255, 0.08)) drop-shadow(0 -4px 20px rgba(139, 92, 246, 0.08));
          animation: none;
          width: 100%;
          max-width: 160px;
          margin: 0 auto;
          transition: filter 0.3s ease;
        }
        .glitch-card-container:hover {
          filter: drop-shadow(0 8px 30px rgba(0, 255, 255, 0.15)) drop-shadow(0 -8px 30px rgba(139, 92, 246, 0.15));
        }

        .glitch-card-content {
          display: grid;
          align-content: center;
          justify-items: center;
          align-items: center;
          text-align: center;
          padding: 1em;
          grid-template-rows: 0.1fr 0.7fr 0.25fr;
          background-color: hsl(296, 59%, 10%);
          width: 100%;
          aspect-ratio: 9/16;
          -webkit-clip-path: polygon(0 0, 85% 0, 100% 14%, 100% 60%, 92% 65%, 93% 77%, 99% 80%, 99% 90%, 89% 100%, 0 100%);
          clip-path: polygon(0 0, 85% 0, 100% 14%, 100% 60%, 92% 65%, 93% 77%, 99% 80%, 99% 90%, 89% 100%, 0 100%);
          position: relative;
          transition: transform 0.3s ease;
        }

        .glitch-card-content::before {
          content: "";
          position: absolute;
          width: 250%;
          aspect-ratio: 1/1;
          transform-origin: center;
          background: linear-gradient(to bottom, transparent, transparent, rgba(102, 224, 255, 0.3), rgba(102, 224, 255, 0.3), rgba(227, 102, 255, 0.3), rgba(227, 102, 255, 0.3), transparent, transparent),
                      linear-gradient(to left, transparent, transparent, rgba(102, 224, 255, 0.3), rgba(102, 224, 255, 0.3), rgba(227, 102, 255, 0.3), rgba(227, 102, 255, 0.3), transparent, transparent);
          animation: rotateGlitch 8s linear infinite;
          z-index: 0;
          opacity: 0.3;
        }

        .glitch-card-content::after {
          content: "";
          position: absolute;
          top: 1%;
          left: 1%;
          width: 98%;
          height: 98%;
          background: repeating-linear-gradient(to bottom, transparent 0%, rgba(64, 144, 181, 0.3) 1px, rgb(0, 0, 0) 3px, rgba(64, 144, 181, 0.2) 5px, #153544 4px, transparent 0.5%),
                      repeating-linear-gradient(to left, hsl(295, 60%, 12%) 100%, hsla(295, 60%, 12%, 0.99) 100%);
          box-shadow: inset 0px 0px 20px 20px hsl(296, 59%, 10%);
          -webkit-clip-path: polygon(0 0, 85% 0, 100% 14%, 100% 60%, 92% 65%, 93% 77%, 99% 80%, 99% 90%, 89% 100%, 0 100%);
          clip-path: polygon(0 0, 85% 0, 100% 14%, 100% 60%, 92% 65%, 93% 77%, 99% 80%, 99% 90%, 89% 100%, 0 100%);
          animation: backglitch 94ms linear infinite;
          z-index: 1;
          opacity: 0.6;
        }

        .glitch-card-title {
          z-index: 80;
          -webkit-clip-path: polygon(90% 0, 100% 100%, 0% 100%, 0% 0%);
          clip-path: polygon(90% 0, 100% 100%, 0% 100%, 0% 0%);
          background: linear-gradient(90deg, rgba(255, 254, 250, 0) 0%, rgba(102, 224, 255, 0.2) 27%, rgba(102, 224, 255, 0.2) 63%, rgba(255, 255, 255, 0) 100%),
                      linear-gradient(0deg, rgba(102, 224, 255, 0.2) 0%, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0) 96%, rgba(102, 224, 255, 0.2) 100%);
          width: 98%;
          font-size: 0.9em;
          padding: 0.2em 0;
          text-align: right;
        }

        .glitch-title {
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 2;
          color: hsl(192, 100%, 88%);
          font-size: 1em;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          font-style: italic;
          font-weight: bold;
          display: block;
          padding-right: 0.5em;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.2);
        }

        .glitch-card-body {
          padding-block: 1.5em;
          padding-inline: 0.8em;
          z-index: 80;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          align-content: center;
          width: 100%;
          min-height: 80px;
        }

        .glitch-icon-large {
          font-size: 3em;
          line-height: 1;
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }
        .glitch-card-container:hover .glitch-icon-large {
          opacity: 0.8;
        }

        .glitch-features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          width: 100%;
          text-align: left;
          font-size: 0.6rem;
          color: #a9c7ff;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          font-weight: 400;
          line-height: 1.6;
        }
        .glitch-feature-item {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 2px 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 0.6rem;
        }
        .glitch-feature-item:last-child {
          border-bottom: none;
        }

        .glitch-card-footer {
          padding-inline: 0.8em;
          z-index: 80;
          width: 100%;
          text-align: right;
        }
        .glitch-card-footer .glitch-title {
          font-size: 0.85em;
          color: #66e0ff;
          text-shadow: 0 0 8px rgba(102, 224, 255, 0.3);
        }

        @keyframes backglitch {
          0% { box-shadow: inset 0px 20px 20px 20px hsl(296, 59%, 10%); }
          50% { box-shadow: inset 0px -20px 20px 20px hsl(296, 59%, 10.2%); }
          to { box-shadow: inset 0px 20px 20px 20px hsl(296, 59%, 10%); }
        }
        @keyframes rotateGlitch {
          0% { transform: rotate(0deg) translate(-50%, 20%); }
          50% { transform: rotate(180deg) translate(40%, 10%); }
          to { transform: rotate(360deg) translate(-50%, 20%); }
        }

        @media (max-width: 640px) {
          .glitch-card-container { max-width: 130px; }
          .glitch-card-title { font-size: 0.7em; }
          .glitch-card-body { padding-block: 1em; min-height: 60px; }
          .glitch-icon-large { font-size: 2.2em; }
          .glitch-features-list { font-size: 0.5rem; }
          .glitch-card-footer .glitch-title { font-size: 0.7em; }
        }
        @media (max-width: 480px) {
          .glitch-card-container { max-width: 110px; }
        }
      `}</style>
    </Link>
  )
}
