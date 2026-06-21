# Pi Dashboard — Personal Home Server Dashboard

## Overview
A personal web dashboard for a Raspberry Pi 5 home server. React frontend + Express backend. Accessible over Tailscale at http://pi:3000. Dark-themed, modern, responsive.

## Tech Stack
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS v3 (dark mode)
- **Backend**: Express.js + TypeScript
- **Build**: npm workspaces (monorepo: frontend/ + backend/)
- **No database** — all data is live API calls or system reads
- **Node v25** is installed on this machine

## Project Structure
```
pi-dashboard/
├── package.json          # workspace root
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── types/
│       │   └── index.ts          # shared types
│       ├── components/
│       │   ├── Layout.tsx        # shell with header + grid
│       │   ├── Widget.tsx        # reusable widget card wrapper
│       │   ├── SystemWidget.tsx  # Pi health metrics
│       │   ├── VpnWidget.tsx     # OpenVPN status
│       │   ├── TorrentWidget.tsx # qBittorrent active torrents
│       │   ├── TailscaleWidget.tsx # Tailscale device list
│       │   └── WeatherWidget.tsx # Finnish weather
│       └── hooks/
│           └── useApi.ts         # polling data fetch hook
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts              # Express server entry
│   │   └── routes/
│   │       ├── system.ts         # GET /api/system
│   │       ├── vpn.ts            # GET /api/vpn
│   │       ├── torrents.ts       # GET /api/torrents
│   │       ├── tailscale.ts      # GET /api/tailscale
│   │       └── weather.ts        # GET /api/weather
│   └── .env.example
└── README.md
```

## Backend API Endpoints

### GET /api/system
Returns Pi system health. Read from the OS:
- CPU temperature: read `/sys/class/thermal/thermal_zone0/temp` (divide by 1000)
- CPU usage: parse `/proc/stat` (calculate over a 1-second interval)
- Memory: parse `/proc/meminfo` (MemTotal, MemAvailable)
- Disk usage: use `df` for the root partition (`/dev/nvme0n1p2`)
- Uptime: parse `/proc/uptime`
- Load average: parse `/proc/loadavg`

Response shape:
```json
{
  "cpuTemp": 52.3,
  "cpuUsage": 12.5,
  "memory": { "total": 8192, "used": 3072, "available": 5120, "percent": 37.5 },
  "disk": { "total": 960, "used": 803, "available": 77, "percent": 84 },
  "uptime": 86400,
  "loadAvg": [0.5, 0.3, 0.2]
}
```

### GET /api/vpn
Returns OpenVPN connection status:
- Check if `tun0` interface exists (use `ip addr show tun0`)
- If up: extract IP address from `ip addr show tun0`, get connection time from `ps -o etimes= -p <pid>` for the openvpn process
- Get external IP via `curl -s ifconfig.me` (but only if tun0 is up, to avoid leaking real IP)
- If down: return `{ "connected": false }`

Response shape:
```json
{
  "connected": true,
  "interface": "tun0",
  "ip": "10.13.4.5",
  "externalIp": "212.112.19.79",
  "uptime": 3600
}
```

### GET /api/torrents
Proxy to qBittorrent Web API (running at http://localhost:8080):
1. Login: POST to `http://localhost:8080/api/v2/auth/login` with credentials from env vars `QBIT_USERNAME` and `QBIT_PASSWORD`
2. Get torrents: GET `http://localhost:8080/api/v2/torrents/info`
3. Return filtered/summarized data

Response shape:
```json
{
  "total": 5,
  "downloading": 2,
  "seeding": 3,
  "totalDownloadSpeed": 1250000,
  "totalUploadSpeed": 500000,
  "torrents": [
    { "name": "...", "size": 1000000000, "progress": 0.75, "downloadSpeed": 500000, "state": "downloading", "eta": 3600 }
  ]
}
```

### GET /api/tailscale
Returns Tailscale status by running `tailscale status --json`:
- Extract: this device name + IP, peer devices (name, IP, online, lastSeen)
- Count online vs total devices

Response shape:
```json
{
  "self": { "name": "pi", "ip": "100.85.59.128", "online": true },
  "peers": [
    { "name": "lebus", "ip": "100.101.141.53", "online": true, "lastSeen": "2026-06-21T12:00:00Z" }
  ],
  "onlineCount": 2,
  "totalCount": 2
}
```

### GET /api/weather
Fetch weather for Helsinki, Finland using Open-Meteo API (free, no API key needed):
- URL: `https://api.open-meteo.com/v1/forecast?latitude=60.17&longitude=24.95&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe/Helsinki&forecast_days=3`
- Map weather codes to human-readable descriptions + emoji icons

Response shape:
```json
{
  "current": { "temp": 18.5, "humidity": 65, "description": "Partly cloudy", "icon": "⛅", "windSpeed": 12.5 },
  "forecast": [
    { "date": "2026-06-21", "max": 22, "min": 15, "description": "Sunny", "icon": "☀️" }
  ]
}
```

## Frontend Design

### Layout
- Full-height dark background (`bg-gray-900`)
- Header bar: "Pi Dashboard" title on left, current time on right, subtle refresh indicator
- Below header: responsive CSS grid of widget cards (1 col mobile, 2 col tablet, 3 col desktop)
- Each widget is a card: rounded corners, subtle border (`border-gray-700`), dark background (`bg-gray-800`), title bar with icon

### Widget Card Component
- Props: title, icon, children, optional `isLoading`, optional `error`
- Shows a loading spinner when data is fetching
- Shows error state with red text if fetch failed
- Auto-refreshes every 5-10 seconds (configurable per widget)

### useApi Hook
```typescript
function useApi<T>(url: string, intervalMs: number = 5000): { data: T | null, isLoading: boolean, error: string | null }
```
- Fetches from backend API on mount and at the specified interval
- Handles errors gracefully
- Returns loading state

### System Widget
- CPU temp with color indicator (green <50°C, yellow <70°C, red ≥70°C)
- CPU usage bar
- Memory usage bar
- Disk usage bar
- Uptime formatted as "Xd Yh Zm"
- Load averages

### VPN Widget
- Large status indicator: green "Connected" or red "Disconnected"
- If connected: show IP, external IP, uptime
- If disconnected: show "Not connected" with muted styling

### Torrent Widget
- Summary row: X downloading, Y seeding, total speeds
- List of active torrents (max 5): name (truncated), progress bar, speed, state
- If no torrents: show "No active torrents"

### Tailscale Widget
- Self device highlighted
- List of peers with online/offline indicator (green/red dot)
- Show IP for each device

### Weather Widget
- Current temp (large), description with emoji
- 3-day forecast row: date, icon, max/min temps
- Clean and compact

## Dev Scripts (root package.json)
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace frontend\" \"npm run dev --workspace backend\"",
    "build": "npm run build --workspace frontend && npm run build --workspace backend",
    "start": "npm run start --workspace backend"
  }
}
```

## Backend .env.example
```
PORT=3001
QBIT_USERNAME=admin
QBIT_PASSWORD=adminadmin
```

## Vite Config
- Dev server proxy: `/api` → `http://localhost:3001`
- This way frontend dev runs on :5173 but calls backend on :3001 seamlessly

## Important Notes
- The backend runs shell commands to get system info — use `child_process.exec` or `execa`
- Handle errors gracefully — if a command fails (e.g., tun0 doesn't exist), return a sensible default, don't crash
- The qBittorrent credentials should be read from environment variables, with defaults
- All temperature values in Celsius
- All sizes in MB (convert from bytes/kB as needed)
- Format large numbers human-readably on the frontend (e.g., "1.2 GB/s")
- The app should work even if some services are down (e.g., VPN not connected, qBittorrent not running)
- Use proper TypeScript types throughout
- Make it look polished — this is a personal tool you'll use daily, not a demo
