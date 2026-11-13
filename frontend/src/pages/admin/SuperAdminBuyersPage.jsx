import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '@/services/Axios';
import { formatDate } from '@/utils/formatters';

const SuperAdminBuyersPage = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/buyers');
        setBuyers(res.data || []);
      } catch (err) {
        console.error('Error fetching buyers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuyers();
  }, []);

  const handleToggleBlock = async (buyerId, buyerEmail, currentBlockedState) => {
    const actionLabel = currentBlockedState ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${actionLabel} customer "${buyerEmail}"?`)) return;

    try {
      await api.put(`/admin/buyers/${buyerId}/block`, { is_blocked: !currentBlockedState });
      setBuyers(prev => prev.map(b => b.id === buyerId ? { ...b, is_blocked: !currentBlockedState } : b));
    } catch (err) {
      console.error('Failed to update user block status:', err);
      alert(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const filteredBuyers = buyers.filter(b => 
    (b.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (`${b.first_name || ''} ${b.last_name || ''}`).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center font-ui text-[#EDEDED]">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui text-[#EDEDED]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#202028]">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Customer Directory
          </span>
          <h1 className="font-editorial text-3xl font-light text-white">Platform Shoppers Directory</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Audit registered buyer accounts, security state, and order frequencies.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#71717A]" size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search shopper name or email..."
            className="pl-9 pr-4 py-2 bg-[#121217] border border-[#202028] focus:border-white text-white text-xs w-64 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#121217] border border-[#202028] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#202028] bg-[#0E0E12] text-[#71717A] text-[10px] font-semibold uppercase tracking-fashion">
                <th className="p-4">Shopper Identity</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Onboarded Date</th>
                <th className="p-4">Account State</th>
                <th className="p-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E26]">
              {filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#71717A] italic">
                    No buyers matching search.
                  </td>
                </tr>
              ) : (
                filteredBuyers.map((b) => (
                  <tr key={b.id} className="hover:bg-[#16161D] transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white text-xs">
                        {b.first_name || b.name ? `${b.first_name || ''} ${b.last_name || ''}`.trim() : 'Anonymous Shopper'}
                      </div>
                      <div className="text-[10px] text-[#71717A] font-tabular">{b.email}</div>
                    </td>
                    <td className="p-4 font-tabular text-[#EDEDED]">
                      {b.phone || '—'}
                    </td>
                    <td className="p-4 text-[#71717A] font-tabular whitespace-nowrap">
                      {formatDate(b.created_at)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 text-[9px] uppercase tracking-fashion border ${
                        b.is_blocked
                          ? 'bg-[#261313] text-[#FCA5A5] border-[#4D1F1F]'
                          : 'bg-[#1C281F] text-[#4ADE80] border-[#2E4A35]'
                      }`}>
                        {b.is_blocked ? 'Suspended' : 'Active Client'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(b.id, b.email, b.is_blocked)}
                        className={`px-3 py-1 text-[9px] uppercase tracking-fashion font-medium transition-colors cursor-pointer border ${
                          b.is_blocked
                            ? 'bg-[#1C281F] hover:bg-[#283C2D] text-[#4ADE80] border-[#2E4A35]'
                            : 'bg-[#261313] hover:bg-[#3D1A1A] text-[#FCA5A5] border-[#4D1F1F]'
                        }`}
                      >
                        {b.is_blocked ? 'Unblock Shopper' : 'Block Shopper'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminBuyersPage;
