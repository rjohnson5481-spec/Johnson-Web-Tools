import { DAY_SHORT } from '../constants/days.js';
import './DayStrip.css';

// Returns true if `date` is today's calendar date.
function isToday(date) {
  const t = new Date();
  return date.getFullYear() === t.getFullYear() &&
         date.getMonth()    === t.getMonth()    &&
         date.getDate()     === t.getDate();
}

// Props: dates (array of 5 Date objects Mon-Fri), selected (0-4), onSelect,
//        sickDayIndices (Set of day indices that are sick days for current student)
export default function DayStrip({ dates, selected, onSelect, sickDayIndices = new Set() }) {
  return (
    <nav className="day-strip" role="tablist" aria-label="Day selector">
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
            <span className="day-strip-date">{date.getDate()}</span>
          </button>
        );
      })}
    </nav>
  );
}
