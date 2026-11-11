import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveDevLanIp } from './resolve-dev-lan-ip.mjs';

const isWin = process.platform === 'win32';
const adbName = isWin ? 'adb.exe' : 'adb';
const METRO_PORT = '8081';
/** FastAPI listens here in development — reverse it so USB devices keep working when LAN IP drifts. */
const API_PORT = '8000';

function resolveAndroidSdk() {
  const homes = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
    path.join(os.homedir(), 'Library', 'Android', 'sdk'),
    path.join(os.homedir(), 'Android', 'Sdk'),
  ].filter(Boolean);

  return homes.find((dir) => fs.existsSync(path.join(dir, 'platform-tools', adbName))) ?? null;
}

function applySdkEnv(sdk) {
  process.env.ANDROID_HOME = sdk;
  process.env.ANDROID_SDK_ROOT = sdk;
  const platformTools = path.join(sdk, 'platform-tools');
  const pathParts = (process.env.PATH ?? '').split(path.delimiter);
  if (!pathParts.includes(platformTools)) {
    process.env.PATH = `${platformTools}${path.delimiter}${process.env.PATH}`;
  }
}

function connectedSerials(adb) {
  const listed = spawnSync(adb, ['devices'], { encoding: 'utf8' });
  if (listed.status !== 0) {
    return [];
  }

  return listed.stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => /\tdevice\b/.test(line))
    .map((line) => line.split(/\s+/)[0])
    .filter(Boolean);
}

/**
 * Debug/dev-client APKs do not ship `index.android.bundle`. USB devices and
 * emulators must tunnel Metro to localhost:8081 or they crash on launch.
 * Also reverse the API port so `/auth/me` and billing keep working when the
 * Wi-Fi IP changes or the phone cannot reach the LAN address.
 */
function reverseTcp(adb, serial, port) {
  const result = spawnSync(adb, ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`], {
    encoding: 'utf8',
  });
  if (result.status === 0) {
    console.log(`[ensure-android-metro] adb reverse tcp:${port} on ${serial}`);
    return;
  }
  const detail = (result.stderr || result.stdout || '').trim();
  console.warn(
    `[ensure-android-metro] adb reverse tcp:${port} failed on ${serial}${detail ? `: ${detail}` : ''}`,
  );
}

function reverseDevPorts(sdk) {
  const adb = path.join(sdk, 'platform-tools', adbName);
  spawnSync(adb, ['start-server'], { stdio: 'ignore' });

  const serials = connectedSerials(adb);
  if (serials.length === 0) {
    return;
  }

  for (const serial of serials) {
    reverseTcp(adb, serial, METRO_PORT);
    reverseTcp(adb, serial, API_PORT);
  }
}

const lanIp = resolveDevLanIp();
if (lanIp && !process.env.REACT_NATIVE_PACKAGER_HOSTNAME) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = lanIp;
  console.log(`[ensure-android-metro] packager host ${lanIp}`);
}

const sdk = resolveAndroidSdk();
if (sdk) {
  applySdkEnv(sdk);
  reverseDevPorts(sdk);
} else {
  console.warn(
    '[ensure-android-metro] Android SDK not found. USB devices will not reach Metro until adb is on PATH.',
  );
}

const args = process.argv.slice(2);
if (args.length === 0) {
  process.exit(0);
}

const [command, ...commandArgs] = args;
const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  env: process.env,
  shell: isWin,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
