import { Router } from 'express';
import { exec } from 'child_process';

export const hermesRouter = Router();

function execCmd(cmd: string, timeout = 15000): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, (err, stdout) => {
      if (err) { resolve(''); return; }
      resolve(stdout.trim());
    });
  });
}

hermesRouter.get('/', async (_req, res) => {
  try {
    const versionOut = await execCmd('/home/leb/.local/bin/hermes version 2>&1 | head -1');
    const version = versionOut.replace('Hermes Agent ', '').trim() || 'unknown';

    const updateOut = await execCmd('/home/leb/.hermes/hermes-agent/venv/bin/pip install hermes-agent 2>&1 | tail -3');
    const updateAvailable = updateOut.includes('Successfully installed');

    const modelOut = await execCmd("grep '^default:' /home/leb/.hermes/profiles/pi/config.yaml -A3 2>/dev/null | grep 'model:' | head -1 | awk '{print $2}'");

    const gwOut = await execCmd('pgrep -f "hermes-gateway" 2>/dev/null | head -1');
    const dbOut = await execCmd('pgrep -f "hermes-dashboard" 2>/dev/null | head -1');

    res.json({
      version,
      updateAvailable,
      model: modelOut || 'not set',
      gatewayRunning: !!gwOut,
      dashboardRunning: !!dbOut,
    });
  } catch {
    res.json({ version: 'unknown', updateAvailable: false, model: 'unknown', gatewayRunning: false, dashboardRunning: false });
  }
});

hermesRouter.post('/update', async (_req, res) => {
  try {
    const updateOutput = await execCmd('/home/leb/.hermes/hermes-agent/venv/bin/pip install --upgrade hermes-agent 2>&1', 120000);
    const success = !updateOutput.includes('ERROR') && !updateOutput.includes('Failed');

    // Restart services if update succeeded
    if (success) {
      execCmd('systemctl --user restart hermes-gateway hermes-dashboard 2>/dev/null', 30000);
    }

    res.json({
      success,
      message: success ? 'Hermes updated — gateway & dashboard restarted' : 'Update failed',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
