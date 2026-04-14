import { useState, useEffect } from 'react';

// Reads/writes data-mode attribute on <html> and persists to localStorage.
// Uses key 'color-mode' — same key initialized in main.jsx before first render.
// Shared with planner so both tools stay in sync.
export function useDarkMode() {
  const [mode, setMode] = useState(
    () => localStorage.getItem('color-mode') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('color-mode', mode);
  }, [mode]);

  function toggle() {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  return { mode, toggle };
}
