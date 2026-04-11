// Full page layout — receives all state and handlers as props from App.jsx.
// No hook calls here. If this file grows, extract the sheet handlers first.
import Header          from './Header.jsx';
import DayStrip        from './DayStrip.jsx';
import SubjectCard     from './SubjectCard.jsx';
import EditSheet       from './EditSheet.jsx';
import UploadSheet     from './UploadSheet.jsx';
import AddSubjectSheet from './AddSubjectSheet.jsx';
import MonthSheet      from './MonthSheet.jsx';
import SickDaySheet    from './SickDaySheet.jsx';
import { getMondayOf, toWeekId, DAY_SHORT, DAY_NAMES } from '../constants/days.js';
import './PlannerLayout.css';

export default function PlannerLayout({
  user,
  weekId,
  weekDates, prevWeek, nextWeek,
  subjects, dayData, subjectsLoading, updateCell, addSubject,
  importCell, jumpToWeek, deleteWeek, wipeWeek,
  performSickDay, sickDayIndices,
  pdfImport,
  student, setStudent,
  day, setDay,
  editTarget, setEditTarget,
  showUpload, setShowUpload,
  showAddSubject, setShowAddSubject,
  showMonthPicker, setShowMonthPicker,
  showSickDay, setShowSickDay,
}) {
  function handleToggleDone(subject) {
    const cell = dayData[subject] ?? {};
    updateCell(subject, day, { ...cell, done: !cell.done });
  }

  function handleToggleFlag(subject) {
    const cell = dayData[subject] ?? {};
    updateCell(subject, day, { ...cell, flag: !cell.flag });
  }

  function handleMonthDaySelect(date) {
    jumpToWeek(toWeekId(getMondayOf(date)));
    setDay(date.getDay() - 1); // JS Mon=1 → dayIndex=0
    setShowMonthPicker(false);
  }

  function handleDeleteWeek() {
    if (!window.confirm('Clear all lessons for this week? This cannot be undone.')) return;
    deleteWeek();
  }

  async function handleSickDayConfirm(selectedSubjects) {
    await performSickDay(selectedSubjects);
    setShowSickDay(false);
  }

  // Writes parsed PDF schedule data to the week/student named in the PDF.
  // wipe: if true, deletes all existing cells for parsedData.weekId/student first.
  // Does NOT auto-close — UploadSheet shows a success state; user closes manually.
  async function handleApplySchedule(parsedData, wipe) {
    pdfImport.addLog(`Applying — student: ${parsedData.student}, week: ${parsedData.weekId}${wipe ? ', wipe: true' : ''}`);
    if (wipe) {
      pdfImport.addLog('Wiping existing week...');
      await wipeWeek(parsedData.weekId, parsedData.student);
      pdfImport.addLog('Wipe complete.');
    }
    let cellCount = 0;
    (parsedData.days ?? []).forEach(({ dayIndex, lessons }) => {
      (lessons ?? []).forEach(({ subject, lesson }) => {
        pdfImport.addLog(`Writing: ${parsedData.student} › ${DAY_SHORT[dayIndex]} › ${subject} › ${lesson}`);
        importCell(parsedData.weekId, parsedData.student, subject, dayIndex,
          { lesson, note: '', done: false, flag: false });
        cellCount++;
      });
    });
    pdfImport.addLog(`Apply complete: Applied ${cellCount} cells`);
    jumpToWeek(parsedData.weekId);
    setStudent(parsedData.student);
    pdfImport.addLog(`Navigation: jumping to week of ${parsedData.weekId}, student=${parsedData.student}`);
  }

  const isSickDay = sickDayIndices?.has(day);

  return (
    <div className="planner">
      <Header
        user={user}
        student={student}
        onStudentChange={setStudent}
        weekDates={weekDates}
        prevWeek={prevWeek}
        nextWeek={nextWeek}
        onUpload={() => setShowUpload(true)}
        onCalendar={() => setShowMonthPicker(true)}
      />

      <div className="planner-body">
        <DayStrip
          dates={weekDates}
          selected={day}
          onSelect={setDay}
          sickDayIndices={sickDayIndices}
        />

        {isSickDay && (
          <div className="planner-sick-banner">Sick Day</div>
        )}

        <main className="planner-main">
          <div className="planner-subjects">
            {subjects.map(subject => (
              <SubjectCard
                key={subject}
                subject={subject}
                data={dayData[subject]}
                onEdit={() => setEditTarget({ subject, day })}
                onToggleDone={() => handleToggleDone(subject)}
                onToggleFlag={() => handleToggleFlag(subject)}
              />
            ))}
          </div>
          {!subjectsLoading && (
            <button className="planner-add-btn" onClick={() => setShowAddSubject(true)}>
              + Add Subject
            </button>
          )}
          {!subjectsLoading && subjects.length > 0 && (
            <>
              <button className="planner-sick-btn" onClick={() => setShowSickDay(true)}>
                Sick Day
              </button>
              <button className="planner-clear-btn" onClick={handleDeleteWeek}>
                Clear Week
              </button>
            </>
          )}
        </main>
      </div>

      {editTarget && (
        <EditSheet
          subject={editTarget.subject}
          data={dayData[editTarget.subject]}
          onSave={data => { updateCell(editTarget.subject, editTarget.day, data); setEditTarget(null); }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {showUpload && (
        <UploadSheet
          pdfImport={pdfImport}
          onApply={handleApplySchedule}
          onClose={() => { setShowUpload(false); pdfImport.reset(); }}
        />
      )}

      {showAddSubject && (
        <AddSubjectSheet
          existingSubjects={subjects}
          onAdd={subject => { addSubject(subject); setShowAddSubject(false); }}
          onClose={() => setShowAddSubject(false)}
        />
      )}

      {showMonthPicker && (
        <MonthSheet
          weekId={weekId}
          onSelectDay={handleMonthDaySelect}
          onClose={() => setShowMonthPicker(false)}
        />
      )}

      {showSickDay && (
        <SickDaySheet
          subjects={subjects}
          dayData={dayData}
          dayName={DAY_NAMES[day]}
          onConfirm={handleSickDayConfirm}
          onClose={() => setShowSickDay(false)}
        />
      )}
    </div>
  );
}
