import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export function SessionTimeout({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, resetSession } = useAuthContext();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionActive, setSessionActive] = useState(true);

  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const isSessionExpired = useCallback(() => {
    return Date.now() - lastActivity > SESSION_TIMEOUT;
  }, [lastActivity]);

  // Listen to user activity
  useEffect(() => {
    if (!sessionActive || !isAuthenticated) return;

    const events = [
      'mousemove',
      'mousedown',
      'keypress',
      'click',
      'scroll',
      'touchstart',
      'touchmove',
      'visibilitychange'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [sessionActive, isAuthenticated, handleActivity]);

  // Periodically check for expiration
  useEffect(() => {
    if (!sessionActive || !isAuthenticated) return;

    const checkInterval = setInterval(() => {
      if (isSessionExpired()) {
        setSessionActive(false);
        resetSession();
        navigate('/session-expired');
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(checkInterval);
  }, [sessionActive, isAuthenticated, isSessionExpired, resetSession, navigate]);

  // Reset session on auth state change
  useEffect(() => {
    if (isAuthenticated) {
      setSessionActive(true);
      setLastActivity(Date.now());
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}
