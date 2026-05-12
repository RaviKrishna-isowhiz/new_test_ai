"use client";

import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataTableProps {
  rowData: any[];
  columnDefs: ColDef[];
  defaultColDef?: ColDef;
  gridRef?: React.RefObject<any>;
  height?: string;
  highlightRowCondition?: (rowData: any) => boolean;
  highlightRowEnabled?: boolean;
  rowSelection?: 'single' | 'multiple';
  onSelectionChanged?: (event: any) => void;
}

export function DataTable({ 
  rowData, 
  columnDefs, 
  defaultColDef, 
  gridRef, 
  height = "80vh", 
  highlightRowCondition, 
  highlightRowEnabled = false,
  rowSelection = 'multiple',
  onSelectionChanged
}: DataTableProps) {
  const { theme } = useTheme();

  // Highlight rows based on custom condition if enabled
  const getRowClass = (params: any) => {
    if (highlightRowEnabled && typeof highlightRowCondition === "function" && highlightRowCondition(params.data)) {
      return "ag-row-even-bg";
    }
    return "";
  };

  return (
    <div style={{ height, width: "100%" }} className={theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}>
      <style>{`
        /* Light mode styles */
        .ag-row-even-bg .ag-cell {
          background-color: var(--slate-50) !important;
        }
        
        .ag-theme-alpine {
          --ag-header-background-color: #f8fafc;
          --ag-odd-row-background-color: #ffffff;
          --ag-even-row-background-color: #f1f5f9;
          --ag-row-hover-color: #e2e8f0;
          --ag-header-foreground-color: var(--navy);
          --ag-selected-row-background-color: rgba(99, 102, 241, 0.1);
          --ag-range-selection-border-color: var(--indigo);
        }

        /* Dark mode specific styles */
        .ag-theme-alpine-dark {
          --ag-background-color: #0f172a !important;
          --ag-header-background-color: #1e293b !important;
          --ag-odd-row-background-color: #0f172a !important;
          --ag-even-row-background-color: #111827 !important;
          --ag-row-hover-color: #1e293b !important;
          --ag-foreground-color: #e2e8f0 !important;
          --ag-border-color: #334155 !important;
          --ag-header-foreground-color: #ffffff !important;
          --ag-header-border-color: #334155 !important;
          --ag-cell-horizontal-border: #334155 !important;
          --ag-selected-row-background-color: rgba(79, 70, 229, 0.2) !important;
          --ag-input-background-color: #1e293b !important;
          --ag-input-border-color: #334155 !important;
          --ag-checkbox-checked-color: #4f46e5 !important;
        }
        
        .ag-header-cell-label {
          font-weight: 800 !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.75rem;
        }

        .ag-row {
          font-size: 0.875rem;
          border-bottom-color: rgba(226, 232, 240, 0.3) !important;
        }
      `}</style>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowClass={getRowClass}
        rowSelection={rowSelection}
        onSelectionChanged={onSelectionChanged}
      />
    </div>
  );
}
