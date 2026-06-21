import { Router } from 'express';
import { exec } from 'child_process';

export const vpnRouter = Router();

interface VpnInfo {
  name: string;
  label: string;
  config: string;
  interface: string;
}

const VPNS: VpnInfo[] = [
  { name: 'CG-FI', label: 'Finland', config: '/etc/openvpn/client/CG_FI.conf', interface: 'tun0' },
  { name: 'CG-TR', label: 'Turkey', config: '/etc/openvpn/tr_openvpn.ovpn', interface: 'tun1' },
];

function execCmd(cmd: string, timeout = 10000): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, (err, stdout) => {
      if (err) { resolve(''); return; }
      resolve(stdout.trim());
    });
  });
}

async function getVpnStatus(vpn: VpnInfo): Promise<{
  name: string;
  label: string;
  connected: boolean;
  ip: string | null;
  uptime: number | null;
}> {
  // Check if the openvpn process is running with this config
  const procCheck = await execCmd(`pgrep -f "openvpn.*${vpn.config.replace(/\//g, '\\/')}"`);
  if (!procCheck) {
    return { name: vpn.name, label: vpn.label, connected: false, ip: null, uptime: null };
  }

  const pid = procCheck.split('\n')[0];

  // Get IP from the expected tun interface or any tun
  const tunOutput = await execCmd(`ip addr show ${vpn.interface} 2>/dev/null`);
  let ip: string | null = null;
  if (tunOutput) {
    const ipMatch = tunOutput.match(/inet (\d+\.\d+\.\d+\.\d+)/);
    ip = ipMatch ? ipMatch[1] : null;
  }

  // If not on expected interface, try any tun
  if (!ip) {
    const anyTun = await execCmd("ip -4 addr show tun* 2>/dev/null | grep inet");
    if (anyTun) {
      const ipMatch = anyTun.match(/inet (\d+\.\d+\.\d+\.\d+)/);
      ip = ipMatch ? ipMatch[1] : null;
    }
  }

  // Get uptime
  let uptime: number | null = null;
  const etimeOutput = await execCmd(`ps -o etimes= -p ${pid}`);
  if (etimeOutput) {
    uptime = parseInt(etimeOutput, 10) || null;
  }

  return { name: vpn.name, label: vpn.label, connected: true, ip, uptime };
}

// GET /api/vpn — status for all VPNs
vpnRouter.get('/', async (_req, res) => {
  try {
    const results = await Promise.all(VPNS.map(getVpnStatus));

    // Get external IP from any connected VPN
    let externalIp: string | null = null;
    const connected = results.filter(r => r.connected);
    if (connected.length > 0) {
      const extOutput = await execCmd('curl -s --max-time 5 ifconfig.me 2>/dev/null');
      if (extOutput && /^\d+\.\d+\.\d+\.\d+$/.test(extOutput)) {
        externalIp = extOutput;
      }
    }

    res.json({ vpns: results, externalIp });
  } catch {
    res.json({ vpns: VPNS.map(v => ({ name: v.name, label: v.label, connected: false, ip: null, uptime: null })), externalIp: null });
  }
});

// POST /api/vpn/connect — start a VPN
vpnRouter.post('/connect', async (req, res) => {
  try {
    const { name } = req.body;
    const vpn = VPNS.find(v => v.name === name);
    if (!vpn) {
      res.status(400).json({ success: false, message: `Unknown VPN: ${name}` });
      return;
    }

    // Check if already connected
    const status = await getVpnStatus(vpn);
    if (status.connected) {
      res.json({ success: true, message: `${vpn.label} VPN is already connected` });
      return;
    }

    const logFile = `/tmp/openvpn-${vpn.name.toLowerCase()}.log`;
    await execCmd(`sudo openvpn --config ${vpn.config} --daemon --log ${logFile} 2>&1`);

    // Wait a moment, then verify
    await new Promise(r => setTimeout(r, 2000));
    const verify = await getVpnStatus(vpn);
    if (verify.connected) {
      res.json({ success: true, message: `${vpn.label} VPN connected` });
    } else {
      const logOutput = await execCmd(`tail -20 ${logFile} 2>/dev/null`);
      res.json({ success: false, message: `Failed to connect ${vpn.label} VPN`, details: logOutput || 'Check logs' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vpn/disconnect — stop a VPN
vpnRouter.post('/disconnect', async (req, res) => {
  try {
    const { name } = req.body;
    const vpn = VPNS.find(v => v.name === name);
    if (!vpn) {
      res.status(400).json({ success: false, message: `Unknown VPN: ${name}` });
      return;
    }

    // Find and kill the specific process
    const pids = await execCmd(`pgrep -f "openvpn.*${vpn.config.replace(/\//g, '\\/')}"`);
    if (!pids) {
      res.json({ success: true, message: `${vpn.label} VPN is not connected` });
      return;
    }

    await execCmd(`sudo kill ${pids.split('\n')[0]} 2>/dev/null`);
    await new Promise(r => setTimeout(r, 1000));

    res.json({ success: true, message: `${vpn.label} VPN disconnected` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
