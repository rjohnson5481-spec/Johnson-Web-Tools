import { DAY_SHORT, DAY_NAMES } from '../constants/days.js';
import './DayStrip.css';

// Returns true if `date` is today's calendar date.
function isToday(date) {
  const t = new Date();
  return date.getFullYear() === t.getFullYear() &&
         date.getMonth()    === t.getMonth()    &&
         date.getDate()     === t.getDate();
}

// Props: dates (array of 5 Date objects Mon-Fri), selected (0-4), onSelect,
//        sickDayIndices (Set of day indices), students (string[], desktop only),
//        student (string, desktop only), onStudentChange (fn, desktop only)
export default function DayStrip({
  dates, selected, onSelect, sickDayIndices = new Set(),
  students = [], student, onStudentChange,
}) {
  return (
    <nav className="day-strip" role="tablist" aria-label="Day selector">
      {/* Student pills — rendered in DOM always, shown only at desktop via CSS */}
      {students.length > 0 && (
        <div className="day-strip-students">
          {students.map(name => (
            <button
              key={name}
              className={`day-strip-student-btn${student === name ? ' day-strip-student-btn--active' : ''}`}
              onClick={() => onStudentChange?.(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {dates.map((date, i) => {
        const active = selected === i;
        const today  = isToday(date);
        const sick   = sickDayIndices.has(i);
        const cls = [
          'day-strip-tab',
          active ? 'day-strip-tab--active' : '',
          today  ? 'day-strip-tab--today'  : '',
          sick   ? 'day-strip-tab--sick'   : '',
        ].filter(Boolean).join(' ');
        return (
          <button
            key={i}
            role="tab"
            aria-selected={active}
            className={cls}
            onClick={() => onSelect(i)}
          >
            <span className="day-strip-name">{DAY_SHORT[i]}</span>
            {/* Full name shown only on desktop sidebar */}
            <span className="day-strip-full-name">{DAY_NAMES[i]}</span>
            <span className="day-strip-date">{date.getDate()}</span>
          </button>
        );
      })}
    </nav>
  );
}
