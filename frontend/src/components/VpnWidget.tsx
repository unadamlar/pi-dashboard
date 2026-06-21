import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import type { VpnData } from '../types';
import Widget from './Widget';

function formatVpnUptime(seconds: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function VpnRow({ name, label, connected, ip, uptime, onConnect, onDisconnect, loading }: {
  name: string;
  label: string;
  connected: boolean;
  ip: string | null;
  uptime: number | null;
  onConnect: () => void;
  onDisconnect: () => void;
  loading: string | null;
}) {
  return (
    <div className={`rounded-lg p-3 transition-colors ${connected ? 'bg-green-900/20 border border-green-800/30' : 'bg-gray-800/50 border border-gray-700/30'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-gray-500 font-mono">({name})</span>
        </div>
        <button
          onClick={connected ? onDisconnect : onConnect}
          disabled={loading !== null}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            connected
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading === name ? '...' : connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
      {connected && ip && (
        <div className="text-xs text-gray-400 space-y-1 font-mono">
          <div className="flex justify-between">
            <span className="text-gray-500">IP:</span>
            <span>{ip}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Uptime:</span>
            <span>{formatVpnUptime(uptime)}</span>
          </div>
        </div>
      )}
      {!connected && (
        <div className="text-xs text-gray-500 italic">Disconnected</div>
      )}
    </div>
  );
}

export default function VpnWidget() {
  const { data, isLoading, error } = useApi<VpnData>('/api/vpn', 10000);
  const [loading, setLoading] = useState<string | null>(null);

  const handleConnect = async (name: string) => {
    setLoading(name);
    try {
      await fetch('/api/vpn/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch {}
    setTimeout(() => setLoading(null), 3000);
  };

  const handleDisconnect = async (name: string) => {
    setLoading(name);
    try {
      await fetch('/api/vpn/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch {}
    setTimeout(() => setLoading(null), 3000);
  };

  return (
    <Widget title="VPN" icon="🔒" isLoading={isLoading} error={error}>
      {data && (
        <div className="space-y-3">
          {data.vpns.map((vpn) => (
            <VpnRow
              key={vpn.name}
              {...vpn}
              onConnect={() => handleConnect(vpn.name)}
              onDisconnect={() => handleDisconnect(vpn.name)}
              loading={loading}
            />
          ))}
          {data.externalIp && (
            <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-700/50">
              <span>External IP:</span>
              <span className="font-mono text-gray-400">{data.externalIp}</span>
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}
