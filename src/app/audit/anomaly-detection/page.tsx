"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import React, { useRef, useState, useMemo } from 'react';
import { ColDef } from 'ag-grid-community';
import { useTheme } from "@/contexts/ThemeContext";

import logger from '@/lib/logger';
import { DataTable } from '../../../components/DataTable';
import { ENDPOINTS } from '@/config/api';

// TypeScript declarations for Speech Recognition API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function AnomalyDetectionPage() {
    // Ref for results section
    const resultsRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Debug logging
    console.log('Anomaly Detection - Current theme:', theme, 'isDark:', isDark);

    // Chat prompt state
    const [chatPrompt, setChatPrompt] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(null);

    // Speech-to-text state
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Grid reference for accessing filtered data
    const gridRef = useRef<any>(null);

    // Export dropdown state
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Debug: Log when PDF loading state changes
    useEffect(() => {
        console.log('PDF loading state changed:', isExportingPDF);
    }, [isExportingPDF]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (showExportDropdown && !isExportingPDF && !target.closest('.export-dropdown')) {
                setShowExportDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExportDropdown, isExportingPDF]);

    const router = useRouter();
    useEffect(() => {
        const user = getUser();
        if (!user) {
            router.replace("/login");
        }
    }, [router]);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                setSpeechSupported(true);
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    setIsListening(true);
                };

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setChatPrompt(prev => prev + (prev ? ' ' : '') + transcript);
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    // Speech recognition functions
    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };

    const user = typeof window !== "undefined" ? getUser() : null;
    if (!user) {
        return null;
    }
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [apiResponseData, setApiResponseData] = useState<any>(null);
    const [originalTotals, setOriginalTotals] = useState<{ total_rows: number, total_anomalies: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle the new API response structure with results array
    const rowData = useMemo(() => {
        if (!apiResponseData) return [];
        const dataArray = apiResponseData.results || apiResponseData.data || [];
        return Array.isArray(dataArray) ? dataArray : [];
    }, [apiResponseData]);

    const columnDefs: ColDef[] = [
        { field: "Transaction_ID", headerName: "Transaction ID", width: 200 },
        { field: "Transaction_Amount", headerName: "Amount", width: 150 },
        { field: "Is_Rounded_Amount", headerName: "Rounded Amount", width: 150 },
        { field: "Manual_Entry", headerName: "Manual Entry", width: 150 },
        { field: "Account_Type", headerName: "Account Type", width: 200 },
        { field: "Time_of_Day", headerName: "Time of Day", width: 150 },
        { field: "Day_of_Week", headerName: "Day of Week", width: 150 },
        { field: "Posting_Frequency", headerName: "Posting Frequency", width: 150 },
        { field: "rf_score", headerName: "RF Score", width: 150 },
    ];

    const defaultColDef: ColDef = {
        filter: true,
        floatingFilter: true,
        sortable: true,
        resizable: true,
    };

    // Helper function to get filtered data from AG-Grid
    const getFilteredData = () => {
        if (!gridRef.current || !gridRef.current.api) {
            console.log('Grid API not available, exporting all data');
            return rowData; // Fallback to all data if grid ref not available
        }

        const filteredData: any[] = [];
        gridRef.current.api.forEachNodeAfterFilter((node: any) => {
            filteredData.push(node.data);
        });

        console.log(`Exporting ${filteredData.length} filtered rows out of ${rowData.length} total rows`);
        return filteredData.length > 0 ? filteredData : rowData;
    };

    // Export functions
    const exportToExcel = async () => {
        const dataToExport = getFilteredData();
        if (dataToExport.length === 0) return;
        const ExcelJS = await import('exceljs');
        const { saveAs } = await import('file-saver');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data');

        // Prepare headers and fields
        const headers = columnDefs.map(col => col.headerName || col.field || '');
        const fields = columnDefs.map(col => col.field || '');

        // Add header row
        worksheet.addRow(headers);
        // Make header row bold
        worksheet.getRow(1).font = { bold: true };

        // Add data rows
        dataToExport.forEach(row => {
            worksheet.addRow(fields.map(field => row[field]));
        });

        // Auto-fit columns
        worksheet.columns.forEach((column, idx) => {
            let maxLength = headers[idx].length;
            if (column && typeof column.eachCell === 'function') {
                column.eachCell({ includeEmpty: true }, cell => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (cellValue.length > maxLength) maxLength = cellValue.length;
                });
            }
            column.width = maxLength + 2;
        });

        // Write to buffer and save
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'anomaly_data.xlsx');
        setShowExportDropdown(false);
    };

    const exportToCSV = async () => {
        const dataToExport = getFilteredData();
        if (dataToExport.length === 0) return;
        const ExcelJS = await import('exceljs');
        const { saveAs } = await import('file-saver');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data');

        // Prepare headers and fields
        const headers = columnDefs.map(col => col.headerName || col.field || '');
        const fields = columnDefs.map(col => col.field || '');

        // Add header row
        worksheet.addRow(headers);
        // Make header row bold
        worksheet.getRow(1).font = { bold: true };

        // Add data rows
        dataToExport.forEach(row => {
            worksheet.addRow(fields.map(field => row[field]));
        });

        // Auto-fit columns
        worksheet.columns.forEach((column, idx) => {
            let maxLength = headers[idx].length;
            if (column && typeof column.eachCell === 'function') {
                column.eachCell({ includeEmpty: true }, cell => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (cellValue.length > maxLength) maxLength = cellValue.length;
                });
            }
            column.width = maxLength + 2;
        });

        // Write to CSV buffer and save
        const csvBuffer = await workbook.csv.writeBuffer();
        saveAs(new Blob([csvBuffer], { type: 'text/csv;charset=utf-8;' }), 'anomaly_data.csv');
        setShowExportDropdown(false);
    };

    const exportToPDF = async () => {
        const dataToExport = getFilteredData();
        if (dataToExport.length === 0) return;

        console.log('Starting PDF export, setting loading state...');
        setIsExportingPDF(true);
        setShowExportDropdown(false);

        // Add a small delay to ensure loading state is visible
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            console.log('Loading jsPDF library...');
            const jsPDF = (await import('jspdf')).default;

            console.log('Loading autoTable plugin...');
            // Import autoTable plugin - this version should work correctly
            const { autoTable } = (await import('jspdf-autotable'));

            console.log('Creating PDF document...');
            const doc = new jsPDF('landscape');

            // Add title
            doc.setFontSize(16);
            doc.text('Anomaly Detection Results', 14, 22);

            console.log('Preparing table data...');
            // Prepare table data
            const headers = columnDefs.map(col => col.headerName || col.field || '');
            const tableData = dataToExport.map(row =>
                columnDefs.map(col => {
                    const value = row[col.field || ''];
                    return value !== null && value !== undefined ? String(value) : '';
                })
            );

            // Add another small delay to ensure loading is visible
            await new Promise(resolve => setTimeout(resolve, 200));

            console.log('Generating table...');
            // Use autoTable with the imported function
            autoTable(doc, {
                head: [headers],
                body: tableData,
                startY: 30,
                styles: {
                    fontSize: 10,
                    cellPadding: 3,
                },
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: 30, left: 14, right: 14 },
            });

            console.log('Saving PDF...');
            // Save the PDF
            doc.save('anomaly_data.pdf');
            console.log('PDF export completed successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to simple text download if PDF generation fails
            const headers = columnDefs.map(col => col.headerName || col.field).join(' | ');
            const rows = dataToExport.map(row =>
                columnDefs.map(col => row[col.field || ''] || '').join(' | ')
            ).join('\n');

            const content = `${headers}\n${'='.repeat(headers.length)}\n${rows}`;
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'anomaly_data.txt');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } finally {
            console.log('Clearing loading state...');
            setIsExportingPDF(false);
        }
    };

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }

    function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }

    function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0] || null;
        setSelectedFile(file);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function validateFile(file: File | null) {
        if (!file) return 'Please select a file to upload.';
        const allowed = ['json', 'csv', 'xls', 'xlsx'];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !allowed.includes(ext)) return 'Invalid file type. Accepted: .json, .csv, .xls, .xlsx';
        return null;
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        setError(null);
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
    }

    function handleLabelClick() {
        if (!selectedFile) fileInputRef.current?.click();
    }
    function handleReset() {
        setSelectedFile(null);
        setError(null);
        setApiResponseData(null);
        setOriginalTotals(null);
        setChatPrompt("");
        setLastSubmittedPrompt(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const validationError = validateFile(selectedFile);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        setIsLoading(true);
        // Send uploaded file to REST API
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('file', selectedFile);
        fetch(ENDPOINTS.ANOMALY_PREDICT, {
            headers: {
                'Accept': 'application/json',
            },
            method: 'POST',
            body: formData,
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to upload file');
                const data = await res.json();
                setApiResponseData(data);
                // Store original totals for later use in chat queries
                setOriginalTotals({
                    total_rows: data.total_rows || 0,
                    total_anomalies: data.total_anomalies || 0
                });
                if (fileInputRef.current) fileInputRef.current.value = "";
                // Scroll to results after response
                setTimeout(() => {
                    if (resultsRef.current) {
                        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 200);
            })
            .catch((err) => {
                setError('Error uploading file: ' + err.message);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    // Chat prompt submit handler
    function handleChatSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!chatPrompt.trim()) return;
        setIsChatLoading(true);
        const userMessage = chatPrompt.trim();
        setChatPrompt("");
        // Prepare FormData with user_query and file
        const formData = new FormData();
        formData.append('user_query', userMessage);
        if (selectedFile) {
            formData.append('file', selectedFile);
        }
        fetch(ENDPOINTS.ANOMALY_QUERY, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
            },
            body: formData,
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to process chat prompt');
                const data = await res.json();
                setLastSubmittedPrompt(userMessage);
                // Preserve original totals and only update the filtered data
                setApiResponseData({
                    ...data,
                    total_rows: originalTotals?.total_rows || 0,
                    total_anomalies: originalTotals?.total_anomalies || 0
                });
                logger.info('AI Response:', data);
            })
            .catch((err) => {
                setError('Error processing chat prompt: ' + err.message);
                logger.error('Chat error:', err.message);
            })
            .finally(() => {
                setIsChatLoading(false);
            });
    }

    return (
        <div className={`flex-1 flex flex-col items-center justify-normal bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-slate-900 py-2 px-2 relative ${isDark ? 'dark-mode-active' : ''}`}>
            {/* Full Page Loader */}
            {(isLoading || isChatLoading) && (
                <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4">
                        <svg className="animate-spin h-12 w-12 text-blue-900 dark:text-blue-300" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-lg font-medium text-blue-900">
                            {isLoading ? 'Processing file...' : 'Processing query...'}
                        </span>
                    </div>
                </div>
            )}
            <div className={`w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-900/20 p-4 dark:border-slate-700 ${isDark ? 'border force-dark-card' : ''}`}>
                <div className="mb-1">
                    <h1 className="text-3xl font-semibold text-blue-900 dark: footer-copyright drop-shadow text-left flex items-center gap-2">
                        <span>Anomaly Detection</span>
                    </h1>
                    <div className="w-20 h-1 bg-gradient-to-r from-blue-900 via-slate-400 to-blue-300 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 rounded-full mt-2 ml-1" />
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-2 text-center font-medium dark:drop-shadow-lg">Detect unusual patterns and outliers in your data using AI-powered algorithms. Upload your dataset and get instant insights.</p>

                <form className="flex flex-col items-center gap-4" onSubmit={handleSubmit}>
                    <input
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.csv,.xls,.xlsx"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div className="w-full flex flex-col md:flex-row gap-4 items-stretch pl-4">
                        <div
                            className={`w-full md:w-4/5 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-blue-900 dark:border-blue-400 rounded-xl bg-blue-50 dark:bg-slate-700 py-2 px-6 transition hover:border-blue-800 hover:bg-blue-100 dark:hover:bg-slate-600 shadow-md relative ${dragActive ? 'border-blue-400 bg-blue-100' : ''} ${isLoading ? 'pointer-events-none opacity-75' : ''}`}
                            onClick={handleLabelClick}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <svg className="w-10 h-10 text-blue-900 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                            <span className="text-lg font-semibold text-blue-900">Drag & drop or click to upload</span>
                            <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">Accepted formats: .json, .csv, .xls, .xlsx</span>
                            {selectedFile && (
                                <span className="mt-3 text-sm text-blue-900 dark:text-blue-200 font-medium">Selected: {selectedFile.name}</span>
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
                                {isLoading && (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isLoading ? 'Analyzing...' : 'Upload & Analyze'}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isLoading}
                                className={`rounded-lg px-6 py-3 font-semibold shadow transition cursor-pointer ${isLoading
                                    ? 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-slate-400 cursor-not-allowed'
                                    : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
                                    } w-full`}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div className="w-full text-center text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/20 rounded-md py-2">{error}</div>
                    )}
                </form>
                <div className="w-full mt-4">
                    <h2 ref={resultsRef} className="text-2xl font-bold mb-2 text-blue-900 dark: footer-copyright">
                        {apiResponseData ? 'Anomaly Detection Results' : ''}
                    </h2>
                    {apiResponseData && (
                        <div className="mb-2 flex flex-col md:flex-row gap-4 justify-start">
                            {/* Total Rows Alert */}
                            <div className="flex items-center p-4 text-blue-800 border border-blue-300 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800" role="alert">
                                <svg className="flex-shrink-0 w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                <div>
                                    <span className="font-medium">Total Rows:</span>
                                    <span className="ml-2 font-bold text-lg">{apiResponseData.total_rows || 0}</span>
                                </div>
                            </div>
                            {/* Total Anomalies Alert */}
                            <div className="flex items-center p-4 text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                </svg>
                                <div>
                                    <span className="font-medium">Total Anomalies:</span>
                                    <span className="ml-2 font-bold text-lg">{apiResponseData.total_anomalies || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {apiResponseData && (
                        <>
                            {/* AI Chat Filter Card */}
                            <div className="w-full mt-2 mb-2">
                                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-2 shadow-xl dark:shadow-2xl border border-blue-100 dark:border-slate-700 backdrop-blur-sm force-dark-card dark-mode-active chat-container-dark">

                                    {/* <div className="max-w-8xl mx-auto"> */}
                                        {/* <div className="w-full flex flex-col md:flex-row gap-4"> */}
                                            {/* Chat Card */}
                                            {/* <div className="w-full md:w-3/3 bg-white dark:bg-slate-900 backdrop-blur-md rounded-xl shadow-lg dark:shadow-2xl p-2 flex flex-col justify-between border border-blue-100 dark:border-slate-600 relative overflow-hidden force-dark-card chat-container-dark"> */}
                                                {/* Animated background gradient for dark mode */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-indigo-400/5 opacity-50"></div>

                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-lg shadow-lg">
                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8a9 9 0 1118 0z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">AI Chat Filter</span>
                                                            <span className="text-sm text-slate-700 dark:text-white-400">Ask AI to filter your data using natural language</span>
                                                        </div>
                                                    </div>

                                                    <form onSubmit={handleChatSubmit} className="relative">
                                                        <div className="relative group">
                                                            <input
                                                                type="text"
                                                                value={chatPrompt}
                                                                onChange={e => setChatPrompt(e.target.value)}
                                                                placeholder="Type your filter query or use microphone..."
                                                                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 px-3 py-3 pr-24 text-md focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-800 backdrop-blur-sm text-slate-900 dark:text-white shadow-lg dark:shadow-xl placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300 group-hover:shadow-xl dark:group-hover:shadow-2xl chat-input-dark"
                                                                disabled={isChatLoading}
                                                            />
                                                            {/* Enhanced glow effect on focus */}
                                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-400/30 dark:to-purple-400/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-xl"></div>
                                                        </div>

                                                        {/* Microphone Button */}
                                                        {speechSupported && (
                                                            <button
                                                                type="button"
                                                                onClick={isListening ? stopListening : startListening}
                                                                className={`absolute bottom-2 right-14 rounded-full p-2 shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer transform hover:scale-110 ${isListening
                                                                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 animate-pulse shadow-red-500/30'
                                                                        : 'bg-gradient-to-r from-gray-600 to-gray-700 dark:from-slate-600 dark:to-slate-700 text-white hover:from-gray-700 hover:to-gray-800 dark:hover:from-slate-500 dark:hover:to-slate-600 shadow-gray-500/30 dark:shadow-slate-500/30'
                                                                    }`}
                                                                disabled={isChatLoading}
                                                                title={isListening ? 'Stop listening' : 'Start voice input'}
                                                            >
                                                                {isListening ? (
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M6 6h12v12H6z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M12 1c-1.66 0-3 1.34-3 3v8c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3zm0 2c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1s-1-.45-1-1V4c0-.55.45-1 1-1zm6 8c0 3.31-2.69 6-6 6s-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8h-2zm-7 8v3h2v-3h-2z" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        )}

                                                        {/* Submit Button */}
                                                        <button
                                                            type="submit"
                                                            className="absolute bottom-2 right-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white p-2 shadow-lg hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-400 dark:hover:to-purple-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transform hover:scale-110 shadow-blue-500/30 dark:shadow-blue-400/30"
                                                            disabled={!chatPrompt.trim() || isChatLoading}
                                                        >
                                                            {isChatLoading ? (
                                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>

                                            {/* Last Applied Filter Card */}
                                            {lastSubmittedPrompt && (
                                                <div className="w-full md:w-1/3 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-lg dark:shadow-2xl p-2 border border-blue-200 dark:border-slate-600 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm force-dark-card chat-container-dark">
                                                    {/* Animated background for dark mode */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-indigo-400/10 dark:from-blue-300/5 dark:via-purple-300/5 dark:to-indigo-300/5 opacity-50"></div>

                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-lg shadow-lg">
                                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Last Applied Filter</span>
                                                        </div>
                                                        <div className="flex-1 flex items-center">
                                                            <div className="bg-gray dark:bg-slate-800 backdrop-blur-sm rounded-lg p-2 border border-blue-200/50 dark:border-slate-600/50 shadow-inner force-dark-card">
                                                                <p className="text-base text-slate-700 dark:text-slate-200 font-normal">{lastSubmittedPrompt}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                            {/* Export Button */}
                            <div className="flex justify-end mb-2">
                                <div className="relative export-dropdown">
                                    <button
                                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                                        disabled={isExportingPDF}
                                        className={`rounded-lg px-4 py-2 font-semibold shadow transition cursor-pointer flex items-center gap-2 ${isExportingPDF
                                                ? 'bg-orange-500 text-white cursor-not-allowed animate-pulse'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {isExportingPDF ? (
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        )}
                                        {isExportingPDF ? 'Generating PDF...' : 'Export'}
                                        {!isExportingPDF && (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </button>
                                    {showExportDropdown && !isExportingPDF && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-10">
                                            <div className="py-1">
                                                <button
                                                    onClick={exportToExcel}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                                    </svg>
                                                    Export to Excel
                                                </button>
                                                <button
                                                    onClick={exportToCSV}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                                    </svg>
                                                    Export to CSV
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        console.log('PDF export button clicked');
                                                        exportToPDF();
                                                    }}
                                                    disabled={isExportingPDF}
                                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${isExportingPDF
                                                            ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-50 dark:bg-slate-600'
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {isExportingPDF ? (
                                                        <svg className="w-4 h-4 text-red-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,10.5L11.5,12L15,8.5L16.5,10L11.5,15L8.5,12L10,10.5Z" />
                                                        </svg>
                                                    )}
                                                    {isExportingPDF ? 'Generating PDF...' : 'Export to PDF'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DataTable
                                gridRef={gridRef}
                                rowData={rowData}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                height="70vh"
                                highlightRowEnabled={true}
                                highlightRowCondition={row => row.rf_score > 80}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
