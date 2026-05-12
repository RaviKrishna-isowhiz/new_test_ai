"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export type StatusLevel = 'high' | 'medium' | 'low' | 'info' | 'success' | 'warning' | 'error';

export interface StatusBadgeProps {
  status: StatusLevel;
  label: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'soft';
}

const statusConfig = {
  high: {
    light: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    dark: { bg: 'dark:bg-red-900', text: 'dark:text-red-200', border: 'dark:border-red-700' },
    icon: '🔴'
  },
  medium: {
    light: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    dark: { bg: 'dark:bg-orange-900', text: 'dark:text-orange-200', border: 'dark:border-orange-700' },
    icon: '🟠'
  },
  low: {
    light: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    dark: { bg: 'dark:bg-green-900', text: 'dark:text-green-200', border: 'dark:border-green-700' },
    icon: '🟢'
  },
  info: {
    light: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    dark: { bg: 'dark:bg-blue-900', text: 'dark:text-blue-200', border: 'dark:border-blue-700' },
    icon: 'ℹ️'
  },
  success: {
    light: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    dark: { bg: 'dark:bg-green-900', text: 'dark:text-green-200', border: 'dark:border-green-700' },
    icon: '✓'
  },
  warning: {
    light: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    dark: { bg: 'dark:bg-yellow-900', text: 'dark:text-yellow-200', border: 'dark:border-yellow-700' },
    icon: '⚠️'
  },
  error: {
    light: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    dark: { bg: 'dark:bg-red-900', text: 'dark:text-red-200', border: 'dark:border-red-700' },
    icon: '✕'
  }
};

const sizeConfig = {
  sm: { padding: 'px-2 py-1', text: 'text-xs' },
  md: { padding: 'px-3 py-1.5', text: 'text-sm' },
  lg: { padding: 'px-4 py-2', text: 'text-base' }
};

export function StatusBadge({
  status,
  label,
  icon,
  size = 'md',
  variant = 'soft'
}: StatusBadgeProps) {
  const { theme } = useTheme();
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  const bgClass = variant === 'solid'
    ? `${config.light.bg} ${config.dark.bg}`
    : variant === 'outline'
      ? `border bg-transparent ${config.light.border} ${config.dark.border}`
      : `${config.light.bg} ${config.dark.bg} bg-opacity-50 dark:bg-opacity-30`;

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-semibold
      ${sizeClass.padding} ${sizeClass.text}
      ${config.light.text} ${config.dark.text}
      ${bgClass}
      transition-colors duration-200
    `}>
      {icon ? icon : config.icon}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}
