import { signOut } from '@johnson-web-tools/shared';
import logo from '@johnson-web-tools/shared/assets/logo.png';
import './Dashboard.css';

export default function Dashboard() {
  function launchTeExtractor() {
    window.location.href = '/te-extractor/';
  }

  return (
    <div className="dash-page">
      <header className="dash-header">
        <div className="dash-brand">
          <img src={logo} alt="ILA" className="dash-logo" />
          <div className="dash-school">
            <span className="dash-school-line1">
              IRON &amp; <span className="dash-school-accent">LIGHT</span>
            </span>
            <span className="dash-school-line2">JOHNSON ACADEMY</span>
            <span className="dash-school-subtitle">Tools App</span>
          </div>
        </div>

        <button
          className="dash-gear"
          onClick={() => {}}
          aria-label="Settings"
        >
          ⚙️
        </button>
      </header>

      <main className="dash-body">
        <div className="dash-grid">
          <article className="tool-card">
            <h2 className="tool-card-title">TE Extractor</h2>
            <p className="tool-card-desc">
              Extract lessons from BJU Press Teacher Editions
            </p>
            <button className="tool-card-btn" onClick={launchTeExtractor}>
              Launch →
            </button>
          </article>
        </div>

        <div className="dash-signout-wrap">
          <button className="dash-signout-btn" onClick={() => signOut()}>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
