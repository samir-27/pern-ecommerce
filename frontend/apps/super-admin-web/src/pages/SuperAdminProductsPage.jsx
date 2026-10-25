import { useState, useEffect } from 'react';
import { Search, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@api';

const SuperAdminProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [error, setError] = useState('');

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/products');
            setProducts(res.data || []);
        } catch (err) {
            console.error('Error fetching admin products:', err);
            setError(err.response?.data?.error || 'Unable to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProducts();
    }, []);

    const handleModerate = async (productId, status) => {
        const note = prompt(`Enter moderation note for ${status}:`, status === 'approved' ? 'Meets marketplace catalog standards' : 'Does not meet standards');
        if (note === null) return;

        try {
            await api.put(`/admin/products/${productId}/moderation`, {
                status,
                moderationNote: note
            });
            setError('');
            await fetchProducts();
        } catch (err) {
            console.error('Error moderating product:', err);
            setError(err.response?.data?.error || 'Failed to moderate product.');
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.seller_email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                    <h1 className="text-2xl md:text-3xl font-black text-white">Marketplace Catalog Moderation</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Oversee garment quality standards, brand product compliance, and catalog approvals.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending_approval">Pending Review</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search product or brand..."
                            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs w-60 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    <span>{error}</span>
                    <button type="button" onClick={fetchProducts} className="font-semibold underline">Retry</button>
                </div>
            )}

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4">Garment</th>
                                <th className="p-4">Brand Owner</th>
                                <th className="p-4">Category & Price</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Moderation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                                        No products match the selected filters.
                                    </td>
                                </tr>
                            ) : filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={p.main_image || p.variants?.find((variant) => variant.image_urls?.length)?.image_urls[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=80&q=80'}
                                                alt={p.name}
                                                className="w-10 h-12 rounded-lg object-cover bg-slate-800 shrink-0"
                                            />
                                            <div>
                                                <div className="font-bold text-white text-sm">{p.name}</div>
                                                <div className="text-slate-400 text-xs">{p.clothing_type || 'Apparel'}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4 text-xs">
                                        <span className="font-bold text-amber-400 block">{p.brand || p.store_name || 'Independent Brand'}</span>
                                        <span className="text-slate-500">{p.seller_email}</span>
                                    </td>

                                    <td className="p-4 text-xs">
                                        <span className="text-slate-300 font-medium block">{p.category_name || 'Apparel'}</span>
                                        <span className="text-white font-bold">₹{Number(p.base_price || 0).toLocaleString('en-IN')}</span>
                                    </td>

                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                                            p.status === 'approved'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                : p.status === 'rejected'
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                        }`}>
                                            {p.status === 'approved' ? <CheckCircle2 size={12} /> : null}
                                            {p.status}
                                        </span>
                                    </td>

                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {p.status !== 'approved' && (
                                                <button
                                                    onClick={() => handleModerate(p.id, 'approved')}
                                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {p.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleModerate(p.id, 'rejected')}
                                                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
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

export default SuperAdminProductsPage;
