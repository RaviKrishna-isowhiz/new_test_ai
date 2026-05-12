"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReconcilePage() {
    const params = useParams();
    const batchId = params.batch_id as string;
    const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'unmatched'>('all');

    // Mock reconciliation data
    const reconciliationData = [
        { id: 'TXN-001', date: '2026-03-05', bankAmount: 1500.00, ledgerAmount: 1500.00, status: 'Matched', description: 'Client Payment' },
        { id: 'TXN-002', date: '2026-03-06', bankAmount: -250.50, ledgerAmount: -250.50, status: 'Matched', description: 'Office Supplies' },
        { id: 'TXN-003', date: '2026-03-08', bankAmount: 850.00, ledgerAmount: 0, status: 'Unmatched', description: 'Unknown Deposit' },
        { id: 'TXN-004', date: '2026-03-10', bankAmount: 0, ledgerAmount: -1200.00, status: 'Unmatched', description: 'Pending Rent Check' },
        { id: 'TXN-005', date: '2026-03-11', bankAmount: -45.00, ledgerAmount: -45.00, status: 'Matched', description: 'Software Subscription' },
    ];

    const filteredData = reconciliationData.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'matched') return item.status === 'Matched';
        if (activeTab === 'unmatched') return item.status === 'Unmatched';
        return true;
    });

    const getStatusColor = (status: string) => {
        return status === 'Matched' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <Link href="/batches" className="text-blue-600 hover:underline flex items-center gap-1 text-sm mb-4">
                        &larr; Back to Batches
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Reconciliation Report</h1>
                    <p className="text-gray-500 mt-2">Batch #{batchId}</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors">
                        Export PDF
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 transition-colors">
                        Approve Reconciliation
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Transactions</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{reconciliationData.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
                    <h3 className="text-sm font-medium text-green-600 uppercase tracking-wide">Matched</h3>
                    <p className="mt-2 text-3xl font-bold text-green-700">{reconciliationData.filter(d => d.status === 'Matched').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
                    <h3 className="text-sm font-medium text-red-600 uppercase tracking-wide">Unmatched</h3>
                    <p className="mt-2 text-3xl font-bold text-red-700">{reconciliationData.filter(d => d.status === 'Unmatched').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Discrepancy Amount</h3>
                    <p className="mt-2 text-3xl font-bold text-red-600">
                        {formatCurrency(Math.abs(reconciliationData.reduce((acc, curr) => acc + (curr.bankAmount - curr.ledgerAmount), 0)))}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden ring-1 ring-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`${activeTab === 'all'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors`}
                        >
                            All Transactions
                        </button>
                        <button
                            onClick={() => setActiveTab('matched')}
                            className={`${activeTab === 'matched'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors`}
                        >
                            Matched
                        </button>
                        <button
                            onClick={() => setActiveTab('unmatched')}
                            className={`${activeTab === 'unmatched'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors`}
                        >
                            Unmatched / Discrepancies
                        </button>
                    </nav>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Amount</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ledger Amount</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                    {item.bankAmount !== 0 ? formatCurrency(item.bankAmount) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                    {item.ledgerAmount !== 0 ? formatCurrency(item.ledgerAmount) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {item.status === 'Unmatched' && (
                                        <button className="text-blue-600 hover:text-blue-900">
                                            Resolve
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                    No transactions found for this view.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
