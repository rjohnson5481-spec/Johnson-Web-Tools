import React from 'react';
import ReactDOM from 'react-dom/client';
import '@johnson-web-tools/shared/styles/tokens.css';
import '@johnson-web-tools/shared/styles/fonts.css';
import './App.css';
import App from './App';

const savedMode = localStorage.getItem('color-mode') || 'light';
document.documentElement.setAttribute('data-mode', savedMode);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
