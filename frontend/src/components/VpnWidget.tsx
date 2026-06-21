import React from 'react';
import { useApi } from '../hooks/useApi';
import type { VpnData } from '../types';
import Widget from './Widget';

function formatVpnUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function VpnWidget() {
  const { data, isLoading, error } = useApi<VpnData>('/api/vpn', 10000);

  return (
    <Widget title="VPN" icon="🔒" isLoading={isLoading} error={error}>
      {data && (
        <div>
          {data.connected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 font-semibold">Connected</span>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">IP:</span>
                  <span className="font-mono">{data.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">External:</span>
                  <span className="font-mono">{data.externalIp}</span>
                </div>
                {data.uptime != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Uptime:</span>
                    <span>{formatVpnUptime(data.uptime)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-red-400 font-semibold">Disconnected</span>
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}
