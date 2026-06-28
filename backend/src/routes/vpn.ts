import { Router } from 'express';
import { exec } from 'child_process';

export const vpnRouter = Router();

interface VpnEntry {
  name: string;
  connected: boolean;
  device: string | null;
  ip: string | null;
  uptime: number | null;  // seconds since activation, null if disconnected
}

function execCmd(cmd: string, timeout = 10000): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, (err, stdout, stderr) => {
      // nmcli sends status output to stderr, not stdout — combine both
      const output = [stdout, stderr].filter(s => s.trim()).join('\n').trim();
      resolve(output);
    });
  });
}

/**
 * Discover all VPN connections from NetworkManager — exactly how the Pi OS GUI works.
 */
async function discoverVpns(): Promise<string[]> {
  const output = await execCmd('nmcli -t -f NAME,TYPE connection show 2>/dev/null');
  if (!output) return [];
  return output
    .split('\n')
    .filter(line => line.endsWith(':vpn'))
    .map(line => line.replace(/:vpn$/, ''))
    .filter(Boolean);
}

/**
 * Get the status of a single VPN connection via NetworkManager.
 * Parses the full terse output — nmcli -f with dotted field names doesn't
 * work with -t mode, so we parse the unfiltered key:value lines.
 */
async function getVpnStatus(name: string): Promise<VpnEntry> {
  const show = await execCmd(`nmcli -t connection show "${name}" 2>/dev/null`);
  if (!show) {
    return { name, connected: false, device: null, ip: null, uptime: null };
  }

  const lines = show.split('\n');

  // Check if activated
  const stateLine = lines.find(l => l.startsWith('GENERAL.STATE:'));
  const state = stateLine?.split(':').slice(1).join(':') || '';
  if (state !== 'activated') {
    return { name, connected: false, device: null, ip: null, uptime: null };
  }

  // Device (e.g., wlan0 for VPN tunnelled over wifi, or tun0)
  const deviceLine = lines.find(l => l.startsWith('GENERAL.DEVICES:'));
  const device = deviceLine?.replace('GENERAL.DEVICES:', '') || null;

  // IP4.ADDRESS[1]:10.8.4.96/24 → strip CIDR suffix
  let ip: string | null = null;
  const ip4Line = lines.find(l => l.startsWith('IP4.ADDRESS[1]:'));
  if (ip4Line) {
    const ipPart = ip4Line.replace('IP4.ADDRESS[1]:', '');
    const ipMatch = ipPart.match(/^(\d+\.\d+\.\d+\.\d+)/);
    ip = ipMatch ? ipMatch[1] : null;
  }

  // Uptime from connection.timestamp (Unix seconds since epoch)
  let uptime: number | null = null;
  const tsLine = lines.find(l => l.startsWith('connection.timestamp:'));
  if (tsLine) {
    const ts = parseInt(tsLine.split(':')[1], 10);
    if (ts && ts > 0) {
      uptime = Math.floor(Date.now() / 1000) - ts;
    }
  }

  return { name, connected: true, device, ip, uptime };
}

// GET /api/vpn — status for all VPN connections
vpnRouter.get('/', async (_req, res) => {
  try {
    const vpnNames = await discoverVpns();
    const vpns = await Promise.all(vpnNames.map(getVpnStatus));

    // External IP: check if any VPN is connected, then curl ifconfig.me
    let externalIp: string | null = null;
    const connected = vpns.filter(v => v.connected);
    if (connected.length > 0) {
      const extOutput = await execCmd('curl -s --max-time 5 ifconfig.me 2>/dev/null');
      if (extOutput && /^\d+\.\d+\.\d+\.\d+$/.test(extOutput)) {
        externalIp = extOutput;
      }
    }

    res.json({ vpns, externalIp });
  } catch {
    res.json({ vpns: [], externalIp: null });
  }
});

// POST /api/vpn/connect — connect a VPN via NetworkManager
vpnRouter.post('/connect', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, message: 'VPN name is required' });
      return;
    }

    // Check if already connected
    const status = await getVpnStatus(name);
    if (status.connected) {
      res.json({ success: true, message: `${name} is already connected` });
      return;
    }

    // Connect via nmcli — same way the Pi OS GUI does it
    const output = await execCmd(`nmcli connection up "${name}" 2>&1`, 30000);

    // Wait a moment for the connection to establish
    await new Promise(r => setTimeout(r, 2000));

    // Verify
    const verify = await getVpnStatus(name);
    if (verify.connected) {
      res.json({ success: true, message: `${name} connected` });
    } else {
      res.json({
        success: false,
        message: `Failed to connect ${name}`,
        details: output || 'No output from nmcli',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vpn/disconnect — disconnect a VPN via NetworkManager
vpnRouter.post('/disconnect', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, message: 'VPN name is required' });
      return;
    }

    const status = await getVpnStatus(name);
    if (!status.connected) {
      res.json({ success: true, message: `${name} is not connected` });
      return;
    }

    await execCmd(`nmcli connection down "${name}" 2>&1`, 15000);
    await new Promise(r => setTimeout(r, 1000));

    res.json({ success: true, message: `${name} disconnected` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
