import { useState } from 'react';
import { signInWithGoogle } from '@homeschool/shared';
import { SCHOOL_NAME, SCHOOL_TAGLINE } from '../constants/school';
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
        <div className="signin-logo">ILA</div>
        <h1 className="signin-name">{SCHOOL_NAME}</h1>
        <p className="signin-tagline">{SCHOOL_TAGLINE}</p>
        <button className="signin-btn" onClick={handleSignIn}>
          Sign in with Google
        </button>
        {error && <p className="signin-error">{error}</p>}
      </div>
    </div>
  );
}
