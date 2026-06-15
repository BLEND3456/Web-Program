import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

(function initTheme() {
  const userSetTheme = localStorage.getItem('theme_user_set') === '1';
  const isDark = userSetTheme && localStorage.getItem('theme') === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  if (!isDark) {
    document.documentElement.classList.remove('dark');
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);