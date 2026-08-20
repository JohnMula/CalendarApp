"use client"

import { useEffect, useState } from "react"

type CalendarLogoProps = {
  date: Date
  size?: number
  className?: string
}

// A small calendar-face icon that always shows today's date and "flips" its
// page whenever the day changes (including at midnight, since callers pass
// in the app's live clock). Remounting the <text> via `key` on every day
// change re-triggers the CSS flip animation from tailwind.config.js.
export function CalendarLogo({ date, size = 32, className = "" }: CalendarLogoProps) {
  const day = date.getDate()
  const [flipKey, setFlipKey] = useState(0)

  useEffect(() => {
    setFlipKey((key) => key + 1)
  }, [day])

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label={`Calendar, day ${day}`}>
      <rect x="1" y="3" width="30" height="28" rx="7" fill="#0f172a" />
      <path d="M8 3h16a7 7 0 0 1 7 7v1H1v-1a7 7 0 0 1 7-7Z" fill="#3b82f6" />
      <rect x="7" y="0" width="3.5" height="6" rx="1.5" fill="#1e293b" />
      <rect x="21.5" y="0" width="3.5" height="6" rx="1.5" fill="#1e293b" />
      <text
        key={flipKey}
        x="16"
        y="24"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="white"
        className="animate-calendar-flip"
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        {day}
      </text>
    </svg>
  )
}
