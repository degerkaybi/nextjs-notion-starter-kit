'use client'

import React, { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import Link from 'next/link'

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const videoId = 'lyU31zPyY6I'
  const startTime = 28

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsModalOpen(true)
  }

  return (
    <section className="hero-container fade-in-entrance">
      <div className="hero-video-bg">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&start=${startTime}&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          className="hero-iframe"
        />
        <div className="hero-overlay" />
      </div>

      <div className="hero-content fade-in">
        <h1 className="hero-title">KAYBID</h1>
        <p className="hero-subtitle">Street Art | Animation | Traditional Collage</p>
        <p className="hero-description">
          Known for the Silent Steps Series—a long-term street art project featuring hand-cut collages of endangered animals, installed across cities worldwide since 2018. Featured: Straat Museum Amsterdam, Paris Olympics 2024, Times Square NYC, WWF partnership.
        </p>
        <div className="hero-actions">
          <button onClick={handleOpenModal} className="hero-btn">
            WATCH FULL DOCUMENTARY
          </button>
          <Link href="/works" className="hero-secondary-link" style={{ color: '#ffffff', fontWeight: 'bold' }}>
            Explore All Works →
          </Link>
        </div>
      </div>

      <div className="scroll-indicator">
        <ChevronDown size={32} />
      </div>

      {isModalOpen && (
        <div className="hero-modal" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={32} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&start=${startTime}`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .hero-container {
          position: relative;
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #000;
        }

        .hero-video-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .hero-iframe {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 56.25vw; /* 16:9 */
          min-width: 177.78vh;
          min-height: 100vh;
          transform: translate(-50%, -50%);
          pointer-events: none;
          opacity: 0.5;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%);
          z-index: 2;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 0 2rem;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .hero-title {
          font-size: clamp(2.5rem, 9vw, 6rem);
          font-weight: 900;
          letter-spacing: -0.05em;
          margin: 0;
          color: #fff;
          text-transform: uppercase;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          letter-spacing: 0.1em;
          color: #fff;
          opacity: 0.9;
          margin: 0;
          font-weight: 500;
        }

        .hero-description {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #fff;
          opacity: 0.8;
          max-width: 700px;
          margin: 1rem 0 2.5rem;
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .hero-btn {
          padding: 1.2rem 3.5rem;
          border-radius: 100px;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          color: #fff;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          cursor: pointer;
        }

        .hero-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #fff;
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        /* FORCE WHITE HERO LINK - ANTI-PURPLE OVERRIDE */
        .hero-secondary-link, 
        a.hero-secondary-link,
        a.hero-secondary-link:visited,
        a.hero-secondary-link:active,
        .hero-content .hero-secondary-link {
          color: #ffffff !important;
          font-weight: 700 !important;
          opacity: 1 !important;
          text-decoration: none !important;
        }

        .hero-secondary-link:hover {
          opacity: 1;
          transform: translateX(5px);
        }

        .scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          color: #fff;
          opacity: 0.5;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
          40% {transform: translateX(-50%) translateY(-10px);}
          60% {transform: translateX(-50%) translateY(-5px);}
        }

        .hero-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.9);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          backdrop-filter: blur(10px);
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          position: relative;
          width: 100%;
          max-width: 1200px;
          aspect-ratio: 16/9;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.8);
        }

        .modal-content iframe {
          width: 100%;
          height: 100%;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1.5rem;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          z-index: 100;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .close-btn:hover {
          opacity: 1;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 4rem;
          }
          .hero-subtitle {
            font-size: 1rem;
          }
          .hero-description {
            font-size: 0.95rem;
          }
          .modal-content {
            aspect-ratio: 9/16; /* Mobile vertical adjustment if needed */
          }
        }
      `}</style>
    </section>
  )
}
