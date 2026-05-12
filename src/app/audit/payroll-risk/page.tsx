"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { ENDPOINTS } from '@/config/api';
import { DataTable } from '@/components/DataTable';
import { ColDef } from 'ag-grid-community';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function PayrollRiskPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [overallRisk, setOverallRisk] = useState<any>(null);
  const [riskBreakdown, setRiskBreakdown] = useState<any>(null);
  const [fraudBreakdown, setFraudBreakdown] = useState<any>(null);
  const [employeeDetail, setEmployeeDetail] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(ENDPOINTS.PAYROLL_UPLOAD, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload file");
      
      const data = await res.json();
      showToast(data.message || "File uploaded and processed successfully", "success");
      
      // Fetch analysis data
      await fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || "An error occurred during upload.", "error");
      setError(err.message || "An error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [overallRes, breakdownRes, fraudRes] = await Promise.all([
        fetch(ENDPOINTS.PAYROLL_OVERALL_RISK),
        fetch(ENDPOINTS.PAYROLL_RISK_BREAKDOWN),
        fetch(ENDPOINTS.PAYROLL_FRAUD_BREAKDOWN)
      ]);

      if (overallRes.ok) setOverallRisk(await overallRes.json());
      if (breakdownRes.ok) setRiskBreakdown(await breakdownRes.json());
      if (fraudRes.ok) setFraudBreakdown(await fraudRes.json());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const fetchEmployeeDetail = async (id: string) => {
    try {
      const res = await fetch(ENDPOINTS.PAYROLL_EMPLOYEE_DETAIL(id));
      if (res.ok) {
        setEmployeeDetail(await res.json());
        setShowModal(true);
      }
    } catch (err) {
      console.error("Error fetching employee detail:", err);
    }
  };

  const columnDefs: ColDef[] = [
    { field: "employee_id", headerName: "Employee ID", filter: true, flex: 1 },
    { field: "department", headerName: "Department", filter: true, flex: 1 },
    { 
      field: "risk_score", 
      headerName: "Risk Score", 
      sortable: true,
      cellRenderer: (params: any) => (
        <span className={`font-bold ${params.value > 0.7 ? 'text-red-500' : 'text-orange-500'}`}>
          {(params.value * 100).toFixed(2)}%
        </span>
      )
    },
    { field: "discrepancy_type", headerName: "Discrepancy Type", filter: true, flex: 1.5 },
    {
      headerName: "Actions",
      cellRenderer: (params: any) => (
        <button 
          onClick={() => fetchEmployeeDetail(params.data.employee_id)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition"
        >
          View Details
        </button>
      )
    }
  ];

  const pieData = fraudBreakdown ? {
    labels: Object.keys(fraudBreakdown),
    datasets: [{
      data: Object.values(fraudBreakdown),
      backgroundColor: [
        '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'
      ],
      borderWidth: 1,
    }]
  } : null;

  return (
    <div className={`flex-1 flex flex-col items-center justify-normal bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-slate-900 py-2 px-2 relative ${isDark ? 'dark-mode-active' : ''}`}>
      {/* Full Page Loader */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-12 w-12 text-blue-900 dark:text-blue-300" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg font-medium text-blue-900 dark:text-white">
              Processing...
            </span>
          </div>
        </div>
      )}

      <div className={`w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-900/20 p-4 dark:border-slate-700 ${isDark ? 'border force-dark-card' : ''}`}>
        <div className="mb-1">
          <h1 className="text-3xl font-semibold text-blue-900 dark: footer-copyright drop-shadow text-left flex items-center gap-2">
            <span>Payroll Risk Analysis</span>
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-900 via-slate-400 to-blue-300 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 rounded-full mt-2 ml-1" />
        </div>
        <p className="text-lg text-slate-700 dark:text-slate-300 mb-4 text-center font-medium dark:drop-shadow-lg">
          AI-powered audit engine detecting anomalies, phantom employees, and payment discrepancies. Upload your payroll data for instant risk assessment.
        </p>

        {/* Upload Section */}
        <form className="flex flex-col items-center gap-4 mb-6" onSubmit={handleUpload}>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-full flex flex-col md:flex-row gap-4 items-stretch pl-4">
            <div
              className={`flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-blue-900 dark:border-blue-400 rounded-xl bg-blue-50 dark:bg-slate-700 py-4 px-6 transition hover:border-blue-800 hover:bg-blue-100 dark:hover:bg-slate-600 shadow-md relative ${isLoading ? 'pointer-events-none opacity-75' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-12 h-12 text-blue-900 dark:text-blue-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
              <span className="text-lg font-semibold text-blue-900 dark:text-blue-200">Drag & drop or click to upload payroll data</span>
              <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">Supported formats: .csv, .xlsx, .xls</span>
              {selectedFile && (
                <span className="mt-3 text-sm text-blue-900 dark:text-blue-200 font-bold bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-700">
                  Selected: {selectedFile.name}
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-4 justify-center w-full md:w-1/5">
              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className={`rounded-lg text-white px-6 py-3 font-semibold shadow-lg transition gap-2 cursor-pointer ${isLoading || !selectedFile
                  ? 'bg-blue-900 cursor-not-allowed opacity-50'
                  : 'bg-blue-900 hover:bg-blue-800 shadow-blue-900/20'
                  } w-full`}
              >
                {isLoading ? 'Analyzing...' : 'Upload & Analyze'}
              </button>
            </div>
          </div>
          {error && <div className="w-full text-center text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/20 rounded-md py-2">{error}</div>}
        </form>

        {overallRisk && (
          <div className="w-full space-y-6">
            {/* Summary Cards aligned with Anomaly Detection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AlertStat 
                label="Risk Exposure Rate" 
                value={overallRisk.anomaly_exposure_rate} 
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>}
                type="blue"
              />
              <AlertStat 
                label="Flagged Transactions" 
                value={overallRisk.flagged_transactions_count} 
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>}
                type="red"
              />
              <AlertStat 
                label="Total Records" 
                value={overallRisk.total_audited_records} 
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>}
                type="purple"
              />
              <AlertStat 
                label="Top Risk Dept" 
                value={overallRisk.highest_exposure_department} 
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd"></path></svg>}
                type="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Risk Category Breakdown */}
              <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-inner">
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Risk Category Distribution</h3>
                <div className="h-[300px] flex items-center justify-center">
                  {pieData ? <Pie data={pieData} options={{ maintainAspectRatio: false }} /> : <p className="text-slate-400">No category data</p>}
                </div>
              </div>

              {/* Data Table */}
              <div className="lg:col-span-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Flagged Risk Entries</h3>
                </div>
                <DataTable 
                  rowData={riskBreakdown?.flagged_payroll_records || []} 
                  columnDefs={columnDefs} 
                  height="340px"
                  highlightRowEnabled={true}
                  highlightRowCondition={(row) => row.risk_score > 0.8}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Minimal & Sophisticated Risk Profile Modal */}
      {showModal && employeeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-500/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Risk Analysis Profile</h3>
                    <p className="text-xs text-slate-400 font-medium">Employee ID: {employeeDetail.employee_id}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8">
              {/* Score Section - Minimal Layout */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-start justify-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Anomaly Score</span>
                  <div className={`text-4xl font-semibold ${employeeDetail.risk_score > 0.8 ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
                    {(employeeDetail.risk_score * 100).toFixed(1)}<span className="text-xl ml-1 opacity-40">%</span>
                  </div>
                </div>
                <div className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-start justify-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Classification</span>
                  <div className={`text-sm font-semibold px-3 py-1 rounded-md border ${
                    employeeDetail.risk_category === 'High' 
                      ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:border-red-800/20' 
                      : 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/10 dark:border-orange-800/20'
                  }`}>
                    {employeeDetail.risk_category} Risk
                  </div>
                </div>
              </div>
 
              {/* Factors - Clean List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4 px-1">Detailed Risk Vectors</h4>
                <Indicator label="Ceased with pay flag" value={employeeDetail.key_flags.is_ceased_with_pay} isBoolean />
                <Indicator label="Last payment exit lag" value={`${employeeDetail.key_flags.last_payment_after_exit_days} days`} />
                <Indicator label="Pay imbalance variance" value={(employeeDetail.key_flags.pay_imbalance_score * 100).toFixed(2) + '%'} />
                <Indicator label="Gross vs Base pay ratio" value={employeeDetail.key_flags.gross_vs_base_ratio.toFixed(3)} />
              </div>
            </div>
 
            {/* Action */}
            <div className="px-8 pb-8 pt-0">
               <button 
                onClick={() => setShowModal(false)}
                className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-[0.99]"
              >
                Dismiss Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components matching system styles
function AlertStat({ label, value, icon, type }: { label: string, value: any, icon: React.ReactNode, type: 'blue' | 'red' | 'purple' | 'orange' }) {
  const styles: any = {
    blue: 'text-blue-800 border-blue-300 bg-blue-50 dark:bg-gray-800 dark:text-blue-300 dark:border-blue-800',
    red: 'text-red-800 border-red-300 bg-red-50 dark:bg-gray-800 dark:text-red-300 dark:border-red-800',
    purple: 'text-purple-800 border-purple-300 bg-purple-50 dark:bg-gray-800 dark:text-purple-300 dark:border-purple-800',
    orange: 'text-orange-800 border-orange-300 bg-orange-50 dark:bg-gray-800 dark:text-orange-300 dark:border-orange-800',
  };

  return (
    <div className={`flex items-center p-4 border rounded-lg shadow-sm transition-all hover:shadow-md ${styles[type]}`} role="alert">
      <div className="flex-shrink-0 mr-3 opacity-80">
        {icon}
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider opacity-70 block">{label}</span>
        <span className="font-bold text-lg">{value ?? '---'}</span>
      </div>
    </div>
  );
}

function Indicator({ label, value, isBoolean = false }: { label: string, value: any, isBoolean?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1 group">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-tight">{label}</span>
      {isBoolean ? (
        <span className={`text-[10px] font-semibold tracking-wider ${value ? 'text-red-500' : 'text-emerald-500'}`}>
          {value ? 'YES' : 'NO'}
        </span>
      ) : (
        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{value}</span>
      )}
    </div>
  );
}

