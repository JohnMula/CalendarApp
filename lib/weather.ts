export type WeatherCondition = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunderstorm"

export type WeatherSnapshot = {
  condition: WeatherCondition
  temperatureC: number
  isDay: boolean
  fetchedAt: number
}

export const conditionLabels: Record<WeatherCondition, string> = {
  clear: "Clear",
  cloudy: "Cloudy",
  fog: "Foggy",
  rain: "Rainy",
  snow: "Snowy",
  thunderstorm: "Thunderstorm",
}

// Maps WMO weather codes (used by Open-Meteo) to a simplified condition we can render.
// Reference: https://open-meteo.com/en/docs
function codeToCondition(code: number): WeatherCondition {
  if (code === 0) return "clear"
  if (code === 1 || code === 2 || code === 3) return "cloudy"
  if (code === 45 || code === 48) return "fog"
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain"
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow"
  if ([95, 96, 99].includes(code)) return "thunderstorm"
  return "clear"
}

// Open-Meteo needs no API key and allows browser-side requests, so this can run
// entirely client-side with no server or secrets involved.
export async function fetchWeather(latitude: number, longitude: number, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,temperature_2m,is_day&timezone=auto`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Weather request failed with status ${response.status}`)

  const data = await response.json()
  const current = data?.current
  if (!current || typeof current.weather_code !== "number" || typeof current.temperature_2m !== "number") {
    throw new Error("Unexpected weather response shape")
  }

  return {
    condition: codeToCondition(current.weather_code),
    temperatureC: current.temperature_2m,
    isDay: current.is_day === 1,
    fetchedAt: Date.now(),
  }
}
