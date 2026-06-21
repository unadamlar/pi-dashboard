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

function Bar({ value, label }: { value: number; label: string }) {
  const color =
    value < 50 ? 'from-green-500 to-green-400' :
    value < 75 ? 'from-yellow-500 to-yellow-400' :
    'from-red-500 to-red-400';

  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-xs text-gray-400 mb-0.5">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function SystemWidget() {
  const { data, isLoading, error } = useApi<SystemData>('/api/system', 5000);

  return (
    <Widget title="System" icon="🖥️" isLoading={isLoading} error={error}>
      {data && (() => {
        const sys = data;
        return (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-lg ${sys.cpuTemp >= 70 ? 'text-red-400' : sys.cpuTemp >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
              🌡️
            </span>
            <span className={`font-semibold ${sys.cpuTemp >= 70 ? 'text-red-400' : sys.cpuTemp >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
              {sys.cpuTemp.toFixed(1)}°C
            </span>
          </div>
          <Bar value={sys.cpuUsage} label="CPU" />
          <Bar value={sys.memory.percent} label="Memory" />
          <Bar value={sys.disk.percent} label="Disk" />
          <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-700/50">
            <span>{formatUptime(sys.uptime)}</span>
            <span>{sys.loadAvg[0].toFixed(1)} / {sys.loadAvg[1].toFixed(1)} / {sys.loadAvg[2].toFixed(1)}</span>
          </div>
          {sys.topProcesses && sys.topProcesses.length > 0 && (
            <div className="pt-2 mt-1 border-t border-gray-700/50">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">Top Processes</div>
              {sys.topProcesses.map((p, i) => (
                <div key={i} className="flex justify-between text-[11px] font-mono py-0.5">
                  <span className="text-gray-400 truncate max-w-[65%]" title={p.command}>{p.command}</span>
                  <span className="text-gray-500">{p.cpu.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
        );
      })()}
    </Widget>
  );
}
