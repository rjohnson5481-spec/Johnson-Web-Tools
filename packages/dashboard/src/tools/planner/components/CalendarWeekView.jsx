import { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, PointerSensor, pointerWithin, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
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
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id, disabled });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id, disabled });
  const setRef = node => { setDragRef(node); setDropRef(node); };
  return (
    <div ref={setRef} {...listeners} {...attributes}
      style={isDragging ? { opacity: 0.4 } : isOver && !isDragging ? { outline: '1px solid rgba(201,168,76,0.3)', outlineOffset: -1, borderRadius: 8 } : undefined}
    >{children}</div>
  );
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
    const parsed = parseDragId(key);
    if (!parsed) continue;
    const cell = out[parsed.day]?.[parsed.subject];
    if (cell) { delete out[parsed.day][parsed.subject]; out[toDi] = { ...out[toDi], [parsed.subject]: cell }; }
  }
  return out;
}

function getOrderedSubjects(daySubjects, dayOrder) {
  const subjects = Object.keys(daySubjects).filter(s => s !== 'allday');
  if (!dayOrder) return subjects;
  const ordered = dayOrder.filter(s => subjects.includes(s));
  const remaining = subjects.filter(s => !dayOrder.includes(s));
  return [...ordered, ...remaining];
}

export default function CalendarWeekView({
  weekDates, prevWeek, nextWeek, jumpToToday,
  loadWeekDataFrom, student, weekId,
  onEditCell, onAddSubject, onMoveCell, onToggleDone,
}) {
  const [weekData, setWeekData] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [optimistic, setOptimistic] = useState({});
  const [dayOrder, setDayOrder] = useState({});
  const [errorKeys, setErrorKeys] = useState(new Set());
  const errorTimers = useRef({});
  const today = todayDateStr();

  const reload = useCallback(() => {
    let cancelled = false;
    loadWeekDataFrom(0).then(data => { if (!cancelled) setWeekData(data); });
    return () => { cancelled = true; };
  }, [loadWeekDataFrom]);

  useEffect(() => reload(), [reload, weekId, student]);
  useEffect(() => { setOptimistic({}); setDayOrder({}); }, [weekId, student]);

  async function handleToggleDone(dayIndex, subject) {
    await onToggleDone(dayIndex, subject);
    reload();
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const rendered = mergeOptimistic(weekData, optimistic);

  async function handleDragEnd(event) {
    const { active, over } = event;
    try {
      if (!over || !active) return;
      const src = parseDragId(active.id);
      if (!src) return;
      const overCard = parseDragId(over.id);
      const toDi = overCard ? overCard.day : parseDropId(over.id);
      if (toDi == null) return;

      if (src.day === toDi) {
        const overSubject = overCard?.subject;
        setDayOrder(prev => {
          const subjects = getOrderedSubjects(rendered[toDi] ?? {}, prev[toDi]);
          const fromIdx = subjects.indexOf(src.subject);
          if (fromIdx < 0) return prev;
          const without = subjects.filter(s => s !== src.subject);
          const targetIdx = overSubject ? without.indexOf(overSubject) : without.length;
          const reordered = [...without];
          reordered.splice(targetIdx < 0 ? reordered.length : targetIdx, 0, src.subject);
          return { ...prev, [toDi]: reordered };
        });
        return;
      }

      const moveKey = dragId(src.day, src.subject);
      setOptimistic(prev => ({ ...prev, [moveKey]: toDi }));
      setDayOrder(prev => {
        const n = { ...prev };
        if (n[src.day]) n[src.day] = n[src.day].filter(s => s !== src.subject);
        return n;
      });
      try {
        await onMoveCell(src.day, src.subject, toDi);
      } catch {
        setErrorKeys(prev => { const s = new Set(prev); s.add(moveKey); return s; });
        clearTimeout(errorTimers.current[moveKey]);
        errorTimers.current[moveKey] = setTimeout(() => setErrorKeys(prev => { const s = new Set(prev); s.delete(moveKey); return s; }), 2000);
      }
      setOptimistic(prev => { const n = { ...prev }; delete n[moveKey]; return n; });
      reload();
    } finally {
      setActiveId(null);
    }
  }

  return (
    <div className="cwv-wrap">
      <div className="cwv-topbar">
        <div className="cwv-nav">
          <button className="cwv-today-btn" onClick={jumpToToday}>Today</button>
          <button className="cwv-chevron" onClick={prevWeek} aria-label="Previous week">‹</button>
          <button className="cwv-chevron" onClick={nextWeek} aria-label="Next week">›</button>
          <span className="cwv-week-label">{formatWeekLabel(weekDates)}</span>
        </div>
        <button className="cwv-add-btn" onClick={() => onAddSubject(0)}>+ Add Lesson</button>
      </div>
      <DndContext key={weekId} sensors={sensors} collisionDetection={pointerWithin} onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
        <div className="cwv-grid">
          {[0, 1, 2, 3, 4].map(di => {
            const date = weekDates[di];
            const daySubjects = rendered[di] ?? {};
            const orderedSubjects = getOrderedSubjects(daySubjects, dayOrder[di]);
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
                  {orderedSubjects.map(subject => {
                    const cell = daySubjects[subject] ?? {};
                    const isDone = !!cell.done;
                    const key = dragId(di, subject);
                    const isErr = errorKeys.has(key);
                    return (
                      <DraggableCard key={key} id={key} disabled={isDone}>
                        <div
                          className={`cwv-card${isDone ? ' done' : ''}${isErr ? ' error' : ''}`}
                          onClick={() => onEditCell(subject, di)}
                        >
                          <div className="cwv-card-top">
                            <span className="cwv-dot" style={{ background: subjectColor(subject) }} />
                            <span className="cwv-subject">{subject}</span>
                            <span
                              className={`cwv-status${isDone ? ' done' : ' undone'}`}
                              onClick={e => { e.stopPropagation(); handleToggleDone(di, subject); }}
                              role="button"
                              aria-label={isDone ? 'Mark not done' : 'Mark done'}
                            >{isDone ? '✓' : ''}</span>
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
