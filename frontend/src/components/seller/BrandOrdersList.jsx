import { PackageCheck, Truck, Calendar, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

const BrandOrdersList = ({
  orders = [],
  onOpenFulfillModal
}) => {
  if (orders.length === 0) {
    return (
      <div className="p-12 text-center bg-[#141419] border border-[#23232C] text-[#71717A] font-ui space-y-3">
        <PackageCheck className="mx-auto text-[#71717A]" size={32} strokeWidth={1.5} />
        <h3 className="font-editorial text-2xl font-light text-white">No Orders Found</h3>
        <p className="text-xs text-[#71717A] max-w-sm mx-auto leading-relaxed">
          Purchases of your atelier pieces will appear here in real-time as customer orders are verified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-ui text-[#EDEDED]">
      {orders.map((o) => {
        const status = o.status || 'unfulfilled';
        const isPending = status === 'pending' || status === 'unfulfilled' || status === 'processing';
        const isShipped = status === 'shipped';
        const isDelivered = status === 'delivered';

        return (
          <div
            key={o.id}
            className="p-5 md:p-6 bg-[#141419] border border-[#23232C] space-y-4 transition-colors"
          >
            {/* Order Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#23232C] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#1C1C24] text-white border border-[#282834]">
                  <PackageCheck size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tabular font-medium text-white text-xs">
                      Order #{o.order_id || o.id}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 uppercase tracking-fashion border ${
                      isDelivered
                        ? 'bg-[#1C281F] text-[#4ADE80] border-[#2E4A35]'
                        : isShipped
                        ? 'bg-[#141E28] text-[#60A5FA] border-[#223B54]'
                        : 'bg-[#2E2018] text-[#FBBF24] border-[#4D3321]'
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
                  <span className="text-sm font-semibold font-tabular text-[#4ADE80] block">
                    {formatCurrency(o.seller_net_earnings ?? o.subtotal ?? 0)} Net Payout
                  </span>
                </div>
                {isPending && (
                  <button
                    type="button"
                    onClick={() => onOpenFulfillModal(o)}
                    className="px-4 py-2 bg-white hover:bg-[#F4F4F2] text-[#0C0C0E] text-[10px] font-medium uppercase tracking-fashion flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Truck size={12} />
                    <span>Dispatch Parcel</span>
                  </button>
                )}
                {isShipped && (
                  <button
                    type="button"
                    onClick={() => onOpenFulfillModal(o)}
                    className="px-4 py-2 bg-[#1C1C24] hover:bg-[#252530] text-white border border-[#2C2C38] text-[10px] font-medium uppercase tracking-fashion flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  <div key={idx} className="p-3 bg-[#0C0C0E] border border-[#202028] flex items-center gap-3">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                      alt={item.name}
                      className="w-10 aspect-[3/4] object-cover bg-[#1B1B22] border border-[#282834] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-[#71717A] font-tabular mt-0.5">
                        Size: {item.size || 'Standard'} · Qty: {item.quantity} · {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination & Tracking Line */}
            <div className="pt-2 border-t border-[#202028] flex flex-wrap items-center justify-between text-[11px] text-[#71717A] font-tabular gap-2">
              <div>
                <span className="text-white font-medium">Customer: </span>
                <span>{o.customer_name || 'Verified Client'} ({o.customer_email})</span>
              </div>
              {o.tracking_number && (
                <div className="text-white">
                  <span>AWB: </span>
                  <strong className="text-[#60A5FA]">{o.tracking_number}</strong>
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
