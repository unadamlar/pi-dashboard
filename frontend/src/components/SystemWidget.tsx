import React from 'react';
import { useApi } from '../hooks/useApi';
import type { SystemData } from '../types';
import Widget from './Widget';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function cpuTempColor(temp: number): string {
  if (temp < 50) return 'text-green-400';
  if (temp < 70) return 'text-yellow-400';
  return 'text-red-400';
}

function barGradient(value: number): string {
  if (value < 50) return 'linear-gradient(90deg, #22c55e, #eab308)';
  if (value < 80) return 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)';
  return 'linear-gradient(90deg, #eab308, #ef4444)';
}

function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(value, 100)}%`,
            background: barGradient(value),
          }}
        />
      </div>
    </div>
  );
}

export default function SystemWidget() {
  const { data, isLoading, error } = useApi<SystemData>('/api/system', 5000);

  return (
    <Widget title="System" icon="🖥️" isLoading={isLoading} error={error}>
      {data && (
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-400">CPU Temp</span>
            <span className={`text-xl font-bold ${cpuTempColor(data.cpuTemp)}`}>
              {data.cpuTemp.toFixed(1)}°C
            </span>
          </div>
          <Bar value={data.cpuUsage} label="CPU" />
          <Bar value={data.memory.percent} label="Memory" />
          <Bar value={data.disk.percent} label="Disk" />
          <div className="flex justify-between text-xs text-gray-400 mt-3">
            <span>Uptime: {formatUptime(data.uptime)}</span>
            <span>Load: {data.loadAvg.map(v => v.toFixed(1)).join(' / ')}</span>
          </div>
        </div>
      )}
    </Widget>
  );
}
