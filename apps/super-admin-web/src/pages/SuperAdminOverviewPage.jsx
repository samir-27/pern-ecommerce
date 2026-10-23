import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    DollarSign, 
    Briefcase, 
    Users, 
    Shirt, 
    ShoppingBag, 
    TrendingUp, 
    AlertCircle, 
    CheckCircle2, 
    ArrowUpRight, 
    ShieldCheck, 
    Loader2 
} from 'lucide-react';
import api from '@api';

const SuperAdminOverviewPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await api.get('/admin/overview');
                setStats(res.data);
            } catch (err) {
                console.error('Error fetching admin overview:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">
                        <ShieldCheck size={14} /> Executive Platform Dashboard
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white">
                        Marketplace Governance Center
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 max-w-xl">
                        Platform-wide revenue reconciliation, brand seller oversight, buyer activity, and catalog moderation.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/brands"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Briefcase size={15} /> Moderate Brands
                    </Link>
                    <Link
                        to="/admin/products"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
                    >
                        Review Catalog
                    </Link>
                </div>
            </div>

            {/* Platform KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider">Gross Marketplace GMV</span>
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <DollarSign size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{formatCurrency(stats?.gmv)}</div>
                    <p className="text-xs text-slate-400 mt-1">Total buyer transaction volume</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider">Platform Revenue</span>
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-indigo-400">{formatCurrency(stats?.platformRevenue)}</div>
                    <p className="text-xs text-slate-400 mt-1">Commission earned across all brands</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider">Active Brands</span>
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                            <Briefcase size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{stats?.activeSellers || 0}</div>
                    <p className="text-xs text-slate-400 mt-1">{stats?.pendingApplications || 0} pending brand approvals</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider">Registered Buyers</span>
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <Users size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{stats?.users || 0}</div>
                    <p className="text-xs text-slate-400 mt-1">{stats?.orders || 0} total completed checkouts</p>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    to="/admin/brands"
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                            <Briefcase size={20} />
                        </div>
                        <ArrowUpRight size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <h3 className="font-bold text-white text-base">Brand Seller Governance</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Review official registrations, suspend delinquent brands, or adjust commission structures.
                    </p>
                </Link>

                <Link
                    to="/admin/buyers"
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                            <Users size={20} />
                        </div>
                        <ArrowUpRight size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <h3 className="font-bold text-white text-base">Buyer Accounts & Spend</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Inspect customer directory, order history frequency, and lifetime purchasing volume.
                    </p>
                </Link>

                <Link
                    to="/admin/audit-logs"
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={20} />
                        </div>
                        <ArrowUpRight size={18} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <h3 className="font-bold text-white text-base">Security Audit Logs</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Chronological trail of catalog changes, dispatch updates, and administrative overrides.
                    </p>
                </Link>
            </div>
        </div>
    );
};

export default SuperAdminOverviewPage;
