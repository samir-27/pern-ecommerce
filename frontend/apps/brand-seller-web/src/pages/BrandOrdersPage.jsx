import { useState, useEffect } from 'react';
import { 
    PackageCheck, 
    Truck, 
    Calendar, 
    User, 
    MapPin, 
    CheckCircle2, 
    Clock, 
    Search, 
    Loader2, 
    X 
} from 'lucide-react';
import api from '@api';

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

            {/* Orders Feed */}
            {filteredOrders.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
                    <PackageCheck className="mx-auto text-slate-600 mb-3" size={40} />
                    <h3 className="text-base font-bold text-white">No orders matching criteria</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        New orders for your apparel will appear here automatically.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((o) => {
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
                                                <Calendar size={12} /> {new Date(o.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-right">
                                        <div>
                                            <span className="text-xs text-slate-400 block">Brand Net Payout</span>
                                            <span className="text-base font-black text-amber-400">
                                                ₹{Number(o.seller_net_earnings ?? o.subtotal ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        {isPending && (
                                            <button
                                                onClick={() => openFulfillModal(o)}
                                                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                                            >
                                                <Truck size={14} /> Dispatch Parcel
                                            </button>
                                        )}
                                        {isShipped && (
                                            <button
                                                onClick={() => openFulfillModal(o)}
                                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                                            >
                                                <Truck size={13} /> Update / Deliver
                                            </button>
                                        )}
                                        {isDelivered && (
                                            <button
                                                onClick={() => openFulfillModal(o)}
                                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
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
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Garments in this order ({o.items?.length || 0})
                                        </span>
                                    </div>

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
                                                                Qty {item.quantity} × ₹{Number(item.price_at_purchase || 0).toLocaleString('en-IN')}
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
            )}

            {/* Fulfill Modal */}
            {isFulfillModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Truck size={18} className="text-amber-400" /> Dispatch Order #{selectedOrder.order_id || selectedOrder.id}
                            </h3>
                            <button
                                onClick={() => setIsFulfillModalOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleFulfillSubmit} className="space-y-4">
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
                                    onClick={() => setIsFulfillModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md disabled:opacity-50"
                                >
                                    {submitting ? 'Updating...' : (fulfillmentStatus === 'delivered' ? 'Confirm Delivery' : 'Confirm Dispatch')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandOrdersPage;
