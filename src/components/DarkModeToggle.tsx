"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  const tooltipText = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center group">
      <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none px-3 py-1 rounded-lg bg-gray-900 text-white text-xs shadow-lg dark:bg-slate-700 absolute right-12 bottom-3 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
        {tooltipText}
      </div>
      <button
        onClick={toggleTheme}
        className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg dark:shadow-2xl border border-gray-200 dark:border-slate-600 hover:scale-110 transition-all duration-300 hover:shadow-xl"
        aria-label={tooltipText}
      >
        {theme === 'dark' ? (
          // Sun icon for light mode
          <svg 
            className="w-6 h-6 text-yellow-500 transition-transform duration-300" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
              clipRule="evenodd" 
            />
          </svg>
        ) : (
          // Moon icon for dark mode
          <svg 
            className="w-6 h-6 text-slate-700 transition-transform duration-300" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" 
            />
          </svg>
        )}
      </button>
    </div>
  );
}