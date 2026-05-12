"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

export function KPICard({
  title,
  value,
  subtext,
  icon,
  trend,
  trendValue,
  backgroundColor = 'from-blue-50 to-indigo-50',
  textColor = 'text-slate-900',
  accentColor = 'text-indigo-600'
}: KPICardProps) {
  const { theme } = useTheme();

  const bgClass = theme === 'dark'
    ? 'dark:from-slate-800 dark:to-slate-700'
    : '';

  const borderColor = theme === 'dark'
    ? 'border-slate-700'
    : 'border-slate-200';

  const textDarkClass = theme === 'dark'
    ? 'dark:text-slate-100'
    : '';

  const subTextDarkClass = theme === 'dark'
    ? 'dark:text-slate-400'
    : '';

  return (
    <div className={`
      relative overflow-hidden rounded-lg border ${borderColor}
      bg-gradient-to-br ${backgroundColor} ${bgClass}
      p-6 shadow-sm hover:shadow-md transition-all duration-300
    `}>
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-12 -mt-12" />

      <div className="relative z-10">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className={`text-sm font-medium text-slate-600 ${subTextDarkClass} uppercase tracking-wider`}>
              {title}
            </p>
          </div>
          {icon && (
            <div className={`${accentColor} text-2xl ml-2`}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-3xl font-bold ${textColor} ${textDarkClass}`}>
            {value}
          </span>
          {trendValue && trend && (
            <span className={`text-sm font-semibold ${
              trend === 'up' ? 'text-green-600 dark:text-green-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-slate-600 dark:text-slate-400'
            }`}>
              {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
            </span>
          )}
        </div>

        {/* Subtext */}
        {subtext && (
          <p className={`text-xs text-slate-600 ${subTextDarkClass}`}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
