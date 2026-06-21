import React from 'react';

interface WidgetProps {
  title: string;
  icon: string;
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export default function Widget({ title, icon, isLoading, error, children }: WidgetProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-500 border-t-blue-400"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
