import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    DollarSign, 
    Briefcase, 
    TrendingUp, 
    ShieldCheck, 
    Loader2,
    BarChart3, 
    RefreshCw, 
    PieChart,
    ShoppingBag
} from 'lucide-react';
import api from '@api';

const SuperAdminOverviewPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const overviewRes = await api.get('/admin/overview').catch(() => ({ data: null }));
            setStats(overviewRes.data);
        } catch (err) {
            console.error('Error fetching admin overview data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAllData();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;
    const chartData = stats?.chartData || [];
    const brandDistribution = stats?.brandDistribution || [];
    const categoryBreakdown = stats?.categoryBreakdown || [];

    const maxChartGmv = Math.max(...chartData.map(d => d.gmv), 1000);

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
                        Platform-wide revenue reconciliation, interactive telemetry, and marketplace order governance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAllData}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all shadow-md active:scale-95"
                    >
                        <RefreshCw size={14} />
                        <span>Refresh Metrics</span>
                    </button>
                    <Link
                        to="/admin/brands"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20"
                    >
                        <Briefcase size={15} /> Moderate Brands
                    </Link>
                </div>
            </div>

            {/* Financial Telemetry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider">Gross Merchandise Value</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">{formatCurrency(stats?.gmv)}</div>
                    <p className="text-xs text-slate-400">Total customer checkout volume</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider">Platform Take-Rate (10%)</span>
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-indigo-400 font-mono">{formatCurrency(stats?.platformRevenue)}</div>
                    <p className="text-xs text-slate-400">Net platform fee revenues</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider">Active Brand Sellers</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Briefcase size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{stats?.activeSellers || 0}</div>
                    <p className="text-xs text-slate-400">{stats?.pendingApplications || 0} applications pending review</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider">Marketplace Orders</span>
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <ShoppingBag size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{stats?.orders || 0}</div>
                    <p className="text-xs text-slate-400">{stats?.orders || 0} completed orders</p>
                </div>
            </div>

            {/* Interactive 14-Day GMV Trajectory Chart */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <BarChart3 className="text-indigo-400" size={20} />
                            Platform Gross Merchandise Value (14-Day Trajectory)
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Daily gross transaction volume and customer checkouts across all brand ateliers
                        </p>
                    </div>

                    {hoveredChartPoint ? (
                        <div className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-right">
                            <span className="text-[10px] uppercase font-bold text-indigo-400 block">{hoveredChartPoint.label}</span>
                            <span className="text-sm font-black text-white font-mono">{formatCurrency(hoveredChartPoint.gmv)}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({hoveredChartPoint.orders} orders)</span>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-500">
                            Hover over any bar to view daily metrics
                        </div>
                    )}
                </div>

                {chartData.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-xs">No historical volume data available.</div>
                ) : (
                    <div className="pt-4">
                        <div className="h-44 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-slate-800">
                            {chartData.map((point, idx) => {
                                const heightPercent = maxChartGmv > 0 ? Math.max((point.gmv / maxChartGmv) * 100, point.gmv > 0 ? 8 : 2) : 2;
                                const isHovered = hoveredChartPoint?.date === point.date;

                                return (
                                    <div
                                        key={idx}
                                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                                        onMouseEnter={() => setHoveredChartPoint(point)}
                                        onMouseLeave={() => setHoveredChartPoint(null)}
                                    >
                                        <div 
                                            style={{ height: `${heightPercent}%` }}
                                            className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 relative ${
                                                point.gmv > 0 
                                                    ? isHovered 
                                                        ? 'bg-indigo-400 shadow-lg shadow-indigo-500/50' 
                                                        : 'bg-gradient-to-t from-indigo-700 to-indigo-500' 
                                                    : 'bg-slate-800/40 group-hover:bg-slate-700/50'
                                            }`}
                                        >
                                            {isHovered && point.gmv > 0 && (
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap z-10">
                                                    {formatCurrency(point.gmv)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1">
                            {chartData.map((point, idx) => (
                                <span key={idx} className="truncate text-center w-full">
                                    {idx % 2 === 0 ? point.label : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Brand Seller Share & Category Mix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brand Sales Contribution */}
                <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Briefcase size={17} className="text-indigo-400" /> Brand Seller Volume Contribution
                    </h3>

                    {brandDistribution.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs">No brand sales data available.</div>
                    ) : (
                        <div className="space-y-3">
                            {brandDistribution.map((b, idx) => (
                                <div key={idx} className="space-y-1 text-xs">
                                    <div className="flex justify-between items-center text-slate-300">
                                        <span className="font-semibold text-white">{b.brand_name || 'Independent Atelier'}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-400">{b.orders_count || 0} orders</span>
                                            <span className="font-mono font-bold text-indigo-400">{formatCurrency(b.gross_sales)}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                                                {b.share}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(b.share, 100)}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Category Demand Mix */}
                <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <PieChart size={17} className="text-purple-400" /> Category Revenue Breakdown
                    </h3>

                    {categoryBreakdown.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs">No category transactions available.</div>
                    ) : (
                        <div className="space-y-3">
                            {categoryBreakdown.map((c, idx) => (
                                <div key={idx} className="space-y-1 text-xs">
                                    <div className="flex justify-between items-center text-slate-300">
                                        <span className="font-semibold text-white">{c.category_name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-400">{c.units_sold || 0} units</span>
                                            <span className="font-mono font-bold text-purple-400">{formatCurrency(c.revenue)}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                                                {c.share}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(c.share, 100)}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminOverviewPage;
