import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
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
            Quality Assurance
          </span>
          <h1 className="font-editorial text-3xl font-light text-white">Catalog Moderation</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Audit apparel quality, imagery compliance, and approve or reject atelier garment submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#121217] border border-[#202028] text-white text-xs outline-none cursor-pointer"
          >
            <option value="all">All Garments</option>
            <option value="pending">Pending Moderation</option>
            <option value="approved">Approved & Published</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#71717A]" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search garment title or atelier..."
              className="pl-9 pr-4 py-2 bg-[#121217] border border-[#202028] focus:border-white text-white text-xs w-60 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#261313] border border-[#4D1F1F] text-[#FCA5A5] text-xs">
          {error}
        </div>
      )}

      <div className="bg-[#121217] border border-[#202028] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#202028] bg-[#0E0E12] text-[#71717A] text-[10px] font-semibold uppercase tracking-fashion">
                <th className="p-4">Garment</th>
                <th className="p-4">Atelier Label</th>
                <th className="p-4">Retail Price</th>
                <th className="p-4">Department & Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E26]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#71717A] italic">
                    No garments matching filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const img = p.images?.[0] || p.main_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80';
                  return (
                    <tr key={p.id} className="hover:bg-[#16161D] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={p.name}
                            className="w-10 aspect-[3/4] object-cover bg-[#1B1B22] border border-[#282834] shrink-0"
                          />
                          <div>
                            <div className="font-medium text-white text-xs line-clamp-1">{p.name}</div>
                            <div className="text-[10px] text-[#71717A] font-tabular">SKU #{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">{p.brand || 'Atelier Partner'}</div>
                        <div className="text-[10px] text-[#71717A] font-tabular">{p.seller_email}</div>
                      </td>
                      <td className="p-4 font-tabular font-semibold text-white">
                        {formatCurrency(p.price || p.base_price || 0)}
                      </td>
                      <td className="p-4 text-[#A1A1AA]">
                        <span>{p.category || 'Clothing'}</span>
                        <span className="block text-[10px] text-[#71717A] uppercase">{p.gender || 'Unisex'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 text-[9px] uppercase tracking-fashion border ${
                          p.status === 'approved'
                            ? 'bg-[#1C281F] text-[#4ADE80] border-[#2E4A35]'
                            : p.status === 'rejected'
                            ? 'bg-[#261313] text-[#FCA5A5] border-[#4D1F1F]'
                            : 'bg-[#2E2018] text-[#FBBF24] border-[#4D3321]'
                        }`}>
                          {p.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleModerate(p.id, 'approved')}
                            className="px-2.5 py-1 bg-[#1C281F] hover:bg-[#283C2D] text-[#4ADE80] border border-[#2E4A35] text-[9px] font-medium uppercase tracking-fashion transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModerate(p.id, 'rejected')}
                            className="px-2.5 py-1 bg-[#261313] hover:bg-[#3D1A1A] text-[#FCA5A5] border border-[#4D1F1F] text-[9px] font-medium uppercase tracking-fashion transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
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
