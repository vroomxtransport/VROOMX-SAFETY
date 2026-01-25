import React, { useState } from 'react';
import { FiFilter, FiDownload, FiColumns, FiChevronDown, FiAlertCircle, FiCheckCircle, FiSearch, FiBell, FiSettings, FiUser } from 'react-icons/fi';

const EnterpriseDemo = () => {
    const [activeTab, setActiveTab] = useState('fleet');

    // Enterprise Color Palette (Internal override for this demo only)
    const styles = {
        wrapper: "min-h-screen bg-gray-50 text-gray-900 font-sans antialiased text-sm",
        header: "bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20",
        sidebar: "w-64 bg-slate-900 text-slate-300 flex-shrink-0 min-h-screen flex flex-col",
        main: "flex-1 overflow-auto p-6",
        card: "bg-white border border-gray-200 rounded-[2px] shadow-sm p-4",
        metricLabel: "text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1",
        metricValue: "text-2xl font-bold text-gray-900",
        metricChange: "text-xs font-medium flex items-center gap-1 mt-1",
        tableHeader: "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200",
        tableCell: "px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap",
        badge: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        btnPrimary: "bg-navy-700 hover:bg-navy-800 text-white px-4 py-2 rounded-[3px] text-sm font-medium shadow-sm border border-transparent transition-colors",
        btnSecondary: "bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-[3px] text-sm font-medium border border-gray-300 shadow-sm transition-colors",
    };

    const navItems = [
        { name: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { name: 'Fleet Status', active: true, icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-roboto text-sm">
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className="h-14 flex items-center px-6 bg-slate-950 border-b border-slate-800">
                    <span className="text-lg font-bold text-white tracking-tight">VroomX <span className="text-gray-400 font-normal">Ent.</span></span>
                </div>
                <div className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-[3px] transition-colors ${item.active
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                            <span className="font-medium">{item.name}</span>
                        </button>
                    ))}
                </div>
                <div className="mt-auto p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-xs font-bold text-white">JD</div>
                        <div>
                            <div className="text-white text-xs font-medium">John Doe</div>
                            <div className="text-slate-500 text-[10px] uppercase">Fleet Manager</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className={styles.header}>
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-800">Fleet Overview</h1>
                        <div className="h-6 w-px bg-gray-300 mx-2"></div>
                        <div className="flex gap-2">
                            <button className={`${styles.btnSecondary} bg-gray-100 text-gray-900 border-gray-400`}>All Terminals</button>
                            <button className={styles.btnSecondary}>Last 30 Days</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search VIN, Driver..."
                                className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-[3px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
                            />
                        </div>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded relative">
                            <FiBell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded"><FiSettings className="w-5 h-5" /></button>
                    </div>
                </header>

                <main className={styles.main}>
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className={styles.card}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className={styles.metricLabel}>Compliance Score</div>
                                    <div className={styles.metricValue}>94.2%</div>
                                </div>
                                <div className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold">+1.2%</div>
                            </div>
                            <div className="mt-4 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '94.2%' }}></div>
                            </div>
                        </div>
                        <div className={styles.card}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className={styles.metricLabel}>HOS Violations</div>
                                    <div className={styles.metricValue}>12</div>
                                </div>
                                <div className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-bold">+3</div>
                            </div>
                            <div className={styles.metricChange}>
                                <span className="text-red-600 text-[10px]">Requires Attention</span>
                            </div>
                        </div>
                        <div className={styles.card}>
                            <div className={styles.metricLabel}>Open Defects</div>
                            <div className={styles.metricValue}>8</div>
                            <div className="text-gray-500 text-xs mt-1">3 Critical, 5 Minor</div>
                        </div>
                        <div className={styles.card}>
                            <div className={styles.metricLabel}>Upcoming Renewals</div>
                            <div className={styles.metricValue}>5</div>
                            <div className="text-gray-500 text-xs mt-1">Next 14 Days</div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-[3px] text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
                                <FiFilter className="w-4 h-4" /> Filter
                            </button>
                            <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-[3px] text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
                                <FiColumns className="w-4 h-4" /> Columns
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-[3px] text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
                                <FiDownload className="w-4 h-4" /> Export CSV
                            </button>
                            <button className="bg-blue-700 text-white px-3 py-1.5 rounded-[3px] text-sm font-medium hover:bg-blue-800 shadow-sm">
                                Add Vehicle
                            </button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-[2px] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="w-8 p-3 bg-gray-50 border-b border-gray-200">
                                            <input type="checkbox" className="rounded border-gray-300" />
                                        </th>
                                        {['Vehicle ID', 'Status', 'Driver', 'Current Location', 'Last Inspection', 'HOS Remaining', 'Maintenance Due', 'Actions'].map((header) => (
                                            <th key={header} className={styles.tableHeader}>
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                                                    {header}
                                                    {header !== 'Actions' && <FiChevronDown className="w-3 h-3 text-gray-400" />}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {[
                                        { id: '1001', status: 'Active', driver: 'Michael Scott', loc: 'Scranton, PA', insp: 'Oct 24, 2023', hos: '8h 12m', maint: 'Nov 15', statusColor: 'green' },
                                        { id: '1002', status: 'Maintenance', driver: 'Dwight Schrute', loc: 'Warehouse', insp: 'Oct 20, 2023', hos: '-', maint: 'Oct 26', statusColor: 'yellow' },
                                        { id: '1003', status: 'Active', driver: 'Jim Halpert', loc: 'Stamford, CT', insp: 'Oct 22, 2023', hos: '5h 45m', maint: 'Dec 01', statusColor: 'green' },
                                        { id: '1004', status: 'OOS', driver: 'Stanley Hudson', loc: 'Florida', insp: 'Oct 15, 2023', hos: '0h 00m', maint: 'ASAP', statusColor: 'red' },
                                        { id: '1005', status: 'Active', driver: 'Pam Beesly', loc: 'Scranton, PA', insp: 'Oct 23, 2023', hos: '9h 20m', maint: 'Nov 30', statusColor: 'green' },
                                        { id: '1006', status: 'Active', driver: 'Ryan Howard', loc: 'New York, NY', insp: 'Oct 21, 2023', hos: '3h 15m', maint: 'Nov 10', statusColor: 'green' },
                                        { id: '1007', status: 'Active', driver: 'Andy Bernard', loc: 'Cornell, NY', insp: 'Oct 24, 2023', hos: '7h 00m', maint: 'Jan 15', statusColor: 'green' },
                                        { id: '1008', status: 'Active', driver: 'Kevin Malone', loc: 'Scranton, PA', insp: 'Oct 19, 2023', hos: '6h 30m', maint: 'Dec 12', statusColor: 'green' },
                                    ].map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="p-3 border-b border-gray-100 text-center">
                                                <input type="checkbox" className="rounded border-gray-300" />
                                            </td>
                                            <td className={`${styles.tableCell} font-mono font-medium text-gray-900`}>
                                                {row.id}
                                            </td>
                                            <td className={styles.tableCell}>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${row.statusColor === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        row.statusColor === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${row.statusColor === 'green' ? 'bg-green-500' :
                                                            row.statusColor === 'yellow' ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                        }`}></span>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className={`${styles.tableCell} font-medium`}>{row.driver}</td>
                                            <td className={styles.tableCell}>{row.loc}</td>
                                            <td className={styles.tableCell}>{row.insp}</td>
                                            <td className={styles.tableCell}>{row.hos}</td>
                                            <td className={styles.tableCell}>{row.maint}</td>
                                            <td className={styles.tableCell}>
                                                <button className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100">
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                            <div className="text-xs text-gray-500">Showing <span className="font-medium text-gray-900">1-8</span> of <span className="font-medium text-gray-900">24</span> results</div>
                            <div className="flex gap-1">
                                <button className={styles.btnSecondary} disabled>Previous</button>
                                <button className={styles.btnSecondary}>Next</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EnterpriseDemo;
