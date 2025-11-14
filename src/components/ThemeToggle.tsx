import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-2 rounded toolbar-button bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    >
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
