import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { useDark } from './lib/useDark';
import { DarkContext } from './lib/dark';
import Login from './pages/Login';
import { AppShell } from './components/shell/AppShell';

function Gate() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  return status === 'in' ? <AppShell /> : <Login />;
}

export default function App() {
  const dark = useDark();
  return (
    <DarkContext.Provider value={dark}>
      <AuthProvider><BrowserRouter><Gate /></BrowserRouter></AuthProvider>
    </DarkContext.Provider>
  );
}
