import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import api from '@api';
import { useCart } from '@/context/CartContext';
import { 
  INDIAN_STATES_AND_CITIES, 
  cleanAndValidateIndianMobile, 
  validateIndianPincode 
} from '@/utils/indiaLocations';
import CheckoutAddressSection from '@/components/buyer/checkout/CheckoutAddressSection';
import CheckoutOrderSummary from '@/components/buyer/checkout/CheckoutOrderSummary';
import TaxInvoiceBill from '@/components/common/TaxInvoiceBill';

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
      if (!token) return;

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

  const handleInputChange = (e) => {
    setShippingForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const shippingCost = subtotal > 1999 ? 0 : (subtotal > 0 ? 150 : 0);
  const estimatedTax = Math.round(subtotal * 0.08);
  const totalAmount = subtotal + shippingCost + estimatedTax;

  const handleRazorpayPayment = async (e) => {
    if (e) e.preventDefault();
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
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    if (!validateIndianPincode(shippingForm.pincode)) {
      setError('Please enter a valid 6-digit Indian postal PIN code.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your shopping bag is empty.');
      return;
    }

    setLoading(true);

    try {
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

      const res = await api.post('/orders/payment/order', {
        orderItems: preparedOrderItems,
      });

      const { keyId, paymentOrder, pricing } = res.data;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway. Please check your internet connection.');
      }

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
            const verifyRes = await api.post('/orders/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderItems: preparedOrderItems,
              shippingAddress: formattedShippingAddress,
            });

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
          color: '#121212',
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

  // If order is placed, show official bill
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <TaxInvoiceBill order={placedOrder} showHeaderControls={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        
        {/* Navigation line */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E4]">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-fashion text-[#71717A] hover:text-[#121212] transition-colors"
          >
            <ArrowLeft size={12} />
            <span>Return to Catalog</span>
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828]">
            Secure Atelier Checkout
          </span>
        </div>

        {error && (
          <div className="p-4 bg-[#843828]/10 border border-[#843828]/30 text-[#843828] text-xs flex items-center gap-2.5">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Two-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <CheckoutAddressSection
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={selectAddress}
              onAddNewAddressOption={handleAddNewAddressOption}
              shippingForm={shippingForm}
              onInputChange={handleInputChange}
              onStateChange={handleStateChange}
              onCitySelectChange={handleCitySelectChange}
              isCustomCity={isCustomCity}
              saveThisAddress={saveThisAddress}
              onSaveThisAddressChange={setSaveThisAddress}
            />
          </div>

          <div className="lg:col-span-5">
            <CheckoutOrderSummary
              cartItems={cartItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              estimatedTax={estimatedTax}
              totalAmount={totalAmount}
              loading={loading}
              onPayClick={handleRazorpayPayment}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
