"use client";

import React, { useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  acceptedFormats?: string[];
  loading?: boolean;
  fileName?: string;
  error?: string | null;
  dragActive?: boolean;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  uploadProgress?: number;
}

export function UploadArea({
  onFileSelect,
  accept = '.csv,.xlsx,.xls,.json',
  acceptedFormats = ['CSV', 'Excel', 'JSON'],
  loading = false,
  fileName,
  error,
  dragActive = false,
  onDragOver,
  onDragLeave,
  onDrop,
  uploadProgress = 0
}: UploadAreaProps) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const borderColor = dragActive
    ? 'border-indigo-500 bg-indigo-50 dark:bg-slate-800'
    : error
      ? 'border-red-300 dark:border-red-600'
      : theme === 'dark'
        ? 'border-slate-600'
        : 'border-slate-300';

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-200
          ${borderColor}
          ${dragActive ? 'shadow-lg' : 'shadow-sm'}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
        `}
      >
        {/* Background icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </div>

        <div className="relative z-10 space-y-3">
          {loading ? (
            <>
              <div className="text-indigo-600 dark:text-indigo-400">
                <svg className="w-8 h-8 mx-auto animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {fileName ? `Processing ${fileName}...` : 'Processing file...'}
              </p>
              {uploadProgress > 0 && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </>
          ) : fileName ? (
            <>
              <svg className="w-8 h-8 mx-auto text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {fileName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click to change file
              </p>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 mx-auto text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Drag and drop your file here
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  or click to select
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supported formats: {acceptedFormats.join(', ')}
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Error: {error}
          </p>
        </div>
      )}
    </div>
  );
}
