import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// URL lama berbasis hash (/#bookings) -> path nyata (/bookings).
if (location.hash.length > 1) history.replaceState(null, '', '/' + location.hash.slice(1));

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

// PWA: service worker cuma di production.
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js');
