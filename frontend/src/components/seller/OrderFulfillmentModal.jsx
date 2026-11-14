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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-ui text-[#121212]">
      <div className="bg-[#FBFBFA] border border-[#E8E8E4] w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E8E8E4] pb-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
              Logistics Dispatch
            </span>
            <h3 className="font-editorial text-2xl font-light text-[#121212] flex items-center gap-2">
              Dispatch Order #{selectedOrder.order_id || selectedOrder.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717A] hover:text-[#121212] cursor-pointer"
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
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs outline-none transition-colors cursor-pointer shadow-2xs"
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
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs outline-none transition-colors cursor-pointer shadow-2xs"
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
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] font-tabular text-xs outline-none transition-colors shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E8E4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#E8E8E4] hover:border-[#121212] text-[#71717A] hover:text-[#121212] text-[10px] font-medium uppercase tracking-fashion transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#121212] hover:bg-black text-[#FBFBFA] text-[10px] font-medium uppercase tracking-fashion transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Truck size={12} />
              <span>{submitting ? 'Confirming Dispatch...' : 'Confirm Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFulfillmentModal;
