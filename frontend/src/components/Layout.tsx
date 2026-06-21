import React, { useState, useEffect } from 'react';

function formatTime(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[date.getDay()];
  const timeStr = date.toLocaleTimeString();
  return `${dayName} ${timeStr}`;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      <header className="bg-gray-800/80 backdrop-blur border-b border-gray-700 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <h1 className="text-lg font-bold text-gray-100 tracking-tight">Pi Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">
            {formatTime(time)}
          </span>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <footer className="text-center py-4 text-xs text-gray-600 border-t border-gray-800">
        Built on Raspberry Pi 5 🍓
      </footer>
    </div>
  );
}
