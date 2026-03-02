import { useState, useEffect, useCallback } from 'react';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState(getConnectionType());
  const [wasOffline, setWasOffline] = useState(false);

  function getConnectionType() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return conn?.effectiveType ?? 'unknown';
  }

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true); // flag so sync can fire
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(false);
  }, []);

  const clearWasOffline = useCallback(() => setWasOffline(false), []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = navigator.connection;
    const handleChange = () => setConnectionType(getConnectionType());
    conn?.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      conn?.removeEventListener('change', handleChange);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, connectionType, wasOffline, clearWasOffline };
}
