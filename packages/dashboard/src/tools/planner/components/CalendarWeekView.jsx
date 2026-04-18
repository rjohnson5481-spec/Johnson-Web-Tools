import { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { formatWeekLabel } from '../constants/days.js';
import './CalendarWeekView.css';

const DAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const PALETTE = ['#5b8dd9','#4caf7d','#7c6fcd','#e09c3a','#c9584c','#3ab8c4','#d4607a','#7da84a'];

function subjectColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function todayDateStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}
function dateStr(d) { return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : ''; }

function dragId(di, subject) { return `card-${di}-${subject}`; }
function dropId(di) { return `col-${di}`; }
function parseDragId(id) { const m = id.match(/^card-(\d)-(.+)$/); return m ? { day: Number(m[1]), subject: m[2] } : null; }
function parseDropId(id) { const m = id.match(/^col-(\d)$/); return m ? Number(m[1]) : null; }

function DraggableCard({ id, children, disabled }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled });
  return <div ref={setNodeRef} {...listeners} {...attributes} style={isDragging ? { opacity: 0.4 } : undefined}>{children}</div>;
}
function DroppableCol({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className="cwv-col-body" style={isOver ? { outline: '1px solid rgba(201,168,76,0.4)', outlineOffset: -1 } : undefined}>{children}</div>;
}

function mergeOptimistic(weekData, moves) {
  if (!Object.keys(moves).length) return weekData;
  const out = {};
  for (let di = 0; di < 5; di++) out[di] = { ...(weekData[di] ?? {}) };
  for (const [key, toDi] of Object.entries(moves)) {
    const { day: fromDi, subject } = parseDragId(key) ?? {};
    if (subject == null) continue;
    const cell = out[fromDi]?.[subject];
    if (cell) { delete out[fromDi][subject]; out[toDi] = { ...out[toDi], [subject]: cell }; }
  }
  return out;
}

export default function CalendarWeekView({
  weekDates, prevWeek, nextWeek, jumpToToday,
  loadWeekDataFrom, student, weekId,
  onEditCell, onAddSubject, onMoveCell,
}) {
  const [weekData, setWeekData] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [activeId, setActiveId] = useState(null);
  const [optimistic, setOptimistic] = useState({});
  const [errorKeys, setErrorKeys] = useState(new Set());
  const errorTimers = useRef({});
  const today = todayDateStr();

  const reload = useCallback(() => {
    let cancelled = false;
    loadWeekDataFrom(0).then(data => { if (!cancelled) setWeekData(data); });
    return () => { cancelled = true; };
  }, [loadWeekDataFrom]);

  useEffect(() => reload(), [reload, weekId, student]);
  useEffect(() => { setSelected(new Set()); setOptimistic({}); }, [weekId, student]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const rendered = mergeOptimistic(weekData, optimistic);

  function toggleSelect(di, subject, isDone) {
    if (isDone) return;
    const key = dragId(di, subject);
    setSelected(prev => { const s = new Set(prev); if (s.has(key)) s.delete(key); else s.add(key); return s; });
  }
  function clearSelection() { setSelected(new Set()); }

  async function handleDragEnd(event) {
    const { active, over } = event;
    try {
      if (!over || !active) return;
      const src = parseDragId(active.id);
      const toDi = parseDropId(over.id);
      if (!src || toDi == null || src.day === toDi) return;
      const isSel = selected.has(active.id);
      const toMove = isSel && selected.size > 1
        ? [...selected].map(k => parseDragId(k)).filter(Boolean)
        : [src];
      const moveKeys = toMove.map(m => dragId(m.day, m.subject));
      setOptimistic(prev => { const n = { ...prev }; moveKeys.forEach(k => { n[k] = toDi; }); return n; });
      clearSelection();
      const results = await Promise.allSettled(toMove.map(m => onMoveCell(m.day, m.subject, toDi)));
      const failedKeys = [];
      results.forEach((r, i) => { if (r.status === 'rejected') failedKeys.push(moveKeys[i]); });
      setOptimistic(prev => { const n = { ...prev }; moveKeys.forEach(k => delete n[k]); return n; });
      if (failedKeys.length) {
        setErrorKeys(prev => { const s = new Set(prev); failedKeys.forEach(k => s.add(k)); return s; });
        failedKeys.forEach(k => {
          clearTimeout(errorTimers.current[k]);
          errorTimers.current[k] = setTimeout(() => setErrorKeys(prev => { const s = new Set(prev); s.delete(k); return s; }), 2000);
        });
      }
      reload();
    } finally {
      setActiveId(null);
    }
  }

  const selCount = selected.size;

  return (
    <div className="cwv-wrap">
      <div className="cwv-topbar">
        <div className="cwv-nav">
          <button className="cwv-today-btn" onClick={jumpToToday}>Today</button>
          <button className="cwv-chevron" onClick={prevWeek} aria-label="Previous week">‹</button>
          <button className="cwv-chevron" onClick={nextWeek} aria-label="Next week">›</button>
          <span className="cwv-week-label">{formatWeekLabel(weekDates)}</span>
          {selCount > 0 && (
            <span className="cwv-sel-pill">{selCount} selected · drag to move <button className="cwv-sel-clear" onClick={clearSelection}>✕</button></span>
          )}
        </div>
        <button className="cwv-add-btn" onClick={() => onAddSubject(0)}>+ Add Lesson</button>
      </div>
      <DndContext key={weekId} sensors={sensors} onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
        <div className="cwv-grid" onClick={e => { if (e.target === e.currentTarget || e.target.classList.contains('cwv-col-body')) clearSelection(); }}>
          {[0, 1, 2, 3, 4].map(di => {
            const date = weekDates[di];
            const daySubjects = rendered[di] ?? {};
            const subjectNames = Object.keys(daySubjects).filter(s => s !== 'allday');
            const allday = daySubjects['allday'] ?? null;
            const isToday = date && dateStr(date) === today;
            return (
              <div key={di} className="cwv-col">
                <div className="cwv-col-header">
                  <div className="cwv-day-name">{DAY_SHORT[di]}</div>
                  <div className={`cwv-day-num${isToday ? ' today' : ''}`}>{date?.getDate() ?? ''}</div>
                </div>
                <DroppableCol id={dropId(di)}>
                  {allday && (
                    <div className="cwv-allday" onClick={() => onEditCell('allday', di)}>
                      <div className="cwv-allday-tag">All Day</div>
                      <div className="cwv-allday-name">{allday.lesson || 'All Day Event'}</div>
                    </div>
                  )}
                  {subjectNames.map(subject => {
                    const cell = daySubjects[subject] ?? {};
                    const isDone = !!cell.done;
                    const key = dragId(di, subject);
                    const isSel = selected.has(key);
                    const isErr = errorKeys.has(key);
                    const isDragging = activeId && (activeId === key || (selected.has(activeId) && isSel));
                    return (
                      <DraggableCard key={key} id={key} disabled={isDone}>
                        <div
                          className={`cwv-card${isDone ? ' done' : ''}${isSel ? ' selected' : ''}${isErr ? ' error' : ''}`}
                          style={isDragging && activeId !== key ? { opacity: 0.4 } : undefined}
                          onClick={e => { e.stopPropagation(); if (!isDone) toggleSelect(di, subject, isDone); }}
                          onDoubleClick={e => { e.stopPropagation(); onEditCell(subject, di); }}
                        >
                          <div className="cwv-card-top">
                            {isSel ? <span className="cwv-sel-check">✓</span> : <span className="cwv-dot" style={{ background: subjectColor(subject) }} />}
                            <span className="cwv-subject">{subject}</span>
                            <span className={`cwv-status${isDone ? ' done' : ' undone'}`}>{isDone ? '✓' : ''}</span>
                          </div>
                          {cell.lesson && <div className="cwv-lesson">{cell.lesson}</div>}
                          {cell.note && <div className="cwv-note">{cell.note}</div>}
                        </div>
                      </DraggableCard>
                    );
                  })}
                  <button className="cwv-col-add" onClick={() => onAddSubject(di)}>+ add</button>
                </DroppableCol>
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
