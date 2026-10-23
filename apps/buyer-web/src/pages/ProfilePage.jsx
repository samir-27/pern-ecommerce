import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  RefreshCw, 
  LogOut, 
  ChevronRight,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import api from '@api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'details'

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profRes, ordersRes] = await Promise.all([
          api.get('/auth/profile').catch(() => ({ data: null })),
          api.get('/orders/myorders').catch(() => ({ data: [] }))
        ]);

        setProfile(profRes.data);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Delivered</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">In Transit</span>;
      case 'processing':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Processing</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Account Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-xl shadow-lg">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
                {profile?.name || 'Valued Client'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {profile?.role || 'Buyer'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{profile?.email || 'customer@minimal.com'}</p>
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
          <span>My Orders & Tracking ({orders.length})</span>
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
          <span>Account Preferences</span>
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map(n => (
                <div key={n} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
              <Package size={36} className="mx-auto text-zinc-300 dark:text-zinc-700" />
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
            orders.map((order) => (
              <div 
                key={order.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Order Number</span>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">#{order.id}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total Amount</span>
                      <span className="font-black text-sm text-zinc-900 dark:text-white">
                        ₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Fulfillment</span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>

                {/* Sub-orders / items */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">M</div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-white block">{item.name || item.product_name}</span>
                            <span className="text-zinc-400 text-[11px]">Qty: {item.quantity} • {item.size || 'Standard'}</span>
                          </div>
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          ₹{parseFloat(item.price_at_purchase || item.price || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex flex-col sm:flex-row justify-between gap-2">
                  <span>Shipping to: {order.shipping_address || 'Address provided during checkout'}</span>
                  <span>Placed on: {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'details' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 max-w-xl space-y-4">
          <h3 className="font-bold text-base text-zinc-900 dark:text-white">Client Information</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Full Legal Name</label>
              <input 
                type="text" 
                defaultValue={profile?.name || ''} 
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Email Address</label>
              <input 
                type="email" 
                readOnly 
                defaultValue={profile?.email || ''} 
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
