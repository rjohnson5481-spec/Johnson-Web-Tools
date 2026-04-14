/* ============================================================
   Iron & Light Johnson Academy — TE Question Extractor
   app.js
   ============================================================ */

const VERSION = '0.20.4';

const SYSTEM_PROMPT = `You are a teacher question extraction assistant for Teacher Edition PDFs at Iron & Light Johnson Academy.

Given a Teacher Edition PDF and lesson numbers:

STEP 1 — Scan the PDF programmatically to find the page range for each requested lesson. Look for "LESSON [n]" printed at the top of TE pages. If given a calendar image instead, read Day numbers directly — Day number equals Lesson number.

STEP 2 — For each lesson extract:
QUESTIONS: Only lines ending in ? Copied exactly. No answers, directions, or commentary. Grouped by TE page with TE page number, student page number, and section heading noted.
VOCABULARY: Words listed under "New" or "Review" labels. Words only, no definitions. Note New vs Review.

STEP 3 — Return a complete, self-contained HTML file with:
- Lexend font (Google Fonts, weights 300;400;500;600;700)
- Logo img src="https://i.imgur.com/9JfGi6d.jpeg" 150px on cover, 32px in footer, onerror hide
- School name: Iron & Light Johnson Academy | Tagline: Faith · Knowledge · Strength
- Sticky print bar (hidden on print): background #22252e, school name left in white, Print button right in #c9a84c
- Cover page: logo, school name, tagline, curriculum info, summary table (Lesson / Story / Student Pages / TE Pages / Questions / Vocabulary count). Page break after.
- Per lesson: dark banner (#22252e) with lesson number in #e8c97a and story title in white, meta strip (#f2f0ed) with page info, vocabulary pills (New=filled #22252e white text, Review=outlined #c9a84c gold text), questions grouped by TE page with #22252e TE badge and outlined student page badge, numbered list with #c9a84c counters
- Page break after each lesson
- Print CSS: @page { margin: 1.5cm 2cm; size: letter; } with print-color-adjust: exact

Return ONLY the complete HTML. No markdown fences. No explanation.`;

// ── State ────────────────────────────────────────────────────
const state = {
  selectedFile: null,
  lastResult:   null,   // { html, lessons, filename, timestamp }
  history:      [],     // { id, lessons, fileName, html, previewText, createdAt } from Firestore
  debugLog:     [],     // { timestamp, label, body } entries
};

// ── DOM Refs ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const dom = {
  // Nav
  navBtns:          document.querySelectorAll('.nav-btn'),
  tabPanels:        document.querySelectorAll('.tab-panel'),
  logBadge:         $('logBadge'),

  // Extract form
  extractForm:      $('extractForm'),
  lessonNumbers:    $('lessonNumbers'),
  fileUpload:       $('fileUpload'),
  fileDropZone:     $('fileDropZone'),
  fileDropContent:  $('fileDropContent'),
  extractBtn:       $('extractBtn'),
  errorBox:         $('errorBox'),
  errorText:        $('errorText'),

  // Results
  resultsCard:      $('resultsCard'),
  resultsLabel:     $('resultsLabel'),
  downloadBtn:      $('downloadBtn'),
  previewBtn:       $('previewBtn'),
  printBtn:         $('printBtn'),
  previewContainer: $('previewContainer'),
  previewFrame:     $('previewFrame'),

  // Prompt tabs
  masterPromptText: $('masterPromptText'),
  copyMasterPrompt: $('copyMasterPrompt'),
  qcPromptText:     $('qcPromptText'),
  copyQcPrompt:     $('copyQcPrompt'),

  // Session / history log
  logLoading:       $('logLoading'),
  logEmpty:         $('logEmpty'),
  logList:          $('logList'),

  // Debug log
  debugBadge:       $('debugBadge'),
  debugEmpty:       $('debugEmpty'),
  debugEntries:     $('debugEntries'),
  debugCopyAllBtn:  $('debugCopyAllBtn'),
  debugClearBtn:    $('debugClearBtn'),

  // Extraction progress
  extractionProgress: $('extractionProgress'),
  progressBarFill:    $('progressBarFill'),
  progressStatus:     $('progressStatus'),
  progressTimer:      $('progressTimer'),

  // PDF splitter
  splitSection:     $('splitSection'),
  splitPageRange:   $('splitPageRange'),
  splitBtn:         $('splitBtn'),
  splitStatus:      $('splitStatus'),
};

// Stamp version into all version displays
// versionDisplay and versionDisplayMobile are inside "TE Extractor v<span>" — no v prefix
document.getElementById('versionDisplay').textContent = VERSION;
document.getElementById('versionDisplayMobile').textContent = VERSION;
document.getElementById('sidebarVersion').textContent = `v${VERSION}`;

// ── Firebase auth-ready — load extraction history ─────────────
// Show loading spinner while waiting for auth + Firestore
dom.logLoading.style.display = 'flex';

document.addEventListener('te-auth-ready', async ({ detail: { uid } }) => {
  await loadHistory(uid);
});

// ── Tab Navigation ───────────────────────────────────────────
dom.navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    dom.navBtns.forEach(b => b.classList.remove('active'));
    dom.tabPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const panel = document.getElementById(`tab-${target}`);
    if (panel) panel.classList.add('active');
  });
});

// ── File Upload & Drag-Drop ──────────────────────────────────
dom.fileUpload.addEventListener('change', e => {
  const file = e.target.files[0] || null;
  handleFileSelected(file);
});

dom.fileDropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dom.fileDropZone.classList.add('drag-over');
});

dom.fileDropZone.addEventListener('dragleave', () => {
  dom.fileDropZone.classList.remove('drag-over');
});

dom.fileDropZone.addEventListener('drop', e => {
  e.preventDefault();
  dom.fileDropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0] || null;
  if (file) {
    handleFileSelected(file);
    // Sync with the input element so the form knows
    const dt = new DataTransfer();
    dt.items.add(file);
    dom.fileUpload.files = dt.files;
  }
});

// 20 MB raw ≈ 27 MB base64 — well within Anthropic's 32 MB document limit
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function handleFileSelected(file) {
  state.selectedFile = file;
  if (!file) {
    resetFileDropZone();
    hideError();
    checkFormReady();
    return;
  }

  const tooBig = file.size > MAX_FILE_BYTES;

  dom.fileDropZone.classList.toggle('has-file', !tooBig);
  dom.fileDropZone.classList.toggle('too-big', tooBig);

  // Show or hide the PDF splitter panel
  $('splitSection').style.display = (tooBig && file.type === 'application/pdf') ? 'block' : 'none';
  hideSplitStatus();

  dom.fileDropContent.innerHTML = tooBig ? `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32" style="color:#d97706">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span class="file-drop-label" style="color:#92400e">${escHtml(file.name)}</span>
    <span class="file-drop-hint" style="color:#92400e">${formatBytes(file.size)} — too large for the API. Use the trimmer below.</span>
    <button type="button" class="btn btn-outline btn-sm" id="clearFileBtn" style="margin-top:8px;z-index:2;position:relative;border-color:#fbbf24;color:#92400e">
      Remove file
    </button>
  ` : `
    <div class="file-name-display">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
        ${file.type === 'application/pdf'
          ? '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>'
          : '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'}
      </svg>
      <span>${escHtml(file.name)}</span>
    </div>
    <span class="file-size-display">${formatBytes(file.size)}</span>
    <button type="button" class="btn btn-outline btn-sm" id="clearFileBtn" style="margin-top:6px;z-index:2;position:relative">
      Remove file
    </button>
  `;

  // The remove button must prevent click from bubbling to the file input
  const clearBtn = document.getElementById('clearFileBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      dom.fileUpload.value = '';
      handleFileSelected(null);
    });
  }

  checkFormReady();
}

function resetFileDropZone() {
  state.selectedFile = null;
  dom.fileDropZone.classList.remove('has-file', 'drag-over');
  dom.fileDropContent.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <span class="file-drop-label">Drop file here or <span class="file-drop-link">browse</span></span>
    <span class="file-drop-hint">PDF · max 100 pages · max 20 MB</span>
  `;
}

// ── Form Readiness Check ─────────────────────────────────────
function checkFormReady() {
  const ready =
    dom.lessonNumbers.value.trim() !== '' &&
    state.selectedFile !== null &&
    state.selectedFile.size <= MAX_FILE_BYTES;
  dom.extractBtn.disabled = !ready;
}

dom.lessonNumbers.addEventListener('input', checkFormReady);

// ── Extract Form Submission ──────────────────────────────────
dom.extractForm.addEventListener('submit', async e => {
  e.preventDefault();
  await runExtraction();
});

async function runExtraction() {
  hideError();
  setExtracting(true);
  hideResults();
  startProgress();

  const lessons = dom.lessonNumbers.value.trim();
  const file    = state.selectedFile;

  try {
    // 1. For PDFs, check page count before wasting the API call
    if (file.type === 'application/pdf') {
      const pageCount = await getPdfPageCount(file);
      if (pageCount > 100) {
        throw new Error(
          'This PDF is too large. Please upload a smaller section — ideally under 50 pages — and try again.'
        );
      }
    }

    // 2. Read file as base64
    const { base64, mediaType } = await readFileAsBase64(file);

    // 3. Call Anthropic API directly (with timing for debug log)
    const apiStart = Date.now();
    const html = await callAPI({ base64, mediaType, lessons, fileName: file.name });
    const apiMs = Date.now() - apiStart;

    // 4. Validate response
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      throw new Error('The response did not contain a valid HTML document. Please try again.');
    }

    // 5. Log debug info
    addDebugLog({
      label: `Lessons ${lessons} — ${file.name}`,
      body: [
        `File: ${file.name}`,
        `File size: ${formatBytes(file.size)}`,
        `Lessons: ${lessons}`,
        `API response time: ${(apiMs / 1000).toFixed(2)}s`,
        `Output size: ${formatBytes(html.length)}`,
        `Output preview (first 300 chars):\n${html.slice(0, 300)}`,
      ].join('\n'),
    });

    // 6. Store result
    const filename  = `lessons_${sanitizeFilename(lessons)}_questions.html`;
    const timestamp = new Date();
    state.lastResult = { html, lessons, filename, timestamp };

    // 7. Save to Firestore history (non-blocking — don't fail extraction on Firestore error)
    addToHistory({ lessons, fileName: file.name, html }).catch(err => {
      console.warn('[TE] Firestore save failed:', err);
    });

    // 8. Show results
    showResults(lessons);

  } catch (err) {
    showError(err.message || 'An unexpected error occurred.');
  } finally {
    stopProgress();
    setExtracting(false);
  }
}

// ── API Call — direct to Anthropic ───────────────────────────
async function callAPI({ base64, mediaType, lessons, fileName }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('API key not configured. Please contact the administrator.');
  }

  const isPDF = mediaType === 'application/pdf';
  const sourceBlock = isPDF
    ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
    : { type: 'image',    source: { type: 'base64', media_type: mediaType, data: base64 } };
  const textBlock = {
    type: 'text',
    text: `Extract all teacher questions and vocabulary for lessons: ${lessons}\n\nFile: ${fileName || 'document'}`,
  };

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: [sourceBlock, textBlock] }],
      }),
    });
  } catch (networkErr) {
    throw new Error(`Network error — could not reach the Anthropic API. Check your internet connection. (${networkErr.message})`);
  }

  if (!response.ok) {
    let errMsg = `API error ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error?.message) errMsg = errData.error.message;
    } catch (_) {}

    if (response.status === 429) throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    if (response.status === 413) throw new Error('File is too large for the API. Please try a smaller file or a specific page range.');
    if (errMsg.toLowerCase().includes('credit')) {
      throw new Error('API credits needed — visit console.anthropic.com to add credits and try again.');
    }
    if (errMsg.includes('context') || errMsg.includes('max_tokens')) {
      dom.splitSection.style.display = 'block';
      dom.splitSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      throw new Error(
        'Too many pages for the model\'s context window. ' +
        'Trim the PDF to only the pages for your specific lessons — ' +
        'aim for 6–8 pages per lesson (e.g. 3 lessons ≈ 20 pages). ' +
        'Use the trimmer below to extract a tighter range.'
      );
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const html = data.content?.[0]?.text || '';
  if (!html) throw new Error('The API returned an empty response. Please try again.');
  return stripMarkdownFences(html);
}

// ── File Reader Helper ───────────────────────────────────────
// FileReader-based ArrayBuffer reader — works on all Android Chrome versions
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file. Please try again.'));
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;           // data:[mime];base64,[data]
      const commaIdx = dataUrl.indexOf(',');
      const base64 = dataUrl.slice(commaIdx + 1);
      const mediaType = file.type || detectMediaType(file.name);
      resolve({ base64, mediaType });
    };
    reader.onerror = () => reject(new Error('Could not read the file. Please try again.'));
    reader.readAsDataURL(file);
  });
}

function detectMediaType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
  return map[ext] || 'application/octet-stream';
}

// ── UI State Helpers ─────────────────────────────────────────
function setExtracting(on) {
  dom.extractBtn.disabled = on;
  dom.extractBtn.querySelector('.btn-text').style.display    = on ? 'none'   : '';
  dom.extractBtn.querySelector('.btn-spinner').style.display = on ? 'inline-flex' : 'none';
}

function showError(msg) {
  dom.errorText.textContent = msg;
  dom.errorBox.style.display = 'flex';
}

function hideError() {
  dom.errorBox.style.display = 'none';
}

function showResults(lessons) {
  dom.resultsLabel.textContent = `Lessons ${lessons}`;
  dom.resultsCard.style.display = 'block';
  dom.previewContainer.style.display = 'none';
  dom.resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResults() {
  dom.resultsCard.style.display = 'none';
}

// ── Result Actions ───────────────────────────────────────────
dom.downloadBtn.addEventListener('click', () => {
  if (!state.lastResult) return;
  const { html, filename } = state.lastResult;
  triggerDownload(html, filename);
});

dom.previewBtn.addEventListener('click', () => {
  if (!state.lastResult) return;
  const isVisible = dom.previewContainer.style.display !== 'none';
  if (isVisible) {
    dom.previewContainer.style.display = 'none';
    dom.previewBtn.textContent = 'Preview';
    return;
  }
  // Write into iframe srcdoc
  dom.previewFrame.srcdoc = state.lastResult.html;
  dom.previewContainer.style.display = 'block';

  // Update button text
  dom.previewBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
    Hide Preview`;
});

dom.printBtn.addEventListener('click', () => {
  if (!state.lastResult) return;
  const { html } = state.lastResult;
  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up was blocked. Please allow pop-ups for this site and try again.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Wait for content to load before printing
  win.onload = () => win.print();
  // Fallback
  setTimeout(() => { try { win.print(); } catch(_) {} }, 800);
});

// ── Copy Prompt Buttons ──────────────────────────────────────
dom.copyMasterPrompt.addEventListener('click', () => {
  copyText(dom.masterPromptText.textContent, dom.copyMasterPrompt);
});

dom.copyQcPrompt.addEventListener('click', () => {
  copyText(dom.qcPromptText.textContent, dom.copyQcPrompt);
});

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  // Visual feedback
  const original = btn.innerHTML;
  btn.classList.add('copied');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = original;
  }, 2000);
}

// ── Extraction History (Firestore-backed) ────────────────────
async function loadHistory(uid) {
  dom.logLoading.style.display = 'flex';
  dom.logEmpty.style.display   = 'none';
  dom.logList.style.display    = 'none';

  try {
    const { getDocs, collection, query, orderBy } = window.__teFirestore;
    const q = query(
      collection(window.__teDb, 'users', uid, 'teExtractor', 'extractions', 'items'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    state.history = snap.docs.map(d => {
      const data = d.data();
      return {
        id:          d.id,
        lessons:     data.lessons    || '',
        fileName:    data.fileName   || '',
        html:        data.html       || '',
        previewText: data.previewText || '',
        createdAt:   data.createdAt?.toDate?.() || null,
      };
    });
    renderHistoryLog();
  } catch (err) {
    console.error('[TE] loadHistory error:', err);
    renderHistoryLog(); // show empty state
  } finally {
    dom.logLoading.style.display = 'none';
  }
}

async function addToHistory({ lessons, fileName, html }) {
  const previewText = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);

  // Optimistic local update first
  const localEntry = { id: null, lessons, fileName, html, previewText, createdAt: new Date() };
  state.history.unshift(localEntry);
  renderHistoryLog();

  // Then persist to Firestore (skip if no auth)
  if (!window.__teUid || !window.__teFirestore) return;
  const { addDoc, collection, serverTimestamp } = window.__teFirestore;
  const docRef = await addDoc(
    collection(window.__teDb, 'users', window.__teUid, 'teExtractor', 'extractions', 'items'),
    { lessons, fileName, html, previewText, createdAt: serverTimestamp() }
  );
  // Backfill the doc ID so delete works immediately
  localEntry.id = docRef.id;
}

function renderHistoryLog() {
  const count = state.history.length;
  dom.logBadge.textContent = count;
  dom.logBadge.style.display = count > 0 ? 'inline' : 'none';

  if (count === 0) {
    dom.logEmpty.style.display = 'flex';
    dom.logList.style.display  = 'none';
    return;
  }

  dom.logEmpty.style.display = 'none';
  dom.logList.style.display  = 'flex';

  dom.logList.innerHTML = state.history.map(entry => `
    <div class="log-entry">
      <div class="log-entry-header">
        <span class="log-entry-lessons">Lessons: ${escHtml(entry.lessons)}</span>
        <span class="log-entry-time">${formatDate(entry.createdAt)}</span>
      </div>
      <div class="log-entry-file">${escHtml(entry.fileName)}</div>
      ${entry.previewText ? `<div class="log-entry-preview">${escHtml(entry.previewText.slice(0, 120))}…</div>` : ''}
      <div class="log-entry-actions">
        <button class="btn btn-primary btn-sm" onclick="historyOpen('${escHtml(entry.id || '')}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open
        </button>
        <button class="btn btn-outline btn-sm" onclick="historyDownload('${escHtml(entry.id || '')}', '${escHtml(entry.lessons)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download
        </button>
        ${entry.id ? `<button class="btn btn-outline btn-sm log-delete-btn" onclick="historyDelete('${escHtml(entry.id)}')">Delete</button>` : ''}
      </div>
    </div>
  `).join('');
}

// History actions — exposed to inline onclick handlers
window.historyOpen = function(id) {
  const entry = state.history.find(e => e.id === id) || state.history[0];
  if (!entry?.html) return;
  const win = window.open('', '_blank');
  if (!win) { alert('Pop-up was blocked. Please allow pop-ups for this site and try again.'); return; }
  win.document.open();
  win.document.write(entry.html);
  win.document.close();
};

window.historyDownload = function(id, lessons) {
  const entry = state.history.find(e => e.id === id);
  if (!entry?.html) return;
  const filename = `lessons_${sanitizeFilename(lessons || entry.lessons)}_questions.html`;
  triggerDownload(entry.html, filename);
};

window.historyDelete = async function(id) {
  if (!id || !window.__teUid || !window.__teFirestore) return;
  const { deleteDoc, doc } = window.__teFirestore;
  try {
    await deleteDoc(doc(window.__teDb, 'users', window.__teUid, 'teExtractor', 'extractions', 'items', id));
  } catch (err) {
    console.error('[TE] historyDelete error:', err);
  }
  state.history = state.history.filter(e => e.id !== id);
  renderHistoryLog();
};

// ── Debug Log ────────────────────────────────────────────────
function addDebugLog({ label, body }) {
  const entry = { label, body, timestamp: new Date() };
  state.debugLog.unshift(entry); // newest first

  // Update badge
  dom.debugBadge.textContent = state.debugLog.length;
  dom.debugBadge.style.display = 'inline';

  renderDebugLog();
}

function renderDebugLog() {
  if (state.debugLog.length === 0) {
    dom.debugEmpty.style.display = 'flex';
    dom.debugEntries.style.display = 'none';
    dom.debugBadge.style.display = 'none';
    return;
  }

  dom.debugEmpty.style.display = 'none';
  dom.debugEntries.style.display = 'flex';

  dom.debugEntries.innerHTML = state.debugLog.map(entry => `
    <div class="debug-entry">
      <div class="debug-entry-header">
        <span>${escHtml(entry.label)}</span>
        <span class="debug-entry-time">${formatTime(entry.timestamp)}</span>
      </div>
      <pre class="debug-entry-body">${escHtml(entry.body)}</pre>
    </div>
  `).join('');
}

dom.debugCopyAllBtn.addEventListener('click', () => {
  const text = state.debugLog.map(e =>
    `[${formatTime(e.timestamp)}] ${e.label}\n${e.body}`
  ).join('\n\n---\n\n');
  copyText(text, dom.debugCopyAllBtn);
});

dom.debugClearBtn.addEventListener('click', () => {
  state.debugLog = [];
  renderDebugLog();
});

// ── Utilities ────────────────────────────────────────────────
function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9_\-]/gi, '_').replace(/_+/g, '_').slice(0, 60);
}

function stripMarkdownFences(text) {
  // Remove ```html ... ``` or ``` ... ``` wrappers if present
  return text.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

// ── Extraction Progress Indicator ────────────────────────────
const PROGRESS_MESSAGES = [
  'Scanning PDF for lesson pages…',
  'Extracting questions and vocabulary…',
  'Building HTML output…',
  'Almost done…',
];

let _progressInterval = null;
let _progressStart    = 0;

function startProgress() {
  _progressStart = Date.now();
  dom.progressStatus.textContent  = PROGRESS_MESSAGES[0];
  dom.progressTimer.textContent   = '0s';
  dom.progressBarFill.style.width = '0%';
  dom.extractionProgress.style.display = 'block';

  _progressInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - _progressStart) / 1000);
    dom.progressTimer.textContent = `${elapsed}s`;

    // Rotate message every 5 seconds
    const msgIdx = Math.min(Math.floor(elapsed / 5), PROGRESS_MESSAGES.length - 1);
    dom.progressStatus.textContent = PROGRESS_MESSAGES[msgIdx];

    // Fill grows to 90% over 90 seconds — never reaches 100% until done
    const pct = Math.min(90, (elapsed / 90) * 90);
    dom.progressBarFill.style.width = `${pct}%`;
  }, 500);
}

function stopProgress() {
  clearInterval(_progressInterval);
  _progressInterval = null;
  dom.extractionProgress.style.display = 'none';
  dom.progressBarFill.style.width = '0%';
}

// ── PDF Splitter ─────────────────────────────────────────────

dom.splitBtn.addEventListener('click', async () => {
  const rangeStr = dom.splitPageRange.value.trim();
  if (!rangeStr) {
    showSplitStatus('error', 'Please enter a page range first (e.g. 45-55).');
    return;
  }
  if (!state.selectedFile) return;

  setSplitting(true);
  hideSplitStatus();

  try {
    const pdfLib  = await loadPdfLib();
    const pages   = parsePageRange(rangeStr);

    if (pages.length === 0) {
      throw new Error('Could not parse that page range. Try a format like "45-55" or "45, 47, 50-60".');
    }

    const arrayBuffer = await readFileAsArrayBuffer(state.selectedFile);
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Could not read the file. Please try removing and re-adding it.');
    }

    if (!pdfLib.PDFDocument) {
      throw new Error('PDF library did not load correctly. Please reload the page and try again.');
    }

    const srcDoc      = await pdfLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const totalPages  = srcDoc.getPageCount();

    // Validate all page numbers
    const invalid = pages.filter(p => p < 1 || p > totalPages);
    if (invalid.length > 0) {
      throw new Error(`Page ${invalid[0]} is out of range. This PDF has ${totalPages} pages.`);
    }

    // Build new PDF with only the requested pages (pdf-lib uses 0-based index)
    const newDoc       = await pdfLib.PDFDocument.create();
    const zeroIndexed  = pages.map(p => p - 1);
    const copiedPages  = await newDoc.copyPages(srcDoc, zeroIndexed);
    copiedPages.forEach(p => newDoc.addPage(p));

    const pdfBytes = await newDoc.save();
    const baseName = state.selectedFile.name.replace(/\.pdf$/i, '');
    const newName  = `${baseName}_pages_${rangeStr.replace(/\s/g, '')}.pdf`;
    const newFile  = new File([pdfBytes], newName, { type: 'application/pdf' });

    // Auto-load into uploader
    handleFileSelected(newFile);

    showSplitStatus('success',
      `Done — ${pages.length} page${pages.length !== 1 ? 's' : ''} extracted (${formatBytes(newFile.size)}). Loaded automatically.`
    );

    // Clear the range input for next use
    dom.splitPageRange.value = '';

  } catch (err) {
    showSplitStatus('error', err.message || 'Could not split the PDF. Please try again.');
  } finally {
    setSplitting(false);
  }
});

// Allow Enter key in the page range input to trigger split
dom.splitPageRange.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); dom.splitBtn.click(); }
});

function setSplitting(on) {
  dom.splitBtn.disabled = on;
  dom.splitBtn.querySelector('.split-btn-text').style.display    = on ? 'none' : '';
  dom.splitBtn.querySelector('.split-btn-spinner').style.display = on ? 'inline-flex' : 'none';
}

function showSplitStatus(type, msg) {
  dom.splitStatus.className = `split-status ${type}`;
  dom.splitStatus.innerHTML = type === 'success'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg> ${escHtml(msg)}`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${escHtml(msg)}`;
  dom.splitStatus.style.display = 'flex';
}

function hideSplitStatus() {
  dom.splitStatus.style.display = 'none';
}

/**
 * Return the page count of a PDF file.
 * Returns 0 if the count cannot be determined (allow API to handle it).
 */
async function getPdfPageCount(file) {
  try {
    const pdfLib = await loadPdfLib();
    const buf    = await readFileAsArrayBuffer(file);
    const doc    = await pdfLib.PDFDocument.load(buf, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch (_) {
    return 0;
  }
}

/**
 * Lazy-load pdf-lib from CDN on first use.
 * Tries jsDelivr first, falls back to unpkg.
 * Returns the PDFLib namespace object.
 */
function loadPdfLib() {
  if (window.PDFLib && window.PDFLib.PDFDocument) return Promise.resolve(window.PDFLib);
  // Clear partial loads
  delete window.PDFLib;

  function tryLoad(src) {
    return new Promise((resolve, reject) => {
      const script   = document.createElement('script');
      script.src     = src;
      script.onload  = () => {
        if (window.PDFLib && window.PDFLib.PDFDocument) resolve(window.PDFLib);
        else reject(new Error('pdf-lib loaded but PDFDocument not found at ' + src));
      };
      script.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(script);
    });
  }

  const PRIMARY  = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
  const FALLBACK = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';

  return tryLoad(PRIMARY).catch(() => tryLoad(FALLBACK)).catch(() => {
    throw new Error('Could not load the PDF library. Check your internet connection and try again.');
  });
}

/**
 * Parse a page range string into a sorted, deduplicated array of 1-based page numbers.
 * Supports: "45-52", "45, 46, 47", "45-52, 60, 62-65"
 */
function parsePageRange(str) {
  const pages = new Set();
  const parts = str.split(/[,;]+/);

  for (const part of parts) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end   = parseInt(rangeMatch[2], 10);
      if (start <= end) {
        for (let i = start; i <= end; i++) pages.add(i);
      }
    } else if (/^\d+$/.test(trimmed)) {
      pages.add(parseInt(trimmed, 10));
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

// ── Cache Clear ──────────────────────────────────────────────
function clearCacheAndReload() {
  if ('caches' in window) {
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => window.location.reload(true));
  } else {
    window.location.reload(true);
  }
}

document.getElementById('clearCacheBtn').addEventListener('click', clearCacheAndReload);
document.getElementById('clearCacheBtnMobile').addEventListener('click', clearCacheAndReload);
