// Wiring only — calls planner hooks, passes results to PlannerLayout.
// Auth is handled by the shell; this tab only runs when user is confirmed.
// Same pattern as packages/planner/src/App.jsx, minus auth guards and redirect.
import { useEffect } from 'react';
import { useAuth }       from '@homeschool/shared';
import { useWeek }       from '../tools/planner/hooks/useWeek.js';
import { useSubjects }   from '../tools/planner/hooks/useSubjects.js';
import { usePdfImport }  from '../tools/planner/hooks/usePdfImport.js';
import { usePlannerUI }  from '../tools/planner/hooks/usePlannerUI.js';
import { useSettings }   from '../tools/planner/hooks/useSettings.js';
import PlannerLayout     from '../tools/planner/components/PlannerLayout.jsx';

export default function PlannerTab() {
  const { user } = useAuth();
  const { weekId, weekDates, prevWeek, nextWeek, jumpToWeek } = useWeek();
  const ui = usePlannerUI();
  const {
    subjects, dayData, loading: subjectsLoading,
    updateCell, addSubject, removeSubject, importCell, deleteWeek, wipeWeek,
    performSickDay, performUndoSickDay, sickDayIndices,
    loadWeekDataFrom,
  } = useSubjects(user?.uid, weekId, ui.student, ui.day);
  const pdfImport = usePdfImport();
  const { students, subjectsByStudent } = useSettings(user?.uid, ui.student);

  // Fall back to first student if the selected one was removed.
  useEffect(() => {
    if (students.length === 0) return;
    if (!students.includes(ui.student)) ui.setStudent(students[0]);
  }, [students, ui.student]);

  if (!user) return null;

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
      plannerSubjects={subjectsByStudent[ui.student]}
      {...ui}
    />
  );
}
