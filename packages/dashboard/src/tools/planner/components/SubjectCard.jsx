import './SubjectCard.css';

// Props: subject (string), data ({ lesson, note, done, flag } | undefined),
//        onEdit, onToggleDone, onToggleFlag
// When subject === 'allday', renders an All Day Event banner instead of a regular card.
export default function SubjectCard({ subject, data, onEdit, onToggleFlag }) {
  if (subject === 'allday') {
    return (
      <div className="subject-card--allday" onClick={onEdit} role="button"
        tabIndex={0} onKeyDown={e => e.key === 'Enter' && onEdit()}>
        <span className="subject-card-allday-label">All Day Event</span>
        <p className="subject-card-allday-name">{data?.lesson || 'Untitled Event'}</p>
        {data?.note && <p className="subject-card-allday-note">{data.note}</p>}
      </div>
    );
  }

  const done    = data?.done ?? false;
  const flag    = data?.flag ?? false;
  const hasNote = Boolean(data?.note);

  return (
    <div
      className={`subject-card${done ? ' subject-card--done' : ''}${flag ? ' subject-card--flag' : ''}`}
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onEdit()}
    >
      <div className="subject-card-top">
        <span className="subject-card-name">{subject}</span>
        <div className="subject-card-indicators">
          <span
            className={`subject-card-note-dot${hasNote ? ' subject-card-note-dot--active' : ''}`}
            aria-label={hasNote ? 'Has note' : 'No note'}
          />
          <button
            className={`subject-card-flag-btn${flag ? ' subject-card-flag-btn--active' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleFlag(); }}
            aria-label={flag ? 'Remove flag' : 'Add flag'}
          >
            ⚑
          </button>
        </div>
      </div>

      <p className="subject-card-lesson">
        {data?.lesson || <span className="subject-card-empty">Tap to add lesson details</span>}
      </p>

      {!done && (
        <div className="subject-card-footer">
          <span className="subject-card-hint">Tap to edit</span>
        </div>
      )}
    </div>
  );
}
