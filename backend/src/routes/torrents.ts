import { Router } from 'express';

export const torrentsRouter = Router();

const BASE_URL = process.env.QBIT_URL || 'http://localhost:8080/api/v2';

interface QBittorrentTorrent {
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  state: string;
  eta: number;
}

/**
 * Authenticate against qBittorrent and return the auth cookie string.
 * Returns null on auth failure OR if qBittorrent is unreachable.
 */
async function qbitLogin(): Promise<string | null> {
  const username = process.env.QBIT_USERNAME || 'admin';
  const password = process.env.QBIT_PASSWORD || 'adminadmin';

  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    });

    if (!loginRes.ok) return null;
    return loginRes.headers.get('set-cookie') || '';
  } catch {
    // qBittorrent unreachable (not running on the configured host/port).
    return null;
  }
}

const EMPTY_STATS = {
  total: 0,
  downloading: 0,
  seeding: 0,
  totalDownloadSpeed: 0,
  totalUploadSpeed: 0,
  torrents: [],
  reachable: false,
};

torrentsRouter.get('/', async (_req, res) => {
  try {
    const cookies = await qbitLogin();
    if (!cookies) {
      res.json(EMPTY_STATS);
      return;
    }

    const torrentsRes = await fetch(`${BASE_URL}/torrents/info`, {
      headers: { Cookie: cookies },
    });

    if (!torrentsRes.ok) {
      res.json({ ...EMPTY_STATS, reachable: true });
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
      reachable: true,
    });
  } catch {
    res.json(EMPTY_STATS);
  }
});

/**
 * POST /add
 * Body: { urls: string, category?: string, savepath?: string, paused?: boolean }
 * `urls` accepts one or more magnet links or http(s) torrent URLs separated by newlines.
 * qBittorrent responds with "Ok." on success.
 */
torrentsRouter.post('/add', async (req, res) => {
  const { urls, category, savepath, paused } = req.body || {};

  if (!urls || typeof urls !== 'string' || urls.trim() === '') {
    res.status(400).json({ ok: false, error: 'No URLs provided' });
    return;
  }

  try {
    const cookies = await qbitLogin();
    if (!cookies) {
      res
        .status(502)
        .json({ ok: false, error: 'qBittorrent unreachable — is it running on port 8080?' });
      return;
    }

    const params = new URLSearchParams();
    params.set('urls', urls);

    // Optional fields — only append when provided so qBittorrent keeps its defaults.
    if (category && typeof category === 'string') params.set('category', category);
    if (savepath && typeof savepath === 'string') params.set('savepath', savepath);
    if (paused === true) params.set('stopped', 'true');

    // Let qBittorrent manage whether to skip already-existing torrents.
    params.set('skip_checking', 'false');

    const addRes = await fetch(`${BASE_URL}/torrents/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookies,
      },
      body: params.toString(),
    });

    if (!addRes.ok) {
      const text = await addRes.text().catch(() => '');
      res.status(502).json({ ok: false, error: `qBittorrent ${addRes.status}: ${text}` });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Add request failed',
    });
  }
});