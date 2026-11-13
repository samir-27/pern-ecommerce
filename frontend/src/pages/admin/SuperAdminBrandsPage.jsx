import { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Loader2, 
  X, 
  Mail, 
  Trash2
} from 'lucide-react';
import api from '@/services/Axios';
import { formatCurrency } from '@/utils/formatters';

const SuperAdminBrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/brands');
      setBrands(res.data || []);
    } catch (err) {
      console.error('Error fetching brands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleStatusChange = async (brandId, newStatus) => {
    const actionLabel = newStatus === 'active' ? 'verify and activate' : newStatus;
    const confirmMsg = `Are you sure you want to ${actionLabel} this atelier?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.put(`/admin/brands/${brandId}`, { status: newStatus });
      await fetchBrands();
    } catch (err) {
      console.error('Error updating brand status:', err);
      alert(err.response?.data?.error || 'Failed to update brand status');
    }
  };

  const handleDeleteBrand = async (brandId, brandName) => {
    const confirmMsg = `Are you sure you want to permanently delete "${brandName}"? All garments and variants will be deleted. This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/admin/brands/${brandId}`);
      alert(res.data?.message || `Atelier "${brandName}" was deleted.`);
      await fetchBrands();
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert(err.response?.data?.error || 'Failed to delete brand');
    }
  };

  const filteredBrands = brands.filter(b => {
    const matchesSearch = (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.owner_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#202028]">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Partner Moderation
          </span>
          <h1 className="font-editorial text-3xl font-light text-white">Partner Ateliers Directory</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Audit, verify, moderate, or suspend partner clothing labels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#141419] border border-[#202028] text-white text-xs outline-none cursor-pointer"
          >
            <option value="all">All Ateliers</option>
            <option value="pending">Pending Moderation</option>
            <option value="active">Verified & Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#71717A]" size={14} />
            <input
              type="text"
              placeholder="Search atelier or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#141419] border border-[#202028] focus:border-white text-white text-xs outline-none transition-colors w-60"
            />
          </div>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-[#121217] border border-[#202028] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#202028] bg-[#0E0E12] text-[#71717A] text-[10px] font-semibold uppercase tracking-fashion">
                <th className="p-4">Atelier Name</th>
                <th className="p-4">Founder / Email</th>
                <th className="p-4">Commission</th>
                <th className="p-4">Pieces Live</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E26]">
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#71717A] italic">
                    No ateliers match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredBrands.map((b) => (
                  <tr key={b.id} className="hover:bg-[#16161D] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white text-[#0A0A0C] border border-[#202028] flex items-center justify-center font-editorial text-sm font-semibold shrink-0">
                          {b.logo_url ? (
                            <img src={b.logo_url} alt={b.name} className="w-full h-full object-cover" />
                          ) : (
                            b.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white text-xs">{b.name}</div>
                          <div className="text-[10px] text-[#71717A] truncate max-w-xs">{b.bio || 'Independent fashion brand'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-white font-medium">{b.owner_name || 'Founder'}</div>
                      <div className="text-[10px] text-[#71717A] font-tabular">{b.owner_email}</div>
                    </td>

                    <td className="p-4 font-tabular text-[#EDEDED]">
                      {b.commission_rate ?? '5.0'}% Static
                    </td>

                    <td className="p-4 font-tabular text-[#EDEDED]">
                      {b.product_count ?? 0}
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 uppercase tracking-fashion border ${
                        b.status === 'active'
                          ? 'bg-[#1C281F] text-[#4ADE80] border-[#2E4A35]'
                          : b.status === 'pending'
                          ? 'bg-[#2E2018] text-[#FBBF24] border-[#4D3321]'
                          : 'bg-[#261313] text-[#FCA5A5] border-[#4D1F1F]'
                      }`}>
                        {b.status === 'active' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                        <span>{b.status}</span>
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(b.id, 'active')}
                            className="px-2.5 py-1 bg-[#4ADE80] hover:bg-[#38C06C] text-[#0A0A0C] text-[9px] font-semibold uppercase tracking-fashion transition-colors cursor-pointer"
                          >
                            Verify & Allow Sell
                          </button>
                        )}

                        {b.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(b.id, 'suspended')}
                            className="px-2.5 py-1 bg-[#241A13] hover:bg-[#3A2417] text-[#FBBF24] border border-[#4D3220] text-[9px] font-medium uppercase tracking-fashion transition-colors cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}

                        {b.status === 'suspended' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(b.id, 'active')}
                            className="px-2.5 py-1 bg-[#1C281F] hover:bg-[#283C2D] text-[#4ADE80] border border-[#2E4A35] text-[9px] font-medium uppercase tracking-fashion transition-colors cursor-pointer"
                          >
                            Reactivate
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBrand(b);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 text-[#71717A] hover:text-white transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBrand(b.id, b.name)}
                          className="p-1.5 text-[#71717A] hover:text-[#E17564] transition-colors cursor-pointer"
                          title="Delete Atelier"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brand Inspection Modal */}
      {isDetailsOpen && selectedBrand && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#202028] w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#202028]">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
                  Atelier Dossier
                </span>
                <h3 className="font-editorial text-2xl font-light text-white">{selectedBrand.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="text-[#71717A] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] block mb-1">
                  Atelier Biography & Manifesto
                </span>
                <p className="text-white leading-relaxed bg-[#0E0E12] p-3 border border-[#1E1E26]">
                  {selectedBrand.bio || 'No brand narrative provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-tabular">
                <div className="p-3 bg-[#0E0E12] border border-[#1E1E26]">
                  <span className="text-[10px] text-[#71717A] uppercase block">Owner Contact</span>
                  <strong className="text-white text-xs">{selectedBrand.owner_name}</strong>
                  <span className="text-[10px] text-[#A1A1AA] block mt-0.5">{selectedBrand.owner_email}</span>
                </div>
                <div className="p-3 bg-[#0E0E12] border border-[#1E1E26]">
                  <span className="text-[10px] text-[#71717A] uppercase block">Platform Commission</span>
                  <strong className="text-white text-xs">{selectedBrand.commission_rate ?? '5.0'}% Static</strong>
                  <span className="text-[10px] text-[#4ADE80] block mt-0.5">Disbursement Rate: 95.0%</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#202028]">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-5 py-2 bg-white text-[#0A0A0C] text-[10px] font-medium uppercase tracking-fashion cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminBrandsPage;
