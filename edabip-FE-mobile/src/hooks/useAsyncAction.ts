import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, getErrorMessage } from '@/services/api/apiError';
import type { FieldErrors } from '@/types/api';

interface AsyncActionState {
  isPending: boolean;
  error: string | null;
  fieldErrors: FieldErrors;
}

interface AsyncAction<TArgs extends unknown[], TResult> extends AsyncActionState {
  /** Resolves with the result, or `undefined` when the action threw. */
  run: (...args: TArgs) => Promise<TResult | undefined>;
  reset: () => void;
}

/**
 * Wraps a one-shot async operation (form submit, retry, refresh) with the
 * pending/error state every screen otherwise reimplements. Field-level messages
 * from a FastAPI 422 response are surfaced separately from the banner message.
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): AsyncAction<TArgs, TResult> {
  const [state, setState] = useState<AsyncActionState>({
    isPending: false,
    error: null,
    fieldErrors: {},
  });

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setState({ isPending: true, error: null, fieldErrors: {} });

      try {
        const result = await action(...args);
        if (isMounted.current) {
          setState({ isPending: false, error: null, fieldErrors: {} });
        }
        return result;
      } catch (cause) {
        if (isMounted.current) {
          setState({
            isPending: false,
            error: getErrorMessage(cause),
            fieldErrors: cause instanceof ApiError ? cause.fieldErrors : {},
          });
        }
        return undefined;
      }
    },
    [action],
  );

  const reset = useCallback(() => {
    setState({ isPending: false, error: null, fieldErrors: {} });
  }, []);

  return { ...state, run, reset };
}
