import logo from '@homeschool/shared/assets/logo.png';
import { signOut } from '@homeschool/shared';
import { formatWeekLabel } from '../constants/days.js';
import { version } from '../../../../package.json';
import './Header.css';

// Props: students, student, onStudentChange, weekDates, prevWeek, nextWeek, onUpload, onCalendar
export default function Header({
  students,
  student, onStudentChange,
  weekDates, prevWeek, nextWeek,
  onUpload, onCalendar,
}) {
  return (
    <header className="header">

      {/* Row 1 — brand left, four action buttons right */}
      <div className="header-top">
        <div className="header-brand">
          <img src={logo} alt="ILA" className="header-logo" />
          <div className="header-school">
            <span className="header-school-line1">
              IRON &amp; <span className="header-school-accent">LIGHT</span>
            </span>
            <span className="header-school-line2">JOHNSON ACADEMY</span>
            <span className="header-school-tagline">Faith · Knowledge · Strength</span>
            <span className="header-school-version">v{version}</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="header-btn" onClick={onCalendar} aria-label="Open calendar" title="Calendar">
            📅
          </button>
          <button className="header-btn" onClick={onUpload} aria-label="Import schedule" title="Import schedule">
            ⬆️
          </button>
          <button className="header-btn" onClick={() => signOut()} aria-label="Sign out" title="Sign out">
            🚪
          </button>
        </div>
      </div>

      {/* Row 2 — week navigation, centered */}
      <nav className="header-week" aria-label="Week navigation">
        <button className="header-nav-btn" onClick={prevWeek} aria-label="Previous week">‹</button>
        <span className="header-week-label">{formatWeekLabel(weekDates)}</span>
        <button className="header-nav-btn" onClick={nextWeek} aria-label="Next week">›</button>
      </nav>

      {/* Row 3 — student selector */}
      <div className="header-students">
        {(students ?? []).map(name => (
          <button
            key={name}
            className={`header-student-btn${student === name ? ' header-student-btn--active' : ''}`}
            onClick={() => onStudentChange(name)}
          >
            {name}
          </button>
        ))}
      </div>

    </header>
  );
}
