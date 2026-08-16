"use client"

import { useTheme } from "next-themes"

import type { CalendarSettings, CalendarView } from "@/lib/calendar"
import { dayPeriods, periodGradients, scenes, toThumb, type DayPeriod } from "@/lib/scenes"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: CalendarSettings
  onChange: (settings: CalendarSettings) => void
  previewPeriod: DayPeriod | null
  onPreviewPeriod: (period: DayPeriod | null) => void
  weatherStatusText: string
  onLiveWeatherChange: (checked: boolean) => void
}

export function SettingsDialog({ open, onOpenChange, settings, onChange, previewPeriod, onPreviewPeriod, weatherStatusText, onLiveWeatherChange }: SettingsDialogProps) {
  const { setTheme } = useTheme()
  const update = <K extends keyof CalendarSettings>(key: K, value: CalendarSettings[K]) => {
    const next = { ...settings, [key]: value }
    onChange(next)
    if (key === "theme") setTheme(value as CalendarSettings["theme"])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/20 bg-slate-950/25 text-white backdrop-blur-xl">
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
            <Label className="text-white">Scene</Label>
            <div className="grid grid-cols-3 gap-2">
              {scenes.map((scene) => <button key={scene.id} type="button" aria-pressed={settings.scene === scene.id} onClick={() => update("scene", scene.id)} className={`group relative flex h-16 items-end overflow-hidden rounded-lg border text-left transition ${settings.scene === scene.id ? "border-white ring-2 ring-white/80" : "border-white/20 hover:border-white/50"}`}>
                {scene.image ? <img src={toThumb(scene.image)} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: periodGradients.midday }} />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="relative z-10 px-1.5 pb-1 text-[11px] font-medium leading-tight text-white drop-shadow">{scene.name}</span>
              </button>)}
            </div>
          </section>
          <section className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-white">Shift with time of day</Label>
              <p className="text-xs text-white/60">Tints the scene through dawn, day, and night as the hours pass.</p>
            </div>
            <Switch checked={settings.dynamicLighting} onCheckedChange={(checked) => update("dynamicLighting", checked)} className="shrink-0 data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-white/20" />
          </section>
          {settings.dynamicLighting && <section className="space-y-2">
            <Label className="text-white">Preview a time of day</Label>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => onPreviewPeriod(null)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${previewPeriod === null ? "bg-blue-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"}`}>Live</button>
              {dayPeriods.map((period) => <button key={period.id} type="button" onClick={() => onPreviewPeriod(period.id)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${previewPeriod === period.id ? "bg-blue-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"}`}>{period.label}</button>)}
            </div>
          </section>}
          <section className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-white">Live weather</Label>
              <p className="text-xs text-white/60">{weatherStatusText}</p>
            </div>
            <Switch checked={settings.liveWeather} onCheckedChange={onLiveWeatherChange} className="shrink-0 data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-white/20" />
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
