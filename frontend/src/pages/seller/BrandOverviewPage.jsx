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
        <Loader2 className="animate-spin text-[#EDEDED]" size={28} />
      </div>
    );
  }

  const { brand, products, orders, inventory } = data || {};

  return (
    <div className="space-y-8 font-ui text-[#EDEDED]">
      {/* Studio Header Banner */}
      <div className="p-6 md:p-8 bg-[#141419] border border-[#23232C] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] mb-1">
            <ShieldCheck size={13} />
            <span>Atelier Operations Console</span>
          </div>
          <h1 className="font-editorial text-3xl font-light text-white">
            Welcome back, {brand?.name || 'Partner Atelier'}
          </h1>
          <p className="text-[#71717A] text-xs mt-1 max-w-xl leading-relaxed">
            Manage your garment catalog, size variant matrices, courier dispatches, and 95% net settlement payouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/seller/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#F4F4F2] text-[#0C0C0E] text-[11px] font-medium uppercase tracking-fashion transition-colors"
          >
            <Plus size={13} />
            <span>Add Garment</span>
          </Link>
          <Link
            to="/seller/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1C24] hover:bg-[#252530] text-white text-[11px] font-medium uppercase tracking-fashion border border-[#2C2C38] transition-colors"
          >
            <span>Fulfill Orders</span>
          </Link>
        </div>
      </div>

      {/* Financial & Catalog Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross GMV */}
        <div className="p-5 bg-[#141419] border border-[#23232C]">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-fashion">Gross Volume</span>
            <DollarSign size={14} className="text-[#A1A1AA]" />
          </div>
          <div className="font-tabular text-2xl font-semibold text-white">
            {formatCurrency(orders?.gross_sales || 0)}
          </div>
          <span className="text-[10px] text-[#71717A] mt-1 block">Customer order total</span>
        </div>

        {/* Net Payout */}
        <div className="p-5 bg-[#141419] border border-[#23232C]">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-fashion">Net Payout (95%)</span>
            <span className="text-[10px] font-tabular font-medium text-[#4ADE80]">Active</span>
          </div>
          <div className="font-tabular text-2xl font-semibold text-[#4ADE80]">
            {formatCurrency(orders?.net_earnings || 0)}
          </div>
          <span className="text-[10px] text-[#71717A] mt-1 block">Static 5.0% platform fee</span>
        </div>

        {/* Active Catalog */}
        <div className="p-5 bg-[#141419] border border-[#23232C]">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-fashion">Live Garments</span>
            <Shirt size={14} className="text-[#A1A1AA]" />
          </div>
          <div className="font-tabular text-2xl font-semibold text-white">
            {products?.total_products || 0}
          </div>
          <span className="text-[10px] text-[#71717A] mt-1 block">Active pieces in store</span>
        </div>

        {/* Pending Fulfillment */}
        <div className="p-5 bg-[#141419] border border-[#23232C]">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-fashion">Pending Dispatch</span>
            <Clock size={14} className="text-[#A1A1AA]" />
          </div>
          <div className="font-tabular text-2xl font-semibold text-[#FBBF24]">
            {orders?.pending_fulfillment || 0}
          </div>
          <span className="text-[10px] text-[#71717A] mt-1 block">Parcels awaiting AWB</span>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {Number(inventory?.low_stock_count || 0) > 0 && (
        <div className="p-4 bg-[#231811] border border-[#4D3220] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-[#FBBF24] shrink-0" size={18} />
            <div className="text-xs text-[#FDE68A]">
              <strong>Low Inventory Alert:</strong> You have {inventory.low_stock_count} garment variant(s) below threshold. Restock to prevent backorders.
            </div>
          </div>
          <Link
            to="/seller/products"
            className="text-[11px] font-medium uppercase tracking-fashion text-[#FBBF24] hover:underline shrink-0"
          >
            Update Quantities →
          </Link>
        </div>
      )}

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/seller/products"
          className="p-6 bg-[#141419] border border-[#23232C] hover:border-white transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-[#1D1D26] text-white">
              <Shirt size={18} />
            </div>
            <ArrowUpRight size={14} className="text-[#71717A] group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-editorial text-xl font-light text-white group-hover:text-white">
            Clothing Catalog & Variants
          </h3>
          <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
            Publish new pieces, configure size matrices, upload colorway photography, and audit SKU inventory.
          </p>
        </Link>

        <Link
          to="/seller/orders"
          className="p-6 bg-[#141419] border border-[#23232C] hover:border-white transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-[#1D1D26] text-white">
              <Clock size={18} />
            </div>
            <ArrowUpRight size={14} className="text-[#71717A] group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-editorial text-xl font-light text-white group-hover:text-white">
            Fulfillment & Consignment Dispatch
          </h3>
          <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
            Review customer orders, record BlueDart / Delhivery tracking numbers, and confirm door-to-door delivery.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default BrandOverviewPage;
