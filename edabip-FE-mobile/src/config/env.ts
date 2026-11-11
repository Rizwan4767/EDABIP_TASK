import { Platform } from 'react-native';

import {
  buildDefaultDevApiBaseUrl,
  resolveDevMachineHost,
  rewriteDevApiBaseUrl,
} from '@/config/resolveDevApiHost';

export type AppEnvironment = 'development' | 'testing' | 'production';

/**
 * Metro replaces `process.env.EXPO_PUBLIC_*` at build time only for statically
 * written property accesses, so every variable must be referenced literally.
 * These values ship inside the JS bundle and are therefore public — never read
 * a secret through this module.
 */
const RAW_APP_ENV = process.env.EXPO_PUBLIC_APP_ENV;
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const RAW_API_TIMEOUT_MS = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
const RAW_ENABLE_DEV_LOGGING = process.env.EXPO_PUBLIC_ENABLE_DEV_LOGGING;

const DEFAULT_API_TIMEOUT_MS = 20_000;

function parseAppEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'production' || value === 'testing' || value === 'development') {
    return value;
  }
  return 'development';
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const appEnv = parseAppEnvironment(RAW_APP_ENV);
const isProduction = appEnv === 'production';

function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charAt(end - 1) === '/') {
    end -= 1;
  }
  return value.slice(0, end);
}

function resolveApiBaseUrl(): string {
  let configured = RAW_API_BASE_URL?.trim();

  if (!configured) {
    if (isProduction) {
      throw new Error(
        'EXPO_PUBLIC_API_BASE_URL is required for production builds. See .env.example.',
      );
    }
    configured = buildDefaultDevApiBaseUrl();
  }

  if (!configured.startsWith('http://') && !configured.startsWith('https://')) {
    throw new Error(
      `EXPO_PUBLIC_API_BASE_URL must start with http:// or https:// (received "${configured}").`,
    );
  }

  if (isProduction && configured.startsWith('http://')) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must use https:// in production builds.');
  }

  if (!isProduction) {
    configured = rewriteDevApiBaseUrl(configured);
  }

  return stripTrailingSlashes(configured);
}

export const env = {
  appEnv,
  isDevelopment: appEnv === 'development',
  isTesting: appEnv === 'testing',
  isProduction,
  /** Base URL of the shared EDABIP FastAPI backend. It exposes no `/api` prefix. */
  apiBaseUrl: resolveApiBaseUrl(),
  /** Host used to reach the dev machine, when auto-detected. */
  devApiHost: isProduction ? null : resolveDevMachineHost(),
  apiTimeoutMs: parsePositiveInteger(RAW_API_TIMEOUT_MS, DEFAULT_API_TIMEOUT_MS),
  enableDevLogging: parseBoolean(RAW_ENABLE_DEV_LOGGING, !isProduction),
  platform: Platform.OS,
} as const;
