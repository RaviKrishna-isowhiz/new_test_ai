"use client";

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterPanelProps {
  filters: {
    [key: string]: FilterOption[];
  };
  selectedFilters: {
    [key: string]: string[];
  };
  onFilterChange: (filterKey: string, selectedIds: string[]) => void;
  onClearAll?: () => void;
}

export function FilterPanel({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll
}: FilterPanelProps) {
  const { theme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>(Object.keys(filters));

  const toggleSection = (key: string) => {
    setExpandedSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleFilter = (filterKey: string, optionId: string) => {
    const current = selectedFilters[filterKey] || [];
    const updated = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    onFilterChange(filterKey, updated);
  };

  const totalSelected = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className={`
      rounded-lg border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}
      p-4 space-y-4 shadow-sm
    `}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className={`font-bold text-sm uppercase tracking-wider ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
          Filters
        </h3>
        {totalSelected > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear All ({totalSelected})
          </button>
        )}
      </div>

      {/* Filter Groups */}
      <div className="space-y-3">
        {Object.entries(filters).map(([filterKey, options]) => (
          <div key={filterKey} className="space-y-2">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(filterKey)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded
                transition-colors text-sm font-semibold
                ${theme === 'dark'
                  ? 'hover:bg-slate-700 text-slate-200'
                  : 'hover:bg-slate-100 text-slate-900'
                }
              `}
            >
              <span className="capitalize">{filterKey}</span>
              <svg
                className={`w-4 h-4 transition-transform ${expandedSections.includes(filterKey) ? 'rotate-0' : '-rotate-90'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* Options */}
            {expandedSections.includes(filterKey) && (
              <div className="space-y-2 pl-2 border-l border-slate-300 dark:border-slate-600">
                {options.map(option => (
                  <label
                    key={option.id}
                    className={`
                      flex items-center gap-3 p-2 rounded cursor-pointer
                      transition-colors text-sm
                      ${theme === 'dark'
                        ? 'hover:bg-slate-700'
                        : 'hover:bg-slate-100'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={(selectedFilters[filterKey] || []).includes(option.id)}
                      onChange={() => toggleFilter(filterKey, option.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`flex-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                        ({option.count})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
