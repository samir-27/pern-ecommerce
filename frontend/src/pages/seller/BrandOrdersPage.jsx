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
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Fulfillment & Dispatch Hub</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review customer purchases for your garments and assign parcel tracking information.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order number or buyer..."
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs w-64 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <span>{error}</span>
          <button type="button" onClick={fetchOrders} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Orders List */}
      <BrandOrdersList
        orders={filteredOrders}
        onOpenFulfillModal={openFulfillModal}
      />

      {/* Fulfillment Modal */}
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
