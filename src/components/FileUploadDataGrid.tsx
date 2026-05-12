"use client";

import { DataTable } from "./DataTable";
import type { ColDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { useState, useCallback, useRef } from 'react';

ModuleRegistry.registerModules([AllCommunityModule]);

function FileUploadDataGrid() {
    const [rowData, setRowData] = useState<any[]>([]);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

    // local file input state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [dragActive, setDragActive] = useState(false);

    // keep a ref to the grid (if future actions are needed)
    const gridRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // default column definition: enable filtering for all columns
    const defaultColDef: ColDef = {
        filter: true,
        floatingFilter: true,
        sortable: true,
        resizable: true,
    };

    const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const f = e.target.files && e.target.files[0];
        if (!f) return setSelectedFile(null);
        setSelectedFile(f);
        setFileName(f.name);
    }, []);

    const handleDropFiles = useCallback((files: FileList | null) => {
                if (!files || files.length === 0) return;
                const f = files[0];
                setSelectedFile(f);
                setFileName(f.name);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleDropFiles(e.dataTransfer.files);
    }, [handleDropFiles]);

    // RFC4180-like CSV parser supporting quoted fields and escaped quotes.
    function parseCSV(text: string) {
        const rows: string[][] = [];
        let cur: string[] = [];
        let curField = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const next = i + 1 < text.length ? text[i + 1] : '';

            if (inQuotes) {
                if (ch === '"') {
                    if (next === '"') {
                        // escaped quote
                        curField += '"';
                        i++; // skip next
                    } else {
                        inQuotes = false;
                    }
                } else {
                    curField += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    cur.push(curField.trim());
                    curField = '';
                } else if (ch === '\r') {
                    // ignore, handle on \n
                } else if (ch === '\n') {
                    cur.push(curField.trim());
                    rows.push(cur);
                    cur = [];
                    curField = '';
                } else {
                    curField += ch;
                }
            }
        }

        // flush remaining
        if (inQuotes) {
            // malformed CSV but try to recover
            cur.push(curField.trim());
            rows.push(cur);
        } else if (curField !== '' || cur.length > 0) {
            cur.push(curField.trim());
            rows.push(cur);
        }

        if (rows.length === 0) return [];

        const header = rows[0].map(h => h);
        const dataRows = rows.slice(1).map(r => {
            const obj: Record<string, any> = {};
            header.forEach((h, i) => { obj[h] = r[i] !== undefined ? r[i] : ''; });
            return obj;
        });

        return dataRows;
    }

    const onSubmitFile = useCallback(async () => {
        setError(null);
        if (!selectedFile) {
            setError("No file selected");
            return;
        }

        setLoading(true);
        try {
            let parsed: any[] = [];

            const name = selectedFile.name.toLowerCase();

            if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
                // parse excel
                const arrayBuffer = await selectedFile.arrayBuffer();
                const XLSX = await import('xlsx');
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                parsed = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            } else {
                const text = await selectedFile.text();

                if (name.endsWith('.json')) {
                    parsed = JSON.parse(text);
                    if (!Array.isArray(parsed)) parsed = [parsed];
                } else if (name.endsWith('.csv')) {
                    parsed = parseCSV(text);
                } else {
                    // try JSON first, then CSV
                    try {
                        parsed = JSON.parse(text);
                        if (!Array.isArray(parsed)) parsed = [parsed];
                    } catch (e) {
                        parsed = parseCSV(text);
                    }
                }
            }

            // if parsed is empty, show an error and do not render the grid
            if (!parsed || parsed.length === 0) {
                setRowData([]);
                setColumnDefs([]);
                setError('Uploaded file contains no records. Please upload a CSV/JSON with at least one row.');
                return;
            }

            setRowData(parsed);

            // update column defs if file contains keys not in current columns
            if (parsed.length > 0) {
                const keys = Object.keys(parsed[0]);
                setColumnDefs(keys.map(k => ({ field: k })));
            }
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    }, [selectedFile]);

    const onReset = useCallback(() => {
        setSelectedFile(null);
        setFileName("");
        setError(null);
        // clear grid data — no network requests
        setRowData([]);
        setColumnDefs([]);

        // clear native file input so filename no longer shows in the browser
        if (fileInputRef.current) {
            try { fileInputRef.current.value = ''; } catch (e) { /* ignore */ }
        }
    }, []);

    return (
        <div className="w-full min-h-screen p-3">
            <div className="mb-3">
                <input
                    type="file"
                    accept=".csv,.json,.xls,.xlsx"
                    onChange={onFileChange}
                    ref={fileInputRef}
                    className="hidden"
                    id="file-upload-input"
                />

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full rounded-2xl border-2 transition-all duration-300 ${dragActive ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} p-10 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer shadow-soft group hover:border-indigo-300`}
                >
                    <div>
                        <div className="text-sm font-medium text-slate-700">Drag & drop a CSV/JSON/Excel (.xls, .xlsx) file here, or click to select</div>
                        <div className="text-xs text-slate-500 mt-1">{fileName || ''}</div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); onSubmitFile(); }}
                            disabled={loading || !selectedFile}
                            className={`bg-gradient-to-r from-navy to-indigo text-white px-6 py-2.5 rounded-xl font-bold uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-indigo-500/25 transition-all ${loading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Processing...' : 'Analyze Data'}
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onReset(); }}
                            className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-6 py-2.5 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* {error && <div className="text-red-600 mb-2">{error}</div>} */}
            {error && (
                <div className="mb-3">
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded">
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.487 0l5.518 9.812A1.75 1.75 0 0 1 16.518 16H3.482a1.75 1.75 0 0 1-1.744-2.089L8.257 3.1zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-6a.75.75 0 0 0-.75.75v3.5c0 .414.336.75.75.75s.75-.336.75-.75v-3.5A.75.75 0 0 0 10 7z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm">{error}</div>
                    </div>
                </div>
            )}

            <div className="w-full">
                {rowData && rowData.length > 0 ? (
                    <DataTable
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        gridRef={gridRef}
                        height="80vh"
                    />
                ) : (
                    <div className="h-48 flex items-center justify-center text-sm text-slate-500">
                        No data to display. Upload a CSV/JSON/Excel (.xls,.xlsx) file to populate the table.
                    </div>
                )}
            </div>
        </div>
    );
}

export default FileUploadDataGrid;