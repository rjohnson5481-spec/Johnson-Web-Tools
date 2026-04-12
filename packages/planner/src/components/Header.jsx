import logo from '@homeschool/shared/assets/logo.png';
import { signOut } from '@homeschool/shared';
import { formatWeekLabel } from '../constants/days.js';
import { version } from '../../package.json';
import './Header.css';

// Props: students, student, onStudentChange, weekDates, prevWeek, nextWeek, onUpload, onCalendar, onSettings
export default function Header({
  students,
  student, onStudentChange,
  weekDates, prevWeek, nextWeek,
  onUpload, onCalendar, onSettings,
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
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 10.5V3.5M4.5 6.5l3-3 3 3M2.5 13.5h10"/>
            </svg>
          </button>
          <button className="header-btn" onClick={onSettings} aria-label="Settings" title="Settings">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.5" cy="7.5" r="2"/><path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3.3 3.3l1.4 1.4M10.3 10.3l1.4 1.4M10.3 4.7l-1.4 1.4M4.7 10.3l-1.4 1.4"/>
            </svg>
          </button>
          <button className="header-btn" onClick={() => signOut()} aria-label="Sign out" title="Sign out">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 4.5l3 3-3 3M13 7.5H6M8 2.5H3v10h5"/>
            </svg>
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
