import { signOut } from '@homeschool/shared';
import logo from '@homeschool/shared/assets/logo.png';
import pkg from '../../package.json';
import './BottomNav.css';

const TABS = [
  { id: 'home',     icon: '🏠', label: 'Home' },
  { id: 'planner',  icon: '📅', label: 'Planner' },
  { id: 'rewards',  icon: '🏅', label: 'Rewards' },
  { id: 'te',       icon: '📄', label: 'TE Extractor', external: '/te-extractor/' },
  { id: 'academic', icon: '🎓', label: 'Records' },
];

// Props: activeTab (string), onTabChange (fn),
//        students (string[]), activeStudent (string), onStudentChange (fn).
// The student section renders only when activeTab === 'planner' and only
// on desktop (hidden on mobile via CSS).
export default function BottomNav({
  activeTab, onTabChange,
  students, activeStudent, onStudentChange,
}) {
  const showStudents = activeTab === 'planner' && (students?.length ?? 0) > 0;

  return (
    <nav className="bottom-nav">

      {/* Desktop-only brand section */}
      <div className="bn-brand">
        <img src={logo} alt="ILA" className="bn-brand-logo" />
        <div className="bn-brand-text">
          <div className="bn-brand-name">
            IRON & <span className="bn-brand-accent">LIGHT</span>
          </div>
          <div className="bn-brand-academy">JOHNSON ACADEMY</div>
          <div className="bn-brand-tagline">Faith · Knowledge · Strength</div>
        </div>
      </div>

      {/* Tab buttons — horizontal on mobile, vertical on desktop */}
      <div className="bn-tabs">
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          function handleClick() {
            if (tab.external) {
              window.location.href = tab.external;
            } else {
              onTabChange(tab.id);
            }
          }
          return (
            <button
              key={tab.id}
              className={`bn-tab${isActive ? ' bn-tab--active' : ''}`}
              onClick={handleClick}
              aria-label={tab.label}
            >
              <span className="bn-icon">{tab.icon}</span>
              <span className="bn-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop-only student selector — only when Planner tab is active */}
      {showStudents && (
        <div className="bn-students">
          <div className="bn-students-label">Student</div>
          {students.map(name => (
            <button
              key={name}
              className={`bn-student-btn${name === activeStudent ? ' bn-student-btn--active' : ''}`}
              onClick={() => onStudentChange(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Desktop-only footer with sign-out + version */}
      <div className="bn-footer">
        <button className="bn-signout" onClick={() => signOut()}>
          🚪 Sign out
        </button>
        <div className="bn-version">v{pkg.version}</div>
      </div>

    </nav>
  );
}
