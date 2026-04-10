import './UploadSheet.css';

// Props: pdfImport ({ file, importing, result, error, selectFile, importSchedule }),
//        student, weekDates, onApply (fn receives parsedData), onClose (fn)
export default function UploadSheet({ pdfImport, student, onApply, onClose }) {
  const { file, importing, result, error, selectFile, importSchedule } = pdfImport;

  // Collect unique subject names from all days in the parsed result.
  const subjectNames = result
    ? [...new Set((result.days ?? []).flatMap(d => (d.lessons ?? []).map(l => l.subject)))]
    : [];

  return (
    <div className="upload-sheet-overlay" onClick={onClose}>
      <div className="upload-sheet" onClick={e => e.stopPropagation()}>

        <div className="upload-sheet-handle" aria-hidden="true" />

        <header className="upload-sheet-header">
          <h2 className="upload-sheet-title">Import Schedule</h2>
          <button className="upload-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="upload-sheet-body">

          {/* File picker — hidden when result is ready */}
          {!result && (
            <label className={`upload-sheet-file-zone${importing ? ' upload-sheet-file-zone--disabled' : ''}`}>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="upload-sheet-file-input"
                onChange={e => e.target.files?.[0] && selectFile(e.target.files[0])}
                disabled={importing}
              />
              {file
                ? <span className="upload-sheet-filename">📄 {file.name}</span>
                : <span className="upload-sheet-file-hint">Tap to choose a PDF or image</span>
              }
            </label>
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

          {/* Parsed result summary */}
          {result && !importing && (
            <div className="upload-sheet-result">
              <p className="upload-sheet-result-heading">
                Found {subjectNames.length} subject{subjectNames.length !== 1 ? 's' : ''} for {result.student}
              </p>
              <ul className="upload-sheet-subject-list">
                {subjectNames.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}

        </div>

        <div className="upload-sheet-footer">
          <button className="upload-sheet-cancel" onClick={onClose}>Cancel</button>
          {result ? (
            <button className="upload-sheet-apply-btn" onClick={() => onApply(result)}>
              Apply to Week
            </button>
          ) : (
            <button
              className="upload-sheet-import-btn"
              onClick={importSchedule}
              disabled={!file || importing}
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
