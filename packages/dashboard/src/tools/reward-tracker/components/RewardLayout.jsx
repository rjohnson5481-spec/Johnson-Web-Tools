// Main screen — two student cards + sheet management + view routing.
import { useState, useEffect } from 'react';
import { subscribePoints, awardPoints, deductPoints, spendPoints } from '../firebase/rewardTracker.js';
import RewardHeader from './RewardHeader.jsx';
import StudentCard  from './StudentCard.jsx';
import AwardSheet   from './AwardSheet.jsx';
import DeductSheet  from './DeductSheet.jsx';
import SpendSheet   from './SpendSheet.jsx';
import LogPage      from './LogPage.jsx';
import './RewardLayout.css';

const STUDENTS = ['Orion', 'Malachi'];

// view state: { page: 'main' | 'log', student: string | null }
const MAIN = { page: 'main', student: null };

// Props: uid (string)
// Dark mode is now handled by the shell (Settings tab); the reward tracker
// no longer needs its own useDarkMode subscriber.
export default function RewardLayout({ uid }) {
  const [balances, setBalances] = useState({ Orion: 0, Malachi: 0 });
  const [view, setView]         = useState(MAIN);
  const [sheet, setSheet]       = useState(null); // { type: 'award'|'deduct'|'spend', student }

  useEffect(() => {
    const unsubs = STUDENTS.map(s =>
      subscribePoints(uid, s, pts => setBalances(prev => ({ ...prev, [s]: pts })))
    );
    return () => unsubs.forEach(u => u());
  }, [uid]);

  function openSheet(type, student) { setSheet({ type, student }); }
  function closeSheet() { setSheet(null); }

  async function handleAward(student, delta, note) {
    closeSheet();
    await awardPoints(uid, student, delta, note);
  }

  async function handleDeduct(student, delta, note) {
    closeSheet();
    await deductPoints(uid, student, delta, note);
  }

  async function handleSpend(student, delta, note) {
    closeSheet();
    await spendPoints(uid, student, delta, note);
  }

  if (view.page === 'log') {
    return (
      <LogPage
        uid={uid}
        student={view.student}
        balance={balances[view.student]}
        onBack={() => setView(MAIN)}
      />
    );
  }

  return (
    <div className="rl-page">
      <RewardHeader onBack={null} />

      <div className="rl-body">
        {STUDENTS.map(student => (
          <StudentCard
            key={student}
            student={student}
            balance={balances[student]}
            onAward={() => openSheet('award', student)}
            onDeduct={() => openSheet('deduct', student)}
            onSpend={() => openSheet('spend', student)}
            onLog={() => setView({ page: 'log', student })}
          />
        ))}
      </div>

      {sheet?.type === 'award' && (
        <AwardSheet
          student={sheet.student}
          balance={balances[sheet.student]}
          onConfirm={(delta, note) => handleAward(sheet.student, delta, note)}
          onClose={closeSheet}
        />
      )}
      {sheet?.type === 'deduct' && (
        <DeductSheet
          student={sheet.student}
          balance={balances[sheet.student]}
          onConfirm={(delta, note) => handleDeduct(sheet.student, delta, note)}
          onClose={closeSheet}
        />
      )}
      {sheet?.type === 'spend' && (
        <SpendSheet
          student={sheet.student}
          balance={balances[sheet.student]}
          onConfirm={(delta, note) => handleSpend(sheet.student, delta, note)}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}
