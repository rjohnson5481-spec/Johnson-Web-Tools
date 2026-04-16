import { useState, useRef } from 'react';
import './CurriculumImportSheet.css';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp';

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result.split(',')[1]); r.onerror = reject; r.readAsDataURL(file);
  });
}

function mediaTypeFor(file) {
  if (file.type === 'application/pdf') return 'application/pdf';
  if (file.type.startsWith('image/')) return file.type;
  return 'application/octet-stream';
}

function fileTypeLabel(file) {
  if (file.type === 'application/pdf') return 'PDF';
  if (file.type.startsWith('image/')) return 'Image';
  return 'File';
}

function isDuplicate(parsed, existing) {
  const pn = parsed.name.toLowerCase();
  return (existing ?? []).some(c => {
    const en = c.name.toLowerCase();
    return en === pn || en.includes(pn) || pn.includes(en);
  });
}

function buildCurriculumLog({ file, startTime, endTime, rawText, parsed, courses }) {
  const lines = [];
  lines.push(`File: ${file.name}`);
  lines.push(`Size: ${(file.size / 1024).toFixed(1)} KB`);
  lines.push(`Type: ${fileTypeLabel(file)}`);
  lines.push(`Request: ${new Date(startTime).toISOString()}`);
  lines.push(`Response: ${endTime - startTime}ms`);
  lines.push('');
  lines.push('── Raw response (first 500 chars) ──');
  lines.push(rawText.slice(0, 500));
  lines.push('');
  const dupes = (parsed ?? []).filter(c => isDuplicate(c, courses)).length;
  lines.push(`Parse result: ${parsed?.length ?? 0} courses found, ${dupes} duplicate${dupes !== 1 ? 's' : ''}`);
  lines.push('');
  (parsed ?? []).forEach(c => {
    const tag = isDuplicate(c, courses) ? ' [DUPLICATE]' : '';
    lines.push(`${c.name} — ${c.curriculum || '(no curriculum)'} [${c.gradingType}]${tag}`);
  });
  return lines.join('\n');
}

const CURRICULUM_SYSTEM_PROMPT = `You are a curriculum receipt and catalog parser for a homeschool. Extract all curriculum items, courses, and subjects from the provided document or image.
Return ONLY a JSON array with no markdown, no preamble, and no explanation. Each item must have exactly these fields:
name (string — course or subject name, e.g. 'Reading 3', 'Mathematics 4', 'Science 3'),
curriculum (string — publisher or curriculum provider, e.g. 'BJU Press', 'Saxon Math', or empty string if unknown),
gradingType (string — must be exactly 'letter' or 'esnu'. Use 'letter' for academic subjects. Use 'esnu' for non-academic subjects like Bible, PE, Art. Default to 'letter' if unclear),
gradeLevel (string — grade level if detectable, e.g. '3', 'K', or empty string if unknown).
If no curriculum items are found return an empty array.`;

export default function CurriculumImportSheet({ open, onClose, onImport, courses }) {
  const fileRef = useRef(null);
  const [file, setFile]         = useState(null);
  const [parsing, setParsing]   = useState(false);
  const [error, setError]       = useState(null);
  const [results, setResults]   = useState(null);
  const [removed, setRemoved]   = useState(new Set());
  const [debugLog, setDebugLog] = useState('');
  const [showLog, setShowLog]   = useState(false);

  function reset() { setFile(null); setParsing(false); setError(null); setResults(null); setRemoved(new Set()); setDebugLog(''); setShowLog(false); }
  function handleClose() { reset(); onClose(); }

  async function handleParse() {
    if (!file) return;
    setParsing(true); setError(null); setResults(null); setRemoved(new Set()); setDebugLog(''); setShowLog(false);
    const startTime = Date.now(); let rawText = '';
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('Anthropic API key not configured');
      const base64 = await readFileAsBase64(file);
      const mediaType = mediaTypeFor(file);
      const isImage = mediaType.startsWith('image/');
      const contentBlock = isImage
        ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }
        : { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } };
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: CURRICULUM_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: `Extract all curriculum courses from this document. File: ${file.name}` }] }] }),
      });
      if (!resp.ok) { const body = await resp.text(); throw new Error(`API error ${resp.status}: ${body.slice(0, 200)}`); }
      const data = await resp.json();
      rawText = data.content?.[0]?.text ?? '';
      let text = rawText.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Expected an array of courses');
      const endTime = Date.now();
      setResults(parsed);
      setDebugLog(buildCurriculumLog({ file, startTime, endTime, rawText, parsed, courses }));
    } catch (err) {
      const endTime = Date.now();
      setDebugLog(buildCurriculumLog({ file, startTime, endTime, rawText, parsed: null, courses }));
      setError(err?.message ?? 'Import failed');
    } finally { setParsing(false); }
  }

  function handleRemove(idx) { setRemoved(prev => { const s = new Set(prev); s.add(idx); return s; }); }

  async function handleConfirm() {
    const newCourses = (results ?? []).filter((c, i) => !removed.has(i) && !isDuplicate(c, courses))
      .map(c => ({ name: c.name, curriculum: c.curriculum || '', gradingType: c.gradingType || 'letter' }));
    if (!newCourses.length) return;
    await onImport(newCourses);
    handleClose();
  }

  if (!open) return null;

  const newCount = results ? (results ?? []).filter((c, i) => !removed.has(i) && !isDuplicate(c, courses)).length : 0;
  const dupeCount = results ? (results ?? []).filter(c => isDuplicate(c, courses)).length : 0;
  const allDupes = results && newCount === 0;
  const logCount = debugLog ? debugLog.split('\n').filter(l => l.trim()).length : 0;

  return (
    <div className="cui-sheet-overlay" onClick={handleClose}>
      <div className="cui-sheet" onClick={e => e.stopPropagation()}>
        <div className="cui-sheet-handle" aria-hidden="true" />
        <header className="cui-sheet-header">
          <h2 className="cui-sheet-title">Import Curriculum</h2>
          <button className="cui-sheet-close" onClick={handleClose} aria-label="Close">✕</button>
        </header>
        <div className="cui-sheet-body">
          {!results && !parsing && (
            <>
              <p className="cui-help">Import a curriculum receipt or photo to automatically add courses to your catalog. Supports PDF and images.</p>
              <div className={`cui-file-zone${file ? ' cui-file-zone--has-file' : ''}`} onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: 'none' }}
                  onChange={e => { setFile(e.target.files?.[0] ?? null); setError(null); }} />
                {file ? <span className="cui-file-name">{file.name}</span> : <span className="cui-file-prompt">Tap to select a file</span>}
              </div>
            </>
          )}
          {parsing && <div className="cui-spinner-wrap"><div className="cui-spinner" /><p className="cui-spinner-label">Analyzing curriculum...</p></div>}
          {error && !parsing && <div className="cui-error">⚠ {error}</div>}
          {results && !parsing && (
            <div className="cui-results">
              <p className="cui-results-count">{results.length} course{results.length !== 1 ? 's' : ''} found · {newCount} new · {dupeCount} already in catalog</p>
              {results.map((c, i) => {
                const dupe = isDuplicate(c, courses);
                if (removed.has(i)) return null;
                return (
                  <div key={i} className={`cui-course-row${dupe ? ' cui-course-row--duplicate' : ''}`}>
                    <div className="cui-course-info">
                      <span className="cui-course-name">{c.name}</span>
                      <span className="cui-course-meta">{c.curriculum || '—'}{c.gradeLevel ? ` · Grade ${c.gradeLevel}` : ''}</span>
                    </div>
                    <span className="cui-course-badge">{c.gradingType === 'esnu' ? 'E/S/N/U' : 'Letter'}</span>
                    {dupe ? <span className="cui-duplicate-badge">Already in catalog</span> : <button className="cui-remove-btn" onClick={() => handleRemove(i)}>✕</button>}
                  </div>
                );
              })}
              {debugLog && <button className="cui-log-btn" onClick={() => setShowLog(v => !v)}>{showLog ? `Hide Log (${logCount})` : `View Log (${logCount})`}</button>}
              {showLog && <div className="cui-log-panel">{debugLog}</div>}
            </div>
          )}
        </div>
        <footer className="cui-sheet-footer">
          <button className="cui-cancel-btn" onClick={handleClose}>Cancel</button>
          {!results ? (
            <button className="cui-parse-btn" onClick={handleParse} disabled={!file || parsing}>{parsing ? 'Analyzing...' : 'Analyze Receipt'}</button>
          ) : (
            <button className="cui-import-btn" onClick={handleConfirm} disabled={allDupes}>
              {allDupes ? 'All courses already in catalog' : `Import ${newCount} Course${newCount !== 1 ? 's' : ''}`}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
