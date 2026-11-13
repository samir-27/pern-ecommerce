import { useState, useEffect } from 'react';
import { Search, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/services/Axios';
import { formatCurrency } from '@/utils/formatters';

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
          <h1 className="text-2xl md:text-3xl font-black text-white">Catalog Product Moderation</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review submitted clothing items, verify compliance with marketplace photography standards, and approve for sale.
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
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, brand or seller..."
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs w-64 focus:outline-none focus:border-indigo-500"
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
                <th className="p-4">Brand / Atelier</th>
                <th className="p-4">Base Price</th>
                <th className="p-4">Variants & Stock</th>
                <th className="p-4">Catalog Status</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    No products matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=80&q=80');
                  const isApproved = p.status === 'approved';
                  const isPending = p.status === 'pending';

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={p.name}
                            className="w-11 h-14 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                          />
                          <div>
                            <span className="font-bold text-white text-xs block max-w-xs truncate">{p.name}</span>
                            <span className="text-[11px] text-slate-400 block">{p.category || 'Garment'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-xs">
                          <span className="font-semibold text-white block">{p.brand || 'Independent'}</span>
                          <span className="text-slate-500 block">{p.seller_email}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-mono font-bold text-white text-xs">
                          {formatCurrency(p.price || p.base_price || 0)}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="text-xs text-slate-300 font-medium">
                          {p.variant_count || p.variants?.length || 1} variants • {p.stock_quantity ?? 10} in stock
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {isApproved ? <CheckCircle2 size={11} /> : null}
                          {p.status || 'Active'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleModerate(p.id, 'approved')}
                                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleModerate(p.id, 'rejected')}
                                className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {!isPending && isApproved && (
                            <button
                              onClick={() => handleModerate(p.id, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                            >
                              Revoke Approval
                            </button>
                          )}
                          {!isPending && !isApproved && (
                            <button
                              onClick={() => handleModerate(p.id, 'approved')}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                        </div>
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

export default SuperAdminProductsPage;
