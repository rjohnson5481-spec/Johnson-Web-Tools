import './SchoolYearSheet.css';

// Bottom sheet listing school years with their quarters nested underneath.
// Tap a school-year edit icon to edit the year; tap a quarter edit icon to
// edit that quarter; "+ Add Quarter" inside a year adds to that year;
// "+ Add School Year" at the bottom adds a new year. All flows hand control
// back to the parent (AcademicRecordsTab) which opens AddEditSchoolYearSheet
// stacked on top.
//
// School-year + quarter state owned by the parent — passed in as props.
//
// Props:
//   open                — boolean
//   onClose             — () => void
//   schoolYears         — Array<{ id, label, startDate, endDate, quarters: [...] }>
//   loading             — boolean
//   error               — string | null
//   onEditSchoolYear    — (year) => void
//   onAddSchoolYear     — () => void
//   onEditQuarter       — ({ quarter, yearId }) => void
//   onAddQuarter        — (yearId) => void
//   onEditBreak         — ({ break: breakObj, yearId }) => void
//   onAddBreak          — (yearId) => void

// Compact "Aug 18 – May 22" range string for display.
function formatDateRange(start, end) {
  if (!start || !end) return '';
  const fmt = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return s;
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function SchoolYearSheet({
  open, onClose, schoolYears, loading, error,
  onEditSchoolYear, onAddSchoolYear, onEditQuarter, onAddQuarter,
  onEditBreak, onAddBreak,
}) {
  if (!open) return null;

  return (
    <div className="sy-sheet-overlay" onClick={onClose}>
      <div className="sy-sheet" onClick={e => e.stopPropagation()}>

        <div className="sy-sheet-handle" aria-hidden="true" />

        <header className="sy-sheet-header">
          <h2 className="sy-sheet-title">School Year &amp; Quarters</h2>
          <button className="sy-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="sy-sheet-body">

          {error && (
            <p className="sy-error" role="alert">⚠ {error}</p>
          )}

          {loading && (
            <p className="sy-loading">Loading school years…</p>
          )}

          {!loading && (schoolYears ?? []).length === 0 && (
            <p className="sy-empty">
              No school years yet. Add your first school year to get started.
            </p>
          )}

          {!loading && (schoolYears ?? []).length > 0 && (
            <div className="sy-year-list">
              {schoolYears.map((year, idx) => (
                <div key={year.id} className="sy-year-block">

                  <div className="sy-year-header">
                    <div className="sy-year-info">
                      <span className="sy-year-label">{year.label}</span>
                      <span className="sy-year-dates">{formatDateRange(year.startDate, year.endDate)}</span>
                    </div>
                    <button
                      type="button"
                      className="sy-edit-btn"
                      onClick={() => onEditSchoolYear(year)}
                      aria-label={`Edit ${year.label}`}
                    >✏️</button>
                  </div>

                  <div className="sy-quarters-list">
                    {(year.quarters ?? []).map(q => (
                      <div key={q.id} className="sy-quarter-row">
                        <div className="sy-quarter-info">
                          <span className="sy-quarter-label">{q.label}</span>
                          <span className="sy-quarter-dates">{formatDateRange(q.startDate, q.endDate)}</span>
                        </div>
                        <button
                          type="button"
                          className="sy-edit-btn"
                          onClick={() => onEditQuarter({ quarter: q, yearId: year.id })}
                          aria-label={`Edit ${q.label}`}
                        >✏️</button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="sy-add-quarter-btn"
                      onClick={() => onAddQuarter(year.id)}
                    >
                      + Add Quarter
                    </button>
                  </div>

                  <div className="sy-breaks-list">
                    <p className="sy-section-label">Breaks</p>
                    {(year.breaks ?? []).map(b => (
                      <div key={b.id} className="sy-break-row">
                        <div className="sy-break-info">
                          <span className="sy-break-label">{b.label}</span>
                          <span className="sy-break-dates">{formatDateRange(b.startDate, b.endDate)}</span>
                        </div>
                        <button
                          type="button"
                          className="sy-edit-btn"
                          onClick={() => onEditBreak({ break: b, yearId: year.id })}
                          aria-label={`Edit ${b.label}`}
                        >✏️</button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="sy-add-break-btn"
                      onClick={() => onAddBreak(year.id)}
                    >
                      + Add Break
                    </button>
                  </div>

                  {idx < schoolYears.length - 1 && <div className="sy-divider" />}
                </div>
              ))}
            </div>
          )}

          <button className="sy-add-btn" onClick={onAddSchoolYear}>
            + Add School Year
          </button>

        </div>

      </div>
    </div>
  );
}
