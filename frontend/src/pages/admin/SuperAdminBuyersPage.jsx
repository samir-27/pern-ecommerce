import { useState, useEffect } from 'react';
import { Search, Calendar, Mail, Phone, Loader2, Ban, CheckCircle2, ShoppingBag } from 'lucide-react';
import api from '@/services/Axios';
import { formatCurrency, formatDate } from '@/utils/formatters';

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
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Platform Buyers Directory</h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor registered shopper accounts, moderation status, lifetime purchasing frequency, and customer volume.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search buyer name or email..."
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs w-64 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4">Completed Orders</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Lifetime Spend</th>
                <th className="p-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No buyers found.
                  </td>
                </tr>
              ) : (
                filteredBuyers.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                          {(b.first_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs block">
                            {b.first_name} {b.last_name}
                          </span>
                          <span className="text-[11px] text-slate-500">Buyer ID: #{b.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail size={12} className="text-slate-500" />
                          <span>{b.email}</span>
                        </div>
                        {b.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone size={12} className="text-slate-500" />
                            <span>{b.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{formatDate(b.created_at)}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-white font-mono font-bold">
                        <ShoppingBag size={12} className="text-slate-500" />
                        <span>{b.orders_count || 0}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        b.is_blocked
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {b.is_blocked ? <Ban size={10} /> : <CheckCircle2 size={10} />}
                        {b.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <span className="font-mono font-bold text-white text-xs">
                        {formatCurrency(b.lifetime_spend || 0)}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleBlock(b.id, b.email, b.is_blocked)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                          b.is_blocked
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        <Ban size={12} />
                        <span>{b.is_blocked ? 'Unblock' : 'Block Access'}</span>
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
