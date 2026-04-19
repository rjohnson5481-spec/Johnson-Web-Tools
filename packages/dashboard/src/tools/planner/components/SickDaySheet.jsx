import { useState, useEffect } from 'react';
import { DAY_NAMES, DAY_SHORT } from '../constants/days.js';
import './SickDaySheet.css';

function extractDayNum(lesson) {
  const m = String(lesson ?? '').match(/Day\s+(\d+)/i);
  return m ? `Day ${m[1]}` : null;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function useIsDesktop() {
  const [d, setD] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const h = e => setD(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return d;
}

// Props:
//   subjects   — string[] — subjects present on the sick day
//   dayData    — { [subject]: { lesson, note, done, flag } } — sick day data
//   dayName    — string — e.g. "Tuesday"
//   day        — 0–4 — sick day index from parent
//   weekDates  — Date[] — Mon–Fri dates for this week
//   loadWeekDataFrom(fromDay) — async fn returning { [dayIndex]: { [subject]: cellData } }
//   onConfirm(selectedSubjects, activeDay) — called with subjects + the day picked in the sheet
//   onClose
export default function SickDaySheet({
  subjects, dayData, dayName, day,
  weekDates, loadWeekDataFrom,
  onConfirm, onClose,
}) {
  const isDesktop = useIsDesktop();
  const [activeDay, setActiveDay]     = useState(day);
  const [allDaysData, setAllDaysData] = useState({ [day]: dayData });
  const [selected, setSelected]       = useState(new Set(subjects));
  const [loading, setLoading]         = useState(isDesktop || day < 4);

  useEffect(() => {
    // Mobile-Friday case: cascade preview is empty, no extra fetch needed.
    if (!isDesktop && day >= 4) return;
    loadWeekDataFrom(0).then(data => {
      setAllDaysData({ ...data, [day]: dayData });
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(subject) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject); else next.add(subject);
      return next;
    });
  }

  function pickDay(d) {
    setActiveDay(d);
    const subjs = Object.keys(allDaysData[d] ?? {}).filter(s => s !== 'allday');
    setSelected(new Set(subjs));
  }

  // Desktop: show only the picked day. Mobile: keep cascade preview (sick day + D+1..4).
  const displayDays = isDesktop
    ? [{ dayIndex: activeDay, dayData: allDaysData[activeDay] ?? {} }]
    : (day === 4
        ? [{ dayIndex: day, dayData: dayData }]
        : [
            { dayIndex: day, dayData: dayData },
            ...Array.from({ length: 4 - day }, (_, i) => ({
              dayIndex: day + 1 + i,
              dayData: allDaysData[day + 1 + i] ?? {},
            })),
          ]);

  const titleDayName      = isDesktop ? DAY_NAMES[activeDay] : dayName;
  const showFridayWarning = !isDesktop && day < 4 && selected.size > 0;

  return (
    <div className="sick-day-overlay" onClick={onClose}>
      <div className="sick-day-sheet" onClick={e => e.stopPropagation()}>
        <div className="sick-day-handle" />

        <div className="sick-day-header">
          <span className="sick-day-title">Sick Day — {titleDayName}</span>
          <button className="sick-day-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sick-day-pills">
          {[0, 1, 2, 3, 4].map(d => (
            <button
              key={d}
              className={`sick-day-pill${d === activeDay ? ' sick-day-pill--active' : ''}`}
              onClick={() => pickDay(d)}
            >
              {DAY_SHORT[d]}
            </button>
          ))}
        </div>

        <div className="sick-day-list">
          {loading ? (
            <div className="sick-day-loading">Loading week…</div>
          ) : (
            displayDays.map(({ dayIndex, dayData: dData }) => {
              const subjectPool = isDesktop
                ? Object.keys(dData).filter(s => s !== 'allday')
                : subjects;
              const daySubjects = subjectPool.filter(s => dData[s]);
              if (daySubjects.length === 0) return null;
              return (
                <div key={dayIndex} className="sick-day-group">
                  <div className="sick-day-group-header">
                    {DAY_SHORT[dayIndex]} · {formatDate(weekDates[dayIndex])}
                    {dayIndex === day && (
                      <span className="sick-day-group-tag">sick day</span>
                    )}
                  </div>
                  {daySubjects.map(subject => {
                    const checked  = selected.has(subject);
                    const lessonLbl = extractDayNum(dData[subject]?.lesson);
                    return (
                      <button
                        key={subject}
                        className={`sick-day-item${checked ? ' sick-day-item--checked' : ''}`}
                        onClick={() => toggle(subject)}
                      >
                        <span className="sick-day-check">{checked ? '✓' : ''}</span>
                        <span className="sick-day-subject">{subject}</span>
                        {lessonLbl && (
                          <span className="sick-day-lesson">{lessonLbl}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {showFridayWarning && (
          <p className="sick-day-friday-warning">
            Friday lessons for selected subjects will be removed.
          </p>
        )}

        <div className="sick-day-footer">
          <button className="sick-day-cancel" onClick={onClose}>Cancel</button>
          <button
            className="sick-day-confirm"
            onClick={() => onConfirm([...selected], activeDay)}
            disabled={selected.size === 0}
          >
            Shift selected lessons
          </button>
        </div>
      </div>
    </div>
  );
}
