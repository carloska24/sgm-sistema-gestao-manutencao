'use client';

import { useEffect } from 'react';

const enablePwa = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true';

export default function ServiceWorkerManager() {
  useEffect(() => {
    if (!enablePwa) {
      return;
    }

    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.info('Service Worker registrado:', registration.scope);
        } catch (error) {
          console.error('Erro ao registrar Service Worker:', error);
        }
      };

      registerServiceWorker();
    }
  }, []);

  return null;
}
