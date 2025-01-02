"use client"

import { useState, useEffect } from 'react'

export function useGoogleMapsLoader() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true)
        return
      }
      timeoutId = setTimeout(checkGoogleMaps, 100)
    }

    checkGoogleMaps()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  return isLoaded
}