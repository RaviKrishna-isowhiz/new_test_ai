"use client";

// Static dashboard data for charts and cards
const dashboardData = {
  anomalyFiles: { last: 120, current: 180 },
  invoicesProcessed: { last: 300, current: 450 },
  bankReconciled: { last: 80, current: 110 },
};

import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTheme } from "@/contexts/ThemeContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper function for percent difference
function getPercent(current: number, last: number) {
  if (last === 0) return "N/A";
  const percent = ((current - last) / last) * 100;
  return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Debug logging
  console.log('Current theme:', theme, 'isDark:', isDark);

  // Chart configuration based on theme
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          color: isDark ? '#94a3b8' : '#64748b',
          font: { weight: 600 as any }
        }
      },
      y: {
        grid: { 
          color: isDark ? 'rgba(71, 85, 105, 0.2)' : 'rgba(226, 232, 240, 0.6)',
          drawBorder: false
        },
        ticks: { 
          color: isDark ? '#94a3b8' : '#64748b',
          padding: 10
        }
      },
    },
    elements: {
      bar: {
        borderRadius: 8,
      }
    }
  };

  // Chart colors: Navy to Indigo gradient supports
  const chartColors = isDark
    ? ["#334155", "#6366f1"]
    : ["#0a192f", "#4338ca"];

  // ChartJS registration is already done at the top-level
  return (
    <div className={`flex-1 bg-slate-50 dark:bg-slate-950 py-4 px-6 flex flex-col rounded-3xl h-full overflow-hidden ${isDark ? 'dark-mode-active' : ''}`}>
      <div className="w-full flex flex-col h-full">
        <div>
          <h1 className="text-3xl font-semibold text-blue-900 dark:text-white text-left drop-shadow-lg tracking-tight flex items-center gap-2">
            <span>Dashboard</span>
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-900 via-slate-400 to-blue-300 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 rounded-full mt-2 ml-1 mb-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Card: Anomaly Detection */}
          <div className={`card-premium p-6 flex flex-col items-center cursor-pointer group rounded-2xl ${isDark ? 'force-dark-card' : ''}`}>
            <div className="bg-gradient-to-br from-navy to-indigo dark:from-indigo-900 dark:to-indigo-700 bg-opacity-10 rounded-2xl p-4 mb-4 shadow-indigo-200/50 dark:shadow-none shadow-lg">
              <svg className="w-10 h-10 text-blue-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{dashboardData.anomalyFiles.current}</div>
              <span className={`text-sm font-bold ${dashboardData.anomalyFiles.current >= dashboardData.anomalyFiles.last ? 'text-green-500' : 'text-rose-500'}`}>{getPercent(dashboardData.anomalyFiles.current, dashboardData.anomalyFiles.last)}</span>
            </div>
            <div className="text-base text-slate-600 dark:text-slate-400 font-semibold mt-2">Files Uploaded</div>
            <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Current FY vs Last FY</div>
          </div>
          {/* Card: Invoices Processed */}
          <div className={`card-premium p-6 flex flex-col items-center cursor-pointer group rounded-2xl ${isDark ? 'force-dark-card' : ''}`}>
            <div className="bg-gradient-to-br from-indigo to-accent dark:from-indigo-800 dark:to-accent-950 bg-opacity-10 rounded-2xl p-4 mb-4 shadow-indigo-200/50 dark:shadow-none shadow-lg">
              <svg className="w-10 h-10 text-blue-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="2" /><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4" /></svg>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{dashboardData.invoicesProcessed.current}</div>
              <span className={`text-sm font-bold ${dashboardData.invoicesProcessed.current >= dashboardData.invoicesProcessed.last ? 'text-green-500' : 'text-rose-500'}`}>{getPercent(dashboardData.invoicesProcessed.current, dashboardData.invoicesProcessed.last)}</span>
            </div>
            <div className="text-base text-slate-600 dark:text-slate-400 font-semibold mt-2">Invoices Processed</div>
            <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Current FY vs Last FY</div>
          </div>
          {/* Card: Bank Reconciliation */}
          <div className={`card-premium p-6 flex flex-col items-center cursor-pointer group rounded-2xl ${isDark ? 'force-dark-card' : ''}`}>
            <div className="bg-gradient-to-br from-navy to-accent dark:from-navy-950 dark:to-accent-900 bg-opacity-10 rounded-2xl p-4 mb-4 shadow-indigo-200/50 dark:shadow-none shadow-lg">
              <svg className="w-10 h-10 text-blue-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" /><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 10v4M16 10v4" /></svg>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{dashboardData.bankReconciled.current}</div>
              <span className={`text-sm font-bold ${dashboardData.bankReconciled.current >= dashboardData.bankReconciled.last ? 'text-green-500' : 'text-rose-500'}`}>{getPercent(dashboardData.bankReconciled.current, dashboardData.bankReconciled.last)}</span>
            </div>
            <div className="text-base text-slate-600 dark:text-slate-400 font-semibold mt-2">Bank Reconciled</div>
            <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Current FY vs Last FY</div>
          </div>
        </div>
        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-[250px] pb-2">
          <div className={`card-premium p-4 flex flex-col items-center rounded-2xl h-full ${isDark ? 'force-dark-card' : ''}`}>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Anomaly Trend</h2>
            <div className="relative w-full flex-1 min-h-0">
              <Bar
                data={{
                  labels: ["Last FY", "Current FY"],
                  datasets: [
                    {
                      label: "Files Uploaded",
                      data: [dashboardData.anomalyFiles.last, dashboardData.anomalyFiles.current],
                      backgroundColor: chartColors,
                      barThickness: 40,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>
          <div className={`card-premium p-4 flex flex-col items-center rounded-2xl h-full ${isDark ? 'force-dark-card' : ''}`}>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Invoice Trend</h2>
            <div className="relative w-full flex-1 min-h-0">
              <Bar
                data={{
                  labels: ["Last FY", "Current FY"],
                  datasets: [
                    {
                      label: "Invoices Processed",
                      data: [dashboardData.invoicesProcessed.last, dashboardData.invoicesProcessed.current],
                      backgroundColor: chartColors,
                      barThickness: 40,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>
          <div className={`card-premium p-4 flex flex-col items-center rounded-2xl h-full ${isDark ? 'force-dark-card' : ''}`}>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Bank Trend</h2>
            <div className="relative w-full flex-1 min-h-0">
              <Bar
                data={{
                  labels: ["Last FY", "Current FY"],
                  datasets: [
                    {
                      label: "Bank Reconciled",
                      data: [dashboardData.bankReconciled.last, dashboardData.bankReconciled.current],
                      backgroundColor: chartColors,
                      barThickness: 40,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
