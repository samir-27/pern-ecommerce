import { PackageCheck, Truck, Calendar, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

const BrandOrdersList = ({
  orders = [],
  onOpenFulfillModal
}) => {
  if (orders.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-[#E8E8E4] text-[#71717A] font-ui space-y-3 shadow-xs">
        <PackageCheck className="mx-auto text-[#71717A]" size={32} strokeWidth={1.5} />
        <h3 className="font-editorial text-2xl font-light text-[#121212]">No Orders Found</h3>
        <p className="text-xs text-[#71717A] max-w-sm mx-auto leading-relaxed">
          Purchases of your atelier pieces will appear here in real-time as customer orders are verified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-ui text-[#121212]">
      {orders.map((o) => {
        const status = o.status || 'unfulfilled';
        const isPending = status === 'pending' || status === 'unfulfilled' || status === 'processing';
        const isShipped = status === 'shipped';
        const isDelivered = status === 'delivered';

        return (
          <div
            key={o.id}
            className="p-5 md:p-6 bg-white border border-[#E8E8E4] space-y-4 transition-colors shadow-xs"
          >
            {/* Order Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E8E4] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F4F4F2] text-[#121212] border border-[#E8E8E4]">
                  <PackageCheck size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tabular font-semibold text-[#121212] text-xs">
                      Order #{o.order_id || o.id}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 uppercase tracking-fashion border ${
                      isDelivered
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isShipped
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {isDelivered || isShipped ? <Truck size={10} /> : <Clock size={10} />}
                      <span>{status}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#71717A] mt-0.5 flex items-center gap-1.5 font-tabular">
                    <Calendar size={11} /> {formatDate(o.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div className="text-right">
                  <div className="text-[10px] text-[#71717A] font-tabular">
                    Gross: {formatCurrency(o.subtotal || 0)} · Fee (5%): -{formatCurrency(o.commission_amount || 0)}
                  </div>
                  <span className="text-sm font-semibold font-tabular text-emerald-800 block">
                    {formatCurrency(o.seller_net_earnings ?? o.subtotal ?? 0)} Net Payout
                  </span>
                </div>
                {isPending && (
                  <button
                    type="button"
                    onClick={() => onOpenFulfillModal(o)}
                    className="px-4 py-2 bg-[#121212] hover:bg-black text-[#FBFBFA] text-[10px] font-medium uppercase tracking-fashion flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Truck size={12} />
                    <span>Dispatch Parcel</span>
                  </button>
                )}
                {isShipped && (
                  <button
                    type="button"
                    onClick={() => onOpenFulfillModal(o)}
                    className="px-4 py-2 bg-white hover:bg-[#F4F4F2] text-[#121212] border border-[#E8E8E4] text-[10px] font-medium uppercase tracking-fashion flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Truck size={12} />
                    <span>Update Delivery</span>
                  </button>
                )}
              </div>
            </div>

            {/* Order Items Table Strip */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
                Purchased Pieces
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(o.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#FBFBFA] border border-[#E8E8E4] flex items-center gap-3">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                      alt={item.name}
                      className="w-10 aspect-[3/4] object-cover bg-[#F4F4F2] border border-[#E8E8E4] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#121212] font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-[#71717A] font-tabular mt-0.5">
                        Size: {item.size || 'Standard'} · Qty: {item.quantity} · {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination & Tracking Line */}
            <div className="pt-2 border-t border-[#E8E8E4] flex flex-wrap items-center justify-between text-[11px] text-[#71717A] font-tabular gap-2">
              <div>
                <span className="text-[#121212] font-medium">Customer: </span>
                <span>{o.customer_name || 'Verified Client'} ({o.customer_email})</span>
              </div>
              {o.tracking_number && (
                <div className="text-[#121212]">
                  <span>AWB: </span>
                  <strong className="text-blue-700">{o.tracking_number}</strong>
                  <span> ({o.shipping_carrier || 'Express Air'})</span>
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
