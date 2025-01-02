'use client'

import Script from 'next/script'

export default function GoogleMapsScript() {
  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
      strategy="beforeInteractive"
      onLoad={() => {
        console.log('Google Maps script loaded');
      }}
      onError={() => {
        console.error('Error loading Google Maps script');
      }}
    />
  )
}