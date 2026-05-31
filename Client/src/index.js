import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

(function initTheme() {
  const stored = localStorage.getItem('theme');
  const isDark = stored !== 'light';
  document.documentElement.classList.toggle('dark', isDark);
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);