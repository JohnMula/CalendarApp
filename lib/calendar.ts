import { addDays, format, parseISO, setHours, setMinutes } from "date-fns"

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
}

export const calendars = [
  { id: "my-calendar", name: "My Calendar", color: "bg-blue-500" },
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

export const createSampleEvents = (today: Date): CalendarEvent[] => {
  const makeEvent = (
    offset: number,
    title: string,
    startTime: string,
    endTime: string,
    calendar: string,
    extras: Partial<CalendarEvent> = {},
  ): CalendarEvent => ({
    id: `sample-${title.toLowerCase().replaceAll(" ", "-")}`,
    title,
    date: format(addDays(today, offset), "yyyy-MM-dd"),
    startTime,
    endTime,
    allDay: false,
    calendar,
    location: "",
    description: "",
    attendees: [],
    ...extras,
  })

  return [
    makeEvent(0, "Morning standup", "09:00", "09:30", "work", { location: "Slack huddle", attendees: ["Product team"], meetingLink: "https://meet.google.com/abc-defg-hij" }),
    makeEvent(0, "Lunch with Sarah", "12:30", "13:30", "personal", { location: "Café Nero" }),
    makeEvent(1, "Team meeting", "10:00", "11:00", "work", {
      location: "Conference Room A",
      description: "Weekly team sync-up",
      attendees: ["Alex Chen", "Priya Nair", "Sam Lee"],
      meetingLink: "https://meet.google.com/xyz-uvwx-rst",
      attachments: [
        { id: "att-agenda", name: "Weekly-sync-agenda.pdf" },
        { id: "att-notes", name: "Last-week-notes.docx" },
      ],
    }),
    makeEvent(1, "Project review", "14:00", "15:30", "work", { location: "Meeting Room 3" }),
    makeEvent(2, "Family dinner", "18:30", "20:00", "family", { location: "Home" }),
    makeEvent(3, "Design review", "11:00", "12:00", "work", { location: "Design Lab", attendees: ["Jordan Kim"], attachments: [{ id: "att-mockups", name: "Homepage-mockups.fig" }] }),
    makeEvent(4, "Gym", "07:30", "08:30", "personal"),
    makeEvent(5, "Client presentation", "13:00", "14:30", "work", { location: "Client office", attendees: ["Client team"], attachments: [{ id: "att-deck", name: "Client-deck-v3.pptx" }] }),
    makeEvent(7, "Plan next week", "09:30", "10:30", "my-calendar"),
    makeEvent(9, "Dad's birthday", "00:00", "23:59", "family", { allDay: true }),
  ]
}