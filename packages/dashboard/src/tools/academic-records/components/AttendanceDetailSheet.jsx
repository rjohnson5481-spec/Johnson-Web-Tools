import './AttendanceDetailSheet.css';

// Bottom sheet showing full attendance detail for the active school year.
// Replaces the large attendance card that was removed from RecordsMainView.
//
// Props:
//   open            — boolean
//   onClose         — () => void
//   attendanceDays  — { attended, sick, breakDays, schoolDays, required: 175 }
//   schoolYearLabel — string, e.g. "2025–2026"
//   student         — string, selected student name

export default function AttendanceDetailSheet({
  open, onClose, attendanceDays, schoolYearLabel, student,
}) {
  if (!open) return null;

  const { attended, sick, breakDays, schoolDays, required } = attendanceDays;
  const pct = required > 0 ? Math.min(100, Math.round((attended / required) * 100)) : 0;

  return (
    <div className="ads-sheet-overlay" onClick={onClose}>
      <div className="ads-sheet" onClick={e => e.stopPropagation()}>

        <div className="ads-sheet-handle" aria-hidden="true" />

        <header className="ads-sheet-header">
          <h2 className="ads-sheet-title">Attendance — {schoolYearLabel ?? '—'}</h2>
          <button className="ads-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="ads-sheet-body">

          <div className="ads-big-number">{attended}</div>
          <p className="ads-big-sub">days completed</p>

          <div className="ads-bar-track">
            <div className="ads-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="ads-bar-labels">
            <span>{pct}% complete</span>
            <span>175 days required (ND)</span>
          </div>

          <div className="ads-detail-rows">
            <div className="ads-detail-row">
              <span className="ads-detail-label">Days Attended</span>
              <span className="ads-detail-value">{attended}</span>
            </div>
            <div className="ads-detail-row">
              <span className="ads-detail-label">Sick Days</span>
              <span className={`ads-detail-value${sick > 0 ? ' ads-detail-value--red' : ''}`}>{sick}</span>
            </div>
            {breakDays > 0 && (
              <div className="ads-detail-row">
                <span className="ads-detail-label">Break Days</span>
                <span className="ads-detail-value">{breakDays}</span>
              </div>
            )}
            <div className="ads-detail-row">
              <span className="ads-detail-label">School Days</span>
              <span className="ads-detail-value">{schoolDays}</span>
            </div>
            <div className="ads-detail-row">
              <span className="ads-detail-label">Days Required</span>
              <span className="ads-detail-value">{required}</span>
            </div>
          </div>

          <p className="ads-note">Sick days pulled automatically from Planner</p>

        </div>

      </div>
    </div>
  );
}
