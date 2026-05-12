import React from 'react';

export default function Footer() {
  return (
    <footer className="hidden sm:block h-20 border-t border-gray-200 dark:border-slate-700 bg-gradient-to-r from-white/40 to-white/10 dark:from-slate-900/40 dark:to-slate-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="text-sm font-bold text-blue-900 dark: footer-copyright">© {new Date().getFullYear()} AI Planet</div>
      </div>
    </footer>
  );
}
