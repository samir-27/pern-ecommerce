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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-ui text-[#EDEDED]">
      <div className="bg-[#141419] border border-[#23232C] w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#23232C] pb-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
              Logistics Dispatch
            </span>
            <h3 className="font-editorial text-2xl font-light text-white flex items-center gap-2">
              Dispatch Order #{selectedOrder.order_id || selectedOrder.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717A] hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Consignment Status *
            </label>
            <select
              value={fulfillmentStatus}
              onChange={(e) => setFulfillmentStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white text-xs outline-none transition-colors cursor-pointer"
            >
              <option value="shipped">Dispatched & In Transit (Shipped)</option>
              <option value="delivered">Delivered to Client (Completed)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Courier Carrier *
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white text-xs outline-none transition-colors cursor-pointer"
            >
              <option value="BlueDart">BlueDart Express Air</option>
              <option value="Delhivery">Delhivery Surface/Air</option>
              <option value="FedEx">FedEx Priority</option>
              <option value="DHL">DHL Express</option>
              <option value="Shadowfax">Shadowfax Logistics</option>
              <option value="DTDC">DTDC Air Cargo</option>
              <option value="IndiaPost">India Post Speed Post</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Courier Waybill / AWB Tracking Number *
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              required
              placeholder="e.g. BD7891234567"
              className="w-full px-3.5 py-2.5 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white font-tabular text-xs outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#23232C]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#23232C] hover:border-white text-[#A1A1AA] hover:text-white text-[10px] font-medium uppercase tracking-fashion transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-white hover:bg-[#F4F4F2] text-[#0C0C0E] text-[10px] font-medium uppercase tracking-fashion transition-colors disabled:opacity-40 cursor-pointer"
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
