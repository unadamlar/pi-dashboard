import express from 'express';
import cors from 'cors';
import { systemRouter } from './routes/system';
import { vpnRouter } from './routes/vpn';
import { torrentsRouter } from './routes/torrents';
import { tailscaleRouter } from './routes/tailscale';
import { weatherRouter } from './routes/weather';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

app.use('/api/system', systemRouter);
app.use('/api/vpn', vpnRouter);
app.use('/api/torrents', torrentsRouter);
app.use('/api/tailscale', tailscaleRouter);
app.use('/api/weather', weatherRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
