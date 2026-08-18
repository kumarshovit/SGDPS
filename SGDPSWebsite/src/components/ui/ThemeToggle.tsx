import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      className={`relative inline-flex h-9 w-16 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gold-500/50 ${
        isDark ? 'bg-charcoal-900 border border-charcoal-700' : 'bg-cream-200 border border-cream-border'
      } ${className}`}
    >
      <span className="sr-only">Toggle Theme</span>
      <div
        className={`flex h-7 w-7 transform items-center justify-center rounded-full shadow-md transition-transform duration-300 ${
          isDark ? 'translate-x-7 bg-maroon-800 text-gold-400' : 'translate-x-0 bg-white text-saffron-600'
        }`}
      >
        {isDark ? (
          <Moon size={14} className="transition-opacity" />
        ) : (
          <Sun size={14} className="transition-opacity" />
        )}
      </div>
    </button>
  );
};
