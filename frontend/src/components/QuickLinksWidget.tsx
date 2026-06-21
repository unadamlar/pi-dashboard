import React from 'react';
import Widget from './Widget';

interface QuickLink {
  name: string;
  url: string | null;
  icon: string;
  description?: string;
}

const links: QuickLink[] = [
  { name: 'qBittorrent', url: 'http://pi:8080', icon: '📥' },
  { name: 'RustDesk', url: null, icon: '🖥️', description: 'Self-hosted — connect via RustDesk client' },
  { name: 'Tailscale Admin', url: 'https://login.tailscale.com/admin/machines', icon: '🔗' },
  { name: 'Hermes Dashboard', url: 'http://pi:8081', icon: '📊' },
  { name: 'Pi Connect', url: 'https://connect.raspberrypi.org', icon: '🥧' },
  { name: 'Open-Meteo', url: 'https://open-meteo.com', icon: '🌤️' },
];

export default function QuickLinksWidget() {
  return (
    <Widget title="Quick Links" icon="🔗">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {links.map((link) => (
          <div key={link.name}>
            {link.url ? (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/60 hover:border-gray-500 border border-transparent transition-all duration-200 group"
              >
                <span className="text-base flex-shrink-0">{link.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-200 group-hover:text-white truncate transition-colors">
                    {link.name}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">{link.url}</div>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/50 border border-transparent">
                <span className="text-base flex-shrink-0">{link.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-300">{link.name}</div>
                  <div className="text-[10px] text-gray-500">{link.description}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Widget>
  );
}
