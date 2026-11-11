type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

/**
 * Lets the HTTP client report an unrecoverable session (refresh token rejected)
 * without importing the auth store, which would create a cycle.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionExpired(): void {
  listeners.forEach((listener) => listener());
}
