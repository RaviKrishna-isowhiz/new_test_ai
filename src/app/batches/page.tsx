"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function BatchesPage() {
    const [batches, setBatches] = useState([
        { id: '1', name: 'March 2026 Recon', date: '2026-03-01', status: 'Pending' },
        { id: '2', name: 'February 2026 Recon', date: '2026-02-01', status: 'Completed' },
    ]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reconciliation Batches</h1>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">
                    Create New Batch
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {batches.map((batch) => (
                            <tr key={batch.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{batch.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${batch.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {batch.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <Link href={`/upload/bank/${batch.id}`} className="text-blue-600 hover:text-blue-900 border border-blue-600 rounded px-2 py-1 text-xs">
                                            Bank Statement
                                        </Link>
                                        <Link href={`/upload/ledger/${batch.id}`} className="text-indigo-600 hover:text-indigo-900 border border-indigo-600 rounded px-2 py-1 text-xs">
                                            Ledger
                                        </Link>
                                        <Link href={`/reconcile/${batch.id}`} className="text-green-600 hover:text-green-900 border border-green-600 rounded px-2 py-1 text-xs">
                                            Reconcile
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
