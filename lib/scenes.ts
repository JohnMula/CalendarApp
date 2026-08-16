export type SceneId = "mountain" | "forest" | "ocean" | "city" | "aurora" | "minimal"

export type DayPeriod = "dawn" | "morning" | "midday" | "golden" | "dusk" | "night"

export type Scene = {
  id: SceneId
  name: string
  description: string
  image: string | null
}

export const scenes: Scene[] = [
  {
    id: "mountain",
    name: "Mountain",
    description: "Misty peaks at first light",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "forest",
    name: "Forest",
    description: "A quiet road through the trees",
    image: "https://images.unsplash.com/photo-1748357664473-664bfc3e1b67?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Turquoise waves rolling in",
    image: "https://images.unsplash.com/photo-1780754001191-840925523a74?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "city",
    name: "City Night",
    description: "Skyline lights after dark",
    image: "https://images.unsplash.com/photo-1690741818722-3f96fc94f678?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Northern lights overhead",
    image: "https://images.unsplash.com/photo-1768981931384-8f8f170043b3?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean color, no photo",
    image: null,
  },
]

export const dayPeriods: { id: DayPeriod; label: string }[] = [
  { id: "dawn", label: "Dawn" },
  { id: "morning", label: "Morning" },
  { id: "midday", label: "Midday" },
  { id: "golden", label: "Golden hour" },
  { id: "dusk", label: "Dusk" },
  { id: "night", label: "Night" },
]

export function getDayPeriod(date: Date): DayPeriod {
  const hour = date.getHours() + date.getMinutes() / 60
  if (hour >= 5 && hour < 7) return "dawn"
  if (hour >= 7 && hour < 11) return "morning"
  if (hour >= 11 && hour < 16) return "midday"
  if (hour >= 16 && hour < 18) return "golden"
  if (hour >= 18 && hour < 20) return "dusk"
  return "night"
}

// Low-opacity color washes laid over a scene photo so it reads as dawn/noon/night light.
export const periodTints: Record<DayPeriod, string> = {
  dawn: "linear-gradient(160deg, rgba(255,183,140,0.38) 0%, rgba(147,112,180,0.42) 100%)",
  morning: "linear-gradient(160deg, rgba(255,238,204,0.2) 0%, rgba(125,168,206,0.22) 100%)",
  midday: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(96,150,196,0.16) 100%)",
  golden: "linear-gradient(160deg, rgba(255,186,107,0.34) 0%, rgba(178,88,74,0.34) 100%)",
  dusk: "linear-gradient(160deg, rgba(150,84,158,0.42) 0%, rgba(43,32,88,0.55) 100%)",
  night: "linear-gradient(160deg, rgba(19,26,58,0.55) 0%, rgba(4,6,20,0.72) 100%)",
}

// Full, opaque backgrounds used for the photo-free "Minimal" scene.
export const periodGradients: Record<DayPeriod, string> = {
  dawn: "linear-gradient(160deg, #fbc9a3 0%, #f596a0 45%, #7c5cbf 100%)",
  morning: "linear-gradient(160deg, #ffe8b8 0%, #a8d8e8 55%, #5b8fc9 100%)",
  midday: "linear-gradient(160deg, #8fd3f4 0%, #5aa9e6 55%, #3f7cc9 100%)",
  golden: "linear-gradient(160deg, #ffcf86 0%, #f79d65 45%, #b95a5a 100%)",
  dusk: "linear-gradient(160deg, #a15bb0 0%, #5b3f8f 55%, #241a4d 100%)",
  night: "linear-gradient(160deg, #232a52 0%, #131735 55%, #05060f 100%)",
}

export const toThumb = (url: string) => url.replace("w=2070", "w=240")
