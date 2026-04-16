import { useState } from 'react';
import './SavedReportCardsSheet.css';

const STUDENTS = ['Orion', 'Malachi'];

function formatDate(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SavedReportCardsSheet({
  open, onClose, savedReports, loading, onDelete,
}) {
  const [confirmId, setConfirmId] = useState(null);

  if (!open) return null;

  const grouped = {};
  STUDENTS.forEach(s => { grouped[s] = []; });
  (savedReports ?? []).forEach(r => {
    if (grouped[r.student]) grouped[r.student].push(r);
    else grouped[r.student] = [r];
  });

  return (
    <div className="src-sheet-overlay" onClick={onClose}>
      <div className="src-sheet" onClick={e => e.stopPropagation()}>
        <div className="src-sheet-handle" aria-hidden="true" />
        <header className="src-sheet-header">
          <h2 className="src-sheet-title">Saved Reports</h2>
          <button className="src-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="src-sheet-body">
          {loading && <p className="src-empty">Loading reports…</p>}
          {!loading && (savedReports ?? []).length === 0 && (
            <p className="src-empty">No reports generated yet.</p>
          )}
          {!loading && STUDENTS.map(student => {
            const reports = grouped[student] ?? [];
            if (reports.length === 0) return null;
            return (
              <div key={student} className="src-group">
                <p className="src-section-label"><span>{student}</span></p>
                {reports.map(r => (
                  <div key={r.id} className="src-report-row">
                    <div className="src-report-info">
                      <span className="src-report-period">{r.periodLabel}</span>
                      <span className="src-report-year">{r.yearLabel} · {formatDate(r.generatedAt)}</span>
                    </div>
                    {confirmId === r.id ? (
                      <div className="src-confirm-row">
                        <span className="src-confirm-msg">Delete?</span>
                        <button className="src-confirm-yes" onClick={() => { onDelete(r.id); setConfirmId(null); }}>Yes</button>
                        <button className="src-confirm-no" onClick={() => setConfirmId(null)}>No</button>
                      </div>
                    ) : (
                      <div className="src-actions">
                        <button className="src-icon-btn" disabled={!r.storageUrl} title="Download PDF"
                          onClick={() => r.storageUrl && window.open(r.storageUrl, '_blank')}
                          style={!r.storageUrl ? { opacity: 0.35, cursor: 'default' } : undefined}>⬇</button>
                        <button className="src-icon-btn src-icon-btn--danger" onClick={() => setConfirmId(r.id)} title="Delete">🗑</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
