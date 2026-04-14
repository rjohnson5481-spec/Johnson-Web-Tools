import logo from '@homeschool/shared/assets/logo.png';
import './RewardHeader.css';

// Props: onBack (fn | null), mode ('light'|'dark'), onToggleDark (fn)
export default function RewardHeader({ onBack, mode, onToggleDark }) {
  return (
    <header className="rh-header">
      <div className="rh-top">
        {onBack ? (
          <button className="rh-back-btn" onClick={onBack} aria-label="Back">←</button>
        ) : (
          <div className="rh-back-spacer" />
        )}

        <div className="rh-brand">
          <img src={logo} alt="ILA" className="rh-logo" />
          <div className="rh-school">
            <span className="rh-school-line1">
              IRON &amp; <span className="rh-school-accent">LIGHT</span>
            </span>
            <span className="rh-school-line2">JOHNSON ACADEMY</span>
            <span className="rh-school-tagline">Faith · Knowledge · Strength</span>
            <span className="rh-school-version">v0.21.2</span>
          </div>
        </div>

        <button
          className="rh-mode-btn"
          onClick={onToggleDark}
          aria-label="Toggle dark mode"
        >
          {mode === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
