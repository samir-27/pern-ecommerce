import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    DollarSign, 
    Shirt, 
    Calendar, 
    Loader2 
} from 'lucide-react';
import api from '@api';

const BrandAnalyticsPage = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/brand/analytics');
                setAnalytics(res.data);
            } catch (err) {
                console.error('Error fetching brand analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
        );
    }

    const { recent_revenue = [], top_products = [] } = analytics || {};

    const totalRecentGross = recent_revenue.reduce((acc, r) => acc + Number(r.gross_sales || 0), 0);
    const totalRecentCommission = recent_revenue.reduce((acc, r) => acc + Number(r.platform_fees || 0), 0);
    const totalRecentNet = recent_revenue.reduce((acc, r) => acc + Number(r.net_earnings || 0), 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white">Brand Revenue & Sales Analytics</h1>
                <p className="text-slate-400 text-sm mt-1">
                    Financial performance, commission reconciliations, and best performing apparel pieces.
                </p>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                        30-Day Gross Volume
                    </span>
                    <span className="text-2xl font-black text-white">
                        ₹{totalRecentGross.toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">Total customer purchases</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                        Platform Commission
                    </span>
                    <span className="text-2xl font-black text-slate-400">
                        ₹{totalRecentCommission.toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">Marketplace service fees</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                        Net Brand Payout
                    </span>
                    <span className="text-2xl font-black text-amber-400">
                        ₹{totalRecentNet.toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-amber-500/80 mt-1">Ready for settlement</p>
                </div>
            </div>

            {/* Top Performing Garments */}
            <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shirt size={18} className="text-amber-400" /> Top Selling Apparel Pieces
                </h3>

                {top_products.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                        No sales data recorded yet for your collection.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                                    <th className="pb-3">Garment</th>
                                    <th className="pb-3">Type</th>
                                    <th className="pb-3">Units Sold</th>
                                    <th className="pb-3 text-right">Revenue Generated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {top_products.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-800/30">
                                        <td className="py-3">
                                            <div className="flex items-center gap-2.5">
                                                <img 
                                                    src={item.images?.[0] || 'https://via.placeholder.com/40'} 
                                                    alt={item.name}
                                                    className="w-8 h-10 rounded object-cover bg-slate-800"
                                                />
                                                <span className="font-bold text-white">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-slate-400">{item.clothing_type || 'Apparel'}</td>
                                        <td className="py-3 font-semibold text-slate-200">{item.units_sold} units</td>
                                        <td className="py-3 text-right font-black text-amber-400">
                                            ₹{Number(item.total_revenue).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Daily Breakdown */}
            <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar size={18} className="text-amber-400" /> Daily Revenue Settlement Log
                </h3>

                {recent_revenue.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                        No sales in the last 30 days.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                                    <th className="pb-3">Date</th>
                                    <th className="pb-3">Orders</th>
                                    <th className="pb-3">Gross Sales</th>
                                    <th className="pb-3">Commission</th>
                                    <th className="pb-3 text-right">Net Payout</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {recent_revenue.map((r, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30">
                                        <td className="py-3 font-semibold text-white">{new Date(r.date).toLocaleDateString()}</td>
                                        <td className="py-3 text-slate-300">{r.orders_count}</td>
                                        <td className="py-3 text-slate-300">₹{Number(r.gross_sales).toLocaleString('en-IN')}</td>
                                        <td className="py-3 text-slate-500">₹{Number(r.platform_fees).toLocaleString('en-IN')}</td>
                                        <td className="py-3 text-right font-bold text-amber-400">
                                            ₹{Number(r.net_earnings).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrandAnalyticsPage;
