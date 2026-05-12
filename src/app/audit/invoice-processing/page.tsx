"use client";

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import { ColDef } from 'ag-grid-community';
import { useTheme } from "@/contexts/ThemeContext";
import { DataTable } from '../../../components/DataTable';
import { ENDPOINTS } from '@/config/api';

// Helper component for rendering a single invoice in detail view
function InvoiceDetailView({ invoice }: { invoice: any }) {
  if (!invoice) return null;

  // Handle both flat and nested `{ invoice: {...} }` formats
  const data = invoice.invoice || invoice;

  // Extract dynamically generated line items
  const itemsMap = new Map<number, any>();
  Object.keys(data).forEach(key => {
    const match = key.match(/^items_(\d+)_(.+)$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      const prop = match[2];
      if (!itemsMap.has(idx)) itemsMap.set(idx, {});
      itemsMap.get(idx)![prop] = data[key];
    }
  });

  const items = Array.from(itemsMap.values());

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 mt-2 w-full">
      <div className="flex flex-col md:flex-row justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300 mb-2">
            Invoice: {data.invoice_no || 'N/A'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            <strong>Type:</strong> {data.document_type || 'N/A'}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            <strong>Date:</strong> {data.invoice_date || 'N/A'}
          </p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            File: {data.file_name || 'N/A'}
          </p>
          {data.extracted_at && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Extracted: {new Date(data.extracted_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Billed From</h4>
          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{data.from || 'N/A'}</p>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Billed To</h4>
          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{data.to || 'N/A'}</p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Line Items</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-600">
                  <th className="py-3 px-4 font-semibold text-sm">Description</th>
                  <th className="py-3 px-4 font-semibold text-sm w-32">Quantity</th>
                  <th className="py-3 px-4 font-semibold text-sm w-40">Unit Price</th>
                  <th className="py-3 px-4 font-semibold text-sm w-40 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-300">{item.description || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-300">{item.quantity || '-'}</td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-300">{item.unit_price || '-'}</td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-300 text-right font-medium">{item.amount || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <div className="w-full sm:w-1/2 md:w-1/3 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
            <span>Subtotal:</span>
            <span className="font-medium">{data.subtotal || '$0'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
            <span>Discount:</span>
            <span className="font-medium">{data.discount || '$0'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
            <span>Tax:</span>
            <span className="font-medium">{data.tax || '$0'}</span>
          </div>
          <div className="flex justify-between py-3 text-lg font-bold text-slate-800 dark:text-white mt-2">
            <span>Total:</span>
            <span className="text-blue-700 dark:text-blue-300">{data.total || '$0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceProcessingPage() {
  // Modal state for expanded preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Debug logging
  console.log('Invoice Processing - Current theme:', theme, 'isDark:', isDark);

  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showAllInvoices, setShowAllInvoices] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedRef = useRef(false);
  const defaultColDef: ColDef = {
    filter: true,
    floatingFilter: true,
    sortable: true,
    resizable: true,
  };

  // Function to fetch existing invoices from the API
  const fetchInvoices = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await fetch(ENDPOINTS.INVOICE_LIST, {
        headers: {
          'Accept': 'application/json',
        },
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();

      if (data.invoices && Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      } else if (Array.isArray(data)) {
        setInvoices(data);
      } else {
        console.log('No invoices found or unexpected data format');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    // Prevent duplicate calls in React Strict Mode
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    // Fetch existing invoices on page load
    fetchInvoices();
  }, [router, fetchInvoices]);

  const user = typeof window !== "undefined" ? getUser() : null;
  if (!user) {
    return null;
  }

  // DataTable configuration
  const columnDefs: ColDef[] = [
    { field: "invoice_no", headerName: "Invoice No", width: 200 },
    { field: "document_type", headerName: "Document Type", width: 200 },
    { field: "invoice_date", headerName: "Invoice Date", width: 150 },
    {
      field: "subtotal", headerName: "Subtotal", width: 150, valueFormatter: (params) => {
        const value = params.value;
        if (value == null) return '$0';
        // Remove $ symbol and commas before converting to number
        const cleanValue = typeof value === 'string' ? value.replace(/[\$,]/g, '') : value;
        const numValue = Number(cleanValue);
        return !isNaN(numValue) ? `$${numValue.toLocaleString()}` : value;
      }
    },
    {
      field: "discount", headerName: "Discount", width: 150, valueFormatter: (params) => {
        const value = params.value;
        if (value == null) return '$0';
        // Remove $ symbol and commas before converting to number
        const cleanValue = typeof value === 'string' ? value.replace(/[\$,]/g, '') : value;
        const numValue = Number(cleanValue);
        return !isNaN(numValue) ? `$${numValue.toLocaleString()}` : value;
      }
    },
    {
      field: "tax", headerName: "Tax", width: 150, valueFormatter: (params) => {
        const value = params.value;
        if (value == null) return '$0';
        // Remove $ symbol and commas before converting to number
        const cleanValue = typeof value === 'string' ? value.replace(/[\$,]/g, '') : value;
        const numValue = Number(cleanValue);
        return !isNaN(numValue) ? `$${numValue.toLocaleString()}` : value;
      }
    },
    {
      field: "total", headerName: "Total", width: 200, valueFormatter: (params) => {
        const value = params.value;
        if (value == null) return '$0';
        // Remove $ symbol and commas before converting to number
        const cleanValue = typeof value === 'string' ? value.replace(/[\$,]/g, '') : value;
        const numValue = Number(cleanValue);
        return !isNaN(numValue) ? `$${numValue.toLocaleString()}` : value;
      }
    },
    { field: "file_name", headerName: "File Name", width: 250 },
    {
      headerName: "Action",
      width: 150,
      cellRenderer: (params: any) => {
        return (
          <button
            onClick={() => {
              setExtractedData(params.data);
              setShowAllInvoices(false);
            }}
            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 mt-1 rounded text-sm transition font-medium"
          >
            View Details
          </button>
        );
      }
    }
  ];

  const displayedInvoices = useMemo(() => {
    if (!showAllInvoices && extractedData) {
      if (extractedData.invoices && Array.isArray(extractedData.invoices)) {
        return extractedData.invoices;
      }
      if (Array.isArray(extractedData)) {
        return extractedData;
      }
      return [extractedData];
    }
    return invoices;
  }, [showAllInvoices, extractedData, invoices]);

  const rowData = displayedInvoices;

  // File handling functions
  function validateFile(file: File | null): string | null {
    if (!file) return "Please select a file";
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return "Please upload a PNG, or JPG file";
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return "File size must be less than 10MB";
    }
    return null;
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Refetch invoices from API
    fetchInvoices();
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

    fetch(ENDPOINTS.INVOICE_EXTRACT, {
      headers: {
        'Accept': 'application/json',
      },
      method: 'POST',
      body: formData,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to upload file');
        const data = await res.json();
        setExtractedData(data);
        setShowAllInvoices(false);

        // Invoice uploaded successfully
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Refetch all invoices to keep list updated (silently)
        void fetchInvoices(true);
      })
      .catch((err) => {
        setError('Error uploading file: ' + err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  const totalInvoices = displayedInvoices.length;
  const totalValue = displayedInvoices.reduce((sum: number, inv: any) => {
    // Use 'total' field from the new API response
    let amount = 0;
    if (inv.total != null) {
      // Remove $ symbol and commas before converting to number
      const cleanTotal = typeof inv.total === 'string' ? inv.total.replace(/[\$,]/g, '') : inv.total;
      const numValue = Number(cleanTotal);
      amount = !isNaN(numValue) ? numValue : 0;
    }
    return sum + amount;
  }, 0);

  return (
    <div className={`flex-1 flex flex-col items-center justify-normal bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-slate-900 py-2 px-2 relative ${isDark ? 'dark-mode-active' : ''}`}>
      {/* Full Page Loader */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-12 w-12 text-blue-900 dark:text-blue-300" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg font-medium text-blue-900 dark:text-white">
              Loading...
            </span>
          </div>
        </div>
      )}

      <div className={`w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-900/20 p-4 dark:border-slate-700 ${isDark ? 'border force-dark-card' : ''}`}>
        <div className="mb-1">
          <h1 className="text-3xl font-semibold text-blue-900 dark: footer-copyright drop-shadow text-left flex items-center gap-2">
            <span>Invoice Processing</span>
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-900 via-slate-400 to-blue-300 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 rounded-full mt-2 ml-1" />
        </div>
        <p className="text-lg text-slate-700 dark:text-white mb-2 text-center font-medium dark:drop-shadow-lg">Extract and process invoice data using AI-powered OCR and document analysis. Upload your invoices and get structured data instantly.</p>

        <form className="flex flex-col items-center gap-4" onSubmit={handleSubmit}>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-full flex flex-col md:flex-row gap-4 items-stretch pl-4">
            {/* Drag and Drop left, Preview right after upload */}
            <div className="flex w-full flex-row gap-4">
              <div
                className={`flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-blue-900 dark:border-blue-400 rounded-xl bg-blue-50 dark:bg-slate-700 py-2 px-6 transition hover:border-blue-800 hover:bg-blue-100 dark:hover:bg-slate-600 shadow-md relative ${dragActive ? 'border-blue-400 bg-blue-100' : ''} ${isLoading ? 'pointer-events-none opacity-75' : ''}`}
                onClick={handleLabelClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <svg className="w-12 h-12 text-blue-900 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                <span className="text-lg font-semibold text-blue-900">Drag & drop or click to upload</span>
                <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">Accepted formats:.png, .jpg, .jpeg</span>
                {selectedFile && (
                  <span className="mt-3 text-sm text-blue-900 dark:text-blue-200 font-medium">Selected: {selectedFile.name}</span>
                )}
              </div>
              {/* Preview image to right if selected file is an image */}
              {selectedFile && selectedFile.type.startsWith('image/') && (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-800 py-2 px-6 shadow-md">
                  <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">Preview:</span>
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Invoice Preview"
                    className="max-h-48 rounded-lg shadow object-contain cursor-pointer hover:scale-105 transition"
                    style={{ maxWidth: '100%', width: 'auto' }}
                    onClick={() => setPreviewOpen(true)}
                  />
                  {previewOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setPreviewOpen(false)}>
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Full Invoice Preview"
                          className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl border-4 border-blue-300 dark:border-blue-700 object-contain bg-white dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-blue-900 text-white rounded-full p-2 shadow hover:bg-blue-700 transition"
                          onClick={e => { e.stopPropagation(); setPreviewOpen(false); }}
                          aria-label="Close preview"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                  <svg className="animate-spin h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoading ? 'Processing...' : 'Upload & Process'}
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

        {/* Statistics Cards */}
        <div className="w-full mt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-white">
              {!showAllInvoices ? 'Extracted Invoice Data' : (totalInvoices > 0 ? 'All Invoices' : 'Invoice Processing Results')}
            </h2>
            {!showAllInvoices && (
              <button
                type="button"
                onClick={() => {
                  setShowAllInvoices(true);
                  if (invoices.length === 0) fetchInvoices(true);
                }}
                className="bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 px-4 py-2 rounded-lg font-medium shadow-sm transition dark:bg-slate-700 dark:text-blue-100 dark:border-blue-800 dark:hover:bg-slate-600"
              >
                Show Invoices
              </button>
            )}
            {showAllInvoices && extractedData && (
              <button
                type="button"
                onClick={() => setShowAllInvoices(false)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 px-4 py-2 rounded-lg font-medium shadow-sm transition dark:bg-slate-700 dark:text-blue-100 dark:border-blue-800 dark:hover:bg-slate-600"
              >
                Show Extracted Invoice
              </button>
            )}
          </div>
          {totalInvoices > 0 && (
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Invoices */}
              <div className="flex items-center p-4 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50" role="alert">
                <svg className="flex-shrink-0 w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd"></path>
                </svg>
                <div>
                  <span className="font-medium">Total Invoices:</span>
                  <span className="ml-2 font-bold text-lg">{totalInvoices}</span>
                </div>
              </div>

              {/* Total Value */}
              <div className="flex items-center p-4 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-600 rounded-lg bg-purple-50" role="alert">
                <svg className="flex-shrink-0 w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd"></path>
                </svg>
                <div>
                  <span className="font-medium">Total Value:</span>
                  <span className="ml-2 font-bold text-lg">${totalValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* DataTable */}
          {totalInvoices > 0 && showAllInvoices && (
            <div className="mt-4">
              <DataTable
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                height="60vh"
              />
            </div>
          )}

          {/* Detail View */}
          {!showAllInvoices && extractedData && (
            <div className="mt-2">
              <InvoiceDetailView invoice={extractedData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}