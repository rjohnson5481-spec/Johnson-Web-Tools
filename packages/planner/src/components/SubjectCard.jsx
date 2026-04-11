import './SubjectCard.css';

// Props: subject (string), data ({ lesson, note, done, flag } | undefined),
//        onEdit, onToggleDone, onToggleFlag
export default function SubjectCard({ subject, data, onEdit, onToggleDone, onToggleFlag }) {
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

      <div className="subject-card-footer">
        <button
          className={`subject-card-done-btn${done ? ' subject-card-done-btn--active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleDone(); }}
          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        >
          {done ? '✓ Done' : 'Mark done'}
        </button>
      </div>
    </div>
  );
}
