import { useState } from 'react';

// Reads a File as a base64 data string (strips the data: prefix).
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Manages PDF import state and the fetch call to /api/parse-schedule.
// Never calls the Anthropic API directly — that lives in the Netlify Function.
export function usePdfImport() {
  const [file, setFile]           = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');

  function selectFile(selectedFile) {
    setFile(selectedFile);
    setResult(null);
    setError('');
  }

  async function importSchedule() {
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const base64 = await readAsBase64(file);
      const res = await fetch('/api/parse-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, mediaType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setImporting(false);
    setResult(null);
    setError('');
  }

  return { file, importing, result, error, selectFile, importSchedule, reset };
}
