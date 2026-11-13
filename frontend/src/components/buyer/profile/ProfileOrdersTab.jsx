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
          <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-fashion bg-[#F4F4F2] text-[#121212] border border-[#E8E8E4] flex items-center gap-1">
            <CheckCircle2 size={10} className="text-[#843828]" /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-fashion bg-[#121212] text-white flex items-center gap-1">
            <Truck size={10} /> Dispatched & In Transit
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-fashion bg-white text-[#843828] border border-[#843828]/40 flex items-center gap-1">
            <Clock size={10} /> In Tailoring Studio
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-fashion bg-[#F4F4F2] text-[#71717A] border border-[#E8E8E4] flex items-center gap-1">
            <Clock size={10} /> Order Recorded
          </span>
        );
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-[#E8E8E4] p-12 text-center space-y-4 font-ui">
        <p className="font-editorial text-2xl font-light text-[#121212]">
          No Atelier Orders Recorded
        </p>
        <p className="text-xs text-[#71717A] max-w-sm mx-auto leading-relaxed">
          Your client wardrobe is currently empty. Explore our seasonal drops from verified independent fashion labels.
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#121212] hover:bg-[#843828] text-white text-[10px] font-medium uppercase tracking-fashion transition-colors"
          >
            <span>Explore Collection</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui text-[#121212]">
      {orders.map((order) => {
        const currentStatus = getOrderStatus(order);
        const fulfillments = order.sellerFulfillments || [];

        return (
          <div
            key={order.id}
            className="bg-white border border-[#E8E8E4] p-6 space-y-6"
          >
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8E8E4] gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold font-tabular uppercase tracking-wider text-[#121212]">
                    Order #{String(order.id).padStart(5, '0')}
                  </span>
                  {renderStatusBadge(currentStatus)}
                </div>
                <p className="text-xs text-[#71717A] mt-1 font-tabular">
                  Placed on {formatDate(order.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="sm:text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] block">
                    Consignment Total
                  </span>
                  <span className="text-base font-semibold font-tabular text-[#121212]">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>

                {onViewBill && (
                  <button
                    type="button"
                    onClick={() => onViewBill(order)}
                    className="px-3.5 py-2 border border-[#E8E8E4] hover:border-[#121212] text-[#121212] text-[10px] font-medium uppercase tracking-fashion flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText size={12} />
                    <span>Tax Invoice</span>
                  </button>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="divide-y divide-[#E8E8E4]">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 aspect-[3/4] bg-[#F4F4F2] border border-[#E8E8E4] overflow-hidden shrink-0">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-xs text-[#121212]">{item.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#71717A] mt-0.5">
                        <span className="uppercase tracking-fashion">{item.brand_name || 'Atelier'}</span>
                        <span>·</span>
                        <span className="font-tabular">Size: {item.size || 'Standard'}</span>
                        <span>·</span>
                        <span className="font-tabular">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  </div>

                  <span className="font-tabular font-medium text-xs text-[#121212] shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Fulfillment Status & Tracking */}
            {fulfillments.length > 0 && (
              <div className="pt-3 border-t border-[#E8E8E4] space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] block">
                  Atelier Dispatch Disclosures:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fulfillments.map((f, i) => (
                    <div key={i} className="p-3 bg-[#FBFBFA] border border-[#E8E8E4] text-xs flex justify-between items-center">
                      <div>
                        <span className="font-medium text-[#121212] uppercase tracking-wider text-[11px] block">{f.seller_store_name || `Atelier #${f.seller_id}`}</span>
                        {f.tracking_number && (
                          <span className="text-[10px] font-tabular text-[#71717A]">
                            AWB: {f.tracking_number} ({f.courier_name || 'Air Cargo'})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-[#843828] font-tabular">{f.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProfileOrdersTab;
