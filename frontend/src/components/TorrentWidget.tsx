import React, { useState } from 'react';
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

type AddStatus = 'idle' | 'adding' | 'success' | 'error';

function AddTorrentForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState('');
  const [category, setCategory] = useState('');
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<AddStatus>('idle');
  const [message, setMessage] = useState('');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-2 py-1.5 px-2 text-xs font-medium text-blue-300 border border-dashed border-gray-600 rounded hover:border-blue-500 hover:text-blue-200 transition-colors"
      >
        + Add torrent
      </button>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urls.trim()) return;
    setStatus('adding');
    setMessage('');
    try {
      const res = await fetch('/api/torrents/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, category: category || undefined, paused }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus('success');
        setMessage('Added');
        setUrls('');
        setCategory('');
        setPaused(false);
        onAdded();
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 2500);
      } else {
        setStatus('error');
        setMessage(json.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Request failed');
    }
  };

  const buttonLabel =
    status === 'adding' ? 'Adding\u2026' : status === 'success' ? 'Added!' : 'Add';
  const buttonClass =
    status === 'success'
      ? 'bg-green-600 hover:bg-green-600'
      : status === 'error'
        ? 'bg-red-600 hover:bg-red-500'
        : 'bg-blue-600 hover:bg-blue-500';

  return (
    <form onSubmit={submit} className="mb-3 p-2 rounded bg-gray-800/60 border border-gray-700 space-y-2">
      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="magnet:?xt=... or https://.../file.torrent (one per line)"
        rows={2}
        className="w-full text-xs bg-gray-900 text-gray-100 placeholder-gray-500 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500 resize-none"
        autoFocus
        spellCheck={false}
      />
      <div className="flex gap-2">
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="category (optional)"
          className="flex-1 text-xs bg-gray-900 text-gray-100 placeholder-gray-500 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          spellCheck={false}
        />
        <label className="flex items-center gap-1 text-xs text-gray-400 select-none">
          <input
            type="checkbox"
            checked={paused}
            onChange={(e) => setPaused(e.target.checked)}
            className="accent-blue-500"
          />
          Paused
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === 'adding' || !urls.trim()}
          className={`flex-1 py-1.5 text-xs font-medium text-white rounded transition-colors disabled:opacity-50 ${buttonClass}`}
        >
          {buttonLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setStatus('idle');
            setMessage('');
          }}
          className="px-3 text-xs text-gray-400 hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
      {status === 'error' && message && (
        <p className="text-xs text-red-400 truncate" title={message}>
          {message}
        </p>
      )}
    </form>
  );
}

export default function TorrentWidget() {
  const { data, isLoading, error, refetch } = useApi<TorrentsData>('/api/torrents', 5000);

  return (
    <Widget title="Torrents" icon="📥" isLoading={isLoading} error={error}>
      <AddTorrentForm onAdded={refetch} />
      {data && !data.reachable && (
        <div className="mb-2 p-2 rounded bg-amber-900/40 border border-amber-600/50 text-xs text-amber-300">
          ⚠️ qBittorrent unreachable — is it running on port 8080?
        </div>
      )}
      {data && data.reachable && (
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