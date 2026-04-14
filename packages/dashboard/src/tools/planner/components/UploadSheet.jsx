import { useState } from 'react';
import DebugSheet from './DebugSheet.jsx';
import { DAY_SHORT } from '../constants/days.js';
import './UploadSheet.css';

// Extracts the day number from a lesson string like "Day 32 — Title" → "32".
function extractDayNum(lesson) {
  const m = String(lesson ?? '').match(/Day\s+(\d+)/i);
  return m ? m[1] : null;
}

// Formats weekId "YYYY-MM-DD" as "Apr 14" (the Monday).
function formatWeekOf(weekId) {
  const [y, mo, d] = weekId.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Formats a specific day of the week: weekId + dayIndex offset → "Aug 17".
function formatDayDate(weekId, dayIndex) {
  const [y, mo, d] = weekId.split('-').map(Number);
  return new Date(y, mo - 1, d + dayIndex).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Props: pdfImport ({ file, importing, result, error, log, selectFile, importSchedule, addLog }),
//        onApply(parsedData, wipe), onClose
export default function UploadSheet({ pdfImport, onApply, onClose }) {
  const { file, importing, result, error, log, selectFile, importSchedule } = pdfImport;

  const [wipe, setWipe]       = useState(false);
  const [applied, setApplied] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const totalLessons = result
    ? (result.days ?? []).reduce((n, d) => n + (d.lessons?.length ?? 0), 0)
    : 0;
  const totalDays = result
    ? (result.days ?? []).filter(d => (d.lessons?.length ?? 0) > 0).length
    : 0;

  function handleApply() {
    setApplied(true);
    onApply(result, wipe);
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

            {/* File picker — hidden once result is ready or applying */}
            {!result && !applied && (
              <>
                <label className={`upload-sheet-file-zone${importing ? ' upload-sheet-file-zone--disabled' : ''}`}>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="upload-sheet-file-input"
                    onChange={e => { if (e.target.files?.[0]) { selectFile(e.target.files[0]); setApplied(false); } }}
                    disabled={importing}
                  />
                  {file
                    ? <span className="upload-sheet-filename">📄 {file.name}</span>
                    : <span className="upload-sheet-file-hint">Tap to choose a PDF or image</span>
                  }
                </label>
                {file && !importing && (
                  <label className="upload-sheet-wipe-row">
                    <input
                      type="checkbox"
                      checked={wipe}
                      onChange={e => setWipe(e.target.checked)}
                      className="upload-sheet-wipe-check"
                    />
                    <span>Replace existing schedule</span>
                  </label>
                )}
              </>
            )}

            {/* Spinner */}
            {importing && (
              <div className="upload-sheet-spinner-row">
                <div className="upload-sheet-spinner" aria-hidden="true" />
                <span>Parsing schedule…</span>
              </div>
            )}

            {/* Error */}
            {error && !importing && (
              <p className="upload-sheet-error">{error}</p>
            )}

            {/* Success state */}
            {applied && result && (
              <div className="upload-sheet-success">
                ✓ Applied — jumped to week of {formatWeekOf(result.weekId)}
              </div>
            )}

            {/* Parsed result preview — grouped by day */}
            {result && !importing && !applied && (
              <div className="upload-sheet-result">
                <p className="upload-sheet-result-meta">
                  {result.student} · Week of {formatWeekOf(result.weekId)}
                </p>
                <div className="upload-sheet-divider" />
                <div className="upload-sheet-lesson-list">
                  {(result.days ?? []).map(({ dayIndex, lessons }) => (
                    <div key={dayIndex} className="upload-sheet-day-group">
                      <div className="upload-sheet-day-header">
                        {DAY_SHORT[dayIndex]} · {formatDayDate(result.weekId, dayIndex)}
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

            {/* View Log button — visible after any import attempt */}
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
            {!applied && (result ? (
              <button className="upload-sheet-apply-btn" onClick={handleApply}>
                {wipe ? 'Replace & Apply' : 'Apply to Week'}
              </button>
            ) : (
              <button
                className="upload-sheet-import-btn"
                onClick={importSchedule}
                disabled={!file || importing}
              >
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
