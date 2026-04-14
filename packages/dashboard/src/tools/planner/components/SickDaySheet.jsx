import { useState, useEffect } from 'react';
import { DAY_SHORT } from '../constants/days.js';
import './SickDaySheet.css';

function extractDayNum(lesson) {
  const m = String(lesson ?? '').match(/Day\s+(\d+)/i);
  return m ? `Day ${m[1]}` : null;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Props:
//   subjects   — string[] — subjects present on the sick day
//   dayData    — { [subject]: { lesson, note, done, flag } } — sick day data
//   dayName    — string — e.g. "Tuesday"
//   day        — 0–4 — sick day index
//   weekDates  — Date[] — Mon–Fri dates for this week
//   loadWeekDataFrom(fromDay) — async fn returning { [dayIndex]: { [subject]: cellData } }
//   onConfirm(selectedSubjects) — called with array of subjects to cascade
//   onClose
export default function SickDaySheet({
  subjects, dayData, dayName, day,
  weekDates, loadWeekDataFrom,
  onConfirm, onClose,
}) {
  const [selected, setSelected]       = useState(new Set(subjects));
  const [remainingData, setRemaining] = useState({});
  const [loading, setLoading]         = useState(day < 4);

  useEffect(() => {
    if (day >= 4) return;
    loadWeekDataFrom(day + 1).then(data => {
      setRemaining(data);
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

  // Build list of days to display: sick day (D) + remaining (D+1..4)
  // For Friday, only show the sick day itself (no remaining days).
  const displayDays = day === 4
    ? [{ dayIndex: day, dayData: dayData }]
    : [
        { dayIndex: day, dayData: dayData },
        ...Array.from({ length: 4 - day }, (_, i) => ({
          dayIndex: day + 1 + i,
          dayData: remainingData[day + 1 + i] ?? {},
        })),
      ];

  const showFridayWarning = day < 4 && selected.size > 0;

  return (
    <div className="sick-day-overlay" onClick={onClose}>
      <div className="sick-day-sheet" onClick={e => e.stopPropagation()}>
        <div className="sick-day-handle" />

        <div className="sick-day-header">
          <span className="sick-day-title">Sick Day — {dayName}</span>
          <button className="sick-day-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sick-day-list">
          {loading ? (
            <div className="sick-day-loading">Loading week…</div>
          ) : (
            displayDays.map(({ dayIndex, dayData: dData }) => {
              const daySubjects = subjects.filter(s => dData[s]);
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
            onClick={() => onConfirm([...selected])}
            disabled={selected.size === 0}
          >
            Shift selected lessons
          </button>
        </div>
      </div>
    </div>
  );
}
