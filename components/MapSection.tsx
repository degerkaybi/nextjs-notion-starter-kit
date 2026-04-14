import React from 'react'

export default function MapSection() {
  return (
    <section className="map-section fade-in">
      <div className="map-text-content">
        <h2 className="map-section-title">Silent Steps Series</h2>
        <p className="map-description">
          The project ongoing since 2018 and over 600+ individual unique collages 
          created from 40+ different species were created and applied to the streets.
        </p>
      </div>

      <div className="map-container-wrapper">
        <div className="map-frame">
          <iframe
            src="https://www.google.com/maps/d/u/0/embed?mid=1tHoeYbM6SzK_Q1106KHegwvG7mPNBL2d&femb=1"
            width="100%"
            height="450"
            style={{ border: 0 }}
            title="Silent Steps Istanbul Map"
          ></iframe>
        </div>
      </div>

      <div className="map-quote-wrapper">
        <p className="map-quote">
          “All my collage works are original and unique. None of them are copies, prints, or stickers. 
          That is all organic. I make them with traditional methods.”
        </p>
      </div>
    </section>
  )
}
