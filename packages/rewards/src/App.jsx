import { useState, useEffect } from 'react';
import { useAuth, db, useDarkMode } from '@johnson-web-tools/shared';
import { doc, onSnapshot } from 'firebase/firestore';
import SignIn              from './components/SignIn.jsx';
import RewardLayout        from './tools/reward-tracker/components/RewardLayout.jsx';
import { seedIfNeeded }    from './tools/reward-tracker/firebase/rewardTracker.js';

export default function App() {
  const { user, loading } = useAuth();
  const uid = user?.uid;
  useDarkMode();

  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, `users/${uid}/settings/students`), snap => {
      setStudents(snap.data()?.names ?? []);
    });
  }, [uid]);

  useEffect(() => {
    if (!uid || !students.length) return;
    seedIfNeeded(uid, students).catch(() => {});
  }, [uid, students]);

  if (loading) return null;
  if (!user)   return <SignIn />;

  if (students.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-msg">No students found. Add students in Settings.</p>
      </div>
    );
  }

  return <RewardLayout uid={uid} students={students} />;
}
