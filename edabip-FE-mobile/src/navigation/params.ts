import type {
  AccountLockedScreenParams,
  BillingScreenParams,
  OtpScreenParams,
  ResetPasswordScreenParams,
} from '@/navigation/types';

/** Shape `useLocalSearchParams()` returns: a value may be repeated in the URL. */
type RawSearchParams = Record<string, string | string[] | undefined>;

function readString(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first && first.trim() !== '' ? first : undefined;
}

export function readOtpParams(params: RawSearchParams): OtpScreenParams {
  return {
    email: readString(params, 'email'),
    flow: readString(params, 'flow'),
  };
}

export function readResetPasswordParams(params: RawSearchParams): ResetPasswordScreenParams {
  return { token: readString(params, 'token') };
}

export function readAccountLockedParams(params: RawSearchParams): AccountLockedScreenParams {
  return {
    email: readString(params, 'email'),
    message: readString(params, 'message'),
  };
}

export function readBillingParams(params: RawSearchParams): BillingScreenParams {
  return {
    section: readString(params, 'section'),
    focus: readString(params, 'focus'),
  };
}
