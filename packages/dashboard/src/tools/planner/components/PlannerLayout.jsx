// Full page layout — receives all state and handlers as props from App.jsx.
import { useState, useEffect } from 'react';
import Header          from './Header.jsx';
import DayStrip        from './DayStrip.jsx';
import SubjectCard     from './SubjectCard.jsx';
import EditSheet       from './EditSheet.jsx';
import UploadSheet     from './UploadSheet.jsx';
import AddSubjectSheet from './AddSubjectSheet.jsx';
import MonthSheet      from './MonthSheet.jsx';
import SickDaySheet    from './SickDaySheet.jsx';
import CalendarWeekView from './CalendarWeekView.jsx';
import PlannerActionBar from './PlannerActionBar.jsx';
import UndoSickSheet   from './UndoSickSheet.jsx';
import { readCell, updateCell as fbWriteCell, deleteCell } from '../firebase/planner.js';
import { compareWithExisting } from '../hooks/usePdfImport.js';
import { getMondayOf, toWeekId, mondayWeekId, formatWeekLabel, DAY_SHORT, DAY_NAMES } from '../constants/days.js';
import './PlannerLayout.css';

function useIsDesktop() {
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  useEffect(() => { const mq = window.matchMedia('(min-width: 1024px)'); const h = e => setD(e.matches); mq.addEventListener('change', h); return () => mq.removeEventListener('change', h); }, []);
  return d;
}

export default function PlannerLayout({
  user,
  weekId,
  weekDates, prevWeek, nextWeek,
  subjects, dayData, subjectsLoading, updateCell, removeSubject,
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

  // Batch-add a cell for each (dayIndex, student) pair.
  // lessonDetails is an optional { [dayIndex]: lessonText } map — if a value
  // exists for a dayIndex it becomes the initial lesson text; otherwise the
  // cell is created blank. Uses importCell with overwrite=false so existing
  // cells are preserved.
  async function handleBatchAddSubject(subject, cells, lessonDetails) {
    const details = lessonDetails ?? {};
    await Promise.all(cells.map(({ dayIndex, student: cellStudent }) => {
      const lesson = details[dayIndex] ?? '';
      return importCell(weekId, cellStudent, subject, dayIndex,
        { lesson, note: '', done: false, flag: false }, false);
    }));
    setShowAddSubject(false);
  }

  async function handleSickDayConfirm(selectedSubjects, sickDayIndex) {
    await performSickDay(selectedSubjects, sickDayIndex);
    setShowSickDay(false);
    // On desktop the SickDaySheet day pills can pick a sickDayIndex that
    // differs from the parent's `day` (mobile's DayStrip keeps them in
    // sync, desktop does not). isSickDay is derived from
    // sickDayIndices.has(day), so without this sync the Undo Sick Day
    // button wouldn't render after a desktop sick day until the user
    // manually selected the sick column.
    setDay(sickDayIndex);
  }

  async function handleUndoSickDay() {
    await performUndoSickDay();
    setShowUndoSickDay(false);
  }

  async function handleApplySchedule(parsedData, onDiffReady) {
    const safeData = { ...parsedData, weekId: mondayWeekId(parsedData.weekId) };
    const uid = user?.uid; if (!uid) return;
    pdfImport.addLog(`Comparing — student: ${safeData.student}, week: ${safeData.weekId}`);
    const cells = (safeData.days ?? []).flatMap(({ dayIndex, lessons }) =>
      (lessons ?? []).map(({ subject }) => ({ dayIndex, subject }))
    );
    const existing = {};
    await Promise.all(cells.map(async ({ dayIndex, subject }) => {
      const data = await readCell(uid, safeData.weekId, safeData.student, dayIndex, subject);
      if (data) { (existing[dayIndex] ??= {})[subject] = data; }
    }));
    const diff = compareWithExisting(safeData, existing);
    pdfImport.addLog(`Diff: ${diff.filter(d => d.status === 'new').length} new, ${diff.filter(d => d.status === 'changed').length} changed, ${diff.filter(d => d.status === 'unchanged').length} unchanged`);
    onDiffReady(diff);
  }

  async function handleConfirmImport(diff) {
    const result = pdfImport.result; if (!result) return;
    const safeWeekId = mondayWeekId(result.weekId);
    const toWrite = diff.filter(d => d.status === 'new' || d.status === 'changed');
    toWrite.forEach(({ dayIndex, subject, lesson }) =>
      pdfImport.addLog(`Writing: ${result.student} › ${DAY_SHORT[dayIndex]} › ${subject} › ${lesson}`)
    );
    await Promise.all(toWrite.map(({ dayIndex, subject, lesson }) =>
      importCell(safeWeekId, result.student, subject, dayIndex, { lesson, note: '', done: false, flag: false }, true)
    ));
    pdfImport.addLog(`Import complete: ${toWrite.length} cells written`);
    jumpToWeek(safeWeekId);
    setStudent(result.student);
  }

  const allDayData = dayData['allday'] ?? null, hasAllDay = Boolean(allDayData);
  const [showSubjects, setShowSubjects] = useState(false);
  const isSickDay = sickDayIndices?.has(day);
  const regularSubjects = subjects.filter(s => s !== 'allday');
  const hasSubjects = subjects.length > 0;
  const doneCount = regularSubjects.filter(s => dayData[s]?.done).length;

  const isDesktop = useIsDesktop();

  // After a Full Restore / Restore Selected completes, the sick-day UI
  // can persist stale state from before the restore — the action bar
  // may still show Undo Sick Day for a week whose marker was just
  // removed in Firestore, or hide it for a week where one was restored.
  // Navigating to a different week and back fixes it because the
  // sickDays subscription in useSubjects re-establishes on weekId
  // change. This effect mirrors that reset: every weekId or student
  // switch closes the sick-day sheets and drops any carried-over
  // visibility state so the action bar re-evaluates against the
  // freshly-subscribed sickDayIndices. Mount triggers it too.
  useEffect(() => {
    setShowSickDay(false);
    setShowUndoSickDay(false);
  // setShow* are stable useState setters; excluding them is intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId, student]);

  async function handleMoveCell(fromDay, subject, toDay) {
    const uid = user?.uid;
    if (!uid) return;
    const data = await readCell(uid, weekId, student, fromDay, subject);
    if (!data) return;
    await fbWriteCell(uid, weekId, student, subject, toDay, data);
    await deleteCell(uid, weekId, student, fromDay, subject);
  }

  return (
    <div className={`planner${isDesktop ? ' cwv-active' : ''}`}>
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
      />

      <div className="planner-body">
        {/* Desktop-only week nav — planner header is hidden in the shell at ≥1024px */}
        <div className="planner-week-nav-desktop">
          <button className="planner-week-nav-btn" onClick={prevWeek} aria-label="Previous week">‹</button>
          <span className="planner-week-nav-label">{formatWeekLabel(weekDates)}</span>
          <button className="planner-week-nav-btn" onClick={nextWeek} aria-label="Next week">›</button>
        </div>

        {isDesktop && (
          <CalendarWeekView
            weekDates={weekDates} prevWeek={prevWeek} nextWeek={nextWeek}
            jumpToToday={() => jumpToWeek(toWeekId(getMondayOf(new Date())))}
            loadWeekDataFrom={loadWeekDataFrom} student={student} weekId={weekId}
            onEditCell={(subject, di) => { setDay(di); setEditTarget({ subject, day: di }); }}
            onAddSubject={(di) => { setDay(di); setShowAddSubject(true); }}
            onMoveCell={handleMoveCell}
          />
        )}

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

      <PlannerActionBar
        isSickDay={isSickDay} hasSubjects={hasSubjects} subjectsLoading={subjectsLoading}
        onUndoSickDay={() => setShowUndoSickDay(true)} onSickDay={() => setShowSickDay(true)}
        onClearWeek={handleDeleteWeek} onImport={() => setShowUpload(true)}
      />

      {editTarget && (
        <EditSheet subject={editTarget.subject} data={dayData[editTarget.subject]}
          onSave={data => { updateCell(editTarget.subject, editTarget.day, data); setEditTarget(null); }}
          onDelete={() => { removeSubject(editTarget.subject); setEditTarget(null); }}
          onClose={() => setEditTarget(null)} />
      )}
      {showUpload && (
        <UploadSheet pdfImport={pdfImport} onApply={handleApplySchedule}
          onConfirmImport={handleConfirmImport}
          onClose={() => { setShowUpload(false); pdfImport.reset(); }} />
      )}
      {showAddSubject && (
        <AddSubjectSheet existingSubjects={subjects} presets={plannerSubjects}
          weekDates={weekDates} currentDayIndex={day} currentStudent={student} students={students}
          onAdd={handleBatchAddSubject}
          onAddAllDay={(name, note) => { updateCell('allday', day, { lesson: name, note, done: false, flag: false }); setShowAddSubject(false); }}
          onEditAllDay={() => { setShowAddSubject(false); setEditTarget({ subject: 'allday', day }); }}
          onClose={() => setShowAddSubject(false)} />
      )}
      {showMonthPicker && (
        <MonthSheet weekId={weekId} onSelectDay={handleMonthDaySelect} onClose={() => setShowMonthPicker(false)} />
      )}
      {showSickDay && (
        <SickDaySheet subjects={subjects} dayData={dayData} dayName={DAY_NAMES[day]} day={day}
          weekDates={weekDates} loadWeekDataFrom={loadWeekDataFrom}
          onConfirm={handleSickDayConfirm} onClose={() => setShowSickDay(false)} />
      )}

      {showUndoSickDay && (
        <UndoSickSheet day={day} onConfirm={handleUndoSickDay} onClose={() => setShowUndoSickDay(false)} />
      )}
    </div>
  );
}
