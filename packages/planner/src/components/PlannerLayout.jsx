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
import SettingsSheet   from './SettingsSheet.jsx';
import { getMondayOf, toWeekId, DAY_SHORT, DAY_NAMES } from '../constants/days.js';
import './PlannerLayout.css';

export default function PlannerLayout({
  user,
  weekId,
  weekDates, prevWeek, nextWeek,
  subjects, dayData, subjectsLoading, updateCell, addSubject, removeSubject,
  importCell, jumpToWeek, deleteWeek, wipeWeek,
  performSickDay, performUndoSickDay, sickDayIndices,
  loadWeekDataFrom,
  pdfImport,
  students,
  student, setStudent,
  day, setDay,
  editTarget, setEditTarget,
  showUpload, setShowUpload,
  showAddSubject, setShowAddSubject,
  showMonthPicker, setShowMonthPicker,
  showSickDay, setShowSickDay,
  showUndoSickDay, setShowUndoSickDay,
  showSettings, setShowSettings,
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

  async function handleUndoSickDay() {
    await performUndoSickDay();
    setShowUndoSickDay(false);
  }

  // Writes parsed PDF schedule data to the week/student named in the PDF.
  // wipe=true: deletes all existing cells first, then writes all imported cells.
  // wipe=false: merge only — imported cells are skipped if they already exist.
  // Does NOT auto-close — UploadSheet shows a success state; user closes manually.
  async function handleApplySchedule(parsedData, wipe) {
    pdfImport.addLog(`Applying — student: ${parsedData.student}, week: ${parsedData.weekId}${wipe ? ', wipe: true' : ''}`);
    if (wipe) {
      pdfImport.addLog('Wiping existing week...');
      await wipeWeek(parsedData.weekId, parsedData.student);
      pdfImport.addLog('Wipe complete.');
    }
    const cells = (parsedData.days ?? []).flatMap(({ dayIndex, lessons }) =>
      (lessons ?? []).map(({ subject, lesson }) => ({ dayIndex, subject, lesson }))
    );
    cells.forEach(({ dayIndex, subject, lesson }) =>
      pdfImport.addLog(`Writing: ${parsedData.student} › ${DAY_SHORT[dayIndex]} › ${subject} › ${lesson}`)
    );
    await Promise.all(cells.map(({ dayIndex, subject, lesson }) =>
      importCell(parsedData.weekId, parsedData.student, subject, dayIndex,
        { lesson, note: '', done: false, flag: false }, wipe)
    ));
    pdfImport.addLog(`Apply complete: Applied ${cells.length} cells`);
    jumpToWeek(parsedData.weekId);
    setStudent(parsedData.student);
    pdfImport.addLog(`Navigation: jumping to week of ${parsedData.weekId}, student=${parsedData.student}`);
  }

  const isSickDay = sickDayIndices?.has(day);
  const hasSubjects = subjects.length > 0;

  return (
    <div className="planner">
      <Header
        user={user}
        student={student}
        onStudentChange={setStudent}
        weekDates={weekDates}
        prevWeek={prevWeek}
        nextWeek={nextWeek}
        students={students}
        onUpload={() => setShowUpload(true)}
        onCalendar={() => setShowMonthPicker(true)}
        onSettings={() => setShowSettings(true)}
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
          {/* Empty state — shown when day has no subjects */}
          {!subjectsLoading && !hasSubjects && (
            <div className="planner-empty">
              <div className="planner-empty-icon">📋</div>
              <p className="planner-empty-title">Nothing planned yet</p>
              <p className="planner-empty-subtitle">
                Import a PDF or add a subject to get started
              </p>
              <button
                className="planner-empty-import-btn"
                onClick={() => setShowUpload(true)}
              >
                📄 Import PDF
              </button>
              <button
                className="planner-empty-add-btn"
                onClick={() => setShowAddSubject(true)}
              >
                + Add Subject
              </button>
            </div>
          )}

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

          {!subjectsLoading && hasSubjects && (
            <button className="planner-add-btn" onClick={() => setShowAddSubject(true)}>
              + Add Subject
            </button>
          )}
        </main>
      </div>

      {/* Fixed bottom action bar */}
      <div className="planner-action-bar">
        {isSickDay && !subjectsLoading && (
          <button
            className="planner-action-btn planner-action-btn--undo"
            onClick={() => setShowUndoSickDay(true)}
          >
            ↩ Undo Sick Day
          </button>
        )}
        {!isSickDay && hasSubjects && !subjectsLoading && (
          <>
            <button
              className="planner-action-btn planner-action-btn--sick"
              onClick={() => setShowSickDay(true)}
            >
              Sick Day
            </button>
            <button
              className="planner-action-btn planner-action-btn--clear"
              onClick={handleDeleteWeek}
            >
              Clear Week
            </button>
          </>
        )}
        <button
          className="planner-action-btn planner-action-btn--import"
          onClick={() => setShowUpload(true)}
        >
          Import
        </button>
      </div>

      {editTarget && (
        <EditSheet
          subject={editTarget.subject}
          data={dayData[editTarget.subject]}
          onSave={data => { updateCell(editTarget.subject, editTarget.day, data); setEditTarget(null); }}
          onDelete={() => { removeSubject(editTarget.subject); setEditTarget(null); }}
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
          day={day}
          weekDates={weekDates}
          loadWeekDataFrom={loadWeekDataFrom}
          onConfirm={handleSickDayConfirm}
          onClose={() => setShowSickDay(false)}
        />
      )}

      {showSettings && (
        <SettingsSheet
          uid={user?.uid}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showUndoSickDay && (
        <div className="undo-sick-overlay" onClick={() => setShowUndoSickDay(false)}>
          <div className="undo-sick-sheet" onClick={e => e.stopPropagation()}>
            <div className="undo-sick-handle" />
            <div className="undo-sick-header">
              <span className="undo-sick-title">Undo Sick Day</span>
              <button className="undo-sick-close" onClick={() => setShowUndoSickDay(false)}>✕</button>
            </div>
            <div className="undo-sick-body">
              {day === 4 ? (
                <p className="undo-sick-msg">
                  Sick day marker removed. Friday lessons were permanently deleted
                  and cannot be restored.
                </p>
              ) : (
                <p className="undo-sick-msg">
                  This will shift lessons back one day for the days they were shifted.
                </p>
              )}
            </div>
            <div className="undo-sick-footer">
              <button className="undo-sick-cancel" onClick={() => setShowUndoSickDay(false)}>Cancel</button>
              <button className="undo-sick-confirm" onClick={handleUndoSickDay}>Undo Sick Day</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
