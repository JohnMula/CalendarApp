"use client"

import { useMemo, type CSSProperties } from "react"

import type { WeatherCondition } from "@/lib/weather"

type WeatherOverlayProps = {
  condition: WeatherCondition | null
}

// A fixed seed keeps drop/flake positions stable across re-renders instead of
// reshuffling every time the weather state refreshes.
function seeded(index: number, salt: number) {
  const value = Math.sin(index * salt) * 10000
  return value - Math.floor(value)
}

export function WeatherOverlay({ condition }: WeatherOverlayProps) {
  const rainDrops = useMemo(
    () =>
      Array.from({ length: 70 }, (_, index) => ({
        left: seeded(index, 12.9898) * 100,
        delay: seeded(index, 78.233) * 1.5,
        duration: 0.45 + seeded(index, 43.17) * 0.35,
      })),
    [],
  )

  const snowFlakes = useMemo(
    () =>
      Array.from({ length: 45 }, (_, index) => ({
        left: seeded(index, 34.11) * 100,
        delay: seeded(index, 91.7) * 10,
        duration: 9 + seeded(index, 15.3) * 7,
        size: 2 + seeded(index, 63.9) * 3,
        drift: seeded(index, 27.4) * 60 - 30,
      })),
    [],
  )

  const clouds = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => ({
        top: 6 + seeded(index, 8.3) * 28,
        width: 220 + seeded(index, 19.6) * 160,
        height: 60 + seeded(index, 5.1) * 40,
        delay: seeded(index, 41.2) * -70,
        duration: 75 + seeded(index, 22.8) * 45,
      })),
    [],
  )

  if (!condition || condition === "clear") return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden transition-opacity duration-1000" aria-hidden="true">
      {condition === "rain" &&
        rainDrops.map((drop, index) => (
          <span
            key={index}
            className="weather-rain-drop"
            style={{ left: `${drop.left}%`, animationDelay: `${drop.delay}s`, animationDuration: `${drop.duration}s` }}
          />
        ))}

      {condition === "snow" &&
        snowFlakes.map((flake, index) => {
          const style: CSSProperties & Record<string, string> = {
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            "--weather-drift": `${flake.drift}px`,
          }
          return <span key={index} className="weather-snow-flake" style={style} />
        })}

      {condition === "fog" && (
        <>
          <div className="weather-fog-band" style={{ top: "30%", height: "34%", background: "rgba(255,255,255,0.12)", animationDuration: "50s" }} />
          <div className="weather-fog-band" style={{ top: "62%", height: "26%", background: "rgba(255,255,255,0.08)", animationDuration: "65s", animationDelay: "-20s" }} />
        </>
      )}

      {(condition === "cloudy" || condition === "thunderstorm") &&
        clouds.map((cloud, index) => (
          <div
            key={index}
            className="weather-cloud"
            style={{ top: `${cloud.top}%`, width: `${cloud.width}px`, height: `${cloud.height}px`, animationDelay: `${cloud.delay}s`, animationDuration: `${cloud.duration}s` }}
          />
        ))}

      {condition === "thunderstorm" && <div className="weather-lightning" style={{ animationDuration: "14s" }} />}
    </div>
  )
}
