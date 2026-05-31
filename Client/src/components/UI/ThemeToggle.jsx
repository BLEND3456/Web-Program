import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className={`p-2.5 rounded-xl border border-app-border bg-app-hover hover:bg-app-hover-strong text-app-muted hover:text-app-text transition-all ${className}`}
    >
      {isDark ? (
        <Sun className="w-[18px] h-[18px]" strokeWidth={2} />
      ) : (
        <Moon className="w-[18px] h-[18px]" strokeWidth={2} />
      )}
    </button>
  );
};

export default ThemeToggle;
