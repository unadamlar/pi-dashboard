import React, { useState, useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-100 tracking-tight">Pi Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono">
            {time.toLocaleTimeString()}
          </span>
        </div>
      </header>
      <main className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
