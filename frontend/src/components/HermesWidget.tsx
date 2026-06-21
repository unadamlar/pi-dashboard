import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import type { HermesData } from '../types/hermes';
import Widget from './Widget';

export default function HermesWidget() {
  const { data, isLoading, error } = useApi<HermesData>('/api/hermes', 30000);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateMsg('');
    try {
      const res = await fetch('/api/hermes/update', { method: 'POST' });
      const result = await res.json();
      setUpdateMsg(result.message);
    } catch {
      setUpdateMsg('Update request failed');
    }
    setTimeout(() => setUpdating(false), 5000);
  };

  return (
    <Widget title="Hermes Agent" icon="🤖" isLoading={isLoading} error={error}>
      {data && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[13px] font-medium">{data.version}</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Model:</span>
              <span className="font-mono">{data.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gateway:</span>
              <span className={data.gatewayRunning ? 'text-green-400' : 'text-red-400'}>
                {data.gatewayRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dashboard:</span>
              <span className={data.dashboardRunning ? 'text-green-400' : 'text-red-400'}>
                {data.dashboardRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
          {data.updateAvailable && (
            <div className="pt-1">
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full py-1.5 text-xs rounded-md font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Available'}
              </button>
              {updateMsg && (
                <p className="text-[10px] text-gray-500 text-center mt-1">{updateMsg}</p>
              )}
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}
