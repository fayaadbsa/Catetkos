'use client';

import { useEffect } from 'react';

// PWA: service worker cuma di production.
export function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production')
      navigator.serviceWorker.register('/sw.js');
  }, []);
  return null;
}
