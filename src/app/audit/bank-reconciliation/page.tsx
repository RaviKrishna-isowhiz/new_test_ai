"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import React, { useRef, useState, useMemo } from 'react';
import { ColDef } from 'ag-grid-community';
import { useToast } from "@/contexts/ToastContext";

import logger from '@/lib/logger';
import { ENDPOINTS } from '@/config/api';
import { DataTable } from "@/components/DataTable";
import { KPICard } from "@/components/KPICard";
import { StatusBadge } from "@/components/StatusBadge";
import { DetailDrawer } from "@/components/DetailDrawer";
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
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

// Custom Plugin for Chart Labels
const chartLabelPlugin = {
    id: 'chartLabel',
    afterDatasetsDraw(chart: any) {
        const { ctx, data } = chart;
        ctx.save();
        data.datasets.forEach((dataset: any, i: number) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((element: any, index: number) => {
                const value = dataset.data[index];
                if (!value || value === 0) return;

                ctx.fillStyle = chart.config.type === 'doughnut' ? '#fff' : '#64748b';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const { x, y } = element.tooltipPosition();

                let label = value.toString();
                if (chart.config.type === 'doughnut') {
                    const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
                    label = ((value / total) * 100).toFixed(0) + '%';
                }

                ctx.fillText(label, x, y);
            });
        });
        ctx.restore();
    }
};

// Re-import DataTable (fixing the previously missing import from user change)
// import { DataTable } from '../../../../components/DataTable';

// TypeScript declarations for Speech Recognition API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function BankReconciliationPage() {
    const { showToast } = useToast();
    // Stepper State
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

    // Step 1: Batch Configuration
    const [batchName, setBatchName] = useState("");
    const [batchDescription, setBatchDescription] = useState("");
    const [periodStart, setPeriodStart] = useState(""); // UI-only
    const [periodEnd, setPeriodEnd] = useState("");     // UI-only
    const [batchId, setBatchId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Step 2: Files
    const [bankFile, setBankFile] = useState<File | null>(null);
    const [ledgerFile, setLedgerFile] = useState<File | null>(null);
    const [bankDragActive, setBankDragActive] = useState(false);
    const [ledgerDragActive, setLedgerDragActive] = useState(false);
    const bankInputRef = useRef<HTMLInputElement>(null);
    const ledgerInputRef = useRef<HTMLInputElement>(null);

    // Global UI states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);

    // Grid reference for accessing filtered data
    const gridRef = useRef<any>(null);

    // Data States
    const [apiResponseData, setApiResponseData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"matches" | "unmatched" | "stats" | "manual" | "audit">("matches");
    const [matchType, setMatchType] = useState<string>("exact");
    const [minConfidence, setMinConfidence] = useState<number>(0);
    const [matchesLimit, setMatchesLimit] = useState<number>(100);
    const [matchesOffset, setMatchesOffset] = useState<number>(0);
    const [isFetchingMatches, setIsFetchingMatches] = useState(false);

    // Manual Match States
    const [selectedBankTxn, setSelectedBankTxn] = useState<any | null>(null);
    const [selectedLedgerTxn, setSelectedLedgerTxn] = useState<any | null>(null);
    const [manualMatchNote, setManualMatchNote] = useState("");
    const [unmatchedBankTxns, setUnmatchedBankTxns] = useState<any[]>([]);
    const [unmatchedLedgerTxns, setUnmatchedLedgerTxns] = useState<any[]>([]);
    const [isFetchingManualData, setIsFetchingManualData] = useState(false);
    const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
    const [showManualMatchSuccess, setShowManualMatchSuccess] = useState(false);

    // Add Transaction Modal States
    const [showAddTxnModal, setShowAddTxnModal] = useState<"bank" | "ledger" | null>(null);
    const [newTxnDate, setNewTxnDate] = useState("");
    const [newTxnAmount, setNewTxnAmount] = useState("");
    const [newTxnDescription, setNewTxnDescription] = useState("");
    const [newTxnReference, setNewTxnReference] = useState("");
    const [isAddingTxn, setIsAddingTxn] = useState(false);

    // Audit Report State
    const [auditReport, setAuditReport] = useState<any>(null);
    const [isFetchingAudit, setIsFetchingAudit] = useState(false);

    // Unmatched Reason Modal State
    const [selectedReasonText, setSelectedReasonText] = useState<string | null>(null);

    // Chart Data Calculations
    const chartData = useMemo(() => {
        if (!apiResponseData) return null;

        // Use a helper to get numeric values and handle string numbers
        const getNum = (val: any) => {
            const num = Number(val);
            return isNaN(num) ? 0 : num;
        };

        const matchedCount = getNum(apiResponseData.matched_count || apiResponseData.Matched_Count || 0);
        const bankUnmatched = getNum(apiResponseData.unmatched_bank || apiResponseData.Unmatched_Bank || 0);
        const ledgerUnmatched = getNum(apiResponseData.unmatched_ledger || apiResponseData.Unmatched_Ledger || 0);
        const totalBank = getNum(apiResponseData.total_bank || apiResponseData.Total_Bank || 0);
        const totalLedger = getNum(apiResponseData.total_ledger || apiResponseData.Total_Ledger || 0);

        // 2. Metrics from results (Breakdown & Tiers)
        const results = apiResponseData.results || apiResponseData.data || [];
        const matchTypes = { exact: 0, fuzzy: 1, semantic: 1, partial: 1 }; // Starting with small defaults to avoid "empty" UI if no data
        matchTypes.exact = 0; matchTypes.fuzzy = 0; matchTypes.semantic = 0; matchTypes.partial = 0;

        const tiers = { high: 0, med: 0, low: 0 };

        // Tracking source-specific matches if only subset of results is available
        let resultsBankMatched = 0;
        let resultsLedgerMatched = 0;

        results.forEach((item: any) => {
            // Handle both camelCase and PascalCase from various API versions
            let mType = String(item.match_type || item.Match_Type || item.matchType || '').toLowerCase();

            // Normalize common type variations
            if (mType.includes('exact')) mType = 'exact';
            else if (mType.includes('fuzzy')) mType = 'fuzzy';
            else if (mType.includes('semantic')) mType = 'semantic';
            else if (mType.includes('partial')) mType = 'partial';

            if (matchTypes.hasOwnProperty(mType)) {
                matchTypes[mType as keyof typeof matchTypes]++;
            }

            const isMatched = item.is_matched === true ||
                item.is_matched === 'true' ||
                item.is_matched === 1 ||
                item.Status === 'Matched' ||
                item.status === 'matched';

            if (isMatched) {
                const score = getNum(item.confidence_score || item.Confidence_Score || item.score || 0);
                if (score >= 0.8) tiers.high++;
                else if (score >= 0.5) tiers.med++;
                else tiers.low++;

                // Check source for coverage
                const source = String(item.source || item.Source || '').toLowerCase();
                if (source === 'bank' || item.bank_description || item.Bank_Amount) resultsBankMatched++;
                if (source === 'ledger' || item.ledger_description || item.Ledger_Amount) resultsLedgerMatched++;
            }
        });

        // 3. Robust Coverage Calculation - Taking the max of computed vs summary
        const bankMatchedCount = Math.max(resultsBankMatched, matchedCount);
        const ledgerMatchedCount = Math.max(resultsLedgerMatched, matchedCount);

        // 4. Calculate Percentages for Status Legend
        const total = matchedCount + bankUnmatched + ledgerUnmatched || 1;
        const matchedPct = ((matchedCount / total) * 100).toFixed(0);
        const bankPct = ((bankUnmatched / total) * 100).toFixed(0);
        const ledgerPct = ((ledgerUnmatched / total) * 100).toFixed(0);

        return {
            status: {
                labels: [`Matched ${matchedPct}%`, `Bank Unmatched ${bankPct}%`, `Ledger Unmatched ${ledgerPct}%`],
                datasets: [{
                    label: 'Transactions',
                    data: [matchedCount, bankUnmatched, ledgerUnmatched],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    hoverOffset: 8,
                    borderWidth: 0,
                }]
            },
            matchTypes: {
                labels: ['Exact', 'Fuzzy', 'Semantic', 'Partial'],
                datasets: [{
                    label: 'Transactions',
                    data: [matchTypes.exact, matchTypes.fuzzy, matchTypes.semantic, matchTypes.partial],
                    backgroundColor: '#3b82f6',
                    borderRadius: 8,
                    barThickness: 32,
                }]
            },
            coverage: {
                labels: ['Bank', 'Ledger'],
                datasets: [
                    {
                        label: 'Matched',
                        data: [bankMatchedCount, ledgerMatchedCount],
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        barThickness: 48,
                    },
                    {
                        label: 'Unmatched',
                        data: [bankUnmatched, ledgerUnmatched],
                        backgroundColor: '#a855f7',
                        borderRadius: 6,
                        barThickness: 48,
                    }
                ]
            },
            confidence: {
                labels: ['HIGH ≥ 80%', 'MED 50-79%', 'LOW < 50%'],
                datasets: [{
                    label: 'Matches',
                    data: [tiers.high, tiers.med, tiers.low],
                    backgroundColor: ['#2dd4bf', '#f59e0b', '#ef4444'], // Teal, Amber, Red to match image
                    borderRadius: 8,
                    barThickness: 50,
                }]
            }
        };
    }, [apiResponseData]);

    // Ensure chart data is loaded when visiting stats tab
    useEffect(() => {
        if (batchId) {
            if (activeTab === "stats") {
                fetchDetailedMatches(batchId, { mType: "all", mConf: 0 });
            } else if (activeTab === "manual") {
                fetchManualData(batchId);
            } else if (activeTab === "audit") {
                fetchAuditReport(batchId);
            }
        }
    }, [activeTab, batchId]);

    const fetchAuditReport = async (id: string) => {
        if (!id) return;
        setIsFetchingAudit(true);
        try {
            const response = await fetch(ENDPOINTS.BANK_RECON_FULL_AUDIT(id));
            if (response.ok) {
                const data = await response.json();
                setAuditReport(data);
            }
        } catch (err) {
            logger.error("Failed to fetch audit report:", err);
        } finally {
            setIsFetchingAudit(false);
        }
    };

    const handleAddTxn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchId || !showAddTxnModal) return;

        setIsAddingTxn(true);
        try {
            const isBank = showAddTxnModal === "bank";
            const endpoint = isBank ? ENDPOINTS.BANK_RECON_ADD_BANK_TXN(batchId) : ENDPOINTS.BANK_RECON_ADD_LEDGER_TXN(batchId);

            const payload = {
                txn_date: newTxnDate,
                amount: parseFloat(newTxnAmount),
                description: newTxnDescription,
                reference: newTxnReference || null,
                currency: "USD"
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowAddTxnModal(null);
                setNewTxnDate("");
                setNewTxnAmount("");
                setNewTxnDescription("");
                setNewTxnReference("");
                await fetchManualData(batchId);

                // Fetch summary to update stats
                const summaryRes = await fetch(ENDPOINTS.BANK_RECON_GET_BATCH(batchId));
                if (summaryRes.ok) {
                    const summaryData = await summaryRes.json();
                    setApiResponseData((prev: any) => ({ ...prev, ...summaryData }));
                }
            } else {
                throw new Error("Failed to add transaction");
            }
        } catch (err: any) {
            setError(err.message || "Failed to add transaction");
        } finally {
            setIsAddingTxn(false);
        }
    };
    const [originalTotals, setOriginalTotals] = useState<{
        total_bank: number;
        total_ledger: number;
        matched_count: number;
        unmatched_bank: number;
        unmatched_ledger: number;
        match_rate: number;
    } | null>(null);

    // Export dropdown state
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Bank Preview states
    const [bankTransactions, setBankTransactions] = useState<any[]>([]);
    const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);
    const [isFetchingLedgerPreview, setIsFetchingLedgerPreview] = useState(false);

    const router = useRouter();
    useEffect(() => {
        const user = getUser();
        if (!user) {
            router.replace("/login");
        }
    }, [router]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (showExportDropdown && !isExportingPDF && !target.closest('.export-dropdown')) {
                setShowExportDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showExportDropdown, isExportingPDF]);


    // Batch Fetching
    useEffect(() => {
        if (currentStep === 1) {
            fetchBatches();
        }
    }, [currentStep]);

    // Detailed Match Fetching when filters change
    useEffect(() => {
        if (currentStep === 4 && batchId) {
            const timeoutId = setTimeout(() => {
                fetchDetailedMatches(batchId);
            }, 500); // Debounce to avoid excessive API calls
            return () => clearTimeout(timeoutId);
        }
    }, [matchType, minConfidence, currentStep, batchId, activeTab]);

    const fetchBatches = async () => {
        setIsLoadingBatches(true);
        try {
            const response = await fetch(ENDPOINTS.BANK_RECON_BATCHES);
            if (response.ok) {
                const data = await response.json();
                setBatches(Array.isArray(data) ? data : (data.batches || []));
            }
        } catch (err) {
            logger.error("Failed to fetch batches:", err);
        } finally {
            setIsLoadingBatches(false);
        }
    };

    // Summary Statistics for Step 1
    const summaryStats = useMemo(() => {
        const total = batches.length;
        const completed = batches.filter(b => (b.status || b.Status || '').toLowerCase().includes('complete')).length;
        const inReview = batches.filter(b => (b.status || b.Status || '').toLowerCase().includes('review')).length;
        const completePct = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, inReview, completePct };
    }, [batches]);

    const filteredBatches = useMemo(() => {
        if (!searchQuery) return batches;
        return batches.filter(b => 
            (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [batches, searchQuery]);
    const handleViewBatch = async (batch: any) => {
        const id = batch.id || batch.batch_id;
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(ENDPOINTS.BANK_RECON_GET_BATCH(id));
            if (!response.ok) throw new Error("Failed to fetch batch details");

            const data = await response.json();
            setBatchId(id);
            setBatchName(data.name || batch.name);
            setBatchDescription(data.description || batch.description || "");

            setApiResponseData(data);
            setOriginalTotals({
                total_bank: data.total_bank || 0,
                total_ledger: data.total_ledger || 0,
                matched_count: data.matched_count || 0,
                unmatched_bank: data.unmatched_bank || 0,
                unmatched_ledger: data.unmatched_ledger || 0,
                match_rate: data.match_rate || 0
            });

            setCurrentStep(4);
            // Fetch initial matches for this batch
            await fetchDetailedMatches(id);
        } catch (err: any) {
            logger.error("Error viewing batch:", err.message);
            setError("Failed to load batch details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBatch = async (batch: any) => {
        const id = batch.id || batch.batch_id;
        if (!id) return;

        if (!confirm(`Are you sure you want to delete the batch "${batch.name}"?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(ENDPOINTS.BANK_RECON_DELETE_BATCH(id), {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchBatches();
            } else {
                throw new Error("Failed to delete batch");
            }
        } catch (err: any) {
            logger.error("Error deleting batch:", err.message);
            setError("Failed to delete batch. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // File handling
    const validateFile = (file: File | null) => {
        if (!file) return 'Please select a file to upload.';
        const allowed = ['json', 'csv', 'xls', 'xlsx'];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !allowed.includes(ext)) return 'Invalid file type. Accepted: .json, .csv, .xls, .xlsx';
        return null;
    };

    const handleBankDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setBankDragActive(false);
        const file = e.dataTransfer.files?.[0] || null;
        if (file) handleBankFileUpload(file);
    };
    const handleLedgerDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setLedgerDragActive(false);
        const file = e.dataTransfer.files?.[0] || null;
        setLedgerFile(file); setError(null);
    };

    const handleBankFileUpload = async (file: File) => {
        if (!batchId) {
            setError("No active batch found. Please create or select a batch first.");
            return;
        }

        const fileErr = validateFile(file);
        if (fileErr) {
            setError(fileErr);
            return;
        }

        setBankFile(file);
        setIsFetchingPreview(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(ENDPOINTS.BANK_RECON_UPLOAD_BANK(batchId), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Failed to upload bank statement");
            showToast("Bank statement processed", "success");
            await fetchBankPreview(batchId);
        } catch (err: any) {
            logger.error("Error uploading bank statement:", err.message);
            showToast("Failed to upload bank statement", "error");
            // Mock data for preview if API fails
            setBankTransactions([
                { Transaction_ID: 'PREVIEW-001', Date: '2026-03-05', Description: 'Client Payment', Bank_Amount: 1500.00, Ledger_Amount: 0, Discrepancy: 1500, Status: 'Unmatched' },
                { Transaction_ID: 'PREVIEW-002', Date: '2026-03-06', Description: 'Office Supplies', Bank_Amount: -250.50, Ledger_Amount: 0, Discrepancy: -250.5, Status: 'Unmatched' },
            ]);
        } finally {
            setIsFetchingPreview(false);
        }
    };

    const fetchBankPreview = async (id: string) => {
        setIsFetchingPreview(true);
        setError(null);
        try {
            const response = await fetch(`${ENDPOINTS.BANK_RECON_TRANSACTIONS(id)}?source=bank`);
            if (response.ok) {
                const data = await response.json();
                // Handle different response structures
                const results = Array.isArray(data) ? data : (data.results || data.items || data.data || []);
                setBankTransactions(results);
            } else {
                throw new Error("Failed to fetch bank transactions");
            }
        } catch (err: any) {
            logger.error("Error fetching bank preview:", err.message);
            setError("Failed to fetch bank preview from API.");
            // Fallback for demo if API fails
            setBankTransactions([
                { amount: 1500.00, txn_date: '2026-03-05', description: 'Client Payment', reference: 'REF-001', currency: 'USD', created_at: '2026-03-12T10:00:00Z' },
                { amount: -250.50, txn_date: '2026-03-06', description: 'Office Supplies', reference: 'REF-002', currency: 'USD', created_at: '2026-03-12T10:05:00Z' },
            ]);
        } finally {
            setIsFetchingPreview(false);
        }
    };

    const fetchLedgerPreview = async (id: string) => {
        setIsFetchingLedgerPreview(true);
        setError(null);
        try {
            const response = await fetch(`${ENDPOINTS.BANK_RECON_TRANSACTIONS(id)}?source=ledger`);
            if (response.ok) {
                const data = await response.json();
                const results = Array.isArray(data) ? data : (data.results || data.items || data.data || []);
                setLedgerTransactions(results);
            } else {
                throw new Error("Failed to fetch ledger transactions");
            }
        } catch (err: any) {
            logger.error("Error fetching ledger preview:", err.message);
            setError("Failed to fetch ledger preview from API.");
            // Fallback for demo
            setLedgerTransactions([
                { amount: 1500.00, txn_date: '2026-03-05', description: 'Office Rent Payment', reference: 'LED-001', currency: 'USD', created_at: '2026-03-12T11:00:00Z' },
                { amount: -250.50, txn_date: '2026-03-06', description: 'Utility Bill', reference: 'LED-002', currency: 'USD', created_at: '2026-03-12T11:05:00Z' },
            ]);
        } finally {
            setIsFetchingLedgerPreview(false);
        }
    };

    const handleLedgerFileUpload = async (file: File) => {
        if (!batchId) {
            setError("No active batch found.");
            return;
        }

        const fileErr = validateFile(file);
        if (fileErr) {
            setError(fileErr);
            return;
        }

        setLedgerFile(file);
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(ENDPOINTS.BANK_RECON_UPLOAD_LEDGER(batchId), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Failed to upload ledger data");
            showToast("Ledger data uploaded successfully", "success");
            await fetchLedgerPreview(batchId);
        } catch (err: any) {
            logger.error("Error uploading ledger data:", err.message);
            showToast("Failed to upload ledger data. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Actions
    const handleCreateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!batchName.trim()) {
            setError("Batch Name is required.");
            return;
        }

        setIsLoading(true);

        try {
            // Create Batch
            const response = await fetch(ENDPOINTS.BANK_RECON_BATCHES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: batchName, description: batchDescription })
            });
            let newBatchId = `BATCH-${Date.now()}`;
            if (response.ok) {
                const data = await response.json();
                newBatchId = data.id || data.batch_id || newBatchId;
                showToast("New batch initialized", "success");
            }
            setBatchId(newBatchId);
            setCurrentStep(2);
            setIsLoading(false);
        } catch (err: any) {
            logger.warn('API sequence failed, falling back to mocks:', err.message);
            // Mock behavior
            setTimeout(() => {
                setBatchId(`BATCH-${Date.now()}`);
                setCurrentStep(2);
                setIsLoading(false);
            }, 800);
        }
    };

    const handleRunReconciliation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchId) return;

        setIsLoading(true);
        setError(null);

        try {
            // Trigger Reconcile
            const reconRes = await fetch(ENDPOINTS.BANK_RECON_RECONCILE(batchId), { method: 'POST' });
            if (!reconRes.ok) throw new Error("Reconciliation trigger failed");

            const data = await reconRes.json();
            setApiResponseData(data);
            setOriginalTotals({
                total_bank: data.total_bank || 0,
                total_ledger: data.total_ledger || 0,
                matched_count: data.matched_count || 0,
                unmatched_bank: data.unmatched_bank || 0,
                unmatched_ledger: data.unmatched_ledger || 0,
                match_rate: data.match_rate || 0
            });
            setCurrentStep(4);
            setIsLoading(false);
        } catch (err: any) {
            logger.warn('API sequence failed, falling back to mocks:', err.message);
            // Mock behavior
            setTimeout(() => {
                const mockData = {
                    total_bank: 50,
                    total_ledger: 48,
                    matched_count: 45,
                    unmatched_bank: 5,
                    unmatched_ledger: 3,
                    match_rate: 90.5,
                    results: [
                        { Transaction_ID: 'TXN-001', Date: '2026-03-05', Bank_Amount: 1500.00, Ledger_Amount: 1500.00, Discrepancy: 0, Status: 'Matched', Description: 'Client Payment', bank_description: 'Client Payment 001', ledger_description: 'Client Payment 001' },
                        { Transaction_ID: 'TXN-002', Date: '2026-03-06', Bank_Amount: -250.50, Ledger_Amount: -250.50, Discrepancy: 0, Status: 'Matched', Description: 'Office Supplies', bank_description: 'Office Supplies Purchase', ledger_description: 'Office Supplies Expense' },
                        { Transaction_ID: 'TXN-003', Date: '2026-03-08', Bank_Amount: 850.00, Ledger_Amount: 500.00, Discrepancy: 350.00, Status: 'Unmatched', Description: 'Unknown Deposit', bank_description: 'Unknown Deposit Ref 123', ledger_description: 'Expected Deposit 500' },
                        { Transaction_ID: 'TXN-004', Date: '2026-03-10', Bank_Amount: 0, Ledger_Amount: -1200.00, Discrepancy: -1200.00, Status: 'Unmatched', Description: 'Pending Rent Check', bank_description: '', ledger_description: 'Rent Check Pending' },
                        { Transaction_ID: 'TXN-005', Date: '2026-03-11', Bank_Amount: -45.00, Ledger_Amount: -45.00, Discrepancy: 0, Status: 'Matched', Description: 'Software Subscription', bank_description: 'Software Sub GitHub', ledger_description: 'Software Sub GitHub' },
                    ]
                };
                setApiResponseData(mockData);
                setOriginalTotals({
                    total_bank: mockData.total_bank,
                    total_ledger: mockData.total_ledger,
                    matched_count: mockData.matched_count,
                    unmatched_bank: mockData.unmatched_bank,
                    unmatched_ledger: mockData.unmatched_ledger,
                    match_rate: mockData.match_rate
                });
                setCurrentStep(4);
                setIsLoading(false);
            }, 1500);
        }
    };

    const handleReconcile = async () => {
        if (!batchId) return;
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(ENDPOINTS.BANK_RECON_RECONCILE(batchId), { method: 'GET' });
            if (!response.ok) throw new Error("Failed to reconcile batch");
            const data = await response.json();

            setApiResponseData(data);
            setOriginalTotals({
                total_bank: data.total_bank || 0,
                total_ledger: data.total_ledger || 0,
                matched_count: data.matched_count || 0,
                unmatched_bank: data.unmatched_bank || 0,
                unmatched_ledger: data.unmatched_ledger || 0,
                match_rate: data.match_rate || 0
            });
            setCurrentStep(4);
            setIsLoading(false);

            // After reconciliation, fetch detailed matches
            await fetchDetailedMatches(batchId);
        } catch (err: any) {
            logger.warn('Reconcile API call failed, falling back to mock data:', err.message);
            // Mock behavior
            setTimeout(() => {
                const mockData = {
                    total_bank: 100,
                    total_ledger: 95,
                    matched_count: 90,
                    unmatched_bank: 10,
                    unmatched_ledger: 5,
                    match_rate: 94.7,
                    results: [
                        { Transaction_ID: 'TXN-M1', Date: '2026-03-11', Bank_Amount: -45.00, Ledger_Amount: -45.00, Discrepancy: 0, Status: 'Matched', Description: 'Software Subscription', bank_description: 'Software Sub GitHub', ledger_description: 'Software Sub GitHub', match_type: 'exact', confidence_score: 1.0 },
                        { Transaction_ID: 'TXN-M2', Date: '2026-03-12', Bank_Amount: 1200.00, Ledger_Amount: 1210.00, Discrepancy: 10, Status: 'Matched', Description: 'Client Payment', bank_description: 'Client A Payment', ledger_description: 'Client A Invoice', match_type: 'fuzzy', confidence_score: 0.85 },
                        { Transaction_ID: 'TXN-M3', Date: '2026-03-13', Bank_Amount: -500.00, Ledger_Amount: -500.00, Discrepancy: 0, Status: 'Matched', Description: 'Consulting Fee', bank_description: 'Strategic Consulting', ledger_description: 'Consulting Services', match_type: 'semantic', confidence_score: 0.92 },
                        { Transaction_ID: 'TXN-M4', Date: '2026-03-14', Bank_Amount: 250.00, Ledger_Amount: 250.00, Discrepancy: 0, Status: 'Matched', Description: 'Refund', bank_description: 'Refund processed', ledger_description: 'Customer Refund', match_type: 'partial', confidence_score: 0.45 },
                    ]
                };
                setApiResponseData(mockData);
                setOriginalTotals({
                    total_bank: mockData.total_bank,
                    total_ledger: mockData.total_ledger,
                    matched_count: mockData.matched_count,
                    unmatched_bank: mockData.unmatched_bank,
                    unmatched_ledger: mockData.unmatched_ledger,
                    match_rate: mockData.match_rate
                });
                setCurrentStep(4);
                setIsLoading(false);
            }, 1500);
        }
    };

    const fetchDetailedMatches = async (id: string = batchId || "", params: { mType?: string, mConf?: number } = {}) => {
        if (!id) return;
        setIsFetchingMatches(true);
        try {
            const queryParams = new URLSearchParams({
                match_type: params.mType || matchType,
                min_confidence: (params.mConf !== undefined ? params.mConf : minConfidence).toString(),
                limit: matchesLimit.toString(),
                offset: matchesOffset.toString()
            }).toString();

            const endpointUrl = activeTab === "unmatched"
                ? ENDPOINTS.BANK_RECON_UNMATCHED(id, `?${queryParams}`)
                : ENDPOINTS.BANK_RECON_MATCHES(id, `?${queryParams}`);

            const response = await fetch(endpointUrl);
            if (response.ok) {
                const data = await response.json();
                const matches = Array.isArray(data) ? data : (data.results || data.data || []);
                // Transform data: Ensure Transaction_ID is integer and handle other fields
                const transformedMatches = matches.map((item: any) => {
                    // Determine if it's a bank or ledger solo item if it's unmatched
                    const isBankSolo = item.source === 'bank' || item.Source === 'Bank' || (item.Bank_Amount && !item.Ledger_Amount);
                    const isLedgerSolo = item.source === 'ledger' || item.Source === 'Ledger' || (item.Ledger_Amount && !item.Bank_Amount);

                    return {
                        ...item,
                        Transaction_ID: item.Transaction_ID ? parseInt(String(item.Transaction_ID)) : item.Transaction_ID,
                        // Fix for missing descriptions in unmatched results
                        bank_description: item.bank_description || (isBankSolo ? item.description || item.Description : ''),
                        ledger_description: item.ledger_description || (isLedgerSolo ? item.description || item.Description : ''),
                    };
                });

                // Update results in apiResponseData to reflect the specific matches
                setApiResponseData((prev: any) => ({
                    ...prev,
                    results: transformedMatches
                }));

            }
        } catch (err) {
            logger.error("Failed to fetch detailed matches:", err);
        } finally {
            setIsFetchingMatches(false);
        }
    };

    const fetchManualData = async (id: string) => {
        if (!id) return;
        setIsFetchingManualData(true);
        try {
            const response = await fetch(ENDPOINTS.BANK_RECON_UNMATCHED(id, '?limit=500'));
            if (response.ok) {
                const data = await response.json();
                const unmatched = Array.isArray(data) ? data : (data.results || data.data || []);

                // Split into bank and ledger
                const bank = unmatched.filter((item: any) =>
                    item.source === 'bank' || item.Source === 'Bank' || (item.Bank_Amount && !item.Ledger_Amount)
                );
                const ledger = unmatched.filter((item: any) =>
                    item.source === 'ledger' || item.Source === 'Ledger' || (item.Ledger_Amount && !item.Bank_Amount)
                );

                setUnmatchedBankTxns(bank);
                setUnmatchedLedgerTxns(ledger);
            }
        } catch (err) {
            logger.error("Failed to fetch manual match data:", err);
        } finally {
            setIsFetchingManualData(false);
        }
    };

    const handleManualMatch = async () => {
        if (!batchId || !selectedBankTxn || !selectedLedgerTxn) {
            setError("Please select both a bank and a ledger transaction to match.");
            return;
        }

        setIsSubmittingMatch(true);
        setError(null);

        try {
            const bankId = selectedBankTxn.transaction_id || selectedBankTxn.Transaction_ID || selectedBankTxn.id;
            const ledgerId = selectedLedgerTxn.transaction_id || selectedLedgerTxn.Transaction_ID || selectedLedgerTxn.id;

            const response = await fetch(ENDPOINTS.BANK_RECON_MANUAL_MATCH(batchId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank_txn_id: String(bankId),
                    ledger_txn_id: String(ledgerId),
                    note: manualMatchNote
                })
            });

            if (response.ok) {
                setSelectedBankTxn(null);
                setSelectedLedgerTxn(null);
                setManualMatchNote("");

                // Refresh data
                if (batchId) {
                    await fetchDetailedMatches(batchId);
                    await fetchManualData(batchId);

                    // Fetch summary to update stats
                    const summaryRes = await fetch(ENDPOINTS.BANK_RECON_GET_BATCH(batchId));
                    if (summaryRes.ok) {
                        const summaryData = await summaryRes.json();
                        setApiResponseData((prev: any) => ({
                            ...prev,
                            ...summaryData
                        }));
                    }
                }

                showToast("Transactions matched successfully", "success");
            } else {
                const errData = await response.json();
                throw new Error(errData.detail || errData.message || "Failed to perform manual match");
            }
        } catch (err: any) {
            logger.error("Manual match error:", err.message);
            showToast(err.message, "error");
        } finally {
            setIsSubmittingMatch(false);
        }
    };

    // AI Chat Filter logic removed as per user request

    const handleReset = () => {
        setCurrentStep(1);
        setBatchName(""); setBatchDescription(""); setBatchId(null);
        setBankFile(null); setLedgerFile(null);
        setApiResponseData(null); setOriginalTotals(null);
        setError(null);
    };

    // Table Setup
    const rowData = useMemo(() => {
        if (!apiResponseData) return [];
        const dataArray = apiResponseData.results || apiResponseData.data || [];
        return Array.isArray(dataArray) ? dataArray : [];
    }, [apiResponseData]);

    const columnDefs: ColDef[] = useMemo(() => {
        if (activeTab === "unmatched") {
            return [
                { field: "reference", headerName: "Reference", flex: 1.2, minWidth: 140 },
                { field: "description", headerName: "Description", flex: 2, minWidth: 200 },
                { field: "source", headerName: "Source", flex: 0.8, minWidth: 100, cellClass: 'capitalize italic' },
                { field: "amount", headerName: "Amount", flex: 1, minWidth: 100, cellClass: 'font-bold text-slate-800 dark:text-white' },
                { field: "txn_date", headerName: "Date", flex: 1, minWidth: 120 },
                {
                    field: "unmatched_reason",
                    headerName: "Unmatched Reason",
                    flex: 3,
                    minWidth: 300,
                    cellRenderer: (params: any) => {
                        const val = params.value || '';
                        if (!val) return '-';
                        return (
                            <div
                                className="truncate cursor-pointer text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 w-full hover:underline"
                                onClick={() => setSelectedReasonText(val)}
                                title="Click to view full reason"
                            >
                                {val.length > 50 ? val.substring(0, 50) + '...' : val}
                            </div>
                        );
                    }
                },
            ];
        }

        return [
            { field: "bank_description", headerName: "Bank Description", flex: 2, minWidth: 200 },
            { field: "ledger_description", headerName: "Ledger Description", flex: 2, minWidth: 200 },
            {
                field: "confidence_score",
                headerName: "Confidence / Match",
                flex: 1,
                minWidth: 120,
                valueFormatter: (params: any) => (params.value !== undefined && params.value !== null) ? `${(params.value * 100).toFixed(1)}%` : '-'
            },
            {
                field: "amount_match",
                headerName: "Amt. Match",
                flex: 0.8,
                minWidth: 100,
                cellRenderer: (params: any) => (params.value === true) ? '✅' : (params.value === false ? '❌' : '-')
            },
            {
                field: "date_diff_days",
                headerName: "Date Diff.",
                flex: 0.8,
                minWidth: 100,
                valueFormatter: (params: any) => (params.value !== undefined && params.value !== null) ? `${params.value}d` : '-'
            },
            {
                field: "description_similarity",
                headerName: "Desc. Simil.",
                flex: 1,
                minWidth: 120,
                valueFormatter: (params: any) => (params.value !== undefined && params.value !== null) ? `${(params.value * 100).toFixed(1)}%` : '-'
            },
            {
                field: "reference_match",
                headerName: "Ref. Match",
                flex: 0.8,
                minWidth: 100,
                cellRenderer: (params: any) => (params.value === true) ? '✅' : (params.value === false ? '❌' : '-')
            },
        ];
    }, [activeTab]);

    const bankPreviewColumns: ColDef[] = [
        { field: "txn_date", headerName: "Transaction Date", flex: 1, minWidth: 120 },
        { field: "description", headerName: "Description", flex: 2, minWidth: 200 },
        { field: "reference", headerName: "Reference", flex: 1, minWidth: 120 },
        { field: "currency", headerName: "Currency", flex: 0.8, minWidth: 80 },
        { field: "amount", headerName: "Amount", flex: 1, minWidth: 100, cellClass: 'font-bold text-blue-700' },
        { field: "created_at", headerName: "Created At", flex: 1.2, minWidth: 150 },
    ];


    const defaultColDef: ColDef = { filter: true, floatingFilter: true, sortable: true, resizable: true };

    const getFilteredData = () => {
        if (!gridRef.current || !gridRef.current.api) return rowData;
        const filteredData: any[] = [];
        gridRef.current.api.forEachNodeAfterFilter((node: any) => filteredData.push(node.data));
        return filteredData.length > 0 ? filteredData : rowData;
    };

    // Exports
    const exportToExcel = () => {
        const dataToExport = getFilteredData();
        if (dataToExport.length === 0) return;
        import('xlsx').then(XLSX => {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
            XLSX.writeFile(workbook, 'bank_recon_data.xlsx');
        });
        setShowExportDropdown(false);
    };

    const exportToCSV = () => {
        const dataToExport = getFilteredData();
        if (dataToExport.length === 0) return;
        import('xlsx').then(XLSX => {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'bank_recon_data.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
        setShowExportDropdown(false);
    };

    const exportToPDF = async () => {
        const dataToExport = getFilteredData();
        if (dataToExport.length === 0) return;

        setIsExportingPDF(true);
        setShowExportDropdown(false);
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const jsPDF = (await import('jspdf')).default;
            const { autoTable } = (await import('jspdf-autotable'));

            const doc = new jsPDF('landscape');
            doc.setFontSize(16);
            doc.text(`Bank Reconciliation Results - ${batchName || batchId}`, 14, 22);

            const headers = columnDefs.map(col => col.headerName || col.field || '');
            const tableData = dataToExport.map(row =>
                columnDefs.map(col => {
                    const value = row[col.field || ''];
                    return value !== null && value !== undefined ? String(value) : '';
                })
            );

            autoTable(doc, {
                head: [headers],
                body: tableData,
                startY: 30,
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { top: 30, left: 14, right: 14 },
            });
            doc.save('bank_recon_data.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsExportingPDF(false);
        }
    };


    const user = typeof window !== "undefined" ? getUser() : null;
    if (!user) return null;

    return (
        <div className="flex-1 flex flex-col items-center justify-normal bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 py-2 px-2 relative">
            {/* Loader overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4">
                        <svg className="animate-spin h-12 w-12 text-blue-900 dark:text-blue-200" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-lg font-medium text-blue-900 dark:text-blue-200">
                            Processing...
                        </span>
                    </div>
                </div>
            )}

            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4">
                <div className="mb-1">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 text-left">
                                {currentStep > 1 && (
                                    <div className="mb-2 flex items-center gap-4">
                                        <button 
                                            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4)}
                                            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#1d1e63] dark:hover:bg-blue-600 transition-all duration-300"
                                        >
                                            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-white uppercase tracking-[0.2em] transition-colors">Back</span>
                                        </button>
                                    </div>
                                )}
                                <h1 className="text-3xl font-semibold text-[#1d1e63] dark:text-blue-200 drop-shadow flex items-center justify-start gap-2">
                                    <span>Bank Reconciliation</span>
                                </h1>
                                <div className="w-20 h-1 bg-gradient-to-r from-blue-900 via-slate-400 to-blue-300 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 rounded-full mt-2 ml-1" />
                        </div>
                    </div>
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-2 text-left font-medium drop-shadow-sm">Reconcile your bank statements with AI-powered matching algorithms.</p>
                
                {/* Stepper Wizard Indicator - Restored Design */}
                <div className="w-full max-w-5xl mx-auto my-12 px-4">
                    <div className="relative flex items-center justify-between">
                        {/* Connecting Line Background */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
                        
                        {[
                            { step: 1, label: 'BATCH' },
                            { step: 2, label: 'BANK STATEMENT' },
                            { step: 3, label: 'LEDGER DATA' },
                            { step: 4, label: 'RESULTS' }
                        ].map((s, idx) => (
                            <div key={s.step} className="relative z-10 flex items-center gap-3 bg-white dark:bg-slate-900 px-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= s.step ? 'bg-[#1d1e63] text-white shadow-xl scale-110' : 'bg-slate-200 text-slate-500'}`}>
                                    {s.step}
                                </div>
                                <span className={`text-xs font-black tracking-widest transition-colors duration-300 ${currentStep >= s.step ? 'text-[#1d1e63] dark:text-blue-300' : 'text-slate-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="w-full text-center text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/20 rounded-md py-2 mb-4">{error}</div>
                )}


                {/* STEP 1: BATCH MANAGEMENT (CREATE OR SELECT) */}
                {currentStep === 1 && (
                    <div className="w-full space-y-8 mt-8">
                        {/* Summary Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl shadow-lg transition hover:scale-105 duration-300 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Total batches</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-[#1d1e63] dark:text-white">{summaryStats.total}</span>
                                    <span className="text-xs font-bold text-slate-400">All time</span>
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl shadow-lg transition hover:scale-105 duration-300 border border-emerald-100 dark:border-emerald-900/20 bg-white dark:bg-slate-900/50">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">Completed</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{summaryStats.completed}</span>
                                    <span className="text-xs font-bold text-slate-400">{summaryStats.completePct}% complete</span>
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl shadow-lg transition hover:scale-105 duration-300 border border-blue-100 dark:border-blue-900/20 bg-white dark:bg-slate-900/50">
                                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">In review</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-blue-600 dark:text-blue-400">{summaryStats.inReview}</span>
                                    <span className="text-xs font-bold text-slate-400">Needs attention</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                            {/* Create Batch - Column 1 */}
                            <div className="lg:col-span-1 p-8 rounded-2xl shadow-lg transition hover:scale-105 duration-300 border border-blue-100 dark:border-blue-800/20 bg-blue-50/50 dark:bg-blue-900/10 flex flex-col h-full">
                                <h3 className="text-lg font-black text-[#1d1e63] dark:text-blue-300 mb-6 flex items-center gap-2 tracking-tight">
                                    <span className="text-blue-600">+</span> Create new batch
                                </h3>
                                <form onSubmit={handleCreateBatch} className="space-y-4 flex-1 flex flex-col">
                                    <div className="space-y-4">
                                        <div className="group relative flex flex-col gap-2">
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-xl"></div>
                                            <label htmlFor="batchName" className="text-[10px] font-black text-slate-400 group-focus-within:bg-gradient-to-r group-focus-within:from-blue-600 group-focus-within:to-indigo-600 group-focus-within:bg-clip-text group-focus-within:text-transparent uppercase tracking-widest transition-all pl-1 cursor-pointer">Batch Identity</label>
                                            <input
                                                id="batchName"
                                                type="text"
                                                required
                                                value={batchName} onChange={e => setBatchName(e.target.value)}
                                                placeholder="Batch name * (e.g. March 2026)"
                                                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-white transition-all font-medium"
                                            />
                                        </div>
                                        <div className="group relative flex flex-col gap-2">
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-xl"></div>
                                            <label htmlFor="batchDesc" className="text-[10px] font-black text-slate-400 group-focus-within:bg-gradient-to-r group-focus-within:from-blue-600 group-focus-within:to-indigo-600 group-focus-within:bg-clip-text group-focus-within:text-transparent uppercase tracking-widest transition-all pl-1 cursor-pointer">Description / Notes</label>
                                            <textarea
                                                id="batchDesc"
                                                rows={3}
                                                value={batchDescription} onChange={e => setBatchDescription(e.target.value)}
                                                placeholder="Description (optional)"
                                                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-white transition-all font-medium resize-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="group relative flex flex-col gap-2">
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-xl"></div>
                                                <label htmlFor="periodStart" className="text-[10px] font-black text-slate-400 group-focus-within:bg-gradient-to-r group-focus-within:from-blue-600 group-focus-within:to-indigo-600 group-focus-within:bg-clip-text group-focus-within:text-transparent uppercase tracking-widest transition-all pl-1 cursor-pointer">Period Start</label>
                                                <input
                                                    id="periodStart"
                                                    type="date"
                                                    value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                                                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-white font-medium"
                                                />
                                            </div>
                                            <div className="group relative flex flex-col gap-2">
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-xl"></div>
                                                <label htmlFor="periodEnd" className="text-[10px] font-black text-slate-400 group-focus-within:bg-gradient-to-r group-focus-within:from-blue-600 group-focus-within:to-indigo-600 group-focus-within:bg-clip-text group-focus-within:text-transparent uppercase tracking-widest transition-all pl-1 cursor-pointer">Period End</label>
                                                <input
                                                    id="periodEnd"
                                                    type="date"
                                                    value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                                                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-white font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !batchName}
                                        className="w-full bg-[#1d1e63] dark:bg-blue-600 hover:bg-black text-white py-4 rounded-xl font-black text-xs tracking-[0.2em] uppercase transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-900/10"
                                    >
                                        {isLoading ? 'Creating...' : 'Initialize Batch'}
                                    </button>
                                </form>
                            </div>

                            {/* Existing Batches List - Column 2-3 */}
                            <div className="lg:col-span-1 p-8 rounded-2xl shadow-lg transition hover:scale-105 duration-300 border border-indigo-100 dark:border-indigo-800/20 bg-indigo-50/50 dark:bg-indigo-900/10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-[#1d1e63] dark:text-blue-300 flex items-center gap-2">
                                        Existing batches
                                        <div className="w-6 h-6 rounded-full bg-[#1d1e63] text-white flex items-center justify-center text-[10px] font-black">{batches.length}</div>
                                    </h3>
                                    <div className="group relative">
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-xl"></div>
                                        <label htmlFor="batchSearch" className="absolute -top-6 left-1 text-[10px] font-black text-slate-400 group-focus-within:bg-gradient-to-r group-focus-within:from-blue-600 group-focus-within:to-indigo-600 group-focus-within:bg-clip-text group-focus-within:text-transparent uppercase tracking-widest transition-all cursor-pointer">Search Batches</label>
                                        <input 
                                            id="batchSearch"
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="e.g. Isowhiz"
                                            className="pl-4 pr-10 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 min-w-[240px] transition-all"
                                        />
                                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>

                                <div className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                    <table className="w-full border-separate border-spacing-y-4">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                <th className="text-left py-2 px-4">Batch Name</th>
                                                <th className="text-left py-2 px-4">Description</th>
                                                <th className="text-left py-2 px-4">Status</th>
                                                <th className="text-right py-2 px-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoadingBatches ? (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Synchronizing...</td>
                                                </tr>
                                            ) : filteredBatches.length > 0 ? (
                                                filteredBatches.map((batch, idx) => {
                                                    const status = (batch.status || batch.Status || 'Pending').toLowerCase();
                                                    const isComplete = status.includes('complete');
                                                    const isInReview = status.includes('review');

                                                    return (
                                                        <tr key={batch.id || idx} className="group bg-white dark:bg-slate-900/60 rounded-xl transition-all hover:bg-white/80 dark:hover:bg-slate-800 shadow-sm">
                                                            <td className="py-4 px-4 rounded-l-xl">
                                                                <span className="font-bold text-slate-800 dark:text-white block truncate max-w-[150px]">{batch.name}</span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="text-sm text-slate-500 dark:text-slate-400 block truncate max-w-[200px]">{batch.description || "Active recon batch"}</span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                                    isComplete ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                                                                    isInReview ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                                                    'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                                                                }`}>
                                                                    {status}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-right rounded-r-xl">
                                                                <div className="flex items-center justify-end gap-4">
                                                                    <button
                                                                        onClick={() => handleViewBatch(batch)}
                                                                        className="text-xs font-black text-blue-600 dark:text-blue-300 hover:scale-110 transition-transform uppercase tracking-tighter flex items-center gap-1"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                        View
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteBatch(batch)}
                                                                        className="text-xs font-black text-red-500 hover:text-red-700 hover:scale-110 transition-transform uppercase tracking-tighter flex items-center gap-1"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-12 text-center text-slate-400 font-bold italic">No batches found matching your search.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center gap-8">
                        <div className="text-center mb-2">
                            <h2 className="text-4xl font-black text-[#1d1e63] dark:text-white tracking-tighter">Bank Statement Upload</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Step 2: Source Verification</p>
                        </div>

                        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 border dark:border-slate-700">
                            <div className="flex flex-col md:flex-row gap-4 items-stretch pl-4">
                                {/* Exact Anomaly Detection Dropzone Style */}
                                <div
                                    className={`w-full md:w-4/5 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-blue-900 dark:border-blue-400 rounded-xl bg-blue-50 dark:bg-slate-700 py-2 px-6 transition hover:border-blue-800 hover:bg-blue-100 dark:hover:bg-slate-600 shadow-md relative ${bankDragActive ? 'border-blue-400 bg-blue-100' : ''} ${isLoading ? 'pointer-events-none opacity-75' : ''}`}
                                    onClick={() => bankInputRef.current?.click()}
                                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setBankDragActive(true); }}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setBankDragActive(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setBankDragActive(false); }}
                                    onDrop={handleBankDrop}
                                >
                                    <input type="file" ref={bankInputRef} accept=".csv,.xlsx,.xls,.pdf,.ofx" className="hidden" onChange={e => { if (e.target.files?.[0]) handleBankFileUpload(e.target.files[0]); }} />
                                    <svg className="w-10 h-10 text-blue-900 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                                    <span className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                                        Drag & drop or click to upload Bank Statement
                                    </span>
                                    <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">Accepted formats: .csv, .xlsx, .xls, .pdf, .ofx</span>
                                    {bankFile && (
                                        <span className="mt-3 text-sm text-blue-900 dark:text-blue-200 font-medium">Selected: {bankFile.name}</span>
                                    )}
                                </div>

                                {/* Exact Anomaly Detection Button Column */}
                                <div className="flex flex-col gap-4 justify-center w-full md:w-1/5">
                                    <button
                                        type="button"
                                        disabled={!bankFile || isLoading}
                                        onClick={() => bankFile && setCurrentStep(3)}
                                        className={`rounded-lg text-white px-6 py-3 font-semibold shadow-lg transition gap-2 cursor-pointer ${!bankFile || isLoading
                                            ? 'bg-blue-900 cursor-not-allowed opacity-50'
                                            : 'bg-blue-900 hover:bg-blue-800 shadow-blue-900/20'
                                            } w-full flex items-center justify-center`}
                                    >
                                        Next Phase
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => batchId && fetchBankPreview(batchId)}
                                        disabled={!bankFile || isFetchingPreview}
                                        className={`rounded-lg px-6 py-3 font-semibold shadow transition cursor-pointer ${!bankFile || isFetchingPreview
                                            ? 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
                                            } w-full flex items-center justify-center`}
                                    >
                                        {isFetchingPreview ? 'Parsing...' : 'Preview Records'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBankFile(null)}
                                        disabled={isFetchingPreview}
                                        className={`rounded-lg px-6 py-3 font-semibold shadow transition cursor-pointer ${isFetchingPreview
                                            ? 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
                                            } w-full flex items-center justify-center`}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Animated Step Progress Hint */}
                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-full border border-blue-100 dark:border-blue-800/30">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-lg">2</div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest leading-none mb-1">Upload Pipeline</span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Statement Validation Active</span>
                            </div>
                        </div>

                        {/* Gated Preview Section - Full Width Flattened */}
                        {bankTransactions.length > 0 && (
                            <div className="w-full max-w-7xl animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col mt-8">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                        Extracted Bank Records
                                    </h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{bankTransactions.length} Transactions Parsed</span>
                                </div>
                                <div className="h-[500px] overflow-hidden">
                                    <DataTable
                                        rowData={bankTransactions}
                                        columnDefs={bankPreviewColumns}
                                        defaultColDef={defaultColDef}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center gap-8">
                        <div className="text-center mb-2">
                            <h2 className="text-4xl font-black text-[#1d1e63] dark:text-white tracking-tighter">Financial Ledger Upload</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Step 3: Verification Logic</p>
                        </div>

                        {/* Slim Banner showing bank file is ready */}
                        <div className="w-full max-w-4xl flex items-center justify-between bg-blue-50 dark:bg-slate-800/50 p-2.5 px-4 rounded-xl border border-blue-100 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="text-blue-600 dark:text-blue-400">
                                    <svg className="w-5 h-5 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bank Statement: <span className="text-blue-600 dark:text-blue-300 ml-1">{bankFile?.name}</span></span>
                            </div>
                            <button onClick={() => setCurrentStep(2)} className="text-[10px] font-bold text-blue-900 dark:text-blue-400 hover:underline tracking-tight uppercase">Replace</button>
                        </div>

                        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 border dark:border-slate-700">
                            <form className="flex flex-col md:flex-row gap-4 items-stretch pl-4" onSubmit={handleRunReconciliation}>
                                {/* Exact Anomaly Detection Dropzone Style */}
                                <div
                                    className={`w-full md:w-4/5 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-blue-900 dark:border-blue-400 rounded-xl bg-blue-50 dark:bg-slate-700 py-2 px-6 transition hover:border-blue-800 hover:bg-blue-100 dark:hover:bg-slate-600 shadow-md relative ${ledgerDragActive ? 'border-blue-400 bg-blue-100' : ''} ${isLoading ? 'pointer-events-none opacity-75' : ''}`}
                                    onClick={() => ledgerInputRef.current?.click()}
                                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setLedgerDragActive(true); }}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setLedgerDragActive(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setLedgerDragActive(false); }}
                                    onDrop={handleLedgerDrop}
                                >
                                    <input type="file" ref={ledgerInputRef} accept=".csv,.xlsx,.xls,.pdf,.ofx" className="hidden" onChange={e => { if (e.target.files?.[0]) handleLedgerFileUpload(e.target.files[0]); }} />
                                    <svg className="w-10 h-10 text-blue-900 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                                    <span className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                                        Drag & drop or click to upload Financial Ledger
                                    </span>
                                    <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">Accepted formats: .csv, .xlsx, .xls, .pdf, .ofx</span>
                                    {ledgerFile && (
                                        <span className="mt-3 text-sm text-emerald-600 font-medium">Selected: {ledgerFile.name}</span>
                                    )}
                                </div>

                                {/* Exact Anomaly Detection Button Column */}
                                <div className="flex flex-col gap-4 justify-center w-full md:w-1/5">
                                    <button
                                        type="submit"
                                        disabled={isLoading || !ledgerFile}
                                        className={`rounded-lg text-white px-6 py-3 font-semibold shadow-lg transition gap-2 cursor-pointer ${isLoading || !ledgerFile
                                            ? 'bg-blue-900 cursor-not-allowed opacity-50'
                                            : 'bg-blue-900 hover:bg-blue-800 shadow-blue-900/20'
                                            } w-full flex items-center justify-center`}
                                    >
                                        Run Reconciliation
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => batchId && fetchLedgerPreview(batchId)}
                                        disabled={!ledgerFile || isFetchingLedgerPreview}
                                        className={`rounded-lg px-6 py-3 font-semibold shadow transition cursor-pointer ${!ledgerFile || isFetchingLedgerPreview
                                            ? 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
                                            } w-full flex items-center justify-center`}
                                    >
                                        {isFetchingLedgerPreview ? 'Parsing...' : 'Preview Records'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLedgerFile(null)}
                                        disabled={isFetchingLedgerPreview}
                                        className={`rounded-lg px-6 py-3 font-semibold shadow transition cursor-pointer ${isFetchingLedgerPreview
                                            ? 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
                                            } w-full flex items-center justify-center`}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Gated Ledger Preview Section */}
                        {ledgerTransactions.length > 0 && (
                            <div className="w-full max-w-5xl animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col mt-4">
                                <div className="flex items-center justify-between mb-4 bg-slate-900 dark:bg-blue-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500 rounded-lg">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black tracking-tight flex items-center gap-2 uppercase">Ledger Statement Preview</h3>
                                            <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest">Parsed Ledger Records</p>
                                        </div>
                                    </div>
                                    <span className="bg-blue-800 text-blue-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-700/50">
                                        {ledgerTransactions.length} Items
                                    </span>
                                </div>
                                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 h-[450px]">
                                    <DataTable
                                        rowData={ledgerTransactions}
                                        columnDefs={bankPreviewColumns}
                                        defaultColDef={defaultColDef}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: RESULTS (Three Tabs: Matches, Unmatched, Stats) */}
                {currentStep === 4 && apiResponseData && (
                    <div className="w-full mt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-sm">Results</span>
                                <span>{batchName}</span>
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentStep(2)} className="flex items-center gap-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                                    Re-upload
                                </button>
                                <button onClick={handleReset} className="flex items-center gap-2 text-sm font-semibold bg-blue-900 text-white px-4 py-2 rounded-lg transition hover:bg-blue-800 shadow-md">
                                    New Batch
                                </button>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 mt-2 relative">
                            <div className="flex gap-8 relative">
                                <button
                                    onClick={() => setActiveTab("matches")}
                                    className={`pb-4 text-sm font-bold transition-all relative z-10 ${activeTab === "matches" ? "text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Matches
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "matches" ? "bg-blue-100 dark:bg-blue-900/40" : "bg-slate-100 dark:bg-slate-800"}`}>
                                            {apiResponseData?.matched_count || 0}
                                        </span>
                                    </div>
                                    {activeTab === "matches" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full shadow-[0_-2px_6px_rgba(37,99,235,0.3)]" />}
                                </button>

                                <button
                                    onClick={() => setActiveTab("unmatched")}
                                    className={`pb-4 text-sm font-bold transition-all relative z-10 ${activeTab === "unmatched" ? "text-red-600 dark:text-red-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Unmatched
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "unmatched" ? "bg-red-100 dark:bg-red-900/40" : "bg-slate-100 dark:bg-slate-800"}`}>
                                            {(apiResponseData?.unmatched_bank || 0) + (apiResponseData?.unmatched_ledger || 0)}
                                        </span>
                                    </div>
                                    {activeTab === "unmatched" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 dark:bg-red-400 rounded-t-full shadow-[0_-2px_6px_rgba(220,38,38,0.3)]" />}
                                </button>

                                <button
                                    onClick={() => setActiveTab("stats")}
                                    className={`pb-4 text-sm font-bold transition-all relative z-10 ${activeTab === "stats" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V5M5 9l7-7 7 7" /></svg>
                                        Statistics
                                    </div>
                                    {activeTab === "stats" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 dark:indigo-400 rounded-t-full shadow-[0_-2px_6px_rgba(79,70,229,0.3)]" />}
                                </button>

                                <button
                                    onClick={() => setActiveTab("manual")}
                                    className={`pb-4 text-sm font-bold transition-all relative z-10 ${activeTab === "manual" ? "text-amber-600 dark:text-amber-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                        Manual Match
                                    </div>
                                    {activeTab === "manual" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600 dark:bg-amber-400 rounded-t-full shadow-[0_-2px_6px_rgba(217,119,6,0.3)]" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab("audit")}
                                    className={`pb-4 text-sm font-bold transition-all relative z-10 ${activeTab === "audit" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Audit Report
                                    </div>
                                    {activeTab === "audit" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-t-full shadow-[0_-2px_6px_rgba(16,185,129,0.3)]" />}
                                </button>
                            </div>
                        </div>

                        {/* TAB CONTENT: STATS */}
                        {activeTab === "stats" && (
                            <div className="animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transition hover:scale-105 duration-300">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            </div>
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Bank Total</span>
                                        </div>
                                        <span className="text-3xl font-black text-slate-800 dark:text-white">{apiResponseData?.total_bank || 0}</span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transition hover:scale-105 duration-300">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                            </div>
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Ledger Total</span>
                                        </div>
                                        <span className="text-3xl font-black text-slate-800 dark:text-white">{apiResponseData?.total_ledger || 0}</span>
                                    </div>
                                    <div className="dark:bg-green-900/20 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800/30 transition hover:scale-105 duration-300">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-green-100 dark:bg-green-800/40 rounded-lg text-green-700 dark:text-green-300">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <span className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest">Matched</span>
                                        </div>
                                        <span className="text-3xl font-black text-green-800 dark:text-green-300">{apiResponseData?.matched_count || 0}</span>
                                    </div>
                                    <div className="dark:bg-red-900/20 p-6 rounded-2xl shadow-lg border border-red-100 dark:border-red-800/30 transition hover:scale-105 duration-300 ">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-red-100 dark:bg-red-800/40 rounded-lg text-red-700 dark:text-red-300">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </div>
                                            <span className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest">Unmatched</span>
                                        </div>
                                        <span className="text-3xl font-black text-red-800 dark:text-red-300">
                                            {(apiResponseData?.unmatched_bank || 0) + (apiResponseData?.unmatched_ledger || 0)}
                                        </span>
                                    </div>
                                    <div className="p-6 rounded-2xl shadow-lg transition hover:scale-110 duration-300 border border-blue-100 dark:border-blue-800/30 bg-white dark:bg-slate-900/50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-800 dark:bg-blue-700 rounded-lg text-blue-200 group-hover:rotate-12 transition-transform">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            </div>
                                            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Accuracy</span>
                                        </div>
                                        <span className="text-4xl font-black text-black dark:text-blue-300  italic">
                                            {(apiResponseData?.match_rate || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Charts Grid */}
                                {chartData && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        {/* Reconciliation Status */}
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transition hover:shadow-xl duration-300">
                                            <div className="mb-6">
                                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Reconciliation Status</h4>
                                                <p className="text-sm text-slate-500">Matched vs unmatched distribution</p>
                                            </div>
                                            <div className="h-[280px] flex items-center justify-center relative">
                                                <Doughnut
                                                    data={chartData.status}
                                                    plugins={[chartLabelPlugin]}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: {
                                                                position: 'bottom',
                                                                labels: {
                                                                    usePointStyle: true,
                                                                    padding: 20,
                                                                    font: { weight: 'bold', size: 11 }
                                                                }
                                                            }
                                                        },
                                                        cutout: '75%'
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-15px]">
                                                    <span className="text-3xl font-black text-slate-800 dark:text-white">{(apiResponseData?.match_rate || 0).toFixed(0)}%</span>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">Overall Match</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Match Type Breakdown */}
                                        {/* <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transition hover:shadow-xl duration-300">
                                            <div className="mb-6">
                                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Match Type Breakdown</h4>
                                                <p className="text-sm text-slate-500">Transactions matched per algorithm</p>
                                            </div>
                                            <div className="h-[280px]">
                                                <Bar
                                                    data={chartData.matchTypes}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: { display: false },
                                                            tooltip: {
                                                                backgroundColor: '#1e293b',
                                                                padding: 12,
                                                                titleFont: { size: 14, weight: 'bold' },
                                                                bodyFont: { size: 13 }
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                max: 800,
                                                                grid: { color: 'rgba(0,0,0,0.05)' },
                                                                ticks: { stepSize: 200, font: { weight: 'bold' } }
                                                            },
                                                            x: { grid: { display: false } }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div> */}

                                        {/* Coverage by Source */}
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transition hover:shadow-xl duration-300">
                                            <div className="mb-6">
                                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Coverage by Source</h4>
                                                <p className="text-sm text-slate-500">Matched vs unmatched per data source</p>
                                            </div>
                                            <div className="h-[280px]">
                                                <Bar
                                                    data={chartData.coverage}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        scales: {
                                                            x: { stacked: true, grid: { display: false } },
                                                            y: {
                                                                stacked: true,
                                                                beginAtZero: true,
                                                                grid: { color: 'rgba(0,0,0,0.05)' },
                                                                ticks: { stepSize: 250, font: { weight: 'bold' } }
                                                            }
                                                        },
                                                        plugins: {
                                                            legend: {
                                                                position: 'bottom',
                                                                labels: {
                                                                    usePointStyle: true,
                                                                    font: { weight: 'bold', size: 11 }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Confidence Tiers */}
                                        {/* <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transition hover:shadow-xl duration-300">
                                            <div className="mb-6">
                                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Confidence Tiers</h4>
                                                <p className="text-sm text-slate-500">Matches grouped by confidence score</p>
                                            </div>
                                            <div className="h-[280px]">
                                                <Bar
                                                    data={chartData.confidence}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false } },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                max: 600,
                                                                grid: { color: 'rgba(0,0,0,0.05)' },
                                                                ticks: { stepSize: 100, font: { weight: 'bold' } }
                                                            },
                                                            x: { grid: { display: false } }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div> */}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: MATCHES OR UNMATCHED */}
                        {(activeTab === "matches" || activeTab === "unmatched") && (
                            <div className="animate-in fade-in duration-500">
                                {activeTab === "matches" && (
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 mb-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                                Analysis Parameters
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Match Type</label>
                                                <select
                                                    value={matchType}
                                                    onChange={(e) => setMatchType(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                >
                                                    <option value="exact">Exact Match</option>
                                                    <option value="fuzzy">Fuzzy Match</option>
                                                    <option value="semantic">Semantic Match</option>
                                                    <option value="partial">Partial Match</option>
                                                    <option value="all">All Types</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Min Confidence</label>
                                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{Math.round(minConfidence * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={minConfidence}
                                                    onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={() => fetchDetailedMatches(batchId || "")}
                                                    disabled={isFetchingMatches}
                                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                                >
                                                    {isFetchingMatches ? (
                                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    )}
                                                    Apply Filters
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Data Grid Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden h-[600px] mb-6">
                                    <DataTable
                                        gridRef={gridRef}
                                        rowData={rowData}
                                        columnDefs={columnDefs}
                                        defaultColDef={defaultColDef}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT: MANUAL MATCH */}
                        {activeTab === "manual" && (
                            <div className="animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Bank Transactions Column */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unmatched Bank</h3>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setShowAddTxnModal("bank")} className="text-[10px] font-black text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-[#1d1e63] dark:hover:bg-blue-600 hover:text-white transition-all">+ Add</button>
                                                <span className="text-[10px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full font-black text-slate-400 uppercase tracking-widest">{unmatchedBankTxns.length} Items</span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-[450px] overflow-y-auto shadow-sm custom-scrollbar">
                                            {isFetchingManualData ? (
                                                <div className="h-full flex items-center justify-center">
                                                    <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1.5 p-2">
                                                    {unmatchedBankTxns.map((txn: any, idx: number) => {
                                                        const id = txn.transaction_id || txn.Transaction_ID || txn.id;
                                                        const isSelected = !!selectedBankTxn && (
                                                            (txn.transaction_id && selectedBankTxn.transaction_id === txn.transaction_id) || 
                                                            (txn.Transaction_ID && selectedBankTxn.Transaction_ID === txn.Transaction_ID) || 
                                                            (txn.id && selectedBankTxn.id === txn.id)
                                                        );
                                                        return (
                                                            <div
                                                                key={id || idx}
                                                                onClick={() => setSelectedBankTxn(txn)}
                                                                className={`p-4 cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden ${
                                                                    isSelected 
                                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-[6px] border-blue-600 shadow-md scale-[0.98]' 
                                                                        : 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{txn.txn_date || txn.Date}</span>
                                                                    <span className={`text-sm font-black transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{txn.amount || txn.Bank_Amount}</span>
                                                                </div>
                                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1 mb-1">{txn.description || txn.Bank_Description || txn.bank_description}</p>
                                                                <div className="flex items-center gap-2">
                                                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400'}`}>Ref: {txn.reference || txn.Reference || '---'}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {unmatchedBankTxns.length === 0 && <div className="p-12 text-center text-slate-400 italic font-medium text-sm">Clear Workspace</div>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ledger Transactions Column */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unmatched Ledger</h3>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setShowAddTxnModal("ledger")} className="text-[10px] font-black text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-[#1d1e63] dark:hover:bg-emerald-600 hover:text-white transition-all">+ Add</button>
                                                <span className="text-[10px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full font-black text-slate-400 uppercase tracking-widest">{unmatchedLedgerTxns.length} Items</span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-[450px] overflow-y-auto shadow-sm custom-scrollbar">
                                            {isFetchingManualData ? (
                                                <div className="h-full flex items-center justify-center">
                                                    <svg className="animate-spin h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1.5 p-2">
                                                    {unmatchedLedgerTxns.map((txn: any, idx: number) => {
                                                        const id = txn.transaction_id || txn.Transaction_ID || txn.id;
                                                        const isSelected = !!selectedLedgerTxn && (
                                                            (txn.transaction_id && selectedLedgerTxn.transaction_id === txn.transaction_id) || 
                                                            (txn.Transaction_ID && selectedLedgerTxn.Transaction_ID === txn.Transaction_ID) || 
                                                            (txn.id && selectedLedgerTxn.id === txn.id)
                                                        );
                                                        return (
                                                            <div
                                                                key={id || idx}
                                                                onClick={() => setSelectedLedgerTxn(txn)}
                                                                className={`p-4 cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden ${
                                                                    isSelected 
                                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-[6px] border-emerald-600 shadow-md scale-[0.98]' 
                                                                        : 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{txn.txn_date || txn.Date}</span>
                                                                    <span className={`text-sm font-black transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{txn.amount || txn.Ledger_Amount}</span>
                                                                </div>
                                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1 mb-1">{txn.description || txn.Ledger_Description || txn.ledger_description}</p>
                                                                <div className="flex items-center gap-2">
                                                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase ${isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400'}`}>Ref: {txn.reference || txn.Reference || '---'}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {unmatchedLedgerTxns.length === 0 && <div className="p-12 text-center text-slate-400 italic font-medium text-sm">Clear Workspace</div>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Area */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-inner">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        <div className="flex-1 w-full">
                                            <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 block tracking-tight uppercase">Match Details & Reason</label>
                                            <textarea
                                                value={manualMatchNote}
                                                onChange={(e) => setManualMatchNote(e.target.value)}
                                                placeholder="Provide a reason or note for this manual match (optional)..."
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition h-24 shadow-sm"
                                            />
                                        </div>
                                        <div className="w-full md:w-64 flex flex-col gap-4">
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selection</span>
                                                    <button
                                                        onClick={() => { setSelectedBankTxn(null); setSelectedLedgerTxn(null); }}
                                                        className="text-[10px] font-bold text-blue-600 hover:underline"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${selectedBankTxn ? 'bg-blue-500' : 'bg-slate-200'}`} />
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Bank {selectedBankTxn ? 'Selected' : 'None'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${selectedLedgerTxn ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Ledger {selectedLedgerTxn ? 'Selected' : 'None'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleManualMatch}
                                                disabled={isSubmittingMatch || !selectedBankTxn || !selectedLedgerTxn}
                                                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSubmittingMatch ? (
                                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                                )}
                                                Confirm Match
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT: AUDIT REPORT */}
                        {activeTab === "audit" && (
                            <div className="animate-in fade-in duration-500">
                                {isFetchingAudit ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <svg className="animate-spin h-10 w-10 text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span className="text-slate-500 font-medium">Generating Full Audit Report...</span>
                                    </div>
                                ) : auditReport ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 mb-6">
                                        <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">Full Audit Report</h3>
                                                <p className="text-slate-500 mt-1">Batch: {auditReport.batch_name || auditReport.batch_id}</p>
                                            </div>
                                            {/* <button
                                                onClick={() => {
                                                    const blob = new Blob([JSON.stringify(auditReport, null, 2)], { type: "application/json" });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement("a");
                                                    a.href = url;
                                                    a.download = `audit_report_${auditReport.batch_id}.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                                                Download JSON
                                            </button> */}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Summary</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Total Bank Txns:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{auditReport.summary?.total_bank_transactions}</span></div>
                                                    <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Total Ledger Txns:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{auditReport.summary?.total_ledger_transactions}</span></div>
                                                    <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Matched Count:</span> <span className="font-bold text-emerald-600">{auditReport.summary?.matched}</span></div>
                                                    <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Match Rate:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{auditReport.summary?.match_rate_pct}</span></div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Confidence Tiers</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> HIGH (Auto Accepted):</span> <span className="font-bold text-emerald-600">{auditReport.confidence_tiers?.HIGH_auto_accepted}</span></div>
                                                    <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> MEDIUM (Needs Review):</span> <span className="font-bold text-amber-600">{auditReport.confidence_tiers?.MEDIUM_needs_review}</span></div>
                                                    <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> LOW (Must Investigate):</span> <span className="font-bold text-red-600">{auditReport.confidence_tiers?.LOW_must_investigate}</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        {auditReport.auditor_recommendations && auditReport.auditor_recommendations.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Auditor Recommendations</h4>
                                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4 space-y-2">
                                                    {auditReport.auditor_recommendations.map((rec: string, i: number) => (
                                                        <div key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                                                            <span className="shrink-0">{rec.split(" ")[0]}</span>
                                                            <span>{rec.split(" ").slice(1).join(" ")}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-500 italic">No audit report available.</div>
                                )}
                            </div>
                        )}
                    </div>

                )}
            </div>

            {/* UNMATCHED REASON MODAL */}
            {selectedReasonText !== null && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                        <div className="p-4 border-b bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Unmatched Reason
                            </h3>
                            <button onClick={() => setSelectedReasonText(null)} className="text-rose-500 hover:text-rose-700 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed font-medium">
                                {selectedReasonText}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            {/* <button
                                onClick={() => setSelectedReasonText(null)}
                                className="px-5 py-2 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg transition shadow-sm"
                            >
                                Close
                            </button> */}
                        </div>
                    </div>
                </div>
            )}

            {/* MANUAL MATCH SUCCESS MODAL */}
            {showManualMatchSuccess && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Match Successful</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                The transactions have been successfully manually matched and removed from the unmatched list.
                            </p>
                            <button
                                onClick={() => setShowManualMatchSuccess(false)}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD TRANSACTION MODAL */}
            {showAddTxnModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`p-4 border-b ${showAddTxnModal === "bank" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50" : "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/50"}`}>
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${showAddTxnModal === "bank" ? "text-blue-800 dark:text-blue-300" : "text-purple-800 dark:text-purple-300"}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Add Manual {showAddTxnModal === "bank" ? "Bank" : "Ledger"} Transaction
                            </h3>
                        </div>
                        <form onSubmit={handleAddTxn} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={newTxnDate}
                                        onChange={e => setNewTxnDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={newTxnAmount}
                                        onChange={e => setNewTxnAmount(e.target.value)}
                                        placeholder="e.g. 1500.00"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Use negative values for debits/withdrawals</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTxnDescription}
                                        onChange={e => setNewTxnDescription(e.target.value)}
                                        placeholder="Transaction Description"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reference (Optional)</label>
                                    <input
                                        type="text"
                                        value={newTxnReference}
                                        onChange={e => setNewTxnReference(e.target.value)}
                                        placeholder="Check #, Invoice #..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowAddTxnModal(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingTxn}
                                    className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md transition disabled:opacity-50 flex items-center gap-2 ${showAddTxnModal === "bank" ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}`}
                                >
                                    {isAddingTxn && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    {isAddingTxn ? "Adding..." : "Add Transaction"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
