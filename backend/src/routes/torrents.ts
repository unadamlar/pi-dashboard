import { Router } from 'express';

export const torrentsRouter = Router();

interface QBittorrentTorrent {
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  state: string;
  eta: number;
}

torrentsRouter.get('/', async (_req, res) => {
  const username = process.env.QBIT_USERNAME || 'admin';
  const password = process.env.QBIT_PASSWORD || 'adminadmin';
  const baseUrl = 'http://localhost:8080/api/v2';

  try {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    });

    if (!loginRes.ok) {
      res.json({
        total: 0,
        downloading: 0,
        seeding: 0,
        totalDownloadSpeed: 0,
        totalUploadSpeed: 0,
        torrents: [],
      });
      return;
    }

    const cookies = loginRes.headers.get('set-cookie') || '';

    const torrentsRes = await fetch(`${baseUrl}/torrents/info`, {
      headers: { Cookie: cookies },
    });

    if (!torrentsRes.ok) {
      res.json({
        total: 0,
        downloading: 0,
        seeding: 0,
        totalDownloadSpeed: 0,
        totalUploadSpeed: 0,
        torrents: [],
      });
      return;
    }

    const raw = (await torrentsRes.json()) as QBittorrentTorrent[];

    const torrents = raw.map((t) => ({
      name: t.name,
      size: t.size,
      progress: t.progress,
      downloadSpeed: t.dlspeed,
      state: t.state,
      eta: t.eta,
    }));

    const totalDownloadSpeed = raw.reduce((sum, t) => sum + t.dlspeed, 0);
    const totalUploadSpeed = raw.reduce((sum, t) => sum + t.upspeed, 0);
    const downloading = raw.filter((t) => t.state === 'downloading').length;
    const seeding = raw.filter((t) => t.state === 'stalledUP' || t.state === 'uploading').length;

    res.json({
      total: torrents.length,
      downloading,
      seeding,
      totalDownloadSpeed,
      totalUploadSpeed,
      torrents,
    });
  } catch {
    res.json({
      total: 0,
      downloading: 0,
      seeding: 0,
      totalDownloadSpeed: 0,
      totalUploadSpeed: 0,
      torrents: [],
    });
  }
});
