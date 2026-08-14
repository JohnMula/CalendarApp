"use client"

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, startOfYear } from "date-fns"

import type { CalendarEvent, CalendarSettings } from "@/lib/calendar"
import { eventDate, formatEventRange, formatEventTime, matchesSearch, timeToMinutes } from "@/lib/calendar"

type SharedProps = {
  events: CalendarEvent[]
  settings: CalendarSettings
  searchQuery: string
  onOpenEvent: (event: CalendarEvent) => void
}

const calendarColor: Record<string, string> = {
  "my-calendar": "bg-blue-500",
  work: "bg-emerald-500",
  personal: "bg-purple-500",
  family: "bg-orange-500",
}

const searchClass = (event: CalendarEvent, searchQuery: string) => {
  if (!searchQuery.trim()) return ""
  return matchesSearch(event, searchQuery) ? "z-10 ring-2 ring-amber-200 opacity-100" : "opacity-35"
}

const hours = Array.from({ length: 13 }, (_, index) => index + 7)
const hourHeight = 64
const snapMinutes = 15
const lastTimeSlot = 23 * 60 + 45

type DragState = {
  event: CalendarEvent
  mode: "move" | "resize"
  pointerId: number
  initialDate: Date
  initialStart: number
  initialEnd: number
  startClientY: number
  originLeft: number
  previewDate: Date
  previewStart: number
  previewEnd: number
  offsetX: number
  offsetY: number
  moved: boolean
}

const minutesToTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum)

function snappedDelta(startY: number, currentY: number) {
  return Math.round(((currentY - startY) / hourHeight) * 60 / snapMinutes) * snapMinutes
}

function TimeGrid({ days, events, settings, searchQuery, onOpenEvent, onTimeSlot, onUpdateEvent }: SharedProps & { days: Date[]; onTimeSlot: (date: Date, time: string) => void; onUpdateEvent: (event: CalendarEvent, changes: Pick<CalendarEvent, "date" | "startTime" | "endTime">) => void }) {
  const gridStyle = { gridTemplateColumns: `56px repeat(${days.length}, minmax(120px, 1fr))` }
  const [dragging, setDragging] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const ignoreClickRef = useRef(false)

  const beginPointer = (pointerEvent: ReactPointerEvent<HTMLElement>, event: CalendarEvent, day: Date, mode: DragState["mode"]) => {
    if (pointerEvent.button !== 0) return
    const column = pointerEvent.currentTarget.closest<HTMLElement>("[data-calendar-day]")
    if (!column) return
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId)
    const nextDrag: DragState = {
      event,
      mode,
      pointerId: pointerEvent.pointerId,
      initialDate: day,
      initialStart: timeToMinutes(event.startTime),
      initialEnd: timeToMinutes(event.endTime),
      startClientY: pointerEvent.clientY,
      originLeft: column.getBoundingClientRect().left,
      previewDate: day,
      previewStart: timeToMinutes(event.startTime),
      previewEnd: timeToMinutes(event.endTime),
      offsetX: 0,
      offsetY: 0,
      moved: false,
    }
    dragRef.current = nextDrag
    setDragging(nextDrag)
  }

  const updatePointer = (pointerEvent: ReactPointerEvent<HTMLElement>) => {
    const activeDrag = dragRef.current
    if (!activeDrag || activeDrag.pointerId !== pointerEvent.pointerId) return
    const delta = snappedDelta(activeDrag.startClientY, pointerEvent.clientY)
    const nextDrag = { ...activeDrag }

    if (activeDrag.mode === "resize") {
      nextDrag.previewEnd = clamp(activeDrag.initialEnd + delta, activeDrag.initialStart + snapMinutes, lastTimeSlot)
      nextDrag.moved = nextDrag.previewEnd !== activeDrag.initialEnd
    } else {
      const duration = activeDrag.initialEnd - activeDrag.initialStart
      nextDrag.previewStart = clamp(activeDrag.initialStart + delta, 0, lastTimeSlot - duration)
      nextDrag.previewEnd = nextDrag.previewStart + duration
      const targetColumn = Array.from(document.querySelectorAll<HTMLElement>("[data-calendar-day]")).find((column) => {
        const bounds = column.getBoundingClientRect()
        return pointerEvent.clientX >= bounds.left && pointerEvent.clientX <= bounds.right && pointerEvent.clientY >= bounds.top && pointerEvent.clientY <= bounds.bottom
      })
      const targetDate = targetColumn?.dataset.calendarDay
      nextDrag.previewDate = targetDate ? parseISO(targetDate) : activeDrag.initialDate
      nextDrag.offsetX = targetColumn ? targetColumn.getBoundingClientRect().left - activeDrag.originLeft : 0
      nextDrag.offsetY = ((nextDrag.previewStart - activeDrag.initialStart) / 60) * hourHeight
      nextDrag.moved = nextDrag.previewStart !== activeDrag.initialStart || !isSameDay(nextDrag.previewDate, activeDrag.initialDate)
    }

    dragRef.current = nextDrag
    setDragging(nextDrag)
  }

  const finishPointer = (pointerEvent: ReactPointerEvent<HTMLElement>) => {
    updatePointer(pointerEvent)
    const activeDrag = dragRef.current
    if (!activeDrag || activeDrag.pointerId !== pointerEvent.pointerId) return
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId)
    if (activeDrag.moved) {
      onUpdateEvent(activeDrag.event, {
        date: format(activeDrag.previewDate, "yyyy-MM-dd"),
        startTime: minutesToTime(activeDrag.previewStart),
        endTime: minutesToTime(activeDrag.previewEnd),
      })
      ignoreClickRef.current = true
      window.requestAnimationFrame(() => { ignoreClickRef.current = false })
    }
    dragRef.current = null
    setDragging(null)
  }

  const cancelPointer = () => {
    dragRef.current = null
    setDragging(null)
  }

  return (
    <div className="overflow-auto">
      <div className="min-w-[620px] overflow-hidden rounded-xl border border-white/20 bg-white/20 shadow-xl backdrop-blur-lg">
        <div className="grid border-b border-white/20" style={gridStyle}>
          <div />
          {days.map((day) => <div key={day.toISOString()} className="border-l border-white/20 p-2 text-center">
            <div className="text-xs font-medium text-white/70">{format(day, "EEE").toUpperCase()}</div>
            <div className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-lg font-medium text-white ${isToday(day) ? "bg-blue-500" : ""}`}>{format(day, "d")}</div>
          </div>)}
        </div>
        <div className="grid border-b border-white/15" style={gridStyle}>
          <div className="p-2 text-right text-xs text-white/45">All day</div>
          {days.map((day) => <div key={day.toISOString()} className="min-h-10 border-l border-white/15 p-1">
            {events.filter((event) => event.allDay && isSameDay(eventDate(event), day)).map((event) => <EventChip key={event.id} event={event} settings={settings} searchQuery={searchQuery} onOpenEvent={onOpenEvent} compact />)}
          </div>)}
        </div>
        <div className="grid" style={gridStyle}>
          <div className="text-white/70">
            {hours.map((hour) => <div key={hour} className="h-16 border-b border-white/10 pr-2 pt-1 text-right text-xs">{formatEventTime(`${String(hour).padStart(2, "0")}:00`, settings.timeFormat)}</div>)}
          </div>
          {days.map((day) => {
            const timedEvents = events.filter((event) => !event.allDay && isSameDay(eventDate(event), day))
            return <div key={day.toISOString()} data-calendar-day={format(day, "yyyy-MM-dd")} className="relative border-l border-white/20">
              {hours.map((hour) => <button key={hour} aria-label={`Create event at ${format(day, "MMMM d")} ${formatEventTime(`${String(hour).padStart(2, "0")}:00`, settings.timeFormat)}`} onClick={() => onTimeSlot(day, `${String(hour).padStart(2, "0")}:00`)} className="block h-16 w-full border-b border-white/10 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300" />)}
              {timedEvents.map((event) => {
                const isDragging = dragging?.event.id === event.id
                const displayEnd = isDragging && dragging.mode === "resize" ? dragging.previewEnd : timeToMinutes(event.endTime)
                const top = ((timeToMinutes(event.startTime) - 7 * 60) / 60) * hourHeight
                const height = Math.max(((displayEnd - timeToMinutes(event.startTime)) / 60) * hourHeight, 25)
                const transform = isDragging ? `translate(${dragging.offsetX}px, ${dragging.mode === "move" ? dragging.offsetY : 0}px)` : undefined
                return <div key={event.id} role="button" tabIndex={0} onClick={(clickEvent) => { clickEvent.stopPropagation(); if (!ignoreClickRef.current) onOpenEvent(event) }} onKeyDown={(keyboardEvent) => { if (keyboardEvent.key === "Enter") onOpenEvent(event) }} onPointerDown={(pointerEvent) => beginPointer(pointerEvent, event, day, "move")} onPointerMove={updatePointer} onPointerUp={finishPointer} onPointerCancel={cancelPointer} className={`absolute left-1 right-1 touch-none select-none overflow-hidden rounded-md p-1.5 text-left text-xs text-white shadow-md transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white ${isDragging ? "z-20 cursor-grabbing opacity-90 transition-none" : "z-10 cursor-grab"} ${calendarColor[event.calendar] || "bg-blue-500"} ${searchClass(event, searchQuery)}`} style={{ top: `${top}px`, height: `${height}px`, transform }}>
                  <span className="block truncate font-semibold">{event.title}</span><span className="block truncate text-[10px] opacity-85">{formatEventRange({ ...event, endTime: minutesToTime(displayEnd) }, settings.timeFormat)}</span>
                  <div role="separator" aria-label={`Resize ${event.title}`} title="Drag the bottom edge to resize" onPointerDown={(pointerEvent) => { pointerEvent.stopPropagation(); beginPointer(pointerEvent, event, day, "resize") }} onPointerMove={(pointerEvent) => { pointerEvent.stopPropagation(); updatePointer(pointerEvent) }} onPointerUp={(pointerEvent) => { pointerEvent.stopPropagation(); finishPointer(pointerEvent) }} onPointerCancel={cancelPointer} className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize border-t border-white/30 bg-white/10 hover:bg-white/35" />
                </div>
              })}
            </div>
          })}
        </div>
      </div>
    </div>
  )
}

function EventChip({ event, settings, searchQuery, onOpenEvent, compact = false }: { event: CalendarEvent; settings: CalendarSettings; searchQuery: string; onOpenEvent: (event: CalendarEvent) => void; compact?: boolean }) {
  return <button onClick={(clickEvent) => { clickEvent.stopPropagation(); onOpenEvent(event) }} className={`flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-xs text-white transition hover:bg-white/20 ${searchClass(event, searchQuery)}`}>
    <span className={`h-2 w-2 shrink-0 rounded-full ${calendarColor[event.calendar] || "bg-blue-500"}`} />
    <span className="truncate">{compact ? event.title : `${event.allDay ? "All day" : formatEventTime(event.startTime, settings.timeFormat)} ${event.title}`}</span>
  </button>
}

export function DayView({ currentDate, onTimeSlot, onUpdateEvent, ...props }: SharedProps & { currentDate: Date; onTimeSlot: (date: Date, time: string) => void; onUpdateEvent: (event: CalendarEvent, changes: Pick<CalendarEvent, "date" | "startTime" | "endTime">) => void }) {
  return <TimeGrid days={[currentDate]} onTimeSlot={onTimeSlot} onUpdateEvent={onUpdateEvent} {...props} />
}

export function WeekView({ currentDate, settings, ...props }: SharedProps & { currentDate: Date; onTimeSlot: (date: Date, time: string) => void; onUpdateEvent: (event: CalendarEvent, changes: Pick<CalendarEvent, "date" | "startTime" | "endTime">) => void }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: settings.weekStartsOn })
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  return <TimeGrid days={days} settings={settings} {...props} />
}

export function MonthView({ currentDate, events, settings, searchQuery, onOpenEvent, onDaySelect }: SharedProps & { currentDate: Date; onDaySelect: (date: Date) => void }) {
  const monthStart = startOfMonth(currentDate)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: settings.weekStartsOn }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: settings.weekStartsOn }),
  })
  const weekdayNames = Array.from({ length: 7 }, (_, index) => format(addDays(startOfWeek(new Date(), { weekStartsOn: settings.weekStartsOn }), index), "EEEE"))
  return (
    <div className="overflow-auto">
      <div className="min-w-[700px] overflow-hidden rounded-xl border border-white/20 bg-white/20 shadow-xl backdrop-blur-lg">
        <div className="grid grid-cols-7 border-b border-white/20">{weekdayNames.map((day) => <div key={day} className="border-l border-white/15 p-2 text-center text-xs font-medium text-white/70 first:border-l-0">{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = events.filter((event) => isSameDay(eventDate(event), day))
            const displayed = dayEvents.slice(0, 3)
            return <div key={day.toISOString()} role="button" tabIndex={0} onClick={() => onDaySelect(day)} onKeyDown={(keyboardEvent) => { if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") { keyboardEvent.preventDefault(); onDaySelect(day) } }} className={`min-h-28 border-b border-l border-white/15 p-2 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300 ${!isSameMonth(day, currentDate) ? "bg-black/10 text-white/35" : ""}`}>
              <span className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm text-white ${isToday(day) ? "bg-blue-500" : ""}`}>{format(day, "d")}</span>
              <div className="space-y-0.5">{displayed.map((event) => <EventChip key={event.id} event={event} settings={settings} searchQuery={searchQuery} onOpenEvent={onOpenEvent} />)}</div>
              {dayEvents.length > displayed.length && <span className="block px-1.5 pt-1 text-xs text-white/65">+{dayEvents.length - displayed.length} more</span>}
            </div>
          })}
        </div>
      </div>
    </div>
  )
}

export function YearView({ currentDate, settings, onSelectMonth }: { currentDate: Date; settings: CalendarSettings; onSelectMonth: (date: Date) => void }) {
  const yearStart = startOfYear(currentDate)
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 12 }, (_, monthIndex) => {
      const month = addMonths(yearStart, monthIndex)
      const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: settings.weekStartsOn }), end: endOfWeek(endOfMonth(month), { weekStartsOn: settings.weekStartsOn }) })
      return <button key={monthIndex} onClick={() => onSelectMonth(month)} className={`rounded-xl border border-white/20 bg-white/15 p-3 text-left shadow-lg backdrop-blur-lg transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-blue-300 ${isSameMonth(month, currentDate) ? "ring-1 ring-blue-300" : ""}`}>
        <div className="mb-2 text-center text-sm font-semibold text-white">{format(month, "MMMM")}</div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-[10px]">{Array.from({ length: 7 }, (_, index) => <span key={index} className="text-white/45">{format(addDays(startOfWeek(yearStart, { weekStartsOn: settings.weekStartsOn }), index), "EEEEE")}</span>)}{days.map((day) => <span key={day.toISOString()} className={`${!isSameMonth(day, month) ? "text-white/20" : "text-white/80"} ${isToday(day) ? "rounded-full bg-blue-500 text-white" : ""}`}>{format(day, "d")}</span>)}</div>
      </button>
    })}
  </div>
}
