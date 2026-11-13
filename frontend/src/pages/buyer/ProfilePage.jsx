import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, MapPin, LogOut } from 'lucide-react';
import api from '@api';
import ProfileOrdersTab from '@/components/buyer/profile/ProfileOrdersTab';
import ProfileDetailsTab from '@/components/buyer/profile/ProfileDetailsTab';
import SavedAddressesTab from '@/components/buyer/profile/SavedAddressesTab';
import TaxInvoiceBill from '@/components/common/TaxInvoiceBill';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'details' | 'addresses'
  const [billModalOrder, setBillModalOrder] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, ordersRes, addrRes] = await Promise.all([
        api.get('/auth/profile').catch(() => ({ data: null })),
        api.get('/orders/myorders').catch(() => ({ data: [] })),
        api.get('/auth/addresses').catch(() => ({ data: [] }))
      ]);

      setProfile(profRes.data);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setAddresses(Array.isArray(addrRes.data) ? addrRes.data : []);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Loading Account Studio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-black text-xl uppercase shadow-lg">
            {profile?.name ? profile.name[0] : 'C'}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block">
              Verified Client Atelier
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
              {profile?.name || 'Valued Client'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              {profile?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 self-end sm:self-center"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'orders'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Package size={14} /> My Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'addresses'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <MapPin size={14} /> Saved Addresses ({addresses.length})
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'details'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <User size={14} /> Profile & Password
        </button>
      </div>

      {/* 3. Active Tab Content */}
      {activeTab === 'orders' && (
        <ProfileOrdersTab orders={orders} onViewBill={(ord) => setBillModalOrder(ord)} />
      )}

      {activeTab === 'addresses' && (
        <SavedAddressesTab addresses={addresses} onAddressesUpdated={fetchData} />
      )}

      {activeTab === 'details' && (
        <ProfileDetailsTab profile={profile} onProfileUpdated={fetchData} />
      )}

      {/* 4. Official Bill Modal */}
      {billModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl my-8">
            <TaxInvoiceBill order={billModalOrder} onClose={() => setBillModalOrder(null)} />
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
