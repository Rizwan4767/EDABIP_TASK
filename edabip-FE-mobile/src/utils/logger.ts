import { env } from '@/config/env';

/**
 * Logging funnel. Debug output is compiled away in production builds so that
 * tokens, OTPs, and request bodies can never reach a release console.
 */
export const logger = {
  debug(scope: string, ...args: unknown[]): void {
    if (!env.enableDevLogging) return;
    // eslint-disable-next-line no-console
    console.log(`[${scope}]`, ...args);
  },
  warn(scope: string, ...args: unknown[]): void {
    console.warn(`[${scope}]`, ...args);
  },
  error(scope: string, ...args: unknown[]): void {
    console.error(`[${scope}]`, ...args);
  },
};
