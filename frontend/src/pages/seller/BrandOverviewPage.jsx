import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Shirt, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  Clock, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import api from '@/services/Axios';
import { formatCurrency } from '@/utils/formatters';

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
          products: { total_products: ov.orders ? (ov.products?.total_products ?? 0) : (ov.totalProducts ?? 0) },
          orders: {
            total_orders: ov.orders?.total_orders ?? ov.totalOrders ?? 0,
            gross_sales: ov.orders?.gross_sales ?? ov.grossSales ?? ov.totalEarnings ?? 0,
            net_earnings: ov.orders?.net_earnings ?? ov.totalEarnings ?? 0,
            total_commission: ov.orders?.total_commission ?? ov.totalCommission ?? 0,
            pending_fulfillment: ov.orders?.pending_fulfillment ?? ov.pendingFulfillment ?? 0,
          },
          inventory: { low_stock_count: ov.inventory?.low_stock_count ?? ov.lowStockCount ?? 0 },
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
            <DollarSign size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(orders?.gross_sales || 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Customer order volume</span>
        </div>

        {/* Net Payout */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Payout</span>
            <span className="text-xs font-bold text-emerald-400">95%</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrency(orders?.net_earnings || 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Minus 5% platform take-rate</span>
        </div>

        {/* Active Garments */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Live Catalog</span>
            <Shirt size={18} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {products?.total_products || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Published garments</span>
        </div>

        {/* Pending Fulfillment */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">To Dispatch</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {orders?.pending_fulfillment || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Orders awaiting shipping</span>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {Number(inventory?.low_stock_count || 0) > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-400 shrink-0" size={20} />
            <div className="text-xs text-amber-300">
              <strong>Low Inventory Alert:</strong> You have {inventory.low_stock_count} garment variant(s) below threshold. Restock soon to prevent order cancellations.
            </div>
          </div>
          <Link
            to="/seller/products"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline shrink-0"
          >
            Update Stock
          </Link>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/seller/products"
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-slate-800 text-amber-400">
              <Shirt size={22} />
            </div>
            <ArrowUpRight size={18} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
            Manage Product Catalog
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Add new garments, customize sizes and colorway images, and update live stock numbers.
          </p>
        </Link>

        <Link
          to="/seller/orders"
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-slate-800 text-blue-400">
              <Clock size={22} />
            </div>
            <ArrowUpRight size={18} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
            Fulfill Orders & Logistics
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Track customer orders, assign shipping carriers, and submit parcel tracking numbers.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default BrandOverviewPage;
