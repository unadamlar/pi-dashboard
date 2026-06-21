import express from 'express';
import cors from 'cors';
import path from 'path';
import { systemRouter } from './routes/system';
import { vpnRouter } from './routes/vpn';
import { torrentsRouter } from './routes/torrents';
import { tailscaleRouter } from './routes/tailscale';
import { weatherRouter } from './routes/weather';
import { animeRouter } from './routes/anime';
import { hermesRouter } from './routes/hermes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/system', systemRouter);
app.use('/api/vpn', vpnRouter);
app.use('/api/torrents', torrentsRouter);
app.use('/api/tailscale', tailscaleRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/anime', animeRouter);
app.use('/api/hermes', hermesRouter);

// Serve built frontend in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pi Dashboard running on http://0.0.0.0:${PORT}`);
});
