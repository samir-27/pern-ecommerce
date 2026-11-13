import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Shirt, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import api from '@/services/Axios';
import { formatCurrency } from '@/utils/formatters';

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
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  const { metrics, chartData, topProducts } = analyticsData || {
    metrics: { totalGross: 0, totalCommission: 0, totalNet: 0, ordersCount: 0, aov: 0 },
    chartData: [],
    topProducts: []
  };

  const maxDailySales = Math.max(...chartData.map(d => d.sales), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Brand Sales & Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track gross merchandise value, net payout reconciliation, and best-selling clothing pieces.
          </p>
        </div>
        <button
          onClick={fetchAllData}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Gross Merch Value
          </span>
          <div className="text-2xl font-black text-white">
            {formatCurrency(metrics.totalGross)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Customer gross purchases</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Net Atelier Payout
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrency(metrics.totalNet)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Minus {brandRate != null ? `${brandRate}%` : '5%'} platform commission
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Platform Take-Rate
          </span>
          <div className="text-2xl font-black text-amber-400">
            {formatCurrency(metrics.totalCommission)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Static 5% retained fee</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Average Order Value
          </span>
          <div className="text-2xl font-black text-white">
            {formatCurrency(metrics.aov)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Over {metrics.ordersCount} total orders</span>
        </div>
      </div>

      {/* 14-Day Sales Velocity Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-400" /> 14-Day Sales Velocity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Daily gross order volume across this atelier's catalog</p>
          </div>
          {hoveredBar && (
            <div className="text-right text-xs">
              <span className="text-slate-400 font-medium">{hoveredBar.label}: </span>
              <strong className="text-amber-400">{formatCurrency(hoveredBar.sales)}</strong>
              <span className="text-slate-500"> ({hoveredBar.orders} orders)</span>
            </div>
          )}
        </div>

        <div className="h-48 flex items-end gap-2 pt-6">
          {chartData.map((d, idx) => {
            const heightPercent = Math.max(8, Math.round((d.sales / maxDailySales) * 100));
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredBar(d)}
                onMouseLeave={() => setHoveredBar(null)}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-lg transition-all ${
                    d.sales > 0
                      ? 'bg-amber-500/80 group-hover:bg-amber-400 group-hover:shadow-lg group-hover:shadow-amber-500/20'
                      : 'bg-slate-800/40 group-hover:bg-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-500 truncate w-full text-center group-hover:text-white">
                  {d.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Performing Garments Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shirt size={18} className="text-amber-400" /> Best-Selling Garments
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Ranked by volume of garment units purchased by clients</p>
        </div>

        {topProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No garment sales recorded yet. Once clients purchase pieces, sales metrics will populate here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topProducts.map((p, idx) => {
                  const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        {img && (
                          <img
                            src={img}
                            alt={p.name}
                            className="w-10 h-12 rounded-lg object-cover bg-slate-800 shrink-0"
                          />
                        )}
                        <span className="font-bold text-white truncate max-w-xs">{p.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{p.clothing_type}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{p.units_sold}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                        {formatCurrency(p.total_revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandAnalyticsPage;
