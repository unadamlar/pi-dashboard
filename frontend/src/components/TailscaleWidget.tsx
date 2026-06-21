import React from 'react';
import { useApi } from '../hooks/useApi';
import type { TailscaleData } from '../types';
import Widget from './Widget';

export default function TailscaleWidget() {
  const { data, isLoading, error } = useApi<TailscaleData>('/api/tailscale', 10000);

  return (
    <Widget title="Tailscale" icon="🌐" isLoading={isLoading} error={error}>
      {data && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">
            {data.onlineCount} / {data.totalCount} online
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">{data.self.name}</span>
            <span className="text-xs text-gray-400 font-mono ml-auto">{data.self.ip}</span>
          </div>
          {data.peers.map((peer) => (
            <div
              key={peer.ip}
              className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg"
            >
              <span
                className={`w-2 h-2 rounded-full ${peer.online ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-sm">{peer.name}</span>
              <span className="text-xs text-gray-400 font-mono ml-auto">{peer.ip}</span>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
}
