// Wiring file only — calls all hooks, checks auth, passes results to PlannerLayout.
// No local state. No JSX layout. No rendering logic.
// If this file grows, something is in the wrong place.

import { useEffect } from 'react';
import { useAuth } from '@homeschool/shared';
import { useWeek }       from './hooks/useWeek.js';
import { useSubjects }   from './hooks/useSubjects.js';
import { usePdfImport }  from './hooks/usePdfImport.js';
import { usePlannerUI }  from './hooks/usePlannerUI.js';
import { useSettings }   from './hooks/useSettings.js';
import PlannerLayout     from './components/PlannerLayout.jsx';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { weekId, weekDates, prevWeek, nextWeek, jumpToWeek } = useWeek();
  const ui = usePlannerUI();
  const {
    subjects, dayData, loading: subjectsLoading,
    updateCell, addSubject, removeSubject, importCell, deleteWeek, wipeWeek,
    performSickDay, performUndoSickDay, sickDayIndices,
    loadWeekDataFrom,
  } = useSubjects(user?.uid, weekId, ui.student, ui.day);
  const pdfImport = usePdfImport();
  const { students } = useSettings(user?.uid);

  // Unauthenticated users go back to the dashboard sign-in.
  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/';
  }, [authLoading, user]);

  // If the currently selected student was removed, fall back to the first in the list.
  useEffect(() => {
    if (students.length === 0) return;
    if (!students.includes(ui.student)) ui.setStudent(students[0]);
  }, [students, ui.student]);

  if (authLoading || !user) return null;

  return (
    <PlannerLayout
      user={user}
      weekId={weekId}
      weekDates={weekDates}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      subjects={subjects}
      dayData={dayData}
      subjectsLoading={subjectsLoading}
      updateCell={updateCell}
      addSubject={addSubject}
      removeSubject={removeSubject}
      importCell={importCell}
      jumpToWeek={jumpToWeek}
      deleteWeek={deleteWeek}
      wipeWeek={wipeWeek}
      performSickDay={performSickDay}
      performUndoSickDay={performUndoSickDay}
      sickDayIndices={sickDayIndices}
      loadWeekDataFrom={loadWeekDataFrom}
      pdfImport={pdfImport}
      students={students}
      {...ui}
    />
  );
}
