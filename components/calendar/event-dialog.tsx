"use client"

import { useEffect, useState } from "react"
import { addMinutes, format, parse } from "date-fns"
import { CalendarIcon, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { CalendarEvent, CalendarSettings } from "@/lib/calendar"
import { calendars, eventDate, formatEventTime } from "@/lib/calendar"
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

const durationEnd = (start: string, duration: number) => {
  return format(addMinutes(parse(start, "HH:mm", new Date()), duration), "HH:mm")
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2)
  const minutes = index % 2 === 0 ? "00" : "30"
  return `${String(hours).padStart(2, "0")}:${minutes}`
})

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
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(initialDate)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [allDay, setAllDay] = useState(false)
  const [calendar, setCalendar] = useState("my-calendar")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [attendees, setAttendees] = useState("")

  useEffect(() => {
    if (!open) return
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
  }, [event, initialDate, initialTime, open, settings.defaultDuration])

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
    }
    onSave(nextEvent)
    onOpenChange(false)
    toast.success(event ? "Event updated" : "Event created")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto border-white/20 bg-slate-950/95 text-white backdrop-blur-xl">
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
                  {calendars.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
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
          <div className="space-y-2"><Label htmlFor="attendees" className="text-white">Attendees <span className="text-white/50">(optional)</span></Label><Input id="attendees" value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="alex@example.com, Sam Lee" className="border-white/20 bg-white/10 text-white placeholder:text-white/50" /></div>
          <div className="space-y-2"><Label htmlFor="description" className="text-white">Description <span className="text-white/50">(optional)</span></Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add notes or an agenda" className="min-h-20 border-white/20 bg-white/10 text-white placeholder:text-white/50" /></div>

          <DialogFooter className="gap-2 sm:justify-between">
            {event ? <AlertDialog>
              <AlertDialogTrigger asChild><button type="button" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-300 hover:bg-red-500/15"><Trash2 className="h-4 w-4" />Delete</button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete this event?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Keep event</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { onDelete(event.id); onOpenChange(false); toast.success("Event deleted") }}>Delete event</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog> : <span />}
            <div className="flex gap-2"><button type="button" onClick={() => onOpenChange(false)} className="rounded-md px-4 py-2 text-sm text-white/80 hover:bg-white/10">Cancel</button><button type="submit" className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400">{event ? "Save changes" : "Create event"}</button></div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
