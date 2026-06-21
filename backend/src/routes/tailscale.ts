import { Router } from 'express';
import { exec } from 'child_process';

export const tailscaleRouter = Router();

function execCmd(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 10000 }, (err, stdout) => {
      if (err) { resolve(''); return; }
      resolve(stdout.trim());
    });
  });
}

interface TailscalePeerStatus {
  HostName: string;
  TailscaleIPs: string[];
  Online: boolean;
  LastSeen?: string;
}

interface TailscaleSelfStatus {
  Self: {
    HostName: string;
    TailscaleIPs: string[];
    Online: boolean;
  };
  Peer: Record<string, TailscalePeerStatus>;
}

tailscaleRouter.get('/', async (_req, res) => {
  try {
    const raw = await execCmd('tailscale status --json 2>/dev/null');

    if (!raw) {
      res.json({
        self: { name: 'pi', ip: 'unknown', online: false },
        peers: [],
        onlineCount: 0,
        totalCount: 1,
      });
      return;
    }

    const status: TailscaleSelfStatus = JSON.parse(raw);

    const selfIp = status.Self.TailscaleIPs?.[0] || 'unknown';
    const self = {
      name: status.Self.HostName,
      ip: selfIp,
      online: status.Self.Online,
    };

    const peers = Object.values(status.Peer || {}).map((peer) => ({
      name: peer.HostName,
      ip: peer.TailscaleIPs?.[0] || 'unknown',
      online: peer.Online,
      lastSeen: peer.LastSeen || '',
    }));

    const onlineCount = peers.filter((p) => p.online).length + (self.online ? 1 : 0);
    const totalCount = peers.length + 1;

    res.json({ self, peers, onlineCount, totalCount });
  } catch {
    res.json({
      self: { name: 'pi', ip: 'unknown', online: false },
      peers: [],
      onlineCount: 0,
      totalCount: 1,
    });
  }
});
