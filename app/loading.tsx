'use client'

import React from 'react'

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-bar shadow-glow" />
      <div className="loading-spinner">
        <div className="spinner-inner" />
      </div>
      <style jsx>{`
        .loading-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #000;
          z-index: 9999;
          pointer-events: none;
        }

        .loading-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #fff, transparent);
          width: 100%;
          animation: loading-bar-anim 2s infinite ease-in-out;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(0deg, rgba(255,255,255,0.1) 33%, #fff 100%);
          animation: spin 1s linear infinite;
        }

        .spinner-inner {
          width: 100%;
          height: 100%;
          background: #000;
          border-radius: 50%;
        }

        @keyframes loading-bar-anim {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .shadow-glow {
          box-shadow: 0 0 15px rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  )
}
