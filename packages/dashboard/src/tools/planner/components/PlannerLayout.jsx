// Full page layout — receives all state and handlers as props from App.jsx.
import { useState } from 'react';
import Header          from './Header.jsx';
import DayStrip        from './DayStrip.jsx';
import SubjectCard     from './SubjectCard.jsx';
import EditSheet       from './EditSheet.jsx';
import UploadSheet     from './UploadSheet.jsx';
import AddSubjectSheet from './AddSubjectSheet.jsx';
import MonthSheet      from './MonthSheet.jsx';
import SickDaySheet    from './SickDaySheet.jsx';
import SettingsSheet   from './SettingsSheet.jsx';
import { getMondayOf, toWeekId, mondayWeekId, DAY_SHORT, DAY_NAMES } from '../constants/days.js';
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
  plannerSubjects,
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
    const safeData = { ...parsedData, weekId: mondayWeekId(parsedData.weekId) };
    pdfImport.addLog(`Applying — student: ${safeData.student}, week: ${safeData.weekId}${wipe ? ', wipe: true' : ''}`);
    if (wipe) {
      pdfImport.addLog('Wiping existing week...');
      await wipeWeek(safeData.weekId, safeData.student);
      pdfImport.addLog('Wipe complete.');
    }
    const cells = (safeData.days ?? []).flatMap(({ dayIndex, lessons }) =>
      (lessons ?? []).map(({ subject, lesson }) => ({ dayIndex, subject, lesson }))
    );
    cells.forEach(({ dayIndex, subject, lesson }) =>
      pdfImport.addLog(`Writing: ${safeData.student} › ${DAY_SHORT[dayIndex]} › ${subject} › ${lesson}`)
    );
    await Promise.all(cells.map(({ dayIndex, subject, lesson }) =>
      importCell(safeData.weekId, safeData.student, subject, dayIndex,
        { lesson, note: '', done: false, flag: false }, wipe)
    ));
    pdfImport.addLog(`Apply complete: Applied ${cells.length} cells`);
    jumpToWeek(safeData.weekId);
    setStudent(safeData.student);
    pdfImport.addLog(`Navigation: jumping to week of ${safeData.weekId}, student=${safeData.student}`);
  }

  const allDayData = dayData['allday'] ?? null, hasAllDay = Boolean(allDayData);
  const [showSubjects, setShowSubjects] = useState(false);
  const isSickDay = sickDayIndices?.has(day);
  const regularSubjects = subjects.filter(s => s !== 'allday');
  const hasSubjects = subjects.length > 0;
  const doneCount = regularSubjects.filter(s => dayData[s]?.done).length;

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
          students={students}
          student={student}
          onStudentChange={setStudent}
        />

        {isSickDay && (
          <div className="planner-sick-banner">Sick Day</div>
        )}

        <main className="planner-main">
          {/* Desktop-only day header */}
          <div className="planner-day-header">
            <div>
              <h2 className="planner-day-title">{DAY_NAMES[day]}, {weekDates[day]?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h2>
              <p className="planner-day-subtitle">{regularSubjects.length} subjects · {doneCount} completed</p>
            </div>
            <button className="planner-day-add-btn" onClick={() => setShowAddSubject(true)}>+ Add</button>
          </div>

          {/* Empty state — shown when day has no subjects */}
          {!subjectsLoading && !hasSubjects && (
            <div className="planner-empty">
              <div className="planner-empty-icon">📋</div>
              <p className="planner-empty-title">Nothing planned yet</p>
              <p className="planner-empty-subtitle">Import a PDF or add a subject to get started</p>
              <button className="planner-empty-import-btn" onClick={() => setShowUpload(true)}>📄 Import PDF</button>
              <button className="planner-empty-add-btn" onClick={() => setShowAddSubject(true)}>+ Add Subject</button>
            </div>
          )}

          {hasAllDay && <SubjectCard subject="allday" data={allDayData} onEdit={() => setEditTarget({ subject: 'allday', day })}
            onToggleDone={() => {}} onToggleFlag={() => {}} />}
          {hasAllDay && <button className="planner-show-subjects-btn" onClick={() => setShowSubjects(s => !s)}>
            {showSubjects ? 'Hide subjects ↑' : 'Show subjects ↓'}</button>}
          {(!hasAllDay || showSubjects) && (
            <div className="planner-subjects">
              {regularSubjects.map(subject => (
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
          )}

          {!subjectsLoading && hasSubjects && (!hasAllDay || showSubjects) && (
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
          presets={plannerSubjects}
          onAdd={subject => { addSubject(subject); setShowAddSubject(false); }}
          onAddAllDay={(name, note) => { updateCell('allday', day, { lesson: name, note, done: false, flag: false }); setShowAddSubject(false); }}
          onEditAllDay={() => { setShowAddSubject(false); setEditTarget({ subject: 'allday', day }); }}
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
