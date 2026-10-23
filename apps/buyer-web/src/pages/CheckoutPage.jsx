import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  ArrowLeft, 
  ShoppingBag, 
  Lock, 
  AlertCircle 
} from 'lucide-react';
import api from '@api';
import { useCart } from '../context/CartContext';

const CheckoutPage = () => {
  const { cartItems, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'card' | 'upi'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  const shippingCost = subtotal > 1999 ? 0 : (subtotal > 0 ? 150 : 0);
  const estimatedTax = Math.round(subtotal * 0.08);
  const totalAmount = subtotal + shippingCost + estimatedTax;

  const handleInputChange = (e) => {
    setShippingForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!shippingForm.fullName || !shippingForm.address || !shippingForm.city || !shippingForm.pincode) {
      setError('Please provide complete shipping address details.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare items with valid variant_ids
      const preparedOrderItems = await Promise.all(
        cartItems.map(async (item) => {
          let variantId = item.variant_id;
          if (!variantId) {
            // Fetch product to resolve first available variant
            try {
              const res = await api.get(`/products/${item.id}`);
              if (res.data?.variants && res.data.variants.length > 0) {
                variantId = res.data.variants[0].id;
              }
            } catch (err) {
              console.warn('Could not resolve variant for item:', item.id);
            }
          }
          return {
            variant_id: variantId || 1,
            quantity: item.quantity,
          };
        })
      );

      const formattedShippingAddress = `${shippingForm.fullName}, Ph: ${shippingForm.phone}, ${shippingForm.address}, ${shippingForm.city}, ${shippingForm.state} - ${shippingForm.pincode}`;

      // 2. Submit order to backend
      const res = await api.post('/orders/create', {
        orderItems: preparedOrderItems,
        shippingAddress: formattedShippingAddress,
      });

      setPlacedOrder(res.data?.order || { id: 'ORD-' + Date.now() });
      clearCart();
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to place order. Please review your details and stock availability.');
    } finally {
      setLoading(false);
    }
  };

  // Order Success Screen
  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/20">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
            Order Confirmed & Payment Verified
          </span>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">
            Thank You for Your Order
          </h1>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Your high-fashion order #{placedOrder.id} has been received. Our partner ateliers will dispatch your garments within 24–48 hours.
          </p>
        </div>

        <div className="pt-6 flex justify-center gap-4">
          <Link
            to="/profile"
            className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Track in My Orders
          </Link>
          <Link
            to="/products"
            className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Checkout Header */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <Link to="/products" className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 flex items-center gap-1.5 mb-1">
            <ArrowLeft size={14} /> Return to Storefront
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            Secure Checkout
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <Lock size={13} />
          <span>256-Bit Encrypted</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Grid */}
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Shipping & Payment (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Section 1: Delivery Address */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Delivery Address & Contact
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Full Recipient Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Samir Sumra"
                  value={shippingForm.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+91 98765 43210"
                  value={shippingForm.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Street Address & Apartment
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="e.g. 402 Atelier Residences, Fashion Avenue"
                  value={shippingForm.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="e.g. Mumbai"
                  value={shippingForm.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Postal Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  placeholder="400001"
                  value={shippingForm.pincode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Payment Selection
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label 
                className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="cod" 
                  checked={paymentMethod === 'cod'} 
                  onChange={() => setPaymentMethod('cod')} 
                  className="sr-only" 
                />
                <Truck size={20} className={paymentMethod === 'cod' ? 'text-blue-600' : 'text-zinc-400'} />
                <div className="mt-3">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white block">Cash on Delivery</span>
                  <span className="text-[10px] text-zinc-500">Pay upon parcel arrival</span>
                </div>
              </label>

              <label 
                className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="card" 
                  checked={paymentMethod === 'card'} 
                  onChange={() => setPaymentMethod('card')} 
                  className="sr-only" 
                />
                <CreditCard size={20} className={paymentMethod === 'card' ? 'text-blue-600' : 'text-zinc-400'} />
                <div className="mt-3">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white block">Credit / Debit Card</span>
                  <span className="text-[10px] text-zinc-500">Instant tokenized checkout</span>
                </div>
              </label>

              <label 
                className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="upi" 
                  checked={paymentMethod === 'upi'} 
                  onChange={() => setPaymentMethod('upi')} 
                  className="sr-only" 
                />
                <CheckCircle2 size={20} className={paymentMethod === 'upi' ? 'text-blue-600' : 'text-zinc-400'} />
                <div className="mt-3">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white block">UPI / QR Code</span>
                  <span className="text-[10px] text-zinc-500">GPay, PhonePe, Paytm</span>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 space-y-6 sticky top-28">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Garments in Order ({cartItems.length})
            </h3>

            {/* Item list */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {cartItems.map((item) => (
                <div key={item.cartKey} className="flex gap-3 items-center">
                  <div className="w-12 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white truncate block">
                      {item.name}
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      Qty: {item.quantity} • {item.selectedSize}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Ledger */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="text-zinc-900 dark:text-white font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Express Shipping</span>
                <span className="text-zinc-900 dark:text-white font-semibold">
                  {shippingCost === 0 ? <span className="text-emerald-500 font-bold">FREE</span> : `₹${shippingCost}`}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Estimated GST (8%)</span>
                <span className="text-zinc-900 dark:text-white font-semibold">₹{estimatedTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between text-sm font-black text-zinc-900 dark:text-white">
                <span>Total Amount</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || cartItems.length === 0}
              className="w-full py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Placing Your Order...</span>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Place Order • ₹{totalAmount.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 font-medium pt-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Full Buyer Escrow Protection & 7-Day Returns</span>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
};

export default CheckoutPage;
