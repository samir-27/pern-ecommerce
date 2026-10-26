import { useState, useEffect } from 'react';
import { 
    BarChart3, 
    Shirt, 
    Loader2,
    RefreshCw
} from 'lucide-react';
import api from '@api';

const BrandAnalyticsPage = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredBar, setHoveredBar] = useState(null);
    const [brandRate, setBrandRate] = useState(null);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [ordersRes, brandRes] = await Promise.all([
                api.get('/seller/orders').catch(() => ({ data: [] })),
                api.get('/brand/profile').catch(() => ({ data: null }))
            ]);
            const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
            if (brandRes?.data?.commission_rate != null) {
                setBrandRate(Number(brandRes.data.commission_rate));
            }

            // 1. Build 14-day daily chart trajectory
            const chartMap = new Map();
            for (let i = 13; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().slice(0, 10);
                const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                chartMap.set(dateStr, { date: dateStr, label, sales: 0, earnings: 0, orders: 0 });
            }

            let totalGross = 0;
            let totalCommission = 0;
            let totalNet = 0;
            const productsById = new Map();

            orders.forEach((order) => {
                const subtotal = Number(order.subtotal || 0);
                const commission = Number(order.commission_amount || 0);
                const net = Number(order.seller_net_earnings || (subtotal - commission));

                totalGross += subtotal;
                totalCommission += commission;
                totalNet += net;

                const dateStr = new Date(order.created_at).toISOString().slice(0, 10);
                if (chartMap.has(dateStr)) {
                    const entry = chartMap.get(dateStr);
                    entry.sales += subtotal;
                    entry.earnings += net;
                    entry.orders += 1;
                }

                (order.items || []).forEach((item) => {
                    const productId = item.product_name || item.variant_id;
                    const product = productsById.get(productId) || {
                        id: productId,
                        name: item.product_name,
                        images: item.image_urls || item.images || [],
                        clothing_type: item.size ? `Size ${item.size} • ${item.color || 'Standard'}` : 'Apparel',
                        units_sold: 0,
                        total_revenue: 0,
                    };
                    product.units_sold += Number(item.quantity || 0);
                    product.total_revenue += Number(item.price_at_purchase || 0) * Number(item.quantity || 0);
                    productsById.set(productId, product);
                });
            });

            const topProducts = [...productsById.values()]
                .sort((a, b) => b.units_sold - a.units_sold)
                .slice(0, 10);

            setAnalyticsData({
                metrics: {
                    totalGross,
                    totalCommission,
                    totalNet,
                    ordersCount: orders.length,
                    aov: orders.length > 0 ? Math.round(totalGross / orders.length) : 0
                },
                chartData: Array.from(chartMap.values()),
                topProducts
            });

        } catch (err) {
            console.error('Error fetching brand analytics:', err);
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
                <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
        );
    }

    const { metrics = {}, chartData = [], topProducts = [] } = analyticsData || {};
    const maxChartValue = Math.max(...chartData.map(d => d.sales), 1000);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white">Brand Sales Analytics</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Revenue telemetry, 14-day order trajectories, and best-performing apparel pieces.
                    </p>
                </div>
                <button
                    onClick={fetchAllData}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 self-start sm:self-auto border border-slate-700"
                >
                    <RefreshCw size={14} />
                    <span>Refresh Analytics</span>
                </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Gross Sales Volume
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                        ₹{(metrics.totalGross ?? 0).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">{metrics.ordersCount || 0} customer purchases</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Net Brand Payout
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                        ₹{(metrics.totalNet ?? 0).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                        After standard 5% platform commission
                    </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Platform Commission (5%)
                    </span>
                    <span className="text-2xl font-black text-slate-300 font-mono">
                        ₹{(metrics.totalCommission ?? 0).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">Marketplace hosting, settlement & transaction fees</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Average Order Value
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                        ₹{(metrics.aov ?? 0).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">Per checkout basket</p>
                </div>
            </div>

            {/* Interactive 14-Day Sales Velocity Chart */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <BarChart3 className="text-amber-400" size={20} />
                            14-Day Daily Sales Trajectory
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Daily gross sales volume and customer order spikes
                        </p>
                    </div>
                    {hoveredBar ? (
                        <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-right">
                            <span className="text-[10px] uppercase font-bold text-amber-400 block">{hoveredBar.label}</span>
                            <span className="text-sm font-black text-white font-mono">₹{hoveredBar.sales.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({hoveredBar.orders} orders)</span>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-500">
                            Hover over any bar to view daily details
                        </div>
                    )}
                </div>

                {/* SVG / CSS Bar Chart */}
                <div className="pt-6 pb-2">
                    <div className="h-48 flex items-end justify-between gap-2 md:gap-3 px-2 border-b border-slate-800">
                        {chartData.map((d, idx) => {
                            const heightPercent = maxChartValue > 0 ? Math.max((d.sales / maxChartValue) * 100, d.sales > 0 ? 8 : 2) : 2;
                            const isHovered = hoveredBar?.date === d.date;

                            return (
                                <div
                                    key={idx}
                                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                                    onMouseEnter={() => setHoveredBar(d)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                >
                                    <div 
                                        style={{ height: `${heightPercent}%` }}
                                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 relative ${
                                            d.sales > 0 
                                                ? isHovered 
                                                    ? 'bg-amber-400 shadow-lg shadow-amber-500/50' 
                                                    : 'bg-gradient-to-t from-amber-600 to-amber-500' 
                                                : 'bg-slate-800/40 group-hover:bg-slate-700/50'
                                        }`}
                                    >
                                        {isHovered && d.sales > 0 && (
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap z-10">
                                                ₹{d.sales.toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-slate-500 group-hover:text-slate-300 mt-2 truncate w-full text-center">
                                        {d.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Top Performing Garments */}
            <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shirt size={18} className="text-amber-400" /> Best Performing Apparel Pieces
                </h3>

                {topProducts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                        No sales data recorded yet for your collection.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                                    <th className="pb-3">Garment Item</th>
                                    <th className="pb-3">Variant</th>
                                    <th className="pb-3 text-right">Units Sold</th>
                                    <th className="pb-3 text-right">Revenue Generated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {topProducts.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 font-medium text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                                {p.images && p.images[0] ? (
                                                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                        <Shirt size={12} />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="truncate max-w-[200px]">{p.name}</span>
                                        </td>
                                        <td className="py-3 text-slate-400">{p.clothing_type}</td>
                                        <td className="py-3 text-right font-bold text-slate-200">{p.units_sold}</td>
                                        <td className="py-3 text-right font-bold text-amber-400 font-mono">
                                            ₹{p.total_revenue.toLocaleString('en-IN')}
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
