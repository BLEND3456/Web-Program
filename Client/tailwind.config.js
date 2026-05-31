/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--app-bg)',
          surface: 'var(--app-surface)',
          elevated: 'var(--app-elevated)',
          canvas: 'var(--app-canvas)',
          border: 'var(--app-border)',
          'border-strong': 'var(--app-border-strong)',
          text: 'var(--app-text)',
          'text-secondary': 'var(--app-text-secondary)',
          muted: 'var(--app-muted)',
          hover: 'var(--app-hover)',
          'hover-strong': 'var(--app-hover-strong)',
          input: 'var(--app-input)',
          overlay: 'var(--app-overlay)'
        }
      }
    }
  },
  plugins: []
};
