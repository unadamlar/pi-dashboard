import React from 'react';
import { useApi } from '../hooks/useApi';
import type { WeatherData } from '../types';
import Widget from './Widget';

export default function WeatherWidget() {
  const { data, isLoading, error } = useApi<WeatherData>('/api/weather', 600000);

  return (
    <Widget title="Weather" icon="🌤️" isLoading={isLoading} error={error}>
      {data && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{data.current.icon}</span>
            <div>
              <span className="text-2xl font-bold">{data.current.temp.toFixed(1)}°C</span>
              <p className="text-xs text-gray-400">{data.current.description}</p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Humidity: {data.current.humidity}%</span>
            <span>Wind: {data.current.windSpeed} km/h</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-700">
            {data.forecast.map((day) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en', { weekday: 'short' });
              return (
                <div key={day.date} className="text-center">
                  <p className="text-xs text-gray-500">{dayName}</p>
                  <p className="text-base">{day.icon}</p>
                  <p className="text-xs">
                    <span className="text-gray-300">{day.max.toFixed(0)}°</span>{' '}
                    <span className="text-gray-500">{day.min.toFixed(0)}°</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Widget>
  );
}
