import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Briefcase, 
  ShieldCheck, 
  Loader2, 
  BarChart3, 
  RefreshCw, 
  ShoppingBag 
} from 'lucide-react';
import api from '@/services/Axios';
import { formatCurrency } from '@/utils/formatters';

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
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center font-ui text-[#121212]">
        <Loader2 className="animate-spin text-[#121212]" size={28} />
      </div>
    );
  }

  const chartData = stats?.chartData || [];
  const brandDistribution = stats?.brandDistribution || [];
  const categoryBreakdown = stats?.categoryBreakdown || [];

  const maxChartGmv = Math.max(...chartData.map(d => d.gmv), 1000);

  return (
    <div className="space-y-8 font-ui text-[#121212]">
      {/* Header Banner */}
      <div className="p-6 md:p-8 bg-white border border-[#E8E8E4] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] mb-1">
            <ShieldCheck size={13} />
            <span>Executive Governance Console</span>
          </div>
          <h1 className="font-editorial text-3xl font-light text-[#121212]">
            Marketplace Command Telemetry
          </h1>
          <p className="text-[#71717A] text-xs mt-1 max-w-xl leading-relaxed">
            Platform-wide gross order volume, 5.0% static fee collection, partner atelier directory, and transaction audit trails.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAllData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#F4F4F2] text-[#121212] text-[11px] font-medium uppercase tracking-fashion border border-[#E8E8E4] transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw size={12} />
            <span>Sync Telemetry</span>
          </button>
          <Link
            to="/admin/brands"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#121212] hover:bg-black text-[#FBFBFA] text-[11px] font-medium uppercase tracking-fashion transition-colors cursor-pointer"
          >
            <Briefcase size={12} />
            <span>Moderate Ateliers</span>
          </Link>
        </div>
      </div>

      {/* Financial Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-[#E8E8E4] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#71717A]">
            <span className="text-[10px] font-semibold uppercase tracking-fashion">Gross Volume (GMV)</span>
            <DollarSign size={14} className="text-[#71717A]" />
          </div>
          <div className="text-2xl font-semibold text-[#121212] font-tabular">{formatCurrency(stats?.gmv || 0)}</div>
          <p className="text-[10px] text-[#71717A]">Total client bag checkout volume</p>
        </div>

        <div className="p-5 bg-white border border-[#E8E8E4] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#71717A]">
            <span className="text-[10px] font-semibold uppercase tracking-fashion">Platform Take-Rate (5%)</span>
            <span className="text-[10px] font-tabular text-emerald-800 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">Retained</span>
          </div>
          <div className="text-2xl font-semibold text-emerald-800 font-tabular">{formatCurrency(stats?.platformCommission || 0)}</div>
          <p className="text-[10px] text-[#71717A]">Static 5.0% fee on delivered orders</p>
        </div>

        <div className="p-5 bg-white border border-[#E8E8E4] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#71717A]">
            <span className="text-[10px] font-semibold uppercase tracking-fashion">Atelier Payouts (95%)</span>
            <span className="text-[10px] font-tabular text-blue-800 bg-blue-50 px-1.5 py-0.5 border border-blue-200">Disbursed</span>
          </div>
          <div className="text-2xl font-semibold text-[#121212] font-tabular">{formatCurrency(stats?.sellerPayouts || 0)}</div>
          <p className="text-[10px] text-[#71717A]">Net capital released to makers</p>
        </div>

        <div className="p-5 bg-white border border-[#E8E8E4] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#71717A]">
            <span className="text-[10px] font-semibold uppercase tracking-fashion">Platform Consignments</span>
            <ShoppingBag size={14} className="text-[#71717A]" />
          </div>
          <div className="text-2xl font-semibold text-[#121212] font-tabular">{stats?.totalOrders || 0}</div>
          <p className="text-[10px] text-[#71717A]">Confirmed orders processed</p>
        </div>
      </div>

      {/* 30-Day GMV Trajectory Chart */}
      <div className="p-6 bg-white border border-[#E8E8E4] space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-fashion text-[#121212] flex items-center gap-2">
              <BarChart3 size={14} className="text-[#843828]" />
              <span>30-Day Marketplace Volume Velocity</span>
            </h3>
            <p className="text-[11px] text-[#71717A] mt-0.5">Chronological platform gross checkout volume</p>
          </div>
          {hoveredChartPoint && (
            <div className="text-right text-xs font-tabular">
              <span className="text-[#71717A]">{hoveredChartPoint.date}: </span>
              <strong className="text-[#121212]">{formatCurrency(hoveredChartPoint.gmv)}</strong>
              <span className="text-[#71717A]"> ({hoveredChartPoint.orders} orders)</span>
            </div>
          )}
        </div>

        <div className="h-44 flex items-end gap-1.5 pt-6 border-b border-[#E8E8E4]">
          {chartData.map((d, idx) => {
            const heightPercent = maxChartGmv > 0 ? Math.max(6, Math.round((d.gmv / maxChartGmv) * 100)) : 6;
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredChartPoint(d)}
                onMouseLeave={() => setHoveredChartPoint(null)}
              >
                <div
                  className="w-full bg-[#E8E8E4] group-hover:bg-[#121212] transition-colors"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Atelier GMV Contribution */}
        <div className="p-6 bg-white border border-[#E8E8E4] space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E4]">
            <h3 className="text-xs font-semibold uppercase tracking-fashion text-[#121212]">
              Atelier Revenue Share
            </h3>
            <span className="text-[10px] text-[#71717A] font-tabular uppercase">By Sales Volume</span>
          </div>

          <div className="space-y-3">
            {brandDistribution.length === 0 ? (
              <p className="text-xs text-[#71717A] italic py-2">No brand order volume yet.</p>
            ) : (
              brandDistribution.slice(0, 5).map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-tabular">
                  <div>
                    <span className="text-[#121212] font-medium">{b.name}</span>
                    <span className="text-[10px] text-[#71717A] block font-ui">{b.orderCount} orders</span>
                  </div>
                  <span className="font-semibold text-[#121212]">{formatCurrency(b.gmv)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 bg-white border border-[#E8E8E4] space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E4]">
            <h3 className="text-xs font-semibold uppercase tracking-fashion text-[#121212]">
              Department Category Mix
            </h3>
            <span className="text-[10px] text-[#71717A] font-tabular uppercase">By Garment Count</span>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-[#71717A] italic py-2">No category data available.</p>
            ) : (
              categoryBreakdown.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-tabular">
                  <span className="text-[#121212] font-medium font-ui">{c.category}</span>
                  <span className="font-semibold text-[#121212]">{c.productCount} Garments</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverviewPage;
