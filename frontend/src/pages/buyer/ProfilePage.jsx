import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, User, MapPin, LogOut } from 'lucide-react';
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
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center py-24">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-2 border-[#121212] border-t-transparent animate-spin mx-auto" />
          <p className="text-[11px] uppercase tracking-fashion text-[#71717A]">
            Loading Client Portfolio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        
        {/* 1. Header Banner */}
        <div className="bg-white border border-[#E8E8E4] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#121212] text-white flex items-center justify-center font-editorial text-2xl uppercase">
              {profile?.name ? profile.name[0] : 'C'}
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
                Client Portfolio
              </span>
              <h1 className="font-editorial text-2xl sm:text-3xl font-light text-[#121212]">
                {profile?.name || 'Valued Client'}
              </h1>
              <p className="text-xs text-[#71717A] mt-0.5 font-tabular">
                {profile?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 border border-[#E8E8E4] hover:border-[#121212] text-[#71717A] hover:text-[#121212] text-[10px] font-medium uppercase tracking-fashion transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E8E8E4] overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-fashion flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'orders'
                ? 'border-[#121212] text-[#121212] bg-[#F4F4F2]'
                : 'border-transparent text-[#71717A] hover:text-[#121212]'
            }`}
          >
            <Package size={13} />
            <span>Consignments ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-fashion flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'addresses'
                ? 'border-[#121212] text-[#121212] bg-[#F4F4F2]'
                : 'border-transparent text-[#71717A] hover:text-[#121212]'
            }`}
          >
            <MapPin size={13} />
            <span>Dispatch Addresses ({addresses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-fashion flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'details'
                ? 'border-[#121212] text-[#121212] bg-[#F4F4F2]'
                : 'border-transparent text-[#71717A] hover:text-[#121212]'
            }`}
          >
            <User size={13} />
            <span>Account Security</span>
          </button>
        </div>

        {/* 3. Tab Contents */}
        <div className="pt-2">
          {activeTab === 'orders' && (
            <ProfileOrdersTab 
              orders={orders} 
              onViewBill={(order) => setBillModalOrder(order)} 
            />
          )}

          {activeTab === 'addresses' && (
            <SavedAddressesTab 
              addresses={addresses} 
              onAddressesUpdated={fetchData} 
            />
          )}

          {activeTab === 'details' && (
            <ProfileDetailsTab 
              profile={profile} 
              onProfileUpdated={fetchData} 
            />
          )}
        </div>

        {/* 4. Tax Invoice Modal if Opened */}
        {billModalOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-4xl bg-[#FBFBFA] border border-[#E8E8E4] p-4 sm:p-6 my-8">
              <TaxInvoiceBill 
                order={billModalOrder} 
                showHeaderControls={true} 
                onClose={() => setBillModalOrder(null)} 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
