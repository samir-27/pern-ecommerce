import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    DollarSign, 
    Shirt, 
    PackageCheck, 
    AlertTriangle, 
    ArrowUpRight, 
    Plus, 
    TrendingUp, 
    Clock, 
    ShieldCheck, 
    Loader2 
} from 'lucide-react';
import api from '@api';

const BrandOverviewPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const [overviewRes, storeRes] = await Promise.all([
                    api.get('/brand/overview').catch(() => api.get('/seller/overview')).catch(() => ({ data: {} })),
                    api.get('/brand/profile').catch(() => api.get('/seller/store')).catch(() => ({ data: {} })),
                ]);
                const ov = overviewRes.data || {};
                const st = storeRes.data || {};
                setData({
                    brand: st,
                    products: { total_products: ov.totalProducts ?? ov.products?.total_products ?? 0 },
                    orders: {
                        total_orders: ov.totalOrders ?? ov.orders?.total_orders ?? 0,
                        gross_sales: ov.totalEarnings ?? ov.orders?.gross_sales ?? 0,
                        net_earnings: ov.totalEarnings ?? ov.orders?.net_earnings ?? 0,
                        pending_fulfillment: ov.pendingFulfillment ?? ov.orders?.pending_fulfillment ?? 0,
                    },
                    inventory: { low_stock_count: ov.lowStockCount ?? ov.inventory?.low_stock_count ?? 0 },
                });
            } catch (err) {
                console.error('Error loading brand overview:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
        );
    }

    const { brand, products, orders, inventory } = data || {};

    const formatCurrency = (val) => {
        return `₹${Number(val || 0).toLocaleString('en-IN')}`;
    };

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
                        <ShieldCheck size={14} /> Brand Operations Console
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white">
                        Welcome back, {brand?.name || 'Partner'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 max-w-xl">
                        Monitor clothing collections, manage variant inventory, dispatch pending orders, and review brand earnings.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/seller/products"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                        <Plus size={16} /> Add Garment
                    </Link>
                    <Link
                        to="/seller/orders"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700"
                    >
                        Fulfill Orders
                    </Link>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {/* Gross Sales */}
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <DollarSign size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{formatCurrency(orders?.gross_sales)}</div>
                    <p className="text-xs text-slate-400 mt-1">Platform gross order volume</p>
                </div>

                {/* Net Brand Earnings */}
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider">Net Brand Payout</span>
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-amber-400">{formatCurrency(orders?.net_earnings)}</div>
                    <p className="text-xs text-slate-400 mt-1">After {brand?.commission_rate || 10}% platform commission</p>
                </div>

                {/* Active Products */}
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider">Active Catalog</span>
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <Shirt size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{products?.total_products || 0}</div>
                    <p className="text-xs text-slate-400 mt-1">Products in your catalog</p>
                </div>

                {/* Pending Dispatch */}
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider">Pending Dispatch</span>
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Clock size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-indigo-400">{orders?.pending_fulfillment || 0}</div>
                    <p className="text-xs text-slate-400 mt-1">Orders requiring shipment label</p>
                </div>
            </div>

            {/* Inventory Alerts & Quick Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Low Stock Warning Card */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                            <AlertTriangle size={15} /> Variant Inventory Health
                        </div>
                        <h3 className="text-lg font-bold text-white">Stock Level Monitoring</h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Garments with inventory at or below minimum threshold.
                        </p>
                        <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-4xl font-black text-amber-400">
                                {inventory?.low_stock_count || 0}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">variants requiring restock</span>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-800">
                        <Link 
                            to="/seller/products" 
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
                        >
                            Manage Variant Inventory <ArrowUpRight size={14} />
                        </Link>
                    </div>
                </div>

                {/* Fast Action Cards */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-4">Quick Brand Operations</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link 
                            to="/seller/products"
                            className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">Catalog Manager</span>
                                <ArrowUpRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Update garment pricing, sizes, fabric specifications, and clothing images.
                            </p>
                        </Link>

                        <Link 
                            to="/seller/orders"
                            className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">Dispatch Hub</span>
                                <ArrowUpRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Assign tracking numbers and carriers (BlueDart, FedEx, Delhivery).
                            </p>
                        </Link>

                        <Link 
                            to="/seller/profile"
                            className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">Brand Identity</span>
                                <ArrowUpRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Configure return conditions, shipping lead times, and brand bio.
                            </p>
                        </Link>

                        <Link 
                            to="/seller/analytics"
                            className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">Revenue & Reports</span>
                                <ArrowUpRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Inspect gross volume, commission breakdowns, and top-selling apparel pieces.
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandOverviewPage;
