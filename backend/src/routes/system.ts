import { Router } from 'express';
import { exec } from 'child_process';
import { readFile } from 'fs/promises';

export const systemRouter = Router();

async function getCpuTemp(): Promise<number> {
  try {
    const data = await readFile('/sys/class/thermal/thermal_zone0/temp', 'utf-8');
    return parseInt(data.trim(), 10) / 1000;
  } catch {
    return 0;
  }
}

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    readFile('/proc/stat', 'utf-8')
      .then((data) => {
        const lines = data.split('\n');
        const cpuLine = lines.find((l) => l.startsWith('cpu '));
        if (!cpuLine) { resolve(0); return; }
        const fields = cpuLine.trim().split(/\s+/).slice(1).map(Number);
        const idle1 = fields[3];
        const total1 = fields.reduce((a, b) => a + b, 0);

        setTimeout(async () => {
          try {
            const data2 = await readFile('/proc/stat', 'utf-8');
            const lines2 = data2.split('\n');
            const cpuLine2 = lines2.find((l) => l.startsWith('cpu '));
            if (!cpuLine2) { resolve(0); return; }
            const fields2 = cpuLine2.trim().split(/\s+/).slice(1).map(Number);
            const idle2 = fields2[3];
            const total2 = fields2.reduce((a, b) => a + b, 0);

            const idleDelta = idle2 - idle1;
            const totalDelta = total2 - total1;
            if (totalDelta === 0) { resolve(0); return; }
            resolve(((totalDelta - idleDelta) / totalDelta) * 100);
          } catch {
            resolve(0);
          }
        }, 1000);
      })
      .catch(() => resolve(0));
  });
}

async function getMemory(): Promise<{ total: number; used: number; available: number; percent: number }> {
  try {
    const data = await readFile('/proc/meminfo', 'utf-8');
    const parse = (key: string): number => {
      const match = data.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'));
      return match ? parseInt(match[1], 10) : 0;
    };
    const total = parse('MemTotal');
    const available = parse('MemAvailable');
    const used = total - available;
    const percent = total > 0 ? (used / total) * 100 : 0;
    return {
      total: Math.round(total / 1024),
      used: Math.round(used / 1024),
      available: Math.round(available / 1024),
      percent: Math.round(percent * 10) / 10,
    };
  } catch {
    return { total: 0, used: 0, available: 0, percent: 0 };
  }
}

function getDisk(): Promise<{ total: number; used: number; available: number; percent: number }> {
  return new Promise((resolve) => {
    exec('df -m / | tail -1', (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve({ total: 0, used: 0, available: 0, percent: 0 });
        return;
      }
      const parts = stdout.trim().split(/\s+/);
      if (parts.length < 5) {
        resolve({ total: 0, used: 0, available: 0, percent: 0 });
        return;
      }
      const total = parseInt(parts[1], 10);
      const used = parseInt(parts[2], 10);
      const available = parseInt(parts[3], 10);
      resolve({
        total,
        used,
        available,
        percent: total > 0 ? Math.round((used / total) * 1000) / 10 : 0,
      });
    });
  });
}

async function getUptime(): Promise<number> {
  try {
    const data = await readFile('/proc/uptime', 'utf-8');
    const uptime = parseFloat(data.split(' ')[0]);
    return Math.round(uptime);
  } catch {
    return 0;
  }
}

async function getLoadAvg(): Promise<[number, number, number]> {
  try {
    const data = await readFile('/proc/loadavg', 'utf-8');
    const parts = data.split(' ');
    return [
      parseFloat(parts[0]),
      parseFloat(parts[1]),
      parseFloat(parts[2]),
    ];
  } catch {
    return [0, 0, 0];
  }
}

systemRouter.get('/', async (_req, res) => {
  try {
    const [cpuTemp, cpuUsage, memory, disk, uptime, loadAvg] = await Promise.all([
      getCpuTemp(),
      getCpuUsage(),
      getMemory(),
      getDisk(),
      getUptime(),
      getLoadAvg(),
    ]);

    res.json({
      cpuTemp,
      cpuUsage: Math.round(cpuUsage * 10) / 10,
      memory,
      disk,
      uptime,
      loadAvg,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get system info' });
  }
});
