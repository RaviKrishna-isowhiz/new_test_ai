"use client";

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
import { typography } from "@/styles/typography";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Static dashboard data
const dashboardData = {
  anomalyFiles: { last: 120, current: 180, change: 50 },
  invoicesProcessed: { last: 300, current: 450, change: 150 },
  bankReconciled: { last: 80, current: 110, change: 30 },
  totalTransactions: { value: 3420, change: 12 },
  successRate: { value: 98.5, change: 2.1 },
  avgProcessingTime: { value: "2.4s", change: -15 },
};

// Sample time series data
const timeSeriesData = [
  { date: "Mon", transactions: 240 },
  { date: "Tue", transactions: 320 },
  { date: "Wed", transactions: 280 },
  { date: "Thu", transactions: 420 },
  { date: "Fri", transactions: 380 },
  { date: "Sat", transactions: 310 },
  { date: "Sun", transactions: 290 },
];

function getPercent(current: number, last: number) {
  if (last === 0) return "N/A";
  const percent = ((current - last) / last) * 100;
  return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' as const },
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

  return (
    <div className={`flex-1 bg-slate-50 dark:bg-slate-950 py-6 px-6 flex flex-col rounded-3xl h-full overflow-auto`}>
      <div className="w-full flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className={`${typography.pageTitle.full} mb-2`}>Dashboard</h1>
          <p className={`${typography.body.full}`}>Welcome back! Here&apos;s your audit summary.</p>
        </div>

        {/* KPI Cards Grid - 2x3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Anomalies */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`${typography.kpiLabel.full} mb-1`}>Anomalies Detected</p>
                <h3 className={`${typography.kpiValue.full}`}>{dashboardData.anomalyFiles.current}</h3>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6 9h12m-6-6h0" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                +{dashboardData.anomalyFiles.change}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">vs last period</p>
            </div>
          </div>

          {/* Card 2: Invoices */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`${typography.kpiLabel.full} mb-1`}>Invoices Processed</p>
                <h3 className={`${typography.kpiValue.full}`}>{dashboardData.invoicesProcessed.current}</h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                +{dashboardData.invoicesProcessed.change}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">vs last period</p>
            </div>
          </div>

          {/* Card 3: Bank Reconciled */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`${typography.kpiLabel.full} mb-1`}>Transactions Reconciled</p>
                <h3 className={`${typography.kpiValue.full}`}>{dashboardData.bankReconciled.current}</h3>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                +{dashboardData.bankReconciled.change}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">vs last period</p>
            </div>
          </div>

          {/* Card 4: Total Transactions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`${typography.kpiLabel.full} mb-1`}>Total Transactions</p>
                <h3 className={`${typography.kpiValue.full}`}>{dashboardData.totalTransactions.value.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                +{dashboardData.totalTransactions.change}%
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">this month</p>
            </div>
          </div>

          {/* Card 5: Success Rate */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`${typography.kpiLabel.full} mb-1`}>Processing Success Rate</p>
                <h3 className={`${typography.kpiValue.full}`}>{dashboardData.successRate.value}%</h3>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${dashboardData.successRate.value}%` }} />
            </div>
          </div>

          {/* Card 6: Avg Processing Time */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`${typography.kpiLabel.full} mb-1`}>Avg Processing Time</p>
                <h3 className={`${typography.kpiValue.full}`}>{dashboardData.avgProcessingTime.value}</h3>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                {dashboardData.avgProcessingTime.change}%
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">faster</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Trend Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className={`${typography.cardTitle.full} mb-4`}>Weekly Transaction Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} />
                  <Area type="monotone" dataKey="transactions" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTransactions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className={`${typography.cardTitle.full} mb-4`}>Processing Metrics Comparison</h3>
            <div className="relative h-64 w-full">
              <Bar
                data={{
                  labels: ["Last FY", "Current FY"],
                  datasets: [
                    {
                      label: "Anomalies",
                      data: [dashboardData.anomalyFiles.last, dashboardData.anomalyFiles.current],
                      backgroundColor: "#ef4444",
                      borderRadius: 8,
                    },
                    {
                      label: "Invoices",
                      data: [dashboardData.invoicesProcessed.last, dashboardData.invoicesProcessed.current],
                      backgroundColor: "#3b82f6",
                      borderRadius: 8,
                    },
                    {
                      label: "Reconciled",
                      data: [dashboardData.bankReconciled.last, dashboardData.bankReconciled.current],
                      backgroundColor: "#8b5cf6",
                      borderRadius: 8,
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
