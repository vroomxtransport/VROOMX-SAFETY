import React from 'react';
import { FiHome, FiCheckCircle, FiSearch, FiBell, FiUser, FiCalendar, FiArrowRight, FiShield } from 'react-icons/fi';

const MinimalistDemo = () => {
    // Minimalist Palette (Internal override)
    const styles = {
        wrapper: "min-h-screen bg-[#FDFCF8] text-[#4A4A4A] font-sans antialiased",
        sidebar: "w-20 lg:w-64 fixed lg:sticky top-0 h-screen p-6 flex flex-col hidden md:flex",
        main: "flex-1 p-6 lg:p-12 overflow-y-auto",
        card: "bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 border border-[#F0F0F0]",
        cardHeader: "text-lg font-bold text-[#2D2D2D] mb-4 flex items-center justify-between",
        navItem: "flex items-center gap-4 px-4 py-3 rounded-2xl text-[#8E8E93] hover:bg-white hover:text-[#FF8A65] hover:shadow-sm transition-all duration-300 font-medium mb-1 cursor-pointer",
        navItemActive: "bg-[#FFF5F2] text-[#FF7043] shadow-inner",
        btnPrimary: "bg-gradient-to-r from-[#FF8A65] to-[#FF7043] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-300",
        search: "bg-white border-none rounded-full px-6 py-3 shadow-[0_2px_15px_rgb(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#FF8A65]/20 w-96 text-sm placeholder-gray-500",
    };

    return (
        <div className="flex min-h-screen bg-[#FDFCF8] font-nunito selection:bg-[#FFCCBC] selection:text-[#BF360C]">
            {/* Search & Header (Mobile) */}
            <div className="fixed top-0 w-full z-10 p-4 flex justify-between md:hidden bg-white/80 backdrop-blur-md">
                <span className="font-black text-xl text-[#FF7043]">VroomX</span>
                <FiBell className="w-6 h-6 text-gray-400" />
            </div>

            {/* Sidebar (Floating Island Style) */}
            <aside className={styles.sidebar}>
                <div className="mb-12 px-4 flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-tr from-[#FF8A65] to-[#FFAB91] rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center text-white">
                        <FiShield className="w-6 h-6" />
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight text-[#2D2D2D]">VroomX</span>
                </div>

                <nav className="space-y-2 flex-1">
                    <div className={`${styles.navItem} ${styles.navItemActive}`}>
                        <FiHome className="w-5 h-5" />
                        <span>Overview</span>
                    </div>
                    <div className={styles.navItem}>
                        <FiCheckCircle className="w-5 h-5" />
                        <span>Compliance</span>
                    </div>
                    <div className={styles.navItem}>
                        <FiUser className="w-5 h-5" />
                        <span>Drivers</span>
                    </div>
                    <div className={styles.navItem}>
                        <FiCalendar className="w-5 h-5" />
                        <span>Schedule</span>
                    </div>
                </nav>

                {/* Profile Blob */}
                <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform">
                    <img src="https://ui-avatars.com/api/?name=Alex+M&background=FF8A65&color=fff" className="w-10 h-10 rounded-full" alt="Profile" />
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate">Alex Morgan</h4>
                        <p className="text-xs text-gray-500 truncate">Safety Officer</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={styles.main}>
                {/* Top Bar Destktop */}
                <header className="hidden md:flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#2D2D2D] mb-1">Good Morning, Alex! ☀️</h1>
                        <p className="text-gray-500 font-medium">Your fleet is 98% compliant today.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                            <input type="text" placeholder="Search for anything..." className={styles.search} />
                        </div>
                        <button className="bg-white p-3 rounded-full shadow-sm hover:shadow-md text-gray-400 hover:text-[#FF7043] transition-all">
                            <FiBell className="w-5 h-5" />
                            <span className="absolute top-8 right-8 w-2 h-2 bg-red-400 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Hero Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    {/* Card 1 */}
                    <div className={`${styles.card} relative overflow-hidden group hover:-translate-y-1`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E3F2FD] rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-500 font-bold mb-2">Driver Score</h3>
                            <div className="text-5xl font-black text-[#2D2D2D] mb-4 tracking-tighter">98<span className="text-2xl text-[#64B5F6]">%</span></div>
                            <div className="inline-flex items-center gap-2 bg-[#E3F2FD] text-[#1E88E5] px-3 py-1 rounded-full text-sm font-bold">
                                <FiArrowRight className="w-3 h-3 rotate-[-45deg]" /> Top 5%
                            </div>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className={`${styles.card} relative overflow-hidden group hover:-translate-y-1`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8F5E9] rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-500 font-bold mb-2">Active Tasks</h3>
                            <div className="text-5xl font-black text-[#2D2D2D] mb-4 tracking-tighter">12</div>
                            <div className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#43A047] px-3 py-1 rounded-full text-sm font-bold">
                                All Systems Go
                            </div>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className={`${styles.card} relative overflow-hidden group hover:-translate-y-1`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFF3E0] rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-500 font-bold mb-2">Expiring Docs</h3>
                            <div className="text-5xl font-black text-[#2D2D2D] mb-4 tracking-tighter">3</div>
                            <div className="inline-flex items-center gap-2 bg-[#FFF3E0] text-[#EF6C00] px-3 py-1 rounded-full text-sm font-bold">
                                Action Needed
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Main List */}
                    <div className={`${styles.card} md:col-span-2`}>
                        <div className={styles.cardHeader}>
                            <span>Recent Activity</span>
                            <button className="text-sm font-bold text-[#FF7043] hover:bg-[#FFF5F2] px-3 py-1 rounded-lg transition-colors">View All</button>
                        </div>

                        <div className="space-y-1">
                            {[
                                { name: 'Vehicle #4001', action: 'Passed Inspection', time: '2 hours ago', icon: '🚛', color: 'bg-blue-50' },
                                { name: 'Marcus Jones', action: 'Uploaded Medical Cert', time: '4 hours ago', icon: '📄', color: 'bg-green-50' },
                                { name: 'Safety Audit', action: 'Scheduled for Friday', time: 'Yesterday', icon: '📅', color: 'bg-purple-50' },
                                { name: 'Vehicle #202', action: 'Maintenance Required', time: 'Yesterday', icon: '🔧', color: 'bg-orange-50' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                                    <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#2D2D2D]">{item.name}</h4>
                                        <p className="text-sm text-gray-500">{item.action}</p>
                                    </div>
                                    <span className="text-xs font-bold text-gray-300">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`${styles.card} bg-[#2D2D2D] text-white border-none`}>
                        <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 transition-colors text-left group">
                                <div className="w-8 h-8 rounded-full bg-[#FF7043] flex items-center justify-center">
                                    <FiCheckCircle className="text-white w-4 h-4" />
                                </div>
                                <span className="font-bold text-sm">New Inspection</span>
                                <FiArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 transition-colors text-left group">
                                <div className="w-8 h-8 rounded-full bg-[#42A5F5] flex items-center justify-center">
                                    <FiUser className="text-white w-4 h-4" />
                                </div>
                                <span className="font-bold text-sm">Add Driver</span>
                                <FiArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <div className="mt-8 pt-8 border-t border-white/10 text-center">
                                <p className="text-white/40 text-xs mb-3">Need help?</p>
                                <button className="bg-white text-[#2D2D2D] px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">Contact Support</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MinimalistDemo;
