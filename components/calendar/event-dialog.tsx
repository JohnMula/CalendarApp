"use client"

import { useEffect, useState } from "react"
import { addMinutes, format, parse } from "date-fns"
import { AlignLeft, CalendarIcon, Clock, ExternalLink, MapPin, Paperclip, Pencil, Plus, Trash2, Users, Video, X, type LucideIcon } from "lucide-react"
import { toast } from "sonner"

import type { CalendarAttachment, CalendarEvent, CalendarSettings } from "@/lib/calendar"
import { calendars, eventDate, formatEventRange, formatEventTime } from "@/lib/calendar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type EventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  initialDate: Date
  initialTime?: string
  settings: CalendarSettings
  onSave: (event: CalendarEvent) => void
  onDelete: (id: string) => void
}

type DialogMode = "view" | "edit"

const durationEnd = (start: string, duration: number) => {
  return format(addMinutes(parse(start, "HH:mm", new Date()), duration), "HH:mm")
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2)
  const minutes = index % 2 === 0 ? "00" : "30"
  return `${String(hours).padStart(2, "0")}:${minutes}`
})

const newAttachmentId = () => globalThis.crypto?.randomUUID?.() || `att-${Date.now()}-${Math.round(Math.random() * 1e6)}`

function Section({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/45">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {children}
    </div>
  )
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  initialDate,
  initialTime,
  settings,
  onSave,
  onDelete,
}: EventDialogProps) {
  const [mode, setMode] = useState<DialogMode>("view")
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(initialDate)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [allDay, setAllDay] = useState(false)
  const [calendar, setCalendar] = useState("my-calendar")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [attendees, setAttendees] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [attachments, setAttachments] = useState<CalendarAttachment[]>([])
  const [attachmentDraft, setAttachmentDraft] = useState("")

  useEffect(() => {
    if (!open) return
    setMode(event ? "view" : "edit")
    setAttachmentDraft("")

    if (event) {
      setTitle(event.title)
      setDate(eventDate(event))
      setStartTime(event.startTime)
      setEndTime(event.endTime)
      setAllDay(event.allDay)
      setCalendar(event.calendar)
      setLocation(event.location)
      setDescription(event.description)
      setAttendees(event.attendees.join(", "))
      setMeetingLink(event.meetingLink || "")
      setAttachments(event.attachments || [])
      return
    }

    const nextStart = initialTime || "09:00"
    setTitle("")
    setDate(initialDate)
    setStartTime(nextStart)
    setEndTime(durationEnd(nextStart, settings.defaultDuration))
    setAllDay(false)
    setCalendar("my-calendar")
    setLocation("")
    setDescription("")
    setAttendees("")
    setMeetingLink("")
    setAttachments([])
  }, [event, initialDate, initialTime, open, settings.defaultDuration])

  const cancelEdit = () => {
    if (!event) {
      onOpenChange(false)
      return
    }
    // Discard any unsaved changes and drop back to the read-only view.
    setTitle(event.title)
    setDate(eventDate(event))
    setStartTime(event.startTime)
    setEndTime(event.endTime)
    setAllDay(event.allDay)
    setCalendar(event.calendar)
    setLocation(event.location)
    setDescription(event.description)
    setAttendees(event.attendees.join(", "))
    setMeetingLink(event.meetingLink || "")
    setAttachments(event.attachments || [])
    setAttachmentDraft("")
    setMode("view")
  }

  const addAttachmentDraft = () => {
    const trimmed = attachmentDraft.trim()
    if (!trimmed) return
    setAttachments((previous) => [...previous, { id: newAttachmentId(), name: trimmed }])
    setAttachmentDraft("")
  }

  const removeAttachment = (id: string) => {
    setAttachments((previous) => previous.filter((attachment) => attachment.id !== id))
  }

  const save = (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    if (!title.trim()) {
      toast.error("Add a title for your event.")
      return
    }
    if (!allDay && endTime <= startTime) {
      toast.error("End time must be after the start time.")
      return
    }

    const nextEvent: CalendarEvent = {
      id: event?.id || globalThis.crypto?.randomUUID?.() || `event-${Date.now()}`,
      title: title.trim(),
      date: format(date, "yyyy-MM-dd"),
      startTime,
      endTime,
      allDay,
      calendar,
      location: location.trim(),
      description: description.trim(),
      attendees: attendees.split(",").map((name) => name.trim()).filter(Boolean),
      meetingLink: meetingLink.trim() || undefined,
      attachments,
    }
    onSave(nextEvent)
    onOpenChange(false)
    toast.success(event ? "Event updated" : "Event created")
  }

  const calendarInfo = calendars.find((item) => item.id === event?.calendar) ?? calendars[0]
  const showView = mode === "view" && !!event

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto border-white/20 bg-slate-950/25 text-white backdrop-blur-xl">
        {showView && event && (
          <div className="absolute right-12 top-4 z-10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode("edit")}
              aria-label="Edit event"
              className="rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Delete event"
                  className="rounded-md p-1.5 text-white/70 transition hover:bg-red-500/15 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep event</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { onDelete(event.id); onOpenChange(false); toast.success("Event deleted") }}>Delete event</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {showView && event ? (
          <div className="space-y-5">
            <DialogHeader className="space-y-3 pr-16 text-left">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${calendarInfo.color}`} />
                <span className="text-xs font-semibold uppercase tracking-wide text-white/55">{calendarInfo.name}</span>
              </div>
              <DialogTitle className="text-2xl font-semibold leading-snug text-white">{event.title}</DialogTitle>
              <DialogDescription className="sr-only">Details for {event.title}</DialogDescription>
            </DialogHeader>

            {/* When / location */}
            <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-white">{format(eventDate(event), "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-white/60">{formatEventRange(event, settings.timeFormat)}</p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                  <p className="min-w-0 flex-1 text-sm text-white/90">{event.location}</p>
                </div>
              )}
            </div>

            {/* Join meeting */}
              {event.meetingLink && (
                <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <Video className="h-4 w-4" />
                  Join meeting
                  <ExternalLink className="h-3.5 w-3.5 opacity-75" />
                </a>
              )}

            {/* Attendees */}
            {event.attendees.length > 0 && (
              <Section label={`Attendees · ${event.attendees.length}`} icon={Users}>
                <div className="flex flex-wrap gap-1.5">
                  {event.attendees.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-1 pr-3 text-xs text-white/85">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/70 text-[10px] font-semibold uppercase text-white">{name.trim().charAt(0) || "?"}</span>
                      {name}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Notes */}
            {event.description && (
              <Section label="Notes" icon={AlignLeft}>
                <p className="whitespace-pre-line rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-white/80">{event.description}</p>
              </Section>
            )}

            {/* Attachments */}
            {event.attachments && event.attachments.length > 0 && (
              <Section label={`Attachments · ${event.attachments.length}`} icon={Paperclip}>
                <div className="space-y-1.5">
                  {event.attachments.map((attachment) => {
                    const row = (
                      <span className="flex items-center gap-2.5 truncate">
                        <Paperclip className="h-4 w-4 shrink-0 text-white/45" />
                        <span className="truncate text-white/90">{attachment.name}</span>
                      </span>
                    )
                    return attachment.url ? (
                      <a key={attachment.id} href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10">
                        {row}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      </a>
                    ) : (
                      <div key={attachment.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                        {row}
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{event ? "Edit event" : "Create event"}</DialogTitle>
              <DialogDescription className="text-white/65">Keep the details you need in one place.</DialogDescription>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-title" className="text-white">Title</Label>
                <Input id="event-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is happening?" className="border-white/20 bg-white/10 text-white placeholder:text-white/50" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="flex h-10 w-full items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-left text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                        <CalendarIcon className="h-4 w-4 text-white/70" />
                        {format(date, "EEE, MMM d, yyyy")}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto border-white/20 p-0" align="start">
                      <Calendar mode="single" selected={date} onSelect={(nextDate) => nextDate && setDate(nextDate)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Calendar</Label>
                  <Select value={calendar} onValueChange={setCalendar}>
                    <SelectTrigger className="border-white/20 bg-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {calendars.map((item) => <SelectItem key={item.id} value={item.id}><span className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />{item.name}</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2">
                <div>
                  <Label htmlFor="all-day" className="text-white">All day</Label>
                  <p className="text-xs text-white/55">No start or end time.</p>
                </div>
                <Switch id="all-day" checked={allDay} onCheckedChange={setAllDay} />
              </div>

              {!allDay && <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label className="text-white">Start time</Label><Select value={startTime} onValueChange={setStartTime}><SelectTrigger className="border-white/20 bg-white/10 text-white"><SelectValue /></SelectTrigger><SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{formatEventTime(time, settings.timeFormat)}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-white">End time</Label><Select value={endTime} onValueChange={setEndTime}><SelectTrigger className="border-white/20 bg-white/10 text-white"><SelectValue /></SelectTrigger><SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{formatEventTime(time, settings.timeFormat)}</SelectItem>)}</SelectContent></Select></div>
              </div>}

              <div className="space-y-2"><Label htmlFor="location" className="text-white">Location <span className="text-white/50">(optional)</span></Label><Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add a location" className="border-white/20 bg-white/10 text-white placeholder:text-white/50" /></div>

              <div className="space-y-2">
                <Label htmlFor="meeting-link" className="text-white">Meeting link <span className="text-white/50">(optional)</span></Label>
                <div className="relative">
                  <Video className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <Input id="meeting-link" type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." className="border-white/20 bg-white/10 pl-9 text-white placeholder:text-white/50" />
                </div>
              </div>

              <div className="space-y-2"><Label htmlFor="attendees" className="text-white">Attendees <span className="text-white/50">(optional)</span></Label><Input id="attendees" value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="alex@example.com, Sam Lee" className="border-white/20 bg-white/10 text-white placeholder:text-white/50" /></div>
              <div className="space-y-2"><Label htmlFor="description" className="text-white">Notes <span className="text-white/50">(optional)</span></Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add notes or an agenda" className="min-h-20 border-white/20 bg-white/10 text-white placeholder:text-white/50" /></div>

              <div className="space-y-2">
                <Label className="text-white">Attachments <span className="text-white/50">(optional)</span></Label>
                {attachments.length > 0 && (
                  <div className="space-y-1.5">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white">
                        <span className="flex min-w-0 items-center gap-2 truncate"><Paperclip className="h-3.5 w-3.5 shrink-0 text-white/50" />{attachment.name}</span>
                        <button type="button" onClick={() => removeAttachment(attachment.id)} aria-label={`Remove ${attachment.name}`} className="shrink-0 rounded p-0.5 text-white/60 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={attachmentDraft}
                    onChange={(e) => setAttachmentDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttachmentDraft() } }}
                    placeholder="File or link name, e.g. Agenda.pdf"
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                  <button type="button" onClick={addAttachmentDraft} aria-label="Add attachment" className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/20 bg-white/10 px-3 text-sm text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                {event ? <AlertDialog>
                  <AlertDialogTrigger asChild><button type="button" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-300 hover:bg-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-300"><Trash2 className="h-4 w-4" />Delete</button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete this event?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Keep event</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { onDelete(event.id); onOpenChange(false); toast.success("Event deleted") }}>Delete event</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog> : <span />}
                <div className="flex gap-2"><button type="button" onClick={cancelEdit} className="rounded-md px-4 py-2 text-sm text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">Cancel</button><button type="submit" className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300">{event ? "Save changes" : "Create event"}</button></div>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}