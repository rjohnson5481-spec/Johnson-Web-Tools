import { useAuth, useDarkMode } from '@johnson-web-tools/shared';
import SignIn    from './components/SignIn.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const { user, loading } = useAuth();
  useDarkMode();

  if (loading) return null;
  if (!user)   return <SignIn />;
  return <Dashboard user={user} />;
}
