import { createContext, useContext } from 'react';
export const DarkContext = createContext<[boolean, (v: boolean) => void]>([false, () => {}]);
export const useDarkMode = () => useContext(DarkContext);
