import React from 'react';
import { useApi } from '../hooks/useApi';
import type { TorrentsData } from '../types';
import Widget from './Widget';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${(bytes / Math.pow(k, idx)).toFixed(1)} ${sizes[idx]}`;
}

function formatSize(bytes: number): string {
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${(bytes / Math.pow(k, idx)).toFixed(1)} ${sizes[idx]}`;
}

function formatEta(seconds: number): string {
  if (seconds >= 86400 * 365) return '\u221e';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

const stateColors: Record<string, string> = {
  downloading: 'text-blue-400',
  seeding: 'text-green-400',
  pausedUP: 'text-yellow-400',
  pausedDL: 'text-yellow-400',
  queuedUP: 'text-gray-400',
  queuedDL: 'text-gray-400',
  stalledUP: 'text-gray-400',
  stalledDL: 'text-gray-400',
  checkingUP: 'text-purple-400',
  checkingDL: 'text-purple-400',
};

const stateLabels: Record<string, string> = {
  downloading: 'DL',
  seeding: 'Seed',
  pausedUP: 'Paused',
  pausedDL: 'Paused',
  queuedUP: 'Queued',
  queuedDL: 'Queued',
  stalledUP: 'Stalled',
  stalledDL: 'Stalled',
  checkingUP: 'Checking',
  checkingDL: 'Checking',
};

export default function TorrentWidget() {
  const { data, isLoading, error } = useApi<TorrentsData>('/api/torrents', 5000);

  return (
    <Widget title="Torrents" icon="📥" isLoading={isLoading} error={error}>
      {data && (
        <div>
          {data.total === 0 ? (
            <p className="text-gray-500 text-sm">No active torrents</p>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3 text-xs text-gray-400 mb-2">
                <span className="text-blue-400">{data.downloading} DL</span>
                <span className="text-green-400">{data.seeding} Seed</span>
                <span>
                  <span className="text-blue-300">{formatBytes(data.totalDownloadSpeed)}</span>
                  {' \u2193 '}
                  <span className="text-green-300">{formatBytes(data.totalUploadSpeed)}</span>
                  {' \u2191'}
                </span>
              </div>
              {data.torrents.slice(0, 5).map((t, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300 truncate max-w-[60%]" title={t.name}>
                      {t.name}
                    </span>
                    <span className={stateColors[t.state] || 'text-gray-400'}>
                      {stateLabels[t.state] || t.state}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-0.5">
                    <div
                      className="h-1.5 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min(t.progress * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{formatBytes(t.downloadSpeed)}</span>
                    <span>{formatSize(t.size)}</span>
                    <span>{t.eta < 86400 * 365 ? formatEta(t.eta) : '\u221e'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}
