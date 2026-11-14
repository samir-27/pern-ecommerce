import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '@/services/Axios';
import BrandOrdersList from '@/components/seller/BrandOrdersList';
import OrderFulfillmentModal from '@/components/seller/OrderFulfillmentModal';

const BrandOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [carrier, setCarrier] = useState('BlueDart');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('shipped');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/brand/orders').catch(() => api.get('/seller/orders'));
      setOrders(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching brand orders:', err);
      setError(err.response?.data?.error || 'Unable to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openFulfillModal = (order) => {
    setSelectedOrder(order);
    setCarrier(order.shipping_carrier || 'BlueDart');
    setTrackingNumber(order.tracking_number || '');
    setFulfillmentStatus(order.status === 'delivered' ? 'delivered' : 'shipped');
    setIsFulfillModalOpen(true);
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const payload = {
        status: fulfillmentStatus,
        fulfillment_status: fulfillmentStatus,
        shippingCarrier: carrier,
        carrier: carrier,
        trackingNumber,
        tracking_number: trackingNumber
      };

      try {
        await api.put(`/brand/orders/${selectedOrder.id}/fulfill`, payload);
      } catch {
        await api.put(`/seller/orders/${selectedOrder.id}/fulfill`, payload);
      }

      setIsFulfillModalOpen(false);
      await fetchOrders();
    } catch (err) {
      console.error('Error fulfilling order:', err);
      alert(err.response?.data?.error || 'Failed to update shipment status');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    String(o.order_id || '').includes(searchTerm) ||
    String(o.id || '').includes(searchTerm) ||
    (o.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center font-ui text-[#121212]">
        <Loader2 className="animate-spin text-[#121212]" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui text-[#121212]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E8E4]">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Client Logistics
          </span>
          <h1 className="font-editorial text-3xl font-light text-[#121212]">Consignment Fulfillment</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Audit customer orders for your atelier pieces, assign courier tracking numbers, and fulfill dispatches.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#71717A]" size={14} />
          <input
            type="text"
            placeholder="Search order ID or client email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs outline-none transition-colors w-64 shadow-2xs"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs">
          {error}
        </div>
      )}

      <BrandOrdersList
        orders={filteredOrders}
        onOpenFulfillModal={openFulfillModal}
      />

      <OrderFulfillmentModal
        isOpen={isFulfillModalOpen}
        onClose={() => setIsFulfillModalOpen(false)}
        selectedOrder={selectedOrder}
        fulfillmentStatus={fulfillmentStatus}
        setFulfillmentStatus={setFulfillmentStatus}
        carrier={carrier}
        setCarrier={setCarrier}
        trackingNumber={trackingNumber}
        setTrackingNumber={setTrackingNumber}
        onSubmit={handleFulfillSubmit}
        submitting={submitting}
      />
    </div>
  );
};

export default BrandOrdersPage;
