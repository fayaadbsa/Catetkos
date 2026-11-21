import { useEffect, useState } from 'react';

// Tema gelap tersimpan di localStorage. Sekalian sinkron <meta theme-color> biar status bar iOS/Android ikut.
export function useDark(): [boolean, (v: boolean) => void] {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#09090b' : '#fafafa');
  }, [dark]);
  return [dark, setDark];
}
