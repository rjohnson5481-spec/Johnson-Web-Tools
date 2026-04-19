import { useEffect, useMemo, useState } from 'react';
import { applyRestoreDiff } from './backup.js';
import { DAY_NAMES, getWeekDates } from '../tools/planner/constants/days.js';
import RestoreDiffCalendar from './RestoreDiffCalendar.jsx';
import './RestoreDiffSheet.css';

function useIsDesktop() {
  const query = '(min-width: 1024px)';
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [isDesktop, setIsDesktop] = useState(get);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

function formatDate(d) {
  return d?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function itemKey(weekId, dayIndex, it) {
  return `${weekId}|${dayIndex}|${it.student}|${it.subject}`;
}

// Renders the per-subject row body (lesson text + tag). MATCH + DELETE read
// from current Firestore data; NEW from backup; CHANGED shows both.
function RowLines({ status, backup, current }) {
  if (status === 'NEW') return (
    <div className="rds-line">
      <span className="rds-text">{backup?.lesson || '(blank)'}</span>
      <span className="rds-tag rds-tag--green">new</span>
    </div>
  );
  if (status === 'CHANGED') return (
    <>
      <div className="rds-line">
        <span className="rds-text">{backup?.lesson || '(blank)'}</span>
        <span className="rds-tag rds-tag--gold">backup</span>
      </div>
      <div className="rds-line">
        <span className="rds-text rds-text--muted">{current?.lesson || '(blank)'}</span>
        <span className="rds-tag rds-tag--grey">current</span>
      </div>
    </>
  );
  if (status === 'MATCH') return (
    <div className="rds-line">
      <span className="rds-text">{backup?.lesson || '(blank)'}</span>
      <span className="rds-tag rds-tag--grey">match</span>
    </div>
  );
  return (
    <div className="rds-line">
      <span className="rds-text">{current?.lesson || '(blank)'}</span>
      <span className="rds-tag rds-tag--red">will delete</span>
    </div>
  );
}

// Props:
//   uid      — string
//   filename — string, displayed in header
//   diff     — nested { [weekId]: { [dayIndex]: [items] } } from generateRestoreDiff
//   onClose  — close the sheet
export default function RestoreDiffSheet({ uid, filename, diff, onClose }) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return <RestoreDiffCalendar uid={uid} filename={filename} diff={diff} onClose={onClose} />;
  }
  return <RestoreDiffSheetMobile uid={uid} filename={filename} diff={diff} onClose={onClose} />;
}

function RestoreDiffSheetMobile({ uid, filename, diff, onClose }) {
  const [busy, setBusy] = useState(false);

  // Flatten diff into chronologically-sorted day entries; also count totals.
  // All days are shown (including MATCH-only days) so the user can verify
  // the restore covers what they expect — days with no conflicts collapse
  // by default and surface an "All matched" badge instead of a count.
  const { visibleDays, weekCount, totalConflicts, daysUnchanged } = useMemo(() => {
    const all = [];
    const weeks = new Set();
    for (const weekId of Object.keys(diff).sort()) {
      weeks.add(weekId);
      const days = diff[weekId];
      for (const diStr of Object.keys(days).sort((a, b) => Number(a) - Number(b))) {
        const dayIndex = Number(diStr);
        const items = days[diStr];
        const conflicts = items.filter(i => i.status !== 'MATCH').length;
        all.push({ weekId, dayIndex, items, conflicts });
      }
    }
    return {
      visibleDays: all,
      weekCount: weeks.size,
      totalConflicts: all.reduce((n, d) => n + d.conflicts, 0),
      daysUnchanged: all.filter(d => d.conflicts === 0).length,
    };
  }, [diff]);

  const [checked, setChecked] = useState(() => {
    const m = {};
    for (const { weekId, dayIndex, items } of visibleDays) {
      for (const it of items) m[itemKey(weekId, dayIndex, it)] = it.checked;
    }
    return m;
  });

  const [expanded, setExpanded] = useState(() => {
    const m = {};
    for (const { weekId, dayIndex, conflicts } of visibleDays) {
      m[`${weekId}|${dayIndex}`] = conflicts > 0;
    }
    return m;
  });

  function toggleItem(key) {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleDay(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleRestore() {
    const out = {};
    for (const [weekId, days] of Object.entries(diff)) {
      out[weekId] = {};
      for (const [diStr, items] of Object.entries(days)) {
        out[weekId][diStr] = items.map(it => ({
          ...it,
          checked: checked[itemKey(weekId, Number(diStr), it)] ?? false,
        }));
      }
    }
    setBusy(true);
    try { await applyRestoreDiff(uid, out); onClose(); }
    catch (err) { console.warn('Restore failed', err); setBusy(false); }
  }

  const conflictLabel = `${totalConflicts} conflict${totalConflicts === 1 ? '' : 's'}`;
  const unchangedLabel = `${daysUnchanged} day${daysUnchanged === 1 ? '' : 's'} unchanged`;

  return (
    <div className="rds-overlay" onClick={onClose}>
      <div className="rds-sheet" onClick={e => e.stopPropagation()}>
        <div className="rds-header">
          <button className="rds-close" onClick={onClose} aria-label="Close">✕</button>
          <div className="rds-header-title">{filename}</div>
          <div className="rds-header-summary">{conflictLabel} · {unchangedLabel} · tap a day to review</div>
        </div>

        {weekCount > 1 && (
          <div className="rds-warning">
            This restore affects {weekCount} weeks. For the best experience review and restore on a desktop.
          </div>
        )}

        <div className="rds-body">
          {visibleDays.map(({ weekId, dayIndex, items, conflicts }) => {
            const dayKey = `${weekId}|${dayIndex}`;
            const isOpen = !!expanded[dayKey];
            const date = getWeekDates(weekId)[dayIndex];
            return (
              <div key={dayKey} className="rds-day">
                <button className="rds-day-header" onClick={() => toggleDay(dayKey)}>
                  <div className="rds-day-title">{DAY_NAMES[dayIndex]} · {formatDate(date)}</div>
                  <div className="rds-day-meta">
                    <span className="rds-day-count">{items.length} subject{items.length === 1 ? '' : 's'}</span>
                    {conflicts > 0
                      ? <span className="rds-badge rds-badge--gold">{conflicts} conflict{conflicts === 1 ? '' : 's'}</span>
                      : <span className="rds-badge rds-badge--green">All matched</span>}
                    <span className="rds-chev">{isOpen ? '▾' : '▸'}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="rds-day-body">
                    {items.map(it => {
                      const key = itemKey(weekId, dayIndex, it);
                      const isChecked = !!checked[key];
                      return (
                        <div key={key} className={`rds-row rds-row--${it.status.toLowerCase()}`}>
                          {it.status === 'MATCH' ? (
                            <span className="rds-check-ph" />
                          ) : (
                            <button className={`rds-check${isChecked ? ' rds-check--on' : ''}`}
                              onClick={() => toggleItem(key)}
                              aria-label={`${isChecked ? 'Uncheck' : 'Check'} ${it.subject}`}>
                              {isChecked ? '✓' : ''}
                            </button>
                          )}
                          <div className="rds-row-body">
                            <div className="rds-row-head">
                              <span className="rds-subject">{it.subject}</span>
                              <span className="rds-student">{it.student}</span>
                            </div>
                            <RowLines status={it.status} backup={it.backup} current={it.current} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rds-footer">
          <button className="rds-btn rds-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="rds-btn rds-btn--gold" onClick={handleRestore} disabled={busy}>
            {busy ? 'Restoring...' : 'Restore Selected'}
          </button>
        </div>
      </div>
    </div>
  );
}
