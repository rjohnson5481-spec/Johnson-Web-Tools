import React from 'react';
import ReactDOM from 'react-dom/client';
import '@homeschool/shared/styles/tokens.css';
import '@homeschool/shared/styles/fonts.css';
import './reward-tracker.css';
import App from './App.jsx';

const savedMode = localStorage.getItem('color-mode') || 'light';
document.documentElement.setAttribute('data-mode', savedMode);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
