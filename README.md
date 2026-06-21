# Pi Dashboard

A personal web dashboard for a Raspberry Pi 5 home server.

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS v3
- **Backend**: Express.js + TypeScript
- **Build**: npm workspaces (monorepo)

## Getting Started

```bash
# Install dependencies
npm install

# Start both frontend and backend in dev mode
npm run dev

# Build for production
npm run build

# Start production backend
npm run start
```

## Configuration

Copy `backend/.env.example` to `backend/.env` and update:

```
PORT=3001
QBIT_USERNAME=admin
QBIT_PASSWORD=adminadmin
```

## Access

- Dev: `http://localhost:5173` (frontend proxies `/api` to backend on `:3001`)
- Production (via Tailscale): `http://pi:3000`
