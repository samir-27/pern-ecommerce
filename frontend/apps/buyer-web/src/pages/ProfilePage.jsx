import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  LogOut, 
  Printer,
  X,
  Plus,
  Trash2,
  MapPin,
  FileText,
  Save,
  ShieldCheck
} from 'lucide-react';
import api from '@api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'details'

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Address Management State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressMsg, setAddressMsg] = useState('');

  // Bill Modal State
  const [billModalOrder, setBillModalOrder] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, ordersRes, addrRes] = await Promise.all([
        api.get('/auth/profile').catch(() => ({ data: null })),
        api.get('/orders/myorders').catch(() => ({ data: [] })),
        api.get('/auth/addresses').catch(() => ({ data: [] }))
      ]);

      const profData = profRes.data;
      setProfile(profData);
      if (profData) {
        setProfileForm({
          name: profData.name || '',
          phone: profData.phone || ''
        });
      }

      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setAddresses(Array.isArray(addrRes.data) ? addrRes.data : []);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg('');
    try {
      const res = await api.put('/auth/profile', {
        name: profileForm.name,
        phone: profileForm.phone
      });
      setProfile(res.data?.user || { ...profile, ...profileForm });
      setProfileSuccessMsg('Profile information updated successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    setAddressSubmitting(true);
    setAddressMsg('');
    try {
      const payload = {
        fullName: newAddress.fullName,
        phone: newAddress.phone,
        address: newAddress.address || newAddress.addressLine,
        addressLine: newAddress.address || newAddress.addressLine,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.pincode,
        isDefault: newAddress.isDefault
      };
      await api.post('/auth/addresses', payload);
      setIsAddingAddress(false);
      setNewAddress({
        fullName: profile?.name || '',
        phone: profile?.phone || '',
        address: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
      });
      setAddressMsg('New delivery address saved.');
      setTimeout(() => setAddressMsg(''), 4000);
      const addrRes = await api.get('/auth/addresses');
      setAddresses(addrRes.data || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add address.');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to remove this address?')) return;
    try {
      await api.delete(`/auth/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('Could not delete address');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.put(`/auth/addresses/${id}/default`);
      setAddresses(prev => prev.map(a => ({
        ...a,
        is_default: a.id === id
      })));
    } catch {
      alert('Could not update default address');
    }
  };

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
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 size={12} /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
            <Truck size={12} /> Dispatched & In Transit
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <Clock size={12} /> Atelier Packaging
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
            <Clock size={12} /> Order Confirmed (Pending Dispatch)
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Account Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-2xl shadow-lg">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
                {profile?.name || 'Valued Client'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                {profile?.role || 'Buyer'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
              <span>{profile?.email}</span>
              {profile?.phone && <span>• {profile.phone}</span>}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/50 transition-colors flex items-center gap-2"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-8 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Package size={15} />
          <span>My Orders & Live Tracking ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'details'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <User size={15} />
          <span>Account Preferences & Address Book</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ORDERS & TRACKING
         ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map(n => (
                <div key={n} className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
              <Package size={40} className="mx-auto text-zinc-300 dark:text-zinc-700" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">No Orders Placed Yet</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Discover exceptional contemporary garments and designer collaborations in our collection.
              </p>
              <Link
                to="/products"
                className="inline-block px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Explore Catalog
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const currentStatus = getOrderStatus(order);
              const fulfillments = order.sellerFulfillments || [];
              const activeFulfillment = fulfillments.find(f => f.tracking_number) || fulfillments[0];

              return (
                <div 
                  key={order.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 space-y-6 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Order Reference</span>
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {order.razorpay_payment_id ? `Razorpay #${order.razorpay_payment_id}` : 'Direct capture'}
                        </span>
                      </div>
                      <h3 className="font-black text-lg text-zinc-900 dark:text-white">
                        Order #{order.id}
                      </h3>
                      <span className="text-xs text-zinc-400">
                        Placed on {new Date(order.created_at || new Date().toISOString()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total Paid</span>
                        <span className="font-black text-base text-zinc-900 dark:text-white font-mono">
                          ₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {renderStatusBadge(currentStatus)}
                      </div>

                      <button
                        onClick={() => setBillModalOrder(order)}
                        className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ml-2"
                      >
                        <Printer size={14} />
                        <span>View / Print Bill</span>
                      </button>
                    </div>
                  </div>

                  {/* Tracking Banner if Shipped */}
                  {activeFulfillment?.tracking_number && (
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                          <Truck size={18} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                            Active Courier Tracking
                          </span>
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">
                            {activeFulfillment.shipping_carrier || 'Express Dispatch'} • AWB #{activeFulfillment.tracking_number}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        Status: {activeFulfillment.status === 'delivered' ? 'Delivered' : 'Package In Transit'}
                      </span>
                    </div>
                  )}

                  {/* Items in this order */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
                        Garments in this order ({order.items.length})
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {order.items.map((item, idx) => {
                          const itemImg = (Array.isArray(item.image_urls) ? item.image_urls[0] : null) || item.image_url;
                          return (
                            <div key={idx} className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 text-xs">
                              <div className="w-12 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0">
                                {itemImg ? (
                                  <img src={itemImg} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">M</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-zinc-900 dark:text-white truncate block">
                                  {item.product_name || item.name}
                                </span>
                                <div className="text-zinc-500 text-[11px] flex items-center gap-2 mt-0.5">
                                  <span>Brand: <strong>{item.store_name || 'MINIMAL Atelier'}</strong></span>
                                  <span>•</span>
                                  <span>Size: <strong>{item.size || 'Standard'}</strong></span>
                                  <span>•</span>
                                  <span>Qty: <strong>{item.quantity}</strong></span>
                                </div>
                              </div>
                              <span className="font-bold font-mono text-zinc-900 dark:text-white shrink-0">
                                ₹{parseFloat(item.price_at_purchase || item.price || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Shipping Footer */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex flex-col sm:flex-row justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-zinc-400 shrink-0" />
                      <span>Delivery: <strong>{order.shipping_address || 'Address provided at checkout'}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={13} className="text-emerald-500" />
                      <span>Verified Razorpay Merchant Order</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ACCOUNT PREFERENCES & ADDRESS BOOK
         ========================================================================= */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Personal Profile (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 space-y-5 shadow-sm">
              <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  <span>Personal Account Details</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Manage your identity and primary contact phone number.</p>
              </div>

              {profileSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Full Legal Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={profileForm.name} 
                    onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Account Email Address
                  </label>
                  <input 
                    type="email" 
                    readOnly 
                    value={profile?.email || ''} 
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-500 cursor-not-allowed font-medium"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">Email address cannot be modified once verified.</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Primary Contact Mobile Phone
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    value={profileForm.phone} 
                    onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{savingProfile ? 'Updating Profile...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Delivery Address Book (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                    <MapPin size={18} className="text-blue-600" />
                    <span>Saved Delivery Addresses</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Saved addresses are automatically available at checkout.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-opacity hover:opacity-90 shadow-sm"
                >
                  <Plus size={14} />
                  <span>{isAddingAddress ? 'Cancel' : '+ Add Address'}</span>
                </button>
              </div>

              {addressMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{addressMsg}</span>
                </div>
              )}

              {/* Add Address Form Modal / Inline Box */}
              {isAddingAddress && (
                <form onSubmit={handleCreateAddress} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-4 text-xs animate-fade-in">
                  <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
                    New Delivery Destination
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Recipient Name *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Samir Sumra"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress(p => ({ ...p, fullName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Phone Number *
                      </label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+91 98765 43210"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress(p => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Street Address & Residence *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Flat / House No., Building Name, Street"
                        value={newAddress.addressLine || newAddress.address || ''}
                        onChange={(e) => setNewAddress(p => ({ ...p, addressLine: e.target.value, address: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        City *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Mumbai"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(p => ({ ...p, city: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        State
                      </label>
                      <input 
                        type="text" 
                        placeholder="Maharashtra"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress(p => ({ ...p, state: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Postal Pincode *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="400001"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress(p => ({ ...p, pincode: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress(p => ({ ...p, isDefault: e.target.checked }))}
                          className="w-4 h-4 rounded text-blue-600 border-zinc-300"
                        />
                        <span className="text-zinc-600 dark:text-zinc-300 font-medium">Set as my default shipping address</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addressSubmitting}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md disabled:opacity-50"
                    >
                      {addressSubmitting ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}

              {/* Addresses List */}
              {addresses.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-xs">
                  No saved delivery addresses found. Add an address to enjoy fast 1-click checkout.
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-white text-sm">{addr.full_name}</span>
                          {addr.is_default && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                          {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          Contact: {addr.phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {!addr.is_default && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-[10px] font-bold"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete Address"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW & PRINT BILL / TAX INVOICE MODAL
         ========================================================================= */}
      {billModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl my-8">
            
            {/* Modal Controls (Hidden in Print) */}
            <div className="no-print flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-4 text-white shadow-xl">
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-blue-400" />
                <span className="font-bold text-sm">Official Tax Invoice • Order #{billModalOrder.id}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setBillModalOrder(null)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Clean Printable Bill Card */}
            <div id="printable-bill" className="bg-white text-zinc-900 rounded-3xl border border-zinc-200 p-8 sm:p-12 shadow-2xl space-y-8">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-zinc-200 gap-6">
                <div>
                  <span className="text-3xl font-black tracking-tighter text-zinc-900">
                    MINIMAL<span className="text-blue-600">.</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mt-1">
                    Contemporary Atelier & Luxury Apparel Inc.
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    GSTIN: 27AABCM8291Q1ZT • Registered Fashion Marketplace
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-300">
                    PAID IN FULL
                  </span>
                  <h3 className="text-base font-black text-zinc-900">TAX INVOICE</h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Invoice: INV-{new Date().getFullYear()}-{String(billModalOrder.id).padStart(5, '0')}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Date: {new Date(billModalOrder.created_at || new Date().toISOString()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Billed & Shipped To:
                  </span>
                  <h4 className="font-bold text-sm text-zinc-900 mb-1">
                    {profile?.name || 'Valued Client'}
                  </h4>
                  <p className="text-zinc-600 leading-relaxed">
                    {billModalOrder.shipping_address || 'Address on file'}
                  </p>
                  <p className="text-zinc-500 mt-1 font-mono">
                    Client Email: {profile?.email}
                  </p>
                </div>

                <div className="sm:text-right space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Payment Gateway Verification:
                  </span>
                  <p className="text-zinc-700 font-medium">
                    Payment Method: <span className="font-bold text-zinc-900">Razorpay Online Gateway</span>
                  </p>
                  <p className="text-zinc-700 font-mono text-[11px]">
                    Payment ID: <span className="text-blue-600 font-semibold">{billModalOrder.razorpay_payment_id || 'Captured'}</span>
                  </p>
                  <p className="text-zinc-700 font-mono text-[11px]">
                    Order Reference: #{billModalOrder.id}
                  </p>
                  <p className="text-emerald-600 font-bold text-[11px]">
                    Status: 256-Bit Encrypted & Captured
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      <th className="py-3">Garment Item</th>
                      <th className="py-3">Brand / Atelier</th>
                      <th className="py-3 text-center">Size</th>
                      <th className="py-3 text-center">Qty</th>
                      <th className="py-3 text-right">Unit Price</th>
                      <th className="py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {billModalOrder.items?.map((item, index) => {
                      const itemPrice = parseFloat(item.price_at_purchase || item.price || 0);
                      const itemQty = item.quantity || 1;
                      return (
                        <tr key={index} className="text-zinc-800">
                          <td className="py-3.5 font-bold">
                            {item.product_name || item.name}
                          </td>
                          <td className="py-3.5 text-zinc-500">
                            {item.store_name || 'MINIMAL Atelier'}
                          </td>
                          <td className="py-3.5 text-center font-mono">
                            {item.size || 'Standard'}
                          </td>
                          <td className="py-3.5 text-center font-bold">
                            {itemQty}
                          </td>
                          <td className="py-3.5 text-right font-mono">
                            ₹{itemPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 text-right font-black font-mono">
                            ₹{(itemPrice * itemQty).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex justify-end pt-4 border-t border-zinc-200">
                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>Total Amount Paid:</span>
                    <span className="text-base font-black text-zinc-900 font-mono">
                      ₹{parseFloat(billModalOrder.total_amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-8 border-t border-zinc-100 text-[11px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>
                  Thank you for supporting verified independent fashion houses. 7-day doorstep return guarantee applies.
                </p>
                <div className="flex items-center gap-1 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
                  <span>Razorpay Verified Merchant Transaction</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;