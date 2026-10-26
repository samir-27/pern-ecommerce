import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft, 
  Lock, 
  AlertCircle,
  Printer,
  Plus,
  Check
} from 'lucide-react';
import api from '@api';
import { useCart } from '../context/CartContext';
import { 
  INDIAN_STATES, 
  INDIAN_STATES_AND_CITIES, 
  cleanAndValidateIndianMobile, 
  validateIndianPincode 
} from '../utils/indiaLocations';

// Helper to dynamically load Razorpay checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [saveThisAddress, setSaveThisAddress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isCustomCity, setIsCustomCity] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      try {
        const [addrRes, profRes] = await Promise.all([
          api.get('/auth/addresses').catch(() => ({ data: [] })),
          api.get('/auth/profile').catch(() => ({ data: null })),
        ]);

        const addresses = addrRes.data || [];
        const profile = profRes.data || {};

        setSavedAddresses(addresses);

        if (addresses.length > 0) {
          const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
          setSelectedAddressId(defaultAddr.id);
          const cities = INDIAN_STATES_AND_CITIES[defaultAddr.state] || [];
          const isCustom = Boolean(defaultAddr.city && cities.length > 0 && !cities.includes(defaultAddr.city));
          setIsCustomCity(isCustom);
          setShippingForm({
            fullName: defaultAddr.full_name || profile.name || '',
            phone: defaultAddr.phone || profile.phone || '',
            address: defaultAddr.address_line || '',
            city: defaultAddr.city || '',
            state: defaultAddr.state || '',
            pincode: defaultAddr.pincode || '',
          });
        } else if (profile.name) {
          setShippingForm(prev => ({
            ...prev,
            fullName: profile.name || '',
            phone: profile.phone || '',
          }));
        }
      } catch (err) {
        console.error('Failed to load user address profile:', err);
      } finally {
        // no-op; address loading is resolved inline without a dedicated loading flag
      }
    };

    loadUserData();
  }, []);

  const selectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    const cities = INDIAN_STATES_AND_CITIES[addr.state] || [];
    const isCustom = Boolean(addr.city && cities.length > 0 && !cities.includes(addr.city));
    setIsCustomCity(isCustom);
    setShippingForm({
      fullName: addr.full_name || '',
      phone: addr.phone || '',
      address: addr.address_line || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
  };

  const handleAddNewAddressOption = () => {
    setSelectedAddressId('new');
    setIsCustomCity(false);
    setShippingForm(prev => ({
      ...prev,
      address: '',
      city: '',
      state: '',
      pincode: '',
    }));
  };

  const handleStateChange = (selectedState) => {
    const cities = INDIAN_STATES_AND_CITIES[selectedState] || [];
    const defaultCity = cities.length > 0 && cities[0] !== 'Other' ? cities[0] : '';
    setIsCustomCity(false);
    setShippingForm(prev => ({
      ...prev,
      state: selectedState,
      city: defaultCity
    }));
  };

  const handleCitySelectChange = (val) => {
    if (val === 'Other') {
      setIsCustomCity(true);
      setShippingForm(prev => ({ ...prev, city: '' }));
    } else {
      setIsCustomCity(false);
      setShippingForm(prev => ({ ...prev, city: val }));
    }
  };

  const shippingCost = subtotal > 1999 ? 0 : (subtotal > 0 ? 150 : 0);
  const estimatedTax = Math.round(subtotal * 0.08);
  const totalAmount = subtotal + shippingCost + estimatedTax;

  const handleInputChange = (e) => {
    setShippingForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRazorpayPayment = async (e) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!shippingForm.fullName || !shippingForm.address || !shippingForm.city || !shippingForm.pincode) {
      setError('Please provide complete recipient and delivery address information.');
      return;
    }

    const validatedMobile = cleanAndValidateIndianMobile(shippingForm.phone);
    if (!validatedMobile) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210).');
      return;
    }

    if (!validateIndianPincode(shippingForm.pincode)) {
      setError('Please enter a valid 6-digit Indian postal PIN code (cannot start with 0).');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your shopping bag is empty.');
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare items with valid variant IDs
      const preparedOrderItems = await Promise.all(
        cartItems.map(async (item) => {
          let variantId = item.variant_id;
          if (!variantId) {
            try {
              const res = await api.get(`/products/${item.id}`);
              if (res.data?.variants && res.data.variants.length > 0) {
                variantId = res.data.variants[0].id;
              }
            } catch {
              console.warn('Could not resolve variant for product:', item.id);
            }
          }
          return {
            variant_id: variantId || 1,
            quantity: item.quantity,
          };
        })
      );

      const formattedShippingAddress = `${shippingForm.fullName}, Ph: ${validatedMobile}, ${shippingForm.address}, ${shippingForm.city}, ${shippingForm.state} - ${shippingForm.pincode}`;

      // 2. Initialize Razorpay Order via backend
      const res = await api.post('/orders/payment/order', {
        orderItems: preparedOrderItems,
      });

      const { keyId, paymentOrder, pricing } = res.data;

      // 3. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway. Please check your internet connection.');
      }

      // 4. Open Razorpay Checkout Modal
      const rzpOptions = {
        key: keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'MINIMAL. Atelier',
        description: 'Payment for Fashion Apparel Order',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80',
        order_id: paymentOrder.id,
        handler: async function (response) {
          try {
            setLoading(true);
            // 5. Verify HMAC payment signature on backend
            const verifyRes = await api.post('/orders/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderItems: preparedOrderItems,
              shippingAddress: formattedShippingAddress,
            });

            // Set final bill / invoice receipt details
            setPlacedOrder({
              id: verifyRes.data?.order?.id || paymentOrder.id,
              created_at: new Date().toISOString(),
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              items: [...cartItems],
              shipping: { ...shippingForm, phone: validatedMobile },
              pricing: {
                subtotal: pricing?.subtotal ?? subtotal,
                shipping: pricing?.shipping ?? shippingCost,
                tax: pricing?.tax ?? estimatedTax,
                total: pricing?.total ?? totalAmount,
              }
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Save address to user's address book if requested
            if (selectedAddressId === 'new' && saveThisAddress) {
              try {
                await api.post('/auth/addresses', {
                  fullName: shippingForm.fullName,
                  phone: validatedMobile,
                  address: shippingForm.address,
                  addressLine: shippingForm.address,
                  city: shippingForm.city,
                  state: shippingForm.state,
                  pincode: shippingForm.pincode,
                  isDefault: savedAddresses.length === 0,
                });
              } catch (addrErr) {
                console.warn('Could not auto-save address:', addrErr);
              }
            }

            clearCart();
          } catch (vErr) {
            console.error('Payment verification failed:', vErr);
            setError(vErr.response?.data?.error || 'Payment was captured but verification failed. Please contact client support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: shippingForm.fullName,
          contact: validatedMobile,
        },
        theme: {
          color: '#09090b',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();

    } catch (err) {
      console.error('Razorpay initialization error:', err);
      setError(err.response?.data?.error || err.message || 'Unable to initiate Razorpay payment.');
      setLoading(false);
    }
  };

  // =========================================================================
  // 1. OFFICIAL TAX INVOICE & BILL SCREEN (On Successful Payment)
  // =========================================================================
  if (placedOrder) {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(placedOrder.id).padStart(5, '0')}`;
    const invoiceDate = new Date(placedOrder.created_at || new Date().toISOString()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
        
        {/* Top Success Banner */}
        <div className="no-print p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                Payment Authorized & Verified
              </span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Payment Received • Razorpay #{placedOrder.razorpay_payment_id}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={15} /> Print / Save Bill
            </button>
            <Link
              to="/profile"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              My Orders
            </Link>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL TAX INVOICE CARD */}
        <div id="printable-bill" className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-8 sm:p-12 shadow-xl space-y-8">
          
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-zinc-200 dark:border-zinc-800 gap-6">
            <div>
              <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
                MINIMAL<span className="text-blue-600 dark:text-blue-400">.</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mt-1">
                Contemporary Atelier & Luxury Apparel Inc.
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">
                GSTIN: 27AABCM8291Q1ZT • Registered Fashion Marketplace
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                PAID IN FULL
              </span>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">TAX INVOICE</h3>
              <p className="text-xs text-zinc-500 font-mono">Invoice: {invoiceNumber}</p>
              <p className="text-xs text-zinc-500">Date: {invoiceDate}</p>
            </div>
          </div>

          {/* Billed To & Payment Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Billed & Shipped To:
              </span>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">
                {placedOrder.shipping?.fullName || 'Valued Client'}
              </h4>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {placedOrder.shipping?.address}<br />
                {placedOrder.shipping?.city}, {placedOrder.shipping?.state} - {placedOrder.shipping?.pincode}<br />
                Phone: {placedOrder.shipping?.phone}
              </p>
            </div>

            <div className="sm:text-right space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Payment Verification Details:
              </span>
              <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                Payment Method: <span className="font-bold text-zinc-900 dark:text-white">Razorpay Online Gateway</span>
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                Payment ID: <span className="text-blue-600 dark:text-blue-400 font-semibold">{placedOrder.razorpay_payment_id}</span>
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                Order Token: {placedOrder.razorpay_order_id || 'Direct Verified'}
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                Status: 256-Bit Encrypted & Captured
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  <th className="py-3">Garment Item</th>
                  <th className="py-3">Brand / Atelier</th>
                  <th className="py-3 text-center">Size</th>
                  <th className="py-3 text-center">Qty</th>
                  <th className="py-3 text-right">Unit Price</th>
                  <th className="py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {placedOrder.items?.map((item, index) => (
                  <tr key={index} className="text-zinc-800 dark:text-zinc-200">
                    <td className="py-3.5 font-bold">
                      {item.name}
                    </td>
                    <td className="py-3.5 text-zinc-500">
                      {item.brand_name || 'MINIMAL Atelier'}
                    </td>
                    <td className="py-3.5 text-center font-mono">
                      {item.selectedSize || 'Standard'}
                    </td>
                    <td className="py-3.5 text-center font-bold">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 text-right font-mono">
                      ₹{item.price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right font-black font-mono">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Ledger */}
          <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-900 dark:text-white font-mono">
                  ₹{Number(placedOrder.pricing?.subtotal || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Express Courier:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {Number(placedOrder.pricing?.shipping || 0) === 0 ? 'FREE' : `₹${placedOrder.pricing?.shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>CGST + SGST (8%):</span>
                <span className="font-semibold text-zinc-900 dark:text-white font-mono">
                  ₹{Number(placedOrder.pricing?.tax || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-base font-black text-zinc-900 dark:text-white">
                <span>Total Paid:</span>
                <span className="font-mono">
                  ₹{Number(placedOrder.pricing?.total || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Bill Footer & Legal Guarantee */}
          <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              Thank you for supporting verified independent fashion houses. 7-day doorstep return guarantee applies.
            </p>
            <div className="flex items-center gap-1 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
              <Lock size={12} className="text-emerald-500" />
              <span>Razorpay Verified Merchant Transaction</span>
            </div>
          </div>

        </div>

        {/* Action Link */}
        <div className="no-print text-center pt-4">
          <Link to="/" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
            ← Return to Homepage & Explore More Collections
          </Link>
        </div>

      </div>
    );
  }

  // =========================================================================
  // 2. CHECKOUT FORM SCREEN (Razorpay Only)
  // =========================================================================
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
          <span>Razorpay 256-Bit Encrypted</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Grid */}
      <form onSubmit={handleRazorpayPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Shipping & Payment (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Section 1: Delivery Address */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    Delivery Address & Recipient
                  </h3>
                  <p className="text-[11px] text-zinc-400">Where should your luxury parcels be dispatched?</p>
                </div>
              </div>

              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddNewAddressOption}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 self-start sm:self-auto ${
                    selectedAddressId === 'new'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  <Plus size={13} />
                  <span>{selectedAddressId === 'new' ? 'Entering New Address' : '+ Add Different Address'}</span>
                </button>
              )}
            </div>

            {/* Saved Addresses Selector */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                  Select From Saved Addresses ({savedAddresses.length})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => selectAddress(addr)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative text-xs ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-bold text-zinc-900 dark:text-white truncate">
                            {addr.full_name}
                          </span>
                          {addr.is_default && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shrink-0">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2 text-[11px] leading-relaxed">
                          {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                          Ph: {addr.phone}
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check size={11} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Full Recipient Name *
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
                  Mobile Number (India) *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="9876543210"
                  value={shippingForm.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 ${
                    shippingForm.phone && !cleanAndValidateIndianMobile(shippingForm.phone)
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'
                  }`}
                />
                {shippingForm.phone && !cleanAndValidateIndianMobile(shippingForm.phone) && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium">
                    10-digit Indian mobile starting with 6, 7, 8, or 9
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Street Address & Residence *
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
                  State / Union Territory *
                </label>
                <select
                  name="state"
                  required
                  value={shippingForm.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select State / UT</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  City *
                </label>
                {shippingForm.state && (INDIAN_STATES_AND_CITIES[shippingForm.state] || []).length > 0 && !isCustomCity ? (
                  <select
                    name="city"
                    required
                    value={shippingForm.city}
                    onChange={(e) => handleCitySelectChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Select City</option>
                    {(INDIAN_STATES_AND_CITIES[shippingForm.state] || []).map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      name="city"
                      required
                      placeholder="Enter city name"
                      value={shippingForm.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {isCustomCity && (
                      <button
                        type="button"
                        onClick={() => setIsCustomCity(false)}
                        className="text-[10px] text-blue-500 hover:underline cursor-pointer"
                      >
                        ← Back to city list
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Postal PIN Code (6 Digits) *
                </label>
                <input
                  type="text"
                  name="pincode"
                  maxLength={6}
                  required
                  placeholder="400001"
                  value={shippingForm.pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setShippingForm(prev => ({ ...prev, pincode: val }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 ${
                    shippingForm.pincode && !validateIndianPincode(shippingForm.pincode)
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'
                  }`}
                />
                {shippingForm.pincode && !validateIndianPincode(shippingForm.pincode) && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium">
                    6-digit PIN code starting with 1-9 (e.g. 400001)
                  </p>
                )}
              </div>

              {selectedAddressId === 'new' && (
                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={saveThisAddress}
                      onChange={(e) => setSaveThisAddress(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">Save this address to my account for future fast checkout</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Payment Gateway (Razorpay Exclusive) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Payment Gateway
                </h3>
                <p className="text-xs text-zinc-500">Fast, secure checkout via official Razorpay partner integration</p>
              </div>
            </div>

            {/* Razorpay Option Card */}
            <div className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <CreditCard size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-zinc-900 dark:text-white">
                      Razorpay Secure Payment
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      Primary
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Supports UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), and NetBanking.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                  Instant Bill
                </span>
              </div>
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
                <span>Launching Razorpay Gateway...</span>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Pay with Razorpay • ₹{totalAmount.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 font-medium pt-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Official Tax Invoice & Bill Generated Upon Payment</span>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
};

export default CheckoutPage;
