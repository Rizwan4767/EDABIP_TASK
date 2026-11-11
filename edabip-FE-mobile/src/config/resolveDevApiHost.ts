import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_PORT = 8000;
/** Android emulator alias for the development host loopback. Not a production endpoint. */
const ANDROID_EMULATOR_LOOPBACK_HOST = '10.0.2.2'; // NOSONAR — emulator-only host alias

type ExpoConstantsWithLegacyManifest = typeof Constants & {
  expoGoConfig?: { debuggerHost?: string };
  manifest?: { debuggerHost?: string };
  manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
};

type ExpoExtra = {
  devApiHost?: string;
};

export function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isEmulatorOnlyHost(hostname: string): boolean {
  return hostname === ANDROID_EMULATOR_LOOPBACK_HOST;
}

function getMetroBundlerHost(): string | null {
  const constants = Constants as ExpoConstantsWithLegacyManifest;
  const hostUri =
    Constants.expoConfig?.hostUri ??
    constants.expoGoConfig?.debuggerHost ??
    constants.manifest2?.extra?.expoGo?.debuggerHost ??
    constants.manifest?.debuggerHost;

  if (typeof hostUri !== 'string' || hostUri.trim() === '') {
    return null;
  }

  const host = hostUri.split(':')[0]?.trim();
  return host || null;
}

function getInjectedDevApiHost(): string | null {
  const host = (Constants.expoConfig?.extra as ExpoExtra | undefined)?.devApiHost;
  if (typeof host !== 'string' || host.trim() === '') {
    return null;
  }
  return host.trim();
}

/**
 * Pick the host the mobile runtime should use to reach the dev machine.
 * Priority: Metro-injected LAN IP → Metro debugger host → Android emulator alias.
 */
export function resolveDevMachineHost(): string | null {
  const injectedHost = getInjectedDevApiHost();
  if (injectedHost) {
    return injectedHost;
  }

  const metroHost = getMetroBundlerHost();
  if (metroHost && !isLoopbackHost(metroHost) && !isEmulatorOnlyHost(metroHost)) {
    return metroHost;
  }

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return ANDROID_EMULATOR_LOOPBACK_HOST;
  }

  return metroHost;
}

export function buildDefaultDevApiBaseUrl(): string {
  const devHost = resolveDevMachineHost();
  if (devHost) {
    return `http://${devHost}:${DEFAULT_API_PORT}`;
  }

  return Platform.OS === 'android'
    ? `http://${ANDROID_EMULATOR_LOOPBACK_HOST}:${DEFAULT_API_PORT}`
    : `http://localhost:${DEFAULT_API_PORT}`;
}

export function rewriteDevApiBaseUrl(url: string): string {
  const devHost = resolveDevMachineHost();
  if (!devHost) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const shouldRewrite =
      isLoopbackHost(parsed.hostname) ||
      (isEmulatorOnlyHost(parsed.hostname) && devHost !== ANDROID_EMULATOR_LOOPBACK_HOST);

    if (!shouldRewrite) {
      return url;
    }

    parsed.hostname = devHost;
    const next = parsed.toString();
    let end = next.length;
    while (end > 0 && next.charAt(end - 1) === '/') {
      end -= 1;
    }
    return next.slice(0, end);
  } catch {
    return url;
  }
}
