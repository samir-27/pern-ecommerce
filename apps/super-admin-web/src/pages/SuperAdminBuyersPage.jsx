import React, { useState, useEffect } from 'react';
import { Users, Search, ShoppingBag, Calendar, Mail, Phone, Loader2 } from 'lucide-react';
import api from '@api';

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
                        Monitor registered shopper accounts, lifetime purchasing frequency, and customer volume.
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
                                <th className="p-4 text-right">Lifetime Spend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredBuyers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
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
                                                <span className="font-bold text-white text-sm">
                                                    {b.first_name} {b.last_name || ''}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-4 text-xs">
                                            <div className="text-slate-300 font-medium flex items-center gap-1.5">
                                                <Mail size={12} className="text-indigo-400" /> {b.email}
                                            </div>
                                            {b.phone && (
                                                <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                    <Phone size={12} /> {b.phone}
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-4 text-xs text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-500" />
                                                {new Date(b.created_at).toLocaleDateString()}
                                            </div>
                                        </td>

                                        <td className="p-4 text-xs">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 font-semibold text-slate-200">
                                                <ShoppingBag size={12} className="text-indigo-400" />
                                                {b.total_orders || 0} orders
                                            </span>
                                        </td>

                                        <td className="p-4 text-right font-black text-amber-400 text-sm">
                                            ₹{Number(b.total_spent || 0).toLocaleString('en-IN')}
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
