import { Package, CheckCircle2, Truck, Clock, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/utils/formatters';

const ProfileOrdersTab = ({ orders, onViewBill }) => {
  const getOrderStatus = (order) => {
    const s = (order.status || 'pending').toLowerCase();
    const sf = order.sellerFulfillments || [];
    const hasDelivered = sf.some(f => f.status === 'delivered') || s === 'delivered';
    const hasShipped = sf.some(f => f.status === 'shipped') || s === 'shipped';

    if (hasDelivered) return 'delivered';
    if (hasShipped) return 'shipped';
    if (s === 'processing') return 'processing';
    return s;
  };

  const renderStatusBadge = (statusKey) => {
    switch (statusKey) {
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 size={12} /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
            <Truck size={12} /> Dispatched & In Transit
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <Clock size={12} /> Tailoring / Processing
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
            <Clock size={12} /> Order Received
          </span>
        );
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-12 text-center space-y-4 shadow-sm animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
          <Package size={28} />
        </div>
        <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">
          No Orders Placed Yet
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Explore our seasonal curation of contemporary garments from verified brand ateliers.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Explore Collection <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {orders.map((order) => {
        const currentStatus = getOrderStatus(order);
        const fulfillments = order.sellerFulfillments || [];

        return (
          <div
            key={order.id}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6"
          >
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-100 dark:border-zinc-800 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black font-mono uppercase tracking-wider text-zinc-400">
                    Order #{String(order.id).padStart(5, '0')}
                  </span>
                  {renderStatusBadge(currentStatus)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Placed on {formatDate(order.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Total Amount
                  </span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-white">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>

                <button
                  onClick={() => onViewBill(order)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FileText size={14} /> View Bill
                </button>
              </div>
            </div>

            {/* Tracking / Fulfillment Status Banner */}
            {fulfillments.length > 0 && fulfillments.some(f => f.tracking_number) && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Courier Tracking Updates
                </span>
                {fulfillments.map((f, fIdx) => (
                  f.tracking_number ? (
                    <div key={fIdx} className="flex flex-wrap items-center justify-between gap-2 text-zinc-700 dark:text-zinc-300">
                      <span>{f.store_name || 'Brand Atelier'}: <strong>{f.shipping_carrier || f.carrier || 'Express Courier'}</strong></span>
                      <span className="font-mono bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        AWB: {f.tracking_number}
                      </span>
                    </div>
                  ) : null
                ))}
              </div>
            )}

            {/* Items Breakdown */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image_urls?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=120&q=80'}
                      alt={item.product_name}
                      className="w-14 h-16 object-cover rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                        {item.product_name}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {item.store_name || 'MINIMAL Atelier'} • Size: <strong className="font-mono">{item.size || 'M'}</strong> • Color: {item.color || 'Default'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Qty: <strong>{item.quantity}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black font-mono text-sm text-zinc-900 dark:text-white">
                      {formatCurrency(Number(item.price_at_purchase) * Number(item.quantity))}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Address Footer */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Delivered to: </span>
              {order.shipping_address}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileOrdersTab;
