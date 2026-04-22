import { useState, useEffect } from 'react';

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
