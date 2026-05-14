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
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col h-full shrink-0 transition-all duration-300 relative ${isDark ? 'dark-mode-active' : ''}`}>
      {/* Logo Header */}
      <div className={`bg-gradient-to-br from-navy to-indigo dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between relative px-4 py-4 min-h-[80px]`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Logo Circle */}
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            {/* Brand Text */}
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-white truncate">Audit Suite</h1>
              <p className="text-xs text-indigo-200 truncate">Enterprise</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        )}

        {/* Collapse Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-4 ${isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-4'} bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/10 rounded-lg p-1.5 transition-all duration-200 z-20`}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <svg 
            className={`w-4 h-4 text-white transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-6 overflow-x-hidden">
        <nav className="space-y-1.5 px-3">
          {/* Navigation Label */}
          {!isCollapsed && (
            <div className="px-4 py-2 mb-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Modules</p>
            </div>
          )}
          
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={isCollapsed ? link.label : ''}
                className={`flex items-center rounded-lg transition-all duration-200 group relative overflow-hidden ${isCollapsed ? 'justify-center p-3 mx-1' : 'px-4 py-2.5 gap-3'} ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600" />
                )}
                
                {/* Icon */}
                <div className={`flex-shrink-0 w-5 h-5 ${isCollapsed ? '' : 'ml-1'}`}>
                  {link.icon}
                </div>
                
                {/* Label */}
                {!isCollapsed && (
                  <span className="flex-1 text-sm font-medium truncate">{link.label}</span>
                )}
                
                {/* Chevron on active */}
                {!isCollapsed && isActive && (
                  <svg className="w-4 h-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-3 py-4 space-y-3">
        {!isCollapsed && (
          <div className="px-3 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Version 1.0</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise Edition</p>
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
