import React from 'react';
import { useApi } from '../hooks/useApi';
import type { WeatherData, CityWeather } from '../types';
import Widget from './Widget';

function CityWeatherCard({ data }: { data: CityWeather }) {
  return (
    <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{data.name}</h4>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{data.current.icon}</span>
        <div>
          <span className="text-xl font-bold">{data.current.temp.toFixed(1)}°C</span>
          <p className="text-xs text-gray-400">{data.current.description}</p>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>💧 {data.current.humidity}%</span>
        <span>💨 {data.current.windSpeed} km/h</span>
      </div>
      <div className="flex justify-between pt-1 border-t border-gray-700/50">
        {data.forecast.map((day) => {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('en', { weekday: 'short' });
          return (
            <div key={day.date} className="text-center">
              <p className="text-xs text-gray-500">{dayName}</p>
              <p className="text-sm">{day.icon}</p>
              <p className="text-xs">
                <span className="text-gray-300">{day.max.toFixed(0)}°</span>{' '}
                <span className="text-gray-500">{day.min.toFixed(0)}°</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WeatherWidget() {
  const { data, isLoading, error } = useApi<WeatherData>('/api/weather', 600000);

  return (
    <Widget title="Weather" icon="🌤️" isLoading={isLoading} error={error}>
      {data && (
        <div className="space-y-3">
          {data.cities.map((city) => (
            <CityWeatherCard key={city.name} data={city} />
          ))}
        </div>
      )}
    </Widget>
  );
}
