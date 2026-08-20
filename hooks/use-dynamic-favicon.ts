"use client"

import { useEffect } from "react"

// Renders a small calendar-face icon with today's date onto a canvas and
// swaps it in as the browser tab favicon. Browsers don't support smoothly
// animating a favicon in place, so this updates it once whenever the
// day-of-month changes (including automatically at midnight, since the
// caller passes in the app's live clock) rather than trying to animate it.
export function useDynamicFavicon(day: number) {
  useEffect(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const radius = 14

    // Base rounded square
    ctx.beginPath()
    ctx.moveTo(radius, 2)
    ctx.arcTo(62, 2, 62, 62, radius)
    ctx.arcTo(62, 62, 2, 62, radius)
    ctx.arcTo(2, 62, 2, 2, radius)
    ctx.arcTo(2, 2, 62, 2, radius)
    ctx.closePath()
    ctx.fillStyle = "#0f172a"
    ctx.fill()

    // Header strip
    ctx.beginPath()
    ctx.moveTo(radius, 2)
    ctx.arcTo(62, 2, 62, 22, radius)
    ctx.lineTo(62, 22)
    ctx.lineTo(2, 22)
    ctx.arcTo(2, 2, 62, 2, radius)
    ctx.closePath()
    ctx.fillStyle = "#3b82f6"
    ctx.fill()

    // Binder rings
    ctx.fillStyle = "#1e293b"
    ctx.fillRect(14, 0, 7, 8)
    ctx.fillRect(43, 0, 7, 8)

    // Day number
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 30px system-ui, -apple-system, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(String(day), 32, 40)

    const dataUrl = canvas.toDataURL("image/png")

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement("link")
      link.rel = "icon"
      document.head.appendChild(link)
    }
    link.type = "image/png"
    link.href = dataUrl
  }, [day])
}
