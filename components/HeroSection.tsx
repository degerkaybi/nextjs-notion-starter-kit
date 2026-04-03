import * as React from 'react'
import Link from 'next/link'
import * as config from '@/lib/config'
import { IoChevronDownOutline } from '@react-icons/all-files/io5/IoChevronDownOutline'

export function HeroSection({ videoUrl, imageUrl, subtitle, startTime }: { videoUrl?: string, imageUrl?: string, subtitle?: string, startTime?: number }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
    const match = url.match(regExp)
    const id = (match && match[2] && match[2].length === 11) ? match[2] : null
    if (!id && url.includes('youtube.com/embed/')) {
        return url.split('embed/')[1]?.split('?')[0] || null
    }
    return id
  }

  const getYoutubeStartTime = (url: string) => {
    try {
      const urlObj = new URL(url.replace('youtu.be/', 'youtube.com/watch?v='))
      const t = urlObj.searchParams.get('t')
      if (!t) return null

      // Handle formats like 1m30s, 90, 90s
      const match = t.match(/(?:(\d+)m)?(?:(\d+)s?)?/)
      if (match) {
        const minutes = parseInt(match[1] || '0', 10)
        const seconds = parseInt(match[2] || '0', 10)
        return minutes * 60 + seconds
      }
      return parseInt(t, 10) || null
    } catch (e) {
      return null
    }
  }

  const youtubeId = videoUrl ? getYoutubeId(videoUrl) : null
  const urlStartTime = videoUrl ? getYoutubeStartTime(videoUrl) : null
  const finalStartTime = startTime || urlStartTime || 0

  return (
    <section className="hero">
      <div className="hero-background">
        {youtubeId ? (
          <div className="hero-youtube-wrapper">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1${finalStartTime ? `&start=${finalStartTime}` : ''}`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="hero-youtube-iframe"
            />
          </div>
        ) : videoUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="hero-media"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Background" className="hero-media" />
        ) : (
          <div className="hero-media hero-placeholder" />
        )}
        <div className="hero-overlay" />
      </div>

      <div className="hero-content">
        <h1 className="hero-title">{config.name}</h1>
        
        <p className="hero-subtitle">{subtitle || config.description}</p>

        <div className="hero-description">
          <p>Known for the Silent Steps Series—a long-term street art project featuring hand-cut collages of endangered animals, installed across cities worldwide since 2018. Featured: Straat Museum Amsterdam, Paris Olympics 2024, Times Square NYC, WWF partnership.</p>
        </div>

        <div className="hero-actions">
          {videoUrl && (
            <button className="hero-btn" onClick={() => setIsModalOpen(true)}>
              <span>Watch Full Documentary</span>
            </button>
          )}

          <Link href="/302392488fe580d4824accf5851dfe96" className="hero-btn">
            <span>Explore All Works →</span>
          </Link>
        </div>
      </div>

      {isModalOpen && (
        <div className="video-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1${finalStartTime ? `&start=${finalStartTime}` : ''}`}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="modal-video-iframe"
              />
            ) : (
              <video controls autoPlay className="modal-video-native">
                <source src={videoUrl} type="video/mp4" />
              </video>
            )}
          </div>
        </div>
      )}

      <div className="hero-scroll-indicator">
        <IoChevronDownOutline />
      </div>

      <style jsx>{`
        .hero {
          position: relative;
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #000;
          color: #fff;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: hidden;
        }

        .hero-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0.7;
        }

        .hero-youtube-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .hero-youtube-iframe {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 56.25vw;
          min-width: 177.78vh;
          min-height: 100vh;
          transform: translate(-50%, -50%);
          opacity: 0.7;
        }

        .hero-placeholder {
          background: linear-gradient(45deg, #1a1a1a, #000);
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%);
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 900px;
          padding: 0 2rem;
        }

        .hero-title {
          font-size: clamp(3rem, 10vw, 6rem);
          font-weight: 800;
          letter-spacing: -2px;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          line-height: 1;
        }



        .hero-description {
          font-size: clamp(0.9rem, 1.8vw, 1.05rem);
          font-weight: 300;
          max-width: 800px;
          margin: 0 auto 2.5rem;
          line-height: 1.6;
          opacity: 0.85;
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .hero-btn {
          position: relative;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          padding: 1.2rem 3rem;
          min-width: 300px;
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          border-radius: 50px;
          cursor: pointer !important;
          backdrop-filter: blur(10px);
          transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
          text-decoration: none;
          outline: none;
          pointer-events: auto !important;
        }

        .hero-btn:hover {
          background: #fff !important;
          color: #000 !important;
          transform: translateY(-8px) scale(1.05);
          box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255,255,255,0.2);
          border-color: #fff !important;
        }

        .hero-btn span {
          display: inline-block;
          transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .hero-btn:hover span {
          transform: translateX(8px);
        }

        @media (max-width: 640px) {
          .hero {
            align-items: flex-start !important;
            padding-top: 10vh;
          }

          .hero-title {
            font-size: 3.5rem;
            letter-spacing: -1px;
            margin-bottom: 1rem;
          }

          .hero-subtitle {
            font-size: 0.8rem;
            letter-spacing: 2px;
            margin-bottom: 1.2rem;
          }

          .hero-description {
            font-size: 0.85rem;
            margin-bottom: 2rem;
            padding: 0 1rem;
          }

          .hero-actions {
            gap: 1rem;
          }

          .hero-content {
            transform: translateY(0);
          }

          .hero-btn {
            padding: 0.8rem 1.5rem;
            font-size: 0.75rem;
            width: 100%;
            max-width: 250px;
          }
        }

        .video-modal-overlay {
           position: fixed;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           background: rgba(0, 0, 0, 0.9);
           z-index: 1000;
           display: flex;
           align-items: center;
           justify-content: center;
           padding: 2rem;
           animation: fadeIn 0.3s ease;
        }

        .video-modal-container {
           position: relative;
           width: 100%;
           max-width: 1200px;
           aspect-ratio: 16/9;
           background: #000;
           border-radius: 12px;
           overflow: hidden;
           box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }

        .modal-close {
           position: absolute;
           top: 1rem;
           right: 1.5rem;
           background: none;
           border: none;
           color: #fff;
           font-size: 2.5rem;
           line-height: 1;
           cursor: pointer;
           z-index: 1001;
           opacity: 0.7;
           transition: opacity 0.2s;
        }

        .modal-close:hover {
           opacity: 1;
        }

        .modal-video-iframe, .modal-video-native {
           width: 100%;
           height: 100%;
           display: block;
        }

        @keyframes fadeIn {
           from { opacity: 0; }
           to { opacity: 1; }
        }

        .hero-scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
          font-size: 2rem;
          opacity: 0.5;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
          40% {transform: translateX(-50%) translateY(-10px);}
          60% {transform: translateX(-50%) translateY(-5px);}
        }
      `}</style>
    </section>
  )
}
