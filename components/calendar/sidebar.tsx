"use client"

import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfDay, startOfMonth, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react"

import type { CalendarEvent, CalendarSettings } from "@/lib/calendar"
import { calendars, eventDate, eventStart, formatEventRange } from "@/lib/calendar"

// Tints each calendar's checkbox to match its own swatch (see calendar.color
// below) instead of every checkbox defaulting to the same blue.
const calendarAccent: Record<string, string> = {
  "my-calendar": "accent-cyan-500",
  work: "accent-emerald-500",
  personal: "accent-purple-500",
  family: "accent-orange-500",
}

type SidebarProps = {
  miniDate: Date
  currentDate: Date
  events: CalendarEvent[]
  settings: CalendarSettings
  visibleCalendars: Record<string, boolean>
  onMiniDateChange: (date: Date) => void
  onDateSelect: (date: Date) => void
  onToggleCalendar: (calendar: string, checked: boolean) => void
  onCreate: () => void
  onJumpToEvent: (event: CalendarEvent) => void
}

export function CalendarSidebar({ miniDate, currentDate, events, settings, visibleCalendars, onMiniDateChange, onDateSelect, onToggleCalendar, onCreate, onJumpToEvent }: SidebarProps) {
  const monthStart = startOfMonth(miniDate)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: settings.weekStartsOn }),
    end: endOfWeek(endOfMonth(miniDate), { weekStartsOn: settings.weekStartsOn }),
  })
  const weekdayNames = Array.from({ length: 7 }, (_, index) => format(addDays(startOfWeek(new Date(), { weekStartsOn: settings.weekStartsOn }), index), "EEEEE"))
  const upcoming = [...events]
    .filter((event) => eventStart(event) >= new Date() || (event.allDay && eventDate(event).getTime() === startOfDay(new Date()).getTime()))
    .sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime())
    .slice(0, 4)

  return (
    <aside className="flex h-full flex-col overflow-y-auto p-4">
      <button onClick={onCreate} className="mb-6 flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-white shadow-lg transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-white">
        <Plus className="h-5 w-5" /><span>Create</span>
      </button>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-white">{format(miniDate, "MMMM yyyy")}</h2>
          <div className="flex gap-1">
            <button aria-label="Previous mini calendar month" onClick={() => onMiniDateChange(addMonths(miniDate, -1))} className="rounded-full p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"><ChevronLeft className="h-4 w-4 text-white" /></button>
            <button aria-label="Next mini calendar month" onClick={() => onMiniDateChange(addMonths(miniDate, 1))} className="rounded-full p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"><ChevronRight className="h-4 w-4 text-white" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdayNames.map((day, index) => <div key={`${day}-${index}`} className="py-1 text-xs font-medium text-white/65">{day}</div>)}
          {days.map((day) => {
            const isSelected = isSameDay(day, currentDate)
            return <button key={day.toISOString()} aria-label={`Go to ${format(day, "MMMM d, yyyy")}`} onClick={() => onDateSelect(day)} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition focus:outline-none focus:ring-2 focus:ring-white ${!isSameMonth(day, miniDate) ? "text-white/25" : "text-white hover:bg-white/20"} ${isSelected ? "bg-blue-500 text-white" : ""} ${isToday(day) && !isSelected ? "ring-1 ring-blue-300" : ""}`}>{format(day, "d")}</button>
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-medium text-white">My calendars</h2>
        <div className="space-y-2.5">
          {calendars.map((calendar) => <label key={calendar.id} className="flex cursor-pointer items-center gap-3 text-sm text-white">
            <input type="checkbox" checked={visibleCalendars[calendar.id] ?? true} onChange={(event) => onToggleCalendar(calendar.id, event.target.checked)} className={`h-4 w-4 cursor-pointer rounded border-white/60 focus:outline-none focus:ring-2 focus:ring-white ${calendarAccent[calendar.id] || "accent-cyan-500"}`} />
            <span className={`h-3 w-3 rounded-sm ${calendar.color}`} />
            {calendar.name}
          </label>)}
        </div>
      </section>

      <section className="mt-auto border-t border-white/15 pt-5">
        <h2 className="mb-3 font-medium text-white">Upcoming</h2>
        {upcoming.length ? <div className="space-y-1">
          {upcoming.map((event) => <button key={event.id} onClick={() => onJumpToEvent(event)} className="w-full rounded-lg p-2 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">
            <div className="truncate text-sm font-medium text-white">{event.title}</div>
            <div className="flex items-center gap-1 text-xs text-white/60"><Clock className="h-3 w-3" />{format(eventDate(event), "EEE, MMM d")} · {formatEventRange(event, settings.timeFormat)}</div>
          </button>)}
        </div> : <p className="text-sm text-white/60">No upcoming events.</p>}
      </section>
    </aside>
  )
}
