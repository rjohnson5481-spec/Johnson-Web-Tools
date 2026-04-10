import { signOut } from '@homeschool/shared';
import { useDarkMode } from '../hooks/useDarkMode';
import { SCHOOL_NAME, SCHOOL_TAGLINE } from '../constants/school';
import './Header.css';

export default function Header() {
  const { mode, toggle } = useDarkMode();

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">ILA</div>
        <div className="header-text">
          <span className="header-name">{SCHOOL_NAME}</span>
          <span className="header-tagline">{SCHOOL_TAGLINE}</span>
        </div>
      </div>
      <div className="header-controls">
        <button className="header-btn" onClick={toggle} aria-label="Toggle color mode">
          {mode === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button className="header-btn" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    </header>
  );
}
