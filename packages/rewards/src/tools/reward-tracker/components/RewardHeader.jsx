import logo from '@johnson-web-tools/shared/assets/logo.png';
import './RewardHeader.css';

// Props: onBack (fn | null)
// Dark-mode toggle was moved to the Settings tab; this header now only
// shows branding + an optional back button (LogPage).
export default function RewardHeader({ onBack }) {
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
          </div>
        </div>

        {/* Symmetry spacer — keeps the brand centered now that the right
            side has no button to balance the left back-btn. */}
        <div className="rh-back-spacer" />
      </div>
    </header>
  );
}
