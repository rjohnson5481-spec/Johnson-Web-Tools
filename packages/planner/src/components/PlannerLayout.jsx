// Full page layout — receives all state and handlers as props from App.jsx.
// No hook calls here. If this file grows, extract the sheet handlers first.
import Header          from './Header.jsx';
import DayStrip        from './DayStrip.jsx';
import SubjectCard     from './SubjectCard.jsx';
import EditSheet       from './EditSheet.jsx';
import UploadSheet     from './UploadSheet.jsx';
import AddSubjectSheet from './AddSubjectSheet.jsx';
import './PlannerLayout.css';

export default function PlannerLayout({
  user,
  weekDates, prevWeek, nextWeek,
  subjects, dayData, subjectsLoading, updateCell, addSubject,
  importCell, jumpToWeek,
  pdfImport,
  student, setStudent,
  day, setDay,
  editTarget, setEditTarget,
  showUpload, setShowUpload,
  showAddSubject, setShowAddSubject,
}) {
  function handleToggleDone(subject) {
    const cell = dayData[subject] ?? {};
    updateCell(subject, day, { ...cell, done: !cell.done });
  }

  function handleToggleFlag(subject) {
    const cell = dayData[subject] ?? {};
    updateCell(subject, day, { ...cell, flag: !cell.flag });
  }

  // Writes parsed PDF schedule data to the week/student named in the PDF.
  // parsedData shape: { student, weekId, days: [{ dayIndex, lessons: [{ subject, lesson }] }] }
  // Uses importCell (not updateCell) so data lands in parsedData.weekId/student,
  // not the currently-viewed week/student. Then navigates there automatically.
  function handleApplySchedule(parsedData) {
    (parsedData.days ?? []).forEach(({ dayIndex, lessons }) => {
      (lessons ?? []).forEach(({ subject, lesson }) => {
        importCell(parsedData.weekId, parsedData.student, subject, dayIndex,
          { lesson, note: '', done: false, flag: false });
      });
    });
    jumpToWeek(parsedData.weekId);
    setStudent(parsedData.student);
    setShowUpload(false);
    pdfImport.reset();
  }

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
      />

      <div className="planner-body">
        <DayStrip dates={weekDates} selected={day} onSelect={setDay} />

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
          student={student}
          weekDates={weekDates}
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
    </div>
  );
}
