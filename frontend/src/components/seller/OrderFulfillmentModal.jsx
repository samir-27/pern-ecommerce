import { Truck, X } from 'lucide-react';

const OrderFulfillmentModal = ({
  isOpen,
  onClose,
  selectedOrder,
  fulfillmentStatus,
  setFulfillmentStatus,
  carrier,
  setCarrier,
  trackingNumber,
  setTrackingNumber,
  onSubmit,
  submitting
}) => {
  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Truck size={18} className="text-amber-400" /> Dispatch Order #{selectedOrder.order_id || selectedOrder.id}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Fulfillment Status *
            </label>
            <select
              value={fulfillmentStatus}
              onChange={(e) => setFulfillmentStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="shipped">Dispatched & In Transit (Shipped)</option>
              <option value="delivered">Delivered to Buyer (Completed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Shipping Courier / Carrier *
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="BlueDart">BlueDart Express</option>
              <option value="Delhivery">Delhivery</option>
              <option value="FedEx">FedEx India</option>
              <option value="DHL">DHL Express</option>
              <option value="Shadowfax">Shadowfax</option>
              <option value="DTDC">DTDC Courier</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Tracking / AWB Number *
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              required
              placeholder="e.g. BD7891234567"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating...' : (fulfillmentStatus === 'delivered' ? 'Confirm Delivery' : 'Confirm Dispatch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFulfillmentModal;
