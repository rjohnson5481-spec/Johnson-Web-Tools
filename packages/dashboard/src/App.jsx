import { useAuth } from '@homeschool/shared';
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user)   return <SignIn />;
  return <Dashboard />;
}
