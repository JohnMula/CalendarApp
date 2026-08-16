"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { addDays, addMonths, addWeeks, addYears, endOfWeek, format, isSameDay, isSameMonth, isSameYear, isToday, startOfDay, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Menu, Moon, MoonStar, Search, Settings, Sparkles, Sun, Sunrise, Sunset, X } from "lucide-react"
import { useTheme } from "next-themes"

import { DayView, MonthView, WeekView, YearView } from "@/components/calendar/calendar-views"
import { EventDialog } from "@/components/calendar/event-dialog"
import { ProfileMenu } from "@/components/calendar/profile-menu"
import { CalendarSidebar } from "@/components/calendar/sidebar"
import { SettingsDialog } from "@/components/calendar/settings-dialog"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/sonner"
import { calendars, createSampleEvents, defaultSettings, eventDate, eventStart, formatEventTime, matchesSearch, type CalendarEvent, type CalendarSettings, type CalendarView } from "@/lib/calendar"
import { dayPeriods, getDayPeriod, periodGradients, periodTints, scenes, type DayPeriod } from "@/lib/scenes"

const periodIcons: Record<DayPeriod, typeof Sun> = {
  dawn: Sunrise,
  morning: Sun,
  midday: Sun,
  golden: Sunset,
  dusk: MoonStar,
  night: Moon,
}

const EVENTS_STORAGE_KEY = "glass-calendar-events"
const SETTINGS_STORAGE_KEY = "glass-calendar-settings"
const VISIBILITY_STORAGE_KEY = "glass-calendar-visibility"

const defaultVisibility = Object.fromEntries(calendars.map((calendar) => [calendar.id, true])) as Record<string, boolean>

function readStored<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

function viewLabel(date: Date, view: CalendarView, weekStartsOn: 0 | 1) {
  if (view === "day") return format(date, "EEEE, MMMM d, yyyy")
  if (view === "month") return format(date, "MMMM yyyy")
  if (view === "year") return format(date, "yyyy")
  const start = startOfWeek(date, { weekStartsOn })
  const end = endOfWeek(date, { weekStartsOn })
  if (isSameMonth(start, end)) return `${format(start, "MMMM d")}–${format(end, "d, yyyy")}`
  if (isSameYear(start, end)) return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`
}

export default function Home() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [miniDate, setMiniDate] = useState(() => new Date())
  const [now, setNow] = useState(() => new Date())
  const [previewPeriod, setPreviewPeriod] = useState<DayPeriod | null>(null)
  const [view, setView] = useState<CalendarView>("week")
  const [events, setEvents] = useState<CalendarEvent[]>(() => createSampleEvents(new Date()))
  const [settings, setSettings] = useState<CalendarSettings>(defaultSettings)
  const [visibleCalendars, setVisibleCalendars] = useState(defaultVisibility)
  const [hydrated, setHydrated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [draftDate, setDraftDate] = useState(() => new Date())
  const [draftTime, setDraftTime] = useState<string | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    setIsLoaded(true)
    const popupTimer = window.setTimeout(() => setShowAIPopup(true), 3000)
    return () => window.clearTimeout(popupTimer)
  }, [])

  useEffect(() => {
    const clockTimer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(clockTimer)
  }, [])

  useEffect(() => {
    const storedSettings = readStored<CalendarSettings>(SETTINGS_STORAGE_KEY)
    const storedEvents = readStored<CalendarEvent[]>(EVENTS_STORAGE_KEY)
    const storedVisibility = readStored<Record<string, boolean>>(VISIBILITY_STORAGE_KEY)
    if (storedSettings) {
      const nextSettings = { ...defaultSettings, ...storedSettings }
      setSettings(nextSettings)
      setView(nextSettings.defaultView)
      setTheme(nextSettings.theme)
    }
    if (storedEvents) setEvents(storedEvents)
    if (storedVisibility) setVisibleCalendars({ ...defaultVisibility, ...storedVisibility })
    setHydrated(true)
  // Local preferences are a one-time client-side hydration step. `setTheme`
  // intentionally changes identity when the theme changes, so it must not
  // retrigger this loader when a user selects Light, Dark, or System.
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    window.localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(visibleCalendars))
  }, [events, hydrated, settings, visibleCalendars])

  const openCreate = (date = currentDate, time?: string) => {
    setEditingEvent(null)
    setDraftDate(date)
    setDraftTime(time)
    setEventDialogOpen(true)
  }

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event)
    setDraftDate(eventDate(event))
    setDraftTime(undefined)
    setEventDialogOpen(true)
  }

  const updateEventTiming = (event: CalendarEvent, changes: Pick<CalendarEvent, "date" | "startTime" | "endTime">) => {
    setEvents((previous) => previous.map((currentEvent) => currentEvent.id === event.id ? { ...currentEvent, ...changes } : currentEvent))
  }

  const navigate = (direction: -1 | 1) => {
    const nextDate = view === "day" ? addDays(currentDate, direction) : view === "week" ? addWeeks(currentDate, direction) : view === "month" ? addMonths(currentDate, direction) : addYears(currentDate, direction)
    setCurrentDate(nextDate)
    setMiniDate(nextDate)
  }

  const goToDate = (date: Date, nextView: CalendarView = "day") => {
    setCurrentDate(date)
    setMiniDate(date)
    setView(nextView)
    setSidebarOpen(false)
  }

  const visibleEvents = useMemo(() => events.filter((event) => visibleCalendars[event.calendar] ?? true), [events, visibleCalendars])
  const searchResults = useMemo(() => searchQuery.trim() ? visibleEvents.filter((event) => matchesSearch(event, searchQuery)).slice(0, 6) : [], [searchQuery, visibleEvents])
  const assistantSuggestion = useMemo(() => {
    const now = new Date()
    const today = startOfDay(now)
    const upcoming = visibleEvents
      .filter((event) => event.allDay ? eventDate(event) >= today : eventStart(event) >= now)
      .sort((first, second) => eventStart(first).getTime() - eventStart(second).getTime())
    const nextEvent = upcoming[0]
    const todayEvents = visibleEvents.filter((event) => isSameDay(eventDate(event), now))

    if (!nextEvent) {
      return {
        event: undefined,
        action: "Create an event",
        message: todayEvents.length
          ? "You’re all caught up for today. There are no more events on your calendar."
          : "Your calendar is clear. Add an event when you’re ready to plan something.",
      }
    }

    const eventTime = nextEvent.allDay ? "all day" : formatEventTime(nextEvent.startTime, settings.timeFormat)
    if (isToday(eventDate(nextEvent))) {
      const remainingToday = upcoming.filter((event) => isToday(eventDate(event))).length
      return {
        event: nextEvent,
        action: "Open event",
        message: `Next up: “${nextEvent.title}” at ${eventTime} today.${remainingToday > 1 ? ` You have ${remainingToday - 1} more event${remainingToday === 2 ? "" : "s"} after that.` : " It’s your last event for today."}`,
      }
    }

    return {
      event: nextEvent,
      action: "View event",
      message: `Your next event is “${nextEvent.title}” on ${format(eventDate(nextEvent), "EEEE, MMMM d")} at ${eventTime}. Your calendar is clear until then.`,
    }
  }, [settings.timeFormat, visibleEvents])

  useEffect(() => {
    if (!showAIPopup) return
    setTypedText("")
    let index = 0
    const typingTimer = window.setInterval(() => {
      index += 1
      setTypedText(assistantSuggestion.message.slice(0, index))
      if (index >= assistantSuggestion.message.length) window.clearInterval(typingTimer)
    }, 18)
    return () => window.clearInterval(typingTimer)
  }, [assistantSuggestion.message, showAIPopup])

  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      const target = keyboardEvent.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
      if (keyboardEvent.key === "n") { keyboardEvent.preventDefault(); openCreate() }
      if (keyboardEvent.key === "t") { keyboardEvent.preventDefault(); goToDate(new Date(), view) }
      if (keyboardEvent.key === "/") { keyboardEvent.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  const activeScene = useMemo(() => scenes.find((scene) => scene.id === settings.scene) ?? scenes[0], [settings.scene])
  const livePeriod = useMemo(() => getDayPeriod(now), [now])
  const activePeriod = previewPeriod ?? livePeriod
  const litPeriod = settings.dynamicLighting ? activePeriod : "midday"
  const PeriodIcon = periodIcons[activePeriod]
  const periodLabel = dayPeriods.find((period) => period.id === activePeriod)?.label ?? ""

  const sidebarProps = {
    miniDate,
    currentDate,
    events: visibleEvents,
    settings,
    visibleCalendars,
    onMiniDateChange: setMiniDate,
    onDateSelect: (date: Date) => goToDate(date),
    onToggleCalendar: (calendar: string, checked: boolean) => setVisibleCalendars((previous) => previous[calendar] === checked ? previous : { ...previous, [calendar]: checked }),
    onCreate: () => openCreate(),
    onJumpToEvent: (event: CalendarEvent) => goToDate(eventDate(event)),
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {activeScene.image && <Image key={activeScene.id} src={activeScene.image} alt={`${activeScene.name} backdrop`} fill className="object-cover" priority />}
      <div
        className="absolute inset-0 transition-[background] duration-1000 ease-in-out"
        style={{ background: activeScene.image ? periodTints[litPeriod] : periodGradients[litPeriod] }}
      />
      <div className={`absolute inset-0 ${mounted && resolvedTheme === "dark" ? "bg-slate-950/45" : "bg-sky-950/15"}`} />

      <header className={`relative z-30 flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-8 opacity-0 ${isLoaded ? "animate-fade-in" : ""}`} style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} aria-label="Toggle sidebar" className="rounded-md p-1 text-white drop-shadow-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white lg:hidden"><Menu className="h-6 w-6" /></button>
          <span className="text-xl font-semibold text-white drop-shadow-lg sm:text-2xl">Calendar</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <input ref={searchRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} type="search" placeholder="Search events" className="w-48 rounded-full border border-white/20 bg-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 lg:w-64" />
            {searchResults.length > 0 && <div className="absolute right-0 top-11 z-40 w-72 overflow-hidden rounded-xl border border-white/20 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-xl">
              <Command><CommandList><CommandGroup heading="Matching events">{searchResults.map((event) => <CommandItem key={event.id} value={event.title} onSelect={() => { goToDate(eventDate(event)); setSearchQuery("") }}><span className="truncate">{event.title}</span><span className="ml-auto text-xs text-muted-foreground">{format(eventDate(event), "MMM d")}</span></CommandItem>)}</CommandGroup><CommandEmpty>No matching events.</CommandEmpty></CommandList></Command>
            </div>}
          </div>
          {settings.dynamicLighting && <div className="hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm sm:flex">
            <PeriodIcon className="h-3.5 w-3.5" />
            {periodLabel}{previewPeriod && <span className="text-white/60">· preview</span>}
          </div>}
          <button onClick={() => setMobileSearchOpen((isOpen) => !isOpen)} aria-label="Search events" className="rounded-md p-1 text-white drop-shadow-md hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white sm:hidden"><Search className="h-6 w-6" /></button>
          <button onClick={() => setSettingsOpen(true)} aria-label="Settings" className="rounded-md p-1 text-white drop-shadow-md hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"><Settings className="h-6 w-6" /></button>
          <ProfileMenu />
        </div>
        {mobileSearchOpen && <div className="absolute left-4 right-4 top-[calc(100%-0.25rem)] rounded-xl border border-white/20 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl sm:hidden">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} type="search" placeholder="Search events" className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50" /></div>
          {searchQuery.trim() && <Command className="mt-2 bg-transparent text-white"><CommandList><CommandGroup heading="Matching events">{searchResults.map((event) => <CommandItem key={event.id} value={event.title} onSelect={() => { goToDate(eventDate(event)); setSearchQuery(""); setMobileSearchOpen(false) }}><span className="truncate">{event.title}</span><span className="ml-auto text-xs text-white/60">{format(eventDate(event), "MMM d")}</span></CommandItem>)}</CommandGroup><CommandEmpty className="text-white/70">No matching events.</CommandEmpty></CommandList></Command>}
        </div>}
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-5rem)]">
        <div className={`hidden w-64 shrink-0 border-r border-white/20 bg-white/10 shadow-xl backdrop-blur-lg lg:block opacity-0 ${isLoaded ? "animate-fade-in" : ""}`} style={{ animationDelay: "0.4s" }}><CalendarSidebar {...sidebarProps} /></div>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}><SheetContent side="left" className="w-[18rem] border-white/20 bg-slate-950/95 p-0"><CalendarSidebar {...sidebarProps} /></SheetContent></Sheet>

        <section className={`flex min-w-0 flex-1 flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""}`} style={{ animationDelay: "0.6s" }}>
          <div className="flex flex-col gap-3 border-b border-white/20 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <button onClick={() => goToDate(new Date(), view)} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-white">Today</button>
              <div className="flex rounded-md bg-white/5">
                <button aria-label="Previous period" onClick={() => navigate(-1)} className="rounded-l-md p-2 text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"><ChevronLeft className="h-5 w-5" /></button>
                <button aria-label="Next period" onClick={() => navigate(1)} className="rounded-r-md p-2 text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"><ChevronRight className="h-5 w-5" /></button>
              </div>
              <h1 className="text-lg font-semibold text-white sm:text-xl">{viewLabel(currentDate, view, settings.weekStartsOn)}</h1>
            </div>
            <div className="flex w-fit items-center gap-1 rounded-lg bg-white/10 p-1">
              {(["day", "week", "month", "year"] as const).map((option) => <button key={option} onClick={() => setView(option)} className={`rounded px-3 py-1.5 text-sm capitalize text-white transition focus:outline-none focus:ring-2 focus:ring-white ${view === option ? "bg-white/25" : "hover:bg-white/10"}`}>{option}</button>)}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {view === "day" && <DayView currentDate={currentDate} events={visibleEvents} settings={settings} searchQuery={searchQuery} onOpenEvent={openEdit} onTimeSlot={openCreate} onUpdateEvent={updateEventTiming} />}
            {view === "week" && <WeekView currentDate={currentDate} events={visibleEvents} settings={settings} searchQuery={searchQuery} onOpenEvent={openEdit} onTimeSlot={openCreate} onUpdateEvent={updateEventTiming} />}
            {view === "month" && <MonthView currentDate={currentDate} events={visibleEvents} settings={settings} searchQuery={searchQuery} onOpenEvent={openEdit} onDaySelect={(date) => goToDate(date)} />}
            {view === "year" && <YearView currentDate={currentDate} settings={settings} onSelectMonth={(date) => goToDate(date, "month")} />}
          </div>
        </section>
      </main>

      {showAIPopup && <div className="fixed bottom-4 right-4 z-20 w-[calc(100%-2rem)] max-w-md sm:bottom-8 sm:right-8">
        <div className="relative rounded-2xl border border-blue-300/30 bg-gradient-to-br from-blue-400/30 via-blue-500/30 to-blue-600/30 p-5 text-white shadow-xl backdrop-blur-lg sm:p-6">
          <button onClick={() => setShowAIPopup(false)} aria-label="Close assistant suggestion" className="absolute right-2 top-2 rounded p-1 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"><X className="h-5 w-5" /></button>
          <div className="flex gap-3"><Sparkles className="mt-1 h-5 w-5 shrink-0 text-blue-200" /><div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-100/80">Calendar assistant</p><p className="min-h-16 text-sm font-light sm:text-base">{typedText}</p></div></div>
          <div className="mt-5 flex gap-3"><button onClick={() => { if (assistantSuggestion.event) goToDate(eventDate(assistantSuggestion.event)); else openCreate(); setShowAIPopup(false) }} className="flex-1 rounded-xl bg-white/20 py-2.5 text-sm font-medium hover:bg-white/30">{assistantSuggestion.action}</button><button onClick={() => setShowAIPopup(false)} className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-medium hover:bg-white/20">Dismiss</button></div>
        </div>
      </div>}

      <EventDialog open={eventDialogOpen} onOpenChange={setEventDialogOpen} event={editingEvent} initialDate={draftDate} initialTime={draftTime} settings={settings} onSave={(nextEvent) => setEvents((previous) => previous.some((event) => event.id === nextEvent.id) ? previous.map((event) => event.id === nextEvent.id ? nextEvent : event) : [...previous, nextEvent])} onDelete={(id) => setEvents((previous) => previous.filter((event) => event.id !== id))} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onChange={setSettings} previewPeriod={previewPeriod} onPreviewPeriod={setPreviewPeriod} />
      <Toaster position="bottom-center" richColors />
    </div>
  )
}
