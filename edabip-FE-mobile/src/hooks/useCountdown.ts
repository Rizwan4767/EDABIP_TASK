import { useCallback, useEffect, useState } from 'react';

interface Countdown {
  secondsLeft: number;
  isComplete: boolean;
  restart: (seconds?: number) => void;
}

/**
 * Second-resolution countdown for OTP resend cooldowns and challenge expiry.
 *
 * The deadline is wall-clock based and computed inside the effect, so the timer
 * stays accurate across app backgrounding and render stays pure.
 */
export function useCountdown(initialSeconds: number): Countdown {
  const [duration, setDuration] = useState(() => Math.max(0, Math.ceil(initialSeconds)));
  const [runId, setRunId] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(duration);

  useEffect(() => {
    if (duration <= 0) return undefined;

    const deadline = Date.now() + duration * 1000;
    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 500);

    return () => clearInterval(interval);
  }, [duration, runId]);

  const restart = useCallback(
    (seconds = initialSeconds) => {
      const next = Math.max(0, Math.ceil(seconds));
      setSecondsLeft(next);
      setDuration(next);
      // Forces the effect to rerun even when the duration is unchanged.
      setRunId((id) => id + 1);
    },
    [initialSeconds],
  );

  return { secondsLeft, isComplete: secondsLeft <= 0, restart };
}
