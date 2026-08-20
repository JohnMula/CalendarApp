import { format, parseISO, setHours, setMinutes } from "date-fns"

import type { SceneId } from "@/lib/scenes"

export type CalendarView = "day" | "week" | "month" | "year"
export type TimeFormat = "12" | "24"

export type CalendarAttachment = {
  id: string
  name: string
  url?: string
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  allDay: boolean
  calendar: string
  location: string
  description: string
  attendees: string[]
  meetingLink?: string
  attachments?: CalendarAttachment[]
}

export type CalendarSettings = {
  theme: "light" | "dark" | "system"
  defaultView: CalendarView
  weekStartsOn: 0 | 1
  timeFormat: TimeFormat
  defaultDuration: 30 | 60
  scene: SceneId
  dynamicLighting: boolean
  liveWeather: boolean
}

// Each calendar's swatch is deliberately distinct from the app's own UI accent
// color (blue-500, used for buttons/focus rings/"today" highlights) so an event
// chip is never mistaken for interactive chrome.
export const calendars = [
  { id: "my-calendar", name: "My Calendar", color: "bg-cyan-500" },
  { id: "work", name: "Work", color: "bg-emerald-500" },
  { id: "personal", name: "Personal", color: "bg-purple-500" },
  { id: "family", name: "Family", color: "bg-orange-500" },
] as const

export const defaultSettings: CalendarSettings = {
  theme: "system",
  defaultView: "week",
  weekStartsOn: 0,
  timeFormat: "12",
  defaultDuration: 60,
  scene: "mountain",
  dynamicLighting: true,
  liveWeather: false,
}

export const eventDate = (event: CalendarEvent) => parseISO(event.date)

export const eventStart = (event: CalendarEvent) =>
  event.allDay ? eventDate(event) : parseISO(`${event.date}T${event.startTime}:00`)

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export const formatEventTime = (time: string, timeFormat: TimeFormat) => {
  const [hours, minutes] = time.split(":").map(Number)
  const date = setMinutes(setHours(new Date(2000, 0, 1), hours), minutes)
  return format(date, timeFormat === "24" ? "HH:mm" : "h:mm a")
}

export const formatEventRange = (event: CalendarEvent, timeFormat: TimeFormat) =>
  event.allDay
    ? "All day"
    : `${formatEventTime(event.startTime, timeFormat)} – ${formatEventTime(event.endTime, timeFormat)}`

export const matchesSearch = (event: CalendarEvent, query: string) => {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [event.title, event.location, event.description, event.attendees.join(",")]
    .join(" ")
    .toLowerCase()
    .includes(needle)
}