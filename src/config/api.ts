// API Configuration
export const API_CONFIG = {
  // Local development API
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8082',

  // Azure cloud API
  AZURE_BASE_URL: process.env.NEXT_PUBLIC_AZURE_API_BASE_URL || 'https://aip.koreacentral.cloudapp.azure.com/api/api',

  // Invoice Processing Endpoints
  INVOICE: {
    EXTRACT: '/api/invoice/extract',
    LIST: '/api/invoice/list',
  },

  // Data Filtering Endpoints
  FILTER: {
    PREVIEW: '/api/filter/preview',
    APPLY: '/api/filter/apply',
  },

  // Anomaly Detection Endpoints
  ANOMALY: {
    PREDICT: '/api/anomaly-detection/predict',
    QUERY: '/api/anomaly-detection/query',
  },

  // Bank Reconciliation Endpoints
  BANK_RECON: {
    BATCHES: '/batches',
    UPLOAD_BANK: '/upload/bank',
    UPLOAD_LEDGER: '/upload/ledger',
    RECONCILE: '/reconcile',
    MATCHES: '/reconcile', // Base for paginated matches
    QUERY: '/bank-reconciliation/query',
    TRANSACTIONS: '/transactions',
  },
  // Payroll Risk Endpoints
  PAYROLL_RISK: {
    UPLOAD: '/api/payroll-risk/upload',
    PREVIEW: '/api/payroll-risk/preview',
    RISK_BREAKDOWN: '/api/payroll-risk/risk-breakdown',
    OVERALL_RISK: '/api/payroll-risk/overall-risk',
    FRAUD_BREAKDOWN: '/api/payroll-risk/fraud-breakdown',
    EMPLOYEE_DETAIL: '/api/payroll-risk/employee-risk',
  }
} as const;

// Helper function to get full URL
export const getApiUrl = (endpoint: string, useAzure = false): string => {
  const baseUrl = useAzure ? API_CONFIG.AZURE_BASE_URL : API_CONFIG.BASE_URL;
  return `${baseUrl}${endpoint}`;
};

// Specific API endpoints
export const ENDPOINTS = {
  // Invoice Processing
  INVOICE_EXTRACT: getApiUrl(API_CONFIG.INVOICE.EXTRACT, false),
  INVOICE_LIST: getApiUrl(API_CONFIG.INVOICE.LIST, false),

  // Data Filtering (uses Azure)
  FILTER_PREVIEW: getApiUrl(API_CONFIG.FILTER.PREVIEW, false),
  FILTER_APPLY: getApiUrl(API_CONFIG.FILTER.APPLY, false),

  // Anomaly Detection (uses Azure)
  ANOMALY_PREDICT: getApiUrl(API_CONFIG.ANOMALY.PREDICT, false),
  ANOMALY_QUERY: getApiUrl(API_CONFIG.ANOMALY.QUERY, false),

  // Bank Reconciliation
  BANK_RECON_BATCHES: getApiUrl(API_CONFIG.BANK_RECON.BATCHES, false),
  BANK_RECON_UPLOAD_BANK: (batchId: string) => getApiUrl(`${API_CONFIG.BANK_RECON.UPLOAD_BANK}/${batchId}`, false),
  BANK_RECON_UPLOAD_LEDGER: (batchId: string) => getApiUrl(`${API_CONFIG.BANK_RECON.UPLOAD_LEDGER}/${batchId}`, false),
  BANK_RECON_RECONCILE: (batchId: string) => getApiUrl(`${API_CONFIG.BANK_RECON.RECONCILE}/${batchId}`, false),
  BANK_RECON_MATCHES: (batchId: string, query: string) => getApiUrl(`${API_CONFIG.BANK_RECON.MATCHES}/${batchId}/matches${query}`, false),
  BANK_RECON_UNMATCHED: (batchId: string, query: string) => getApiUrl(`${API_CONFIG.BANK_RECON.MATCHES}/${batchId}/unmatched${query}`, false),
  BANK_RECON_DELETE_BATCH: (batchId: string) => getApiUrl(`${API_CONFIG.BANK_RECON.BATCHES}/${batchId}`, false),
  BANK_RECON_GET_BATCH: (batchId: string) => getApiUrl(`${API_CONFIG.BANK_RECON.BATCHES}/${batchId}`, false),
  BANK_RECON_MANUAL_MATCH: (batchId: string) => getApiUrl(`${API_CONFIG.BANK_RECON.RECONCILE}/${batchId}/manual-match`, false),
  BANK_RECON_ADD_BANK_TXN: (batchId: string) => getApiUrl(`${API_CONFIG.BANK_RECON.TRANSACTIONS}/${batchId}/bank`, false),
  BANK_RECON_ADD_LEDGER_TXN: (batchId: string) => getApiUrl(`${API_CONFIG.BANK_RECON.TRANSACTIONS}/${batchId}/ledger`, false),
  BANK_RECON_FULL_AUDIT: (batchId: string) => getApiUrl(`/reports/${batchId}/full-audit`, false),
  BANK_RECON_QUERY: getApiUrl(API_CONFIG.BANK_RECON.QUERY, false),
  BANK_RECON_TRANSACTIONS: (batchId: string) => getApiUrl(`${API_CONFIG.BANK_RECON.TRANSACTIONS}/${batchId}`, false),

  // Payroll Risk
  PAYROLL_UPLOAD: getApiUrl(API_CONFIG.PAYROLL_RISK.UPLOAD, false),
  PAYROLL_PREVIEW: getApiUrl(API_CONFIG.PAYROLL_RISK.PREVIEW, false),
  PAYROLL_RISK_BREAKDOWN: getApiUrl(API_CONFIG.PAYROLL_RISK.RISK_BREAKDOWN, false),
  PAYROLL_OVERALL_RISK: getApiUrl(API_CONFIG.PAYROLL_RISK.OVERALL_RISK, false),
  PAYROLL_FRAUD_BREAKDOWN: getApiUrl(API_CONFIG.PAYROLL_RISK.FRAUD_BREAKDOWN, false),
  PAYROLL_EMPLOYEE_DETAIL: (id: string) => getApiUrl(`${API_CONFIG.PAYROLL_RISK.EMPLOYEE_DETAIL}/${id}`, false),
} as const;