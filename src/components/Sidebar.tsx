"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from "@/contexts/ThemeContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { 
      href: '/audit/anomaly-detection', 
      label: 'Anomaly Detection',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    { 
      href: '/audit/data-filtering', 
      label: 'Data Filtering',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      )
    },
    { 
      href: '/audit/bank-reconciliation', 
      label: 'Bank Reconciliation',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    { 
      href: '/audit/invoice-processing', 
      label: 'Invoice Processing',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      href: '/audit/payroll-risk', 
      label: 'Payroll Risk Analysis',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 hidden md:flex flex-col h-full shrink-0 shadow-sm transition-all duration-300 relative ${isDark ? 'dark-mode-active' : ''}`}>
      <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center relative min-h-[64px]`}>
        {!isCollapsed && (
          <div className="flex items-center justify-center w-full">
            <h2 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Audit Suite</h2>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute right-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full p-1.5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-20"
            >
              <svg 
                className="w-4 h-4 text-slate-600 dark:text-slate-400 transform transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
        {isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full p-1.5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-20"
          >
            <svg 
              className="w-4 h-4 text-slate-600 dark:text-slate-400 transform transition-transform duration-300 rotate-180" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
        <nav className="space-y-2 px-3">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={isCollapsed ? link.label : ''}
                className={`flex items-center rounded-xl transition-all duration-200 group ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'} ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-slate-700' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-navy dark:hover:text-white'
                }`}
              >
                {link.icon}
                {!isCollapsed && <div className="ml-3 flex-1 font-bold text-sm truncate">{link.label}</div>}
                {!isCollapsed && isActive && (
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
