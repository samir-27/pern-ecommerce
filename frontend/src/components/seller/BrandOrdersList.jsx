import { PackageCheck, Truck, Calendar, User, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

const BrandOrdersList = ({
  orders = [],
  onOpenFulfillModal
}) => {
  if (orders.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
        <PackageCheck className="mx-auto text-slate-600 mb-3" size={40} />
        <h3 className="text-base font-bold text-white">No orders matching criteria</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          New orders for your apparel will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const status = o.status || 'unfulfilled';
        const isPending = status === 'pending' || status === 'unfulfilled' || status === 'processing';
        const isShipped = status === 'shipped';
        const isDelivered = status === 'delivered';

        return (
          <div
            key={o.id}
            className="p-5 md:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all space-y-4"
          >
            {/* Order Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      Order #{o.order_id || o.id}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isDelivered
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isShipped
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isDelivered || isShipped ? <Truck size={11} /> : <Clock size={11} />}
                      {status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Calendar size={12} /> {formatDate(o.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">
                    Gross: {formatCurrency(o.subtotal || 0)} • Fee (5%): -{formatCurrency(o.commission_amount || 0)}
                  </div>
                  <span className="text-base font-black text-amber-400 block">
                    {formatCurrency(o.seller_net_earnings ?? o.subtotal ?? 0)} Net Payout
                  </span>
                </div>
                {isPending && (
                  <button
                    onClick={() => onOpenFulfillModal(o)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck size={14} /> Dispatch Parcel
                  </button>
                )}
                {isShipped && (
                  <button
                    onClick={() => onOpenFulfillModal(o)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Truck size={13} /> Update / Deliver
                  </button>
                )}
                {isDelivered && (
                  <button
                    onClick={() => onOpenFulfillModal(o)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={13} className="text-emerald-400" /> Logistics Details
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
              <div className="flex items-start gap-2 text-slate-300">
                <User size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">
                    {o.customer_name || 'Customer'}
                  </span>
                  <span className="text-slate-400">{o.customer_email}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <MapPin size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block">Delivery Address:</span>
                  <span className="text-white">
                    {typeof o.shipping_address === 'object'
                      ? Object.values(o.shipping_address || {}).filter(Boolean).join(', ')
                      : o.shipping_address || 'Address provided on customer file'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tracking Info if Shipped */}
            {o.tracking_number && (
              <div className="flex items-center gap-3 text-xs bg-blue-950/20 border border-blue-500/30 text-blue-300 px-3.5 py-2 rounded-xl">
                <Truck size={14} className="text-blue-400" />
                <span>
                  Carrier: <strong>{o.shipping_carrier || 'Express Courier'}</strong> • Tracking AWB: <strong>{o.tracking_number}</strong>
                </span>
              </div>
            )}

            {/* Line Items */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Garments in this order ({o.items?.length || 0})
              </span>

              {(!o.items || o.items.length === 0) ? (
                <div className="p-3 rounded-xl bg-slate-950/40 text-slate-500 text-xs italic">
                  Awaiting garment item details
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {o.items.map((item, idx) => {
                    const imgSrc = (Array.isArray(item.image_urls) && item.image_urls.length > 0 ? item.image_urls[0] : null) ||
                                   (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null) ||
                                   item.image_url ||
                                   'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=80&q=80';
                    return (
                      <div
                        key={item.order_item_id || item.id || idx}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3.5 text-xs hover:border-slate-700 transition-colors"
                      >
                        <img
                          src={imgSrc}
                          alt={item.product_name}
                          className="w-12 h-14 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate text-xs">{item.product_name}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Size: <span className="text-white font-medium">{item.size || 'Standard'}</span> • Color: <span className="text-white font-medium">{item.color || 'Standard'}</span>
                          </div>
                          <div className="text-amber-400 font-bold mt-1 font-mono">
                            Qty {item.quantity} × {formatCurrency(item.price_at_purchase || 0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BrandOrdersList;
