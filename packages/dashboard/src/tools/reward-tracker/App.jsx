// Wiring file only — auth check + seed, then hands off to RewardLayout.
// No local state beyond auth. No JSX layout. No rendering logic.

import { useState, useEffect } from 'react';
import { useAuth } from '@homeschool/shared';
import { seedIfNeeded } from './firebase/rewardTracker.js';
import RewardLayout from './components/RewardLayout.jsx';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [seeded, setSeeded] = useState(false);

  // Redirect unauthenticated users to dashboard sign-in.
  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/';
  }, [authLoading, user]);

  // Seed initial points for Orion and Malachi on first run.
  useEffect(() => {
    if (!user?.uid) return;
    seedIfNeeded(user.uid).then(() => setSeeded(true)).catch(() => setSeeded(true));
  }, [user?.uid]);

  if (authLoading || !user || !seeded) return null;

  return <RewardLayout uid={user.uid} />;
}
