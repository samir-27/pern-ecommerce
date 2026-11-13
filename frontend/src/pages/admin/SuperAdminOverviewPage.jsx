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
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Refresh Metrics</span>
          </button>
          <Link
            to="/admin/brands"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
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
          <div className="text-2xl font-black text-white font-mono">{formatCurrency(stats?.gmv || 0)}</div>
          <p className="text-xs text-slate-400">Total customer checkout volume</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Take-Rate (5%)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono">{formatCurrency(stats?.platformRevenue || 0)}</div>
          <p className="text-xs text-slate-400">Fixed 5% standard marketplace commission</p>
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
              Daily customer purchase volume across all onboarded ateliers
            </p>
          </div>
          {hoveredChartPoint && (
            <div className="text-right text-xs bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400">{hoveredChartPoint.date}: </span>
              <strong className="text-indigo-400 font-mono">{formatCurrency(hoveredChartPoint.gmv)}</strong>
              <span className="text-slate-500"> ({hoveredChartPoint.orders || 0} orders)</span>
            </div>
          )}
        </div>

        <div className="h-48 flex items-end gap-2 pt-4">
          {chartData.map((d, idx) => {
            const heightPercent = Math.max(10, Math.round((d.gmv / maxChartGmv) * 100));
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredChartPoint(d)}
                onMouseLeave={() => setHoveredChartPoint(null)}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-lg transition-all ${
                    d.gmv > 0
                      ? 'bg-indigo-600 group-hover:bg-indigo-500 group-hover:shadow-lg group-hover:shadow-indigo-600/25'
                      : 'bg-slate-800/40 group-hover:bg-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-500 truncate w-full text-center group-hover:text-white">
                  {d.date ? d.date.slice(5) : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Category Breakdown & Brand Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart size={16} className="text-indigo-400" /> Category Revenue Breakdown
            </h3>
          </div>
          {categoryBreakdown.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No category purchases logged yet.</div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold">{cat.name}</span>
                    <span className="font-mono text-white">{formatCurrency(cat.revenue)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.round((cat.revenue / (stats?.gmv || 1)) * 100))}%` }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Brand Distribution */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase size={16} className="text-amber-400" /> Top Partner Ateliers by GMV
            </h3>
          </div>
          {brandDistribution.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No brand sales logged yet.</div>
          ) : (
            <div className="space-y-3">
              {brandDistribution.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <div className="font-bold text-white truncate max-w-xs">{b.name}</div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 block">{formatCurrency(b.revenue)}</span>
                    <span className="text-[10px] text-slate-500">{b.orderCount || 0} orders</span>
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
