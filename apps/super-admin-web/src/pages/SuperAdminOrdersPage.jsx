import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Calendar, User, Truck, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import api from '@api';

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
        (o.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.user_email || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className="text-2xl md:text-3xl font-black text-white">Platform Orders Oversight</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Global transaction ledger across all brand sellers and buyers.
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search order number or buyer..."
                        className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs w-64 focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4">Order #</th>
                                <th className="p-4">Buyer Customer</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Order Total</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4">Fulfillment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 font-bold text-white text-xs">
                                        #{o.order_number || `ORD-${o.id}`}
                                    </td>
                                    <td className="p-4 text-xs">
                                        <span className="font-semibold text-white block">{o.user_name || 'Buyer'}</span>
                                        <span className="text-slate-500">{o.user_email}</span>
                                    </td>
                                    <td className="p-4 text-xs text-slate-400">
                                        {new Date(o.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 font-bold text-amber-400 text-xs">
                                        ₹{Number(o.total_amount).toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                                            {o.payment_status || 'Paid'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">
                                            {o.status || 'Processing'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminOrdersPage;
