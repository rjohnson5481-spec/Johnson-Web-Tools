// Wiring only — seeds reward tracker then renders RewardLayout.
// Auth is handled by the shell; this tab only runs when user is confirmed.
// Same pattern as packages/reward-tracker/src/App.jsx, minus auth guards and redirect.
import { useState, useEffect } from 'react';
import { useAuth }        from '@homeschool/shared';
import { seedIfNeeded }   from '../tools/reward-tracker/firebase/rewardTracker.js';
import RewardLayout       from '../tools/reward-tracker/components/RewardLayout.jsx';

export default function RewardsTab() {
  const { user } = useAuth();
  const [seeded, setSeeded] = useState(false);

  // Seed initial points for Orion and Malachi on first run.
  // Guarded by localStorage flag — no-op on subsequent renders.
  useEffect(() => {
    if (!user?.uid) return;
    seedIfNeeded(user.uid).then(() => setSeeded(true)).catch(() => setSeeded(true));
  }, [user?.uid]);

  if (!user || !seeded) return null;

  return <RewardLayout uid={user.uid} />;
}
