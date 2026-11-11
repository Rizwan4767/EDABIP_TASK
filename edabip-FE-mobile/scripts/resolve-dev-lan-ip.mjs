import os from 'node:os';

const ANDROID_EMULATOR_LOOPBACK_HOST = '10.0.2.2'; // NOSONAR — emulator-only host alias

function scoreIp(ip) {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.') && ip !== ANDROID_EMULATOR_LOOPBACK_HOST) return 1;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 2;
  return 3;
}

/**
 * Best-effort LAN IP for the machine running Metro. Injected into the app so
 * physical devices and emulators can reach the local FastAPI backend.
 */
export function resolveDevLanIp() {
  const candidates = [];

  for (const entries of Object.values(os.networkInterfaces())) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      candidates.push(entry.address);
    }
  }

  candidates.sort((left, right) => scoreIp(left) - scoreIp(right));
  return candidates[0];
}
