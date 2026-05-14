"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from "@/contexts/ThemeContext";
import { typography } from "@/styles/typography";

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
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col h-full shrink-0 transition-all duration-300 ${isDark ? 'dark-mode-active' : ''}`}>
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-5 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 3.062v2.332c0 .322-.033.646-.099.967a28.697 28.697 0 01-1.979 5.25 5.83 5.83 0 01-2.804 2.202 5.83 5.83 0 01-2.997 0 5.83 5.83 0 01-2.804-2.202 28.7 28.7 0 01-1.979-5.25 10.87 10.87 0 01-.099-.967V6.517a3.066 3.066 0 012.812-3.062zM9 13a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className={`${typography.cardTitle.full} truncate`}>Audit Suite</h2>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 3.062v2.332c0 .322-.033.646-.099.967a28.697 28.697 0 01-1.979 5.25 5.83 5.83 0 01-2.804 2.202 5.83 5.83 0 01-2.997 0 5.83 5.83 0 01-2.804-2.202 28.7 28.7 0 01-1.979-5.25 10.87 10.87 0 01-.099-.967V6.517a3.066 3.066 0 012.812-3.062zM9 13a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {!isCollapsed && (
          <div className="px-3 py-2 mb-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Modules</p>
          </div>
        )}

        <div className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={isCollapsed ? link.label : ''}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                {link.icon}
                {!isCollapsed && <span className={`${typography.navItem.full} flex-1 truncate`}>{link.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Divider */}
      <div className="border-t border-slate-200 dark:border-slate-800" />
    </aside>
  );
}
