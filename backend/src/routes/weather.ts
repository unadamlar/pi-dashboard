import { Router } from 'express';

export const weatherRouter = Router();

const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0:  { description: 'Clear sky',      icon: '☀️' },
  1:  { description: 'Mainly clear',   icon: '🌤️' },
  2:  { description: 'Partly cloudy',  icon: '⛅' },
  3:  { description: 'Overcast',       icon: '☁️' },
  45: { description: 'Foggy',          icon: '🌫️' },
  48: { description: 'Rime fog',       icon: '🌫️' },
  51: { description: 'Light drizzle',  icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle',  icon: '🌧️' },
  56: { description: 'Freezing drizzle', icon: '🌧️' },
  57: { description: 'Freezing drizzle', icon: '🌧️' },
  61: { description: 'Slight rain',    icon: '🌦️' },
  63: { description: 'Moderate rain',  icon: '🌧️' },
  65: { description: 'Heavy rain',     icon: '🌧️' },
  66: { description: 'Freezing rain',  icon: '🌧️' },
  67: { description: 'Freezing rain',  icon: '🌧️' },
  71: { description: 'Slight snow',    icon: '🌨️' },
  73: { description: 'Moderate snow',  icon: '🌨️' },
  75: { description: 'Heavy snow',     icon: '❄️' },
  77: { description: 'Snow grains',    icon: '❄️' },
  80: { description: 'Slight showers', icon: '🌦️' },
  81: { description: 'Moderate showers', icon: '🌧️' },
  82: { description: 'Violent showers', icon: '⛈️' },
  85: { description: 'Slight snow showers', icon: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '❄️' },
  95: { description: 'Thunderstorm',   icon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with hail', icon: '⛈️' },
};

const CITIES = [
  { name: 'Helsinki', lat: 60.17, lon: 24.95, tz: 'Europe/Helsinki' },
  { name: 'Istanbul', lat: 41.01, lon: 28.98, tz: 'Europe/Istanbul' },
];

function getWeatherInfo(code: number): { description: string; icon: string } {
  return WMO_CODES[code] || { description: 'Unknown', icon: '❓' };
}

async function fetchCityWeather(city: typeof CITIES[0]) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=${encodeURIComponent(city.tz)}&forecast_days=3`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json() as any;
  const currentCode = data.current?.weather_code ?? 0;
  const currentInfo = getWeatherInfo(currentCode);

  return {
    name: city.name,
    current: {
      temp: data.current?.temperature_2m ?? 0,
      humidity: data.current?.relative_humidity_2m ?? 0,
      description: currentInfo.description,
      icon: currentInfo.icon,
      windSpeed: data.current?.wind_speed_10m ?? 0,
    },
    forecast: (data.daily?.time || []).map((date: string, i: number) => {
      const code = data.daily?.weather_code?.[i] ?? 0;
      const info = getWeatherInfo(code);
      return {
        date,
        max: data.daily?.temperature_2m_max?.[i] ?? 0,
        min: data.daily?.temperature_2m_min?.[i] ?? 0,
        description: info.description,
        icon: info.icon,
      };
    }),
  };
}

weatherRouter.get('/', async (_req, res) => {
  try {
    const results = await Promise.all(CITIES.map(fetchCityWeather));
    const cities = results.filter(r => r !== null);

    if (cities.length === 0) {
      res.status(502).json({ error: 'Weather API unavailable' });
      return;
    }

    res.json({ cities });
  } catch {
    res.status(502).json({ error: 'Weather API unavailable' });
  }
});
