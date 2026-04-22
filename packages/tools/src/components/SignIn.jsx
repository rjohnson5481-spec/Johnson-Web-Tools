import { useState } from 'react';
import { signInWithGoogle } from '@johnson-web-tools/shared';
import logo from '@johnson-web-tools/shared/assets/logo.png';
import './SignIn.css';

export default function SignIn() {
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError('Sign-in failed. Please try again.');
    }
  }

  return (
    <div className="signin">
      <div className="signin-card">
        <img src={logo} alt="ILA" className="signin-logo" />
        <div className="signin-school">
          <span className="signin-school-line1">
            IRON &amp; <span className="signin-school-accent">LIGHT</span>
          </span>
          <span className="signin-school-line2">JOHNSON ACADEMY</span>
          <span className="signin-school-tagline">Faith · Knowledge · Strength</span>
        </div>
        <button className="signin-btn" onClick={handleSignIn}>
          Sign in with Google
        </button>
        {error && <p className="signin-error">{error}</p>}
      </div>
    </div>
  );
}
