"use client"

import { useCallback, useState } from "react"

export type GeolocationStatus = "idle" | "loading" | "granted" | "denied" | "unsupported" | "error"

export type GeolocationCoords = { latitude: number; longitude: number }

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>("idle")
  const [coords, setCoords] = useState<GeolocationCoords | null>(null)

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported")
      return
    }
    setStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        setStatus("granted")
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error")
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 15 * 60 * 1000 },
    )
  }, [])

  return { status, coords, request }
}
