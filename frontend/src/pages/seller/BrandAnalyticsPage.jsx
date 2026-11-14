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
            clothing_type: item.size ? `Size ${item.size} · ${item.color || 'Standard'}` : 'Apparel',
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
      <div className="h-[60vh] flex items-center justify-center font-ui text-[#121212]">
        <Loader2 className="animate-spin text-[#121212]" size={28} />
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
    <div className="space-y-8 font-ui text-[#121212]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E8E4]">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Commercial Telemetry
          </span>
          <h1 className="font-editorial text-3xl font-light text-[#121212]">Sales & Net Settlement</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Audit gross merchandise volume, net atelier payouts, and top-performing garments.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAllData}
          className="px-4 py-2 bg-white border border-[#E8E8E4] hover:bg-[#F4F4F2] text-[#121212] text-[10px] font-medium uppercase tracking-fashion inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw size={12} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-[#E8E8E4] shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] block mb-2">
            Gross Merch Value
          </span>
          <div className="font-tabular text-2xl font-semibold text-[#121212]">
            {formatCurrency(metrics.totalGross)}
          </div>
          <span className="text-[10px] text-[#71717A] mt-1 block">Total client order billing</span>
        </div>

        <div className="p-5 bg-white border border-[#E8E8E4] shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] block mb-2">
            Net Atelier Payout
          </span>
          <div className="font-tabular text-2xl font-semibold text-emerald-800">
            {formatCurrency(metrics.totalNet)}
          </div>
          <span className="text-[10px] text-[#71717A] mt-1 block">
            Minus {brandRate != null ? `${brandRate}%` : '5%'} platform share
          </span>
        </div>

        <div className="p-5 bg-white border border-[#E8E8E4] shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] block mb-2">
            Platform Take-Rate
          </span>
          <div className="font-tabular text-2xl font-semibold text-[#121212]">
            {formatCurrency(metrics.totalCommission)}
          </div>
          <span className="text-[10px] text-[#71717A] mt-1 block">Static 5.0% platform fee</span>
        </div>

        <div className="p-5 bg-white border border-[#E8E8E4] shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] block mb-2">
            Average Order Value
          </span>
          <div className="font-tabular text-2xl font-semibold text-[#121212]">
            {formatCurrency(metrics.aov)}
          </div>
          <span className="text-[10px] text-[#71717A] mt-1 block">Over {metrics.ordersCount} total consignments</span>
        </div>
      </div>

      {/* 14-Day Sales Velocity Chart */}
      <div className="p-6 bg-white border border-[#E8E8E4] space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-fashion text-[#121212] flex items-center gap-2">
              <BarChart3 size={14} className="text-[#843828]" />
              <span>14-Day Sales Trajectory</span>
            </h3>
            <p className="text-[11px] text-[#71717A] mt-0.5">Daily gross order volume across this atelier's catalog</p>
          </div>
          {hoveredBar && (
            <div className="text-right text-xs font-tabular">
              <span className="text-[#71717A]">{hoveredBar.label}: </span>
              <strong className="text-[#121212]">{formatCurrency(hoveredBar.sales)}</strong>
              <span className="text-[#71717A]"> ({hoveredBar.orders} orders)</span>
            </div>
          )}
        </div>

        <div className="h-44 flex items-end gap-2 pt-6 border-b border-[#E8E8E4]">
          {chartData.map((d, i) => {
            const heightPercent = maxDailySales > 0 ? Math.max(6, Math.round((d.sales / maxDailySales) * 100)) : 6;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredBar(d)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div
                  className="w-full bg-[#E8E8E4] group-hover:bg-[#121212] transition-colors"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[9px] text-[#71717A] mt-2 truncate w-full text-center font-tabular">
                  {d.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best-Performing Garments */}
      <div className="bg-white border border-[#E8E8E4] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E4]">
          <h3 className="text-xs font-semibold uppercase tracking-fashion text-[#121212] flex items-center gap-2">
            <Shirt size={14} className="text-[#843828]" />
            <span>Top-Performing Garments</span>
          </h3>
          <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-tabular">
            By Units Dispatched
          </span>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-xs text-[#71717A] italic py-4">No product sales velocity recorded yet.</p>
        ) : (
          <div className="divide-y divide-[#E8E8E4]">
            {topProducts.map((p, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-tabular text-[10px] text-[#71717A] w-5">#{idx + 1}</span>
                  <div>
                    <h4 className="font-medium text-[#121212] text-xs">{p.name}</h4>
                    <span className="text-[10px] text-[#71717A]">{p.clothing_type}</span>
                  </div>
                </div>

                <div className="text-right font-tabular">
                  <span className="text-xs font-semibold text-[#121212] block">{p.units_sold} Units Sold</span>
                  <span className="text-[10px] text-[#71717A]">{formatCurrency(p.total_revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandAnalyticsPage;
