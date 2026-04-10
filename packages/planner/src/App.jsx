// Wiring file only — calls all hooks, checks auth, passes results to PlannerLayout.
// No local state. No JSX layout. No rendering logic.
// If this file grows, something is in the wrong place.

import { useEffect } from 'react';
import { useAuth } from '@homeschool/shared';
import { useWeek }       from './hooks/useWeek.js';
import { useSubjects }   from './hooks/useSubjects.js';
import { usePdfImport }  from './hooks/usePdfImport.js';
import { usePlannerUI }  from './hooks/usePlannerUI.js';
import PlannerLayout     from './components/PlannerLayout.jsx';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { weekId, weekDates, prevWeek, nextWeek } = useWeek();
  const ui = usePlannerUI();
  const {
    subjects, weekData, loading: subjectsLoading,
    updateCell, addSubject, removeSubject,
  } = useSubjects(user?.uid, weekId, ui.student);
  const pdfImport = usePdfImport();

  // Unauthenticated users go back to the dashboard sign-in.
  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/';
  }, [authLoading, user]);

  if (authLoading || !user) return null;

  return (
    <PlannerLayout
      user={user}
      weekId={weekId}
      weekDates={weekDates}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      subjects={subjects}
      weekData={weekData}
      subjectsLoading={subjectsLoading}
      updateCell={updateCell}
      addSubject={addSubject}
      removeSubject={removeSubject}
      pdfImport={pdfImport}
      {...ui}
    />
  );
}
