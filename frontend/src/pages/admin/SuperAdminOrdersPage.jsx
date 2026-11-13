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
            Transaction Ledger
          </span>
          <h1 className="font-editorial text-3xl font-light text-white">Platform Consignment Orders</h1>
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
            className="pl-9 pr-4 py-2 bg-[#121217] border border-[#202028] focus:border-white text-white text-xs w-64 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#121217] border border-[#202028] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#202028] bg-[#0E0E12] text-[#71717A] text-[10px] font-semibold uppercase tracking-fashion">
                <th className="p-4">Order Code</th>
                <th className="p-4">Purchasing Client</th>
                <th className="p-4">Gross Order Amount</th>
                <th className="p-4">Platform Take (5%)</th>
                <th className="p-4">Payment & Gateway</th>
                <th className="p-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E26]">
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
                    <tr key={o.id} className="hover:bg-[#16161D] transition-colors">
                      <td className="p-4 font-tabular font-medium text-white">
                        #{o.order_number || String(o.id).padStart(5, '0')}
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">{o.user_name || 'Verified Client'}</div>
                        <div className="text-[10px] text-[#71717A] font-tabular">{o.user_email}</div>
                      </td>
                      <td className="p-4 font-tabular font-semibold text-white">
                        {formatCurrency(gross)}
                      </td>
                      <td className="p-4 font-tabular text-[#4ADE80]">
                        {formatCurrency(commission)}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 bg-[#1C281F] text-[#4ADE80] border border-[#2E4A35] text-[9px] uppercase tracking-fashion">
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
