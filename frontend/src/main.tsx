import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DarkProvider } from '@/lib/dark';
import { SessionProvider } from '@/lib/me';
import App from './App';
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DarkProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </DarkProvider>
    </BrowserRouter>
  </StrictMode>,
);

// PWA: service worker cuma di production.
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js');
