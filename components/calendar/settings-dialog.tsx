"use client"

import { useTheme } from "next-themes"

import type { CalendarSettings, CalendarView } from "@/lib/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: CalendarSettings
  onChange: (settings: CalendarSettings) => void
}

export function SettingsDialog({ open, onOpenChange, settings, onChange }: SettingsDialogProps) {
  const { setTheme } = useTheme()
  const update = <K extends keyof CalendarSettings>(key: K, value: CalendarSettings[K]) => {
    const next = { ...settings, [key]: value }
    onChange(next)
    if (key === "theme") setTheme(value as CalendarSettings["theme"])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/20 bg-slate-950/95 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="text-white/65">Changes are saved automatically to this device.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <section className="space-y-2">
            <Label className="text-white">Theme</Label>
            <ToggleGroup type="single" value={settings.theme} onValueChange={(value) => value && update("theme", value as CalendarSettings["theme"])} className="justify-start rounded-lg bg-white/10 p-1">
              {(["light", "dark", "system"] as const).map((theme) => <ToggleGroupItem key={theme} value={theme} className="h-8 px-3 capitalize data-[state=on]:bg-blue-500 data-[state=on]:text-white">{theme}</ToggleGroupItem>)}
            </ToggleGroup>
          </section>
          <section className="space-y-2">
            <Label className="text-white">Default view on load</Label>
            <ToggleGroup type="single" value={settings.defaultView} onValueChange={(value) => value && update("defaultView", value as CalendarView)} className="justify-start rounded-lg bg-white/10 p-1">
              {(["day", "week", "month", "year"] as const).map((view) => <ToggleGroupItem key={view} value={view} className="h-8 px-3 capitalize data-[state=on]:bg-blue-500 data-[state=on]:text-white">{view}</ToggleGroupItem>)}
            </ToggleGroup>
          </section>
          <section className="space-y-2">
            <Label className="text-white">Week starts on</Label>
            <Select value={String(settings.weekStartsOn)} onValueChange={(value) => update("weekStartsOn", Number(value) as 0 | 1)}>
              <SelectTrigger className="border-white/20 bg-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="0">Sunday</SelectItem><SelectItem value="1">Monday</SelectItem></SelectContent>
            </Select>
          </section>
          <section className="space-y-2">
            <Label className="text-white">Time format</Label>
            <ToggleGroup type="single" value={settings.timeFormat} onValueChange={(value) => value && update("timeFormat", value as CalendarSettings["timeFormat"])} className="justify-start rounded-lg bg-white/10 p-1">
              <ToggleGroupItem value="12" className="h-8 px-3 data-[state=on]:bg-blue-500 data-[state=on]:text-white">12-hour</ToggleGroupItem>
              <ToggleGroupItem value="24" className="h-8 px-3 data-[state=on]:bg-blue-500 data-[state=on]:text-white">24-hour</ToggleGroupItem>
            </ToggleGroup>
          </section>
          <section className="space-y-2">
            <Label className="text-white">Default new-event duration</Label>
            <Select value={String(settings.defaultDuration)} onValueChange={(value) => update("defaultDuration", Number(value) as 30 | 60)}>
              <SelectTrigger className="border-white/20 bg-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="30">30 minutes</SelectItem><SelectItem value="60">60 minutes</SelectItem></SelectContent>
            </Select>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
