// HomeTab — morning summary dashboard with brand header.
// Header provides dark mode toggle + sign-out on mobile.
// Header is hidden on desktop (sidebar provides branding).
import { useAuth, signOut } from '@homeschool/shared';
import logo from '@homeschool/shared/assets/logo.png';
import { useDarkMode } from '../hooks/useDarkMode.js';
import { useHomeSummary } from '../hooks/useHomeSummary.js';
import './HomeTab.css';

const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function cashValue(pts) {
  return (Math.floor(pts / 15 * 100) / 100).toFixed(2);
}

export default function HomeTab({ onTabChange }) {
  const { user } = useAuth();
  const { mode, toggle } = useDarkMode();
  const { students, activeStudent, setActiveStudent, subjects, points } = useHomeSummary(user?.uid);

  const today      = new Date();
  const dateLabel  = `${DAY_NAMES[today.getDay()]}, ${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;
  const subjectKeys  = Object.keys(subjects).filter(s => s !== 'allday');
  const totalLessons = subjectKeys.length;
  const doneLessons  = subjectKeys.filter(s => subjects[s].done).length;

  return (
    <div className="home-tab">
      <header className="home-header">
        <div className="home-header-brand">
          <img src={logo} alt="ILA" className="home-header-logo" />
          <div className="home-header-name">
            IRON & <span className="home-header-accent">LIGHT</span>
            <br />JOHNSON ACADEMY
          </div>
        </div>
        <div className="home-header-actions">
          <button className="home-header-btn" onClick={toggle} aria-label="Toggle dark mode">
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="home-header-btn" onClick={signOut} aria-label="Sign out">
            🚪
          </button>
        </div>
      </header>
      <div className="home-content">

        <div className="home-date-row">
          <span className="home-date">{dateLabel}</span>
          <span className="home-greeting">Good morning</span>
        </div>

        {students.length > 1 && (
          <div className="home-student-row">
            {students.map(s => (
              <button
                key={s}
                className={`home-student-pill${s === activeStudent ? ' home-student-pill--active' : ''}`}
                onClick={() => setActiveStudent(s)}
              >{s}</button>
            ))}
          </div>
        )}

        <div className="home-summary-row">
          <div className="home-summary-card">
            <div className="home-summary-label">Today's Lessons</div>
            <div className="home-summary-value">{doneLessons}/{totalLessons}</div>
            <div className="home-summary-sub">
              {totalLessons === 0 ? 'No lessons' : `${totalLessons - doneLessons} left`}
            </div>
          </div>
          {['Orion', 'Malachi'].map(name => (
            <div key={name} className="home-summary-card">
              <div className="home-summary-label">{name}</div>
              <div className="home-summary-value">
                {points[name] !== null ? points[name] : '…'}
              </div>
              <div className="home-summary-sub">
                {points[name] !== null ? `$${cashValue(points[name])}` : 'pts'}
              </div>
            </div>
          ))}
        </div>

        {totalLessons > 0 && (
          <div className="home-section">
            <p className="home-section-label">Today — {activeStudent}</p>
            <div className="home-lesson-list">
              {subjectKeys.map(subject => (
                <button key={subject} className="home-lesson-row" onClick={() => onTabChange('planner')}>
                  <span className={`home-lesson-dot${subjects[subject].done ? ' home-lesson-dot--done' : ''}`} />
                  <div className="home-lesson-body">
                    <span className="home-lesson-subject">{subject}</span>
                    {subjects[subject].lesson && (
                      <span className="home-lesson-text">{subjects[subject].lesson}</span>
                    )}
                  </div>
                  <span className="home-lesson-chevron">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="home-actions">
          <button className="home-action-btn home-action-btn--primary" onClick={() => onTabChange('planner')}>
            📅 Open Planner
          </button>
          <button className="home-action-btn home-action-btn--ghost" onClick={() => onTabChange('rewards')}>
            🏅 Award Points
          </button>
        </div>

      </div>
    </div>
  );
}
