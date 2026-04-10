import { signOut } from '@homeschool/shared';
import { formatWeekLabel } from '../constants/days.js';
import './Header.css';

const STUDENTS = ['Orion', 'Malachi'];

// Props: student, onStudentChange, weekDates, prevWeek, nextWeek, onUpload
// signOut is called directly from shared — no prop needed.
export default function Header({
  student, onStudentChange,
  weekDates, prevWeek, nextWeek,
  onUpload,
}) {
  return (
    <header className="header">

      {/* Row 1 — logo · week navigation · action buttons */}
      <div className="header-top">
        <div className="header-logo" aria-hidden="true">ILA</div>

        <nav className="header-week" aria-label="Week navigation">
          <button className="header-nav-btn" onClick={prevWeek} aria-label="Previous week">
            ‹
          </button>
          <span className="header-week-label">{formatWeekLabel(weekDates)}</span>
          <button className="header-nav-btn" onClick={nextWeek} aria-label="Next week">
            ›
          </button>
        </nav>

        <div className="header-actions">
          <button className="header-btn" onClick={onUpload}>Import</button>
          <button className="header-btn" onClick={() => signOut()}>Sign out</button>
        </div>
      </div>

      {/* Row 2 — student selector */}
      <div className="header-students">
        {STUDENTS.map(name => (
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
