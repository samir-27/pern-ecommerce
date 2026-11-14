import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '@/services/Axios';
import { formatCurrency, formatDate } from '@/utils/formatters';

const SuperAdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/orders');
        setOrders(res.data || []);
      } catch (err) {
        console.error('Error fetching admin orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o =>
    (o.order_number || String(o.id || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.user_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center font-ui text-[#121212]">
        <Loader2 className="animate-spin text-[#121212]" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui text-[#121212]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E8E4]">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Transaction Ledger
          </span>
          <h1 className="font-editorial text-3xl font-light text-[#121212]">Platform Consignment Orders</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Global ledger of customer checkouts, multi-vendor splits, and 5.0% take-rate collections.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#71717A]" size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order number or client..."
            className="pl-9 pr-4 py-2 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs w-64 outline-none transition-colors shadow-2xs"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E8E8E4] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8E8E4] bg-[#F4F4F2] text-[#71717A] text-[10px] font-semibold uppercase tracking-loose-caps">
                <th className="p-4">Order Code</th>
                <th className="p-4">Purchasing Client</th>
                <th className="p-4">Gross Order Amount</th>
                <th className="p-4">Platform Take (5%)</th>
                <th className="p-4">Payment & Gateway</th>
                <th className="p-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E4]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#71717A] italic">
                    No orders match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const gross = Number(o.total_amount || 0);
                  const commission = Number(o.commission_amount || (gross * 0.05));

                  return (
                    <tr key={o.id} className="hover:bg-[#FBFBFA] transition-colors">
                      <td className="p-4 font-tabular font-medium text-[#121212]">
                        #{o.order_number || String(o.id).padStart(5, '0')}
                      </td>
                      <td className="p-4">
                        <div className="text-[#121212] font-medium">{o.user_name || 'Verified Client'}</div>
                        <div className="text-[10px] text-[#71717A] font-tabular">{o.user_email}</div>
                      </td>
                      <td className="p-4 font-tabular font-semibold text-[#121212]">
                        {formatCurrency(gross)}
                      </td>
                      <td className="p-4 font-tabular text-emerald-800 font-semibold">
                        {formatCurrency(commission)}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] uppercase tracking-fashion">
                          {o.payment_status || 'Paid (Razorpay)'}
                        </span>
                      </td>
                      <td className="p-4 text-[#71717A] font-tabular whitespace-nowrap">
                        {formatDate(o.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOrdersPage;
