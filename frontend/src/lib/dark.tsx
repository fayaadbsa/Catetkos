
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type DarkCtx = [boolean, (v: boolean) => void];
const Ctx = createContext<DarkCtx>([false, () => {}]);
export const useDarkMode = () => useContext(Ctx);

// Tema disimpan di localStorage. Kelas `dark` awal dipasang script anti-FOUC di layout root.
export function DarkProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  const setDark = useCallback((v: boolean) => {
    setDarkState(v);
    document.documentElement.classList.toggle('dark', v);
    localStorage.setItem('theme', v ? 'dark' : 'light');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', v ? '#09090b' : '#fafafa');
  }, []);
  return <Ctx.Provider value={[dark, setDark]}>{children}</Ctx.Provider>;
}
