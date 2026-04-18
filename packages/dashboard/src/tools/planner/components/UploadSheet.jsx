import { useState } from 'react';
import DebugSheet from './DebugSheet.jsx';
import ImportDiffPreview from './ImportDiffPreview.jsx';
import { DAY_SHORT, mondayWeekId } from '../constants/days.js';
import './UploadSheet.css';
import './UploadResult.css';

function extractDayNum(lesson) {
  const m = String(lesson ?? '').match(/Day\s+(\d+)/i);
  return m ? m[1] : null;
}

function formatWeekOf(weekId) {
  const [y, mo, d] = weekId.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDayDate(weekId, dayIndex) {
  const [y, mo, d] = weekId.split('-').map(Number);
  return new Date(y, mo - 1, d + dayIndex).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UploadSheet({ pdfImport, onApply, onConfirmImport, onClose }) {
  const { file, importing, result, error, log, selectFile, importSchedule } = pdfImport;

  const [applied, setApplied] = useState(false);
  const [diff, setDiff]       = useState(null);
  const [showLog, setShowLog] = useState(false);

  const totalLessons = result
    ? (result.days ?? []).reduce((n, d) => n + (d.lessons?.length ?? 0), 0)
    : 0;
  const totalDays = result
    ? (result.days ?? []).filter(d => (d.lessons?.length ?? 0) > 0).length
    : 0;

  function handleReview() {
    onApply(result, (diffResult) => setDiff(diffResult));
  }

  function handleConfirm() {
    if (!diff) return;
    setDiff(null); setApplied(true);
    onConfirmImport(diff);
  }

  return (
    <>
      <div className="upload-sheet-overlay" onClick={onClose}>
        <div className="upload-sheet" onClick={e => e.stopPropagation()}>

          <div className="upload-sheet-handle" aria-hidden="true" />

          <header className="upload-sheet-header">
            <h2 className="upload-sheet-title">Import Schedule</h2>
            <button className="upload-sheet-close" onClick={onClose} aria-label="Close">✕</button>
          </header>

          <div className="upload-sheet-body">

            {!result && !applied && (
              <label className={`upload-sheet-file-zone${importing ? ' upload-sheet-file-zone--disabled' : ''}`}>
                <input type="file" accept="application/pdf,image/*" className="upload-sheet-file-input"
                  onChange={e => { if (e.target.files?.[0]) { selectFile(e.target.files[0]); setApplied(false); setDiff(null); } }}
                  disabled={importing} />
                {file ? <span className="upload-sheet-filename">📄 {file.name}</span>
                  : <span className="upload-sheet-file-hint">Tap to choose a PDF or image</span>}
              </label>
            )}

            {importing && (
              <div className="upload-sheet-spinner-row">
                <div className="upload-sheet-spinner" aria-hidden="true" />
                <span>Parsing schedule…</span>
              </div>
            )}

            {error && !importing && <p className="upload-sheet-error">{error}</p>}

            {applied && result && (
              <div className="upload-sheet-success">
                ✓ Applied — jumped to week of {formatWeekOf(mondayWeekId(result.weekId))}
              </div>
            )}

            {diff && (
              <ImportDiffPreview diff={diff} student={result?.student} weekId={result?.weekId}
                onCancel={() => setDiff(null)} onConfirm={handleConfirm} />
            )}

            {result && !importing && !applied && !diff && (
              <div className="upload-sheet-result">
                <p className="upload-sheet-result-meta">
                  {result.student} · Week of {formatWeekOf(mondayWeekId(result.weekId))}
                </p>
                <div className="upload-sheet-divider" />
                <div className="upload-sheet-lesson-list">
                  {(result.days ?? []).map(({ dayIndex, lessons }) => (
                    <div key={dayIndex} className="upload-sheet-day-group">
                      <div className="upload-sheet-day-header">
                        {DAY_SHORT[dayIndex]} · {formatDayDate(mondayWeekId(result.weekId), dayIndex)}
                      </div>
                      {(lessons ?? []).map(({ subject, lesson }, i) => {
                        const dayNum = extractDayNum(lesson);
                        return (
                          <div key={i} className="upload-sheet-lesson-row">
                            <span className="upload-sheet-lesson-subject">{subject}</span>
                            {dayNum && <span className="upload-sheet-lesson-num">Day {dayNum}</span>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="upload-sheet-divider" />
                <p className="upload-sheet-result-footer">
                  {totalLessons} lesson{totalLessons !== 1 ? 's' : ''} across {totalDays} day{totalDays !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {log.length > 0 && (
              <button className="upload-sheet-log-btn" onClick={() => setShowLog(true)}>
                View Log ({log.length})
              </button>
            )}

          </div>

          <div className="upload-sheet-footer">
            <button className="upload-sheet-cancel" onClick={onClose}>
              {applied ? 'Close' : 'Cancel'}
            </button>
            {!applied && !diff && (result ? (
              <button className="upload-sheet-apply-btn" onClick={handleReview}>Review Changes</button>
            ) : (
              <button className="upload-sheet-import-btn" onClick={importSchedule} disabled={!file || importing}>
                {importing ? 'Importing…' : 'Import'}
              </button>
            ))}
          </div>

        </div>
      </div>

      {showLog && <DebugSheet log={log} onClose={() => setShowLog(false)} />}
    </>
  );
}
