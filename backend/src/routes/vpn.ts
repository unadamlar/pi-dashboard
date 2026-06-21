import { Router } from 'express';
import { exec } from 'child_process';

export const vpnRouter = Router();

function execCmd(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 10000 }, (err, stdout) => {
      if (err) { resolve(''); return; }
      resolve(stdout.trim());
    });
  });
}

vpnRouter.get('/', async (_req, res) => {
  try {
    const tunOutput = await execCmd('ip addr show tun0 2>/dev/null');

    if (!tunOutput) {
      res.json({ connected: false });
      return;
    }

    const ipMatch = tunOutput.match(/inet (\d+\.\d+\.\d+\.\d+)/);
    const ip = ipMatch ? ipMatch[1] : 'unknown';

    let uptime: number | undefined;
    const pidOutput = await execCmd('pgrep -x openvpn');
    if (pidOutput) {
      const etimeOutput = await execCmd(`ps -o etimes= -p ${pidOutput.split('\n')[0]}`);
      uptime = parseInt(etimeOutput, 10) || undefined;
    }

    let externalIp: string | undefined;
    const extOutput = await execCmd('curl -s --max-time 5 ifconfig.me 2>/dev/null');
    if (extOutput && /^\d+\.\d+\.\d+\.\d+$/.test(extOutput)) {
      externalIp = extOutput;
    }

    res.json({
      connected: true,
      interface: 'tun0',
      ip,
      externalIp,
      uptime,
    });
  } catch {
    res.json({ connected: false });
  }
});
