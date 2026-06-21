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

function getWeatherInfo(code: number): { description: string; icon: string } {
  return WMO_CODES[code] || { description: 'Unknown', icon: '❓' };
}

weatherRouter.get('/', async (_req, res) => {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=60.17&longitude=24.95&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe/Helsinki&forecast_days=3';
    const response = await fetch(url);

    if (!response.ok) {
      res.status(502).json({ error: 'Weather API unavailable' });
      return;
    }

    const data = await response.json() as {
      current?: {
        weather_code: number;
        temperature_2m: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
      };
      daily?: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
      };
    };

    const currentCode = data.current?.weather_code ?? 0;
    const currentInfo = getWeatherInfo(currentCode);

    const current = {
      temp: data.current?.temperature_2m ?? 0,
      humidity: data.current?.relative_humidity_2m ?? 0,
      description: currentInfo.description,
      icon: currentInfo.icon,
      windSpeed: data.current?.wind_speed_10m ?? 0,
    };

    const forecast = (data.daily?.time || []).map((date: string, i: number) => {
      const code = data.daily?.weather_code?.[i] ?? 0;
      const info = getWeatherInfo(code);
      return {
        date,
        max: data.daily?.temperature_2m_max?.[i] ?? 0,
        min: data.daily?.temperature_2m_min?.[i] ?? 0,
        description: info.description,
        icon: info.icon,
      };
    });

    res.json({ current, forecast });
  } catch {
    res.status(502).json({ error: 'Weather API unavailable' });
  }
});
