import { useState, useEffect } from 'react';
import { 
    Search, 
    CheckCircle2, 
    AlertTriangle, 
    Eye, 
    Percent, 
    Loader2, 
    X, 
    Mail, 
    Phone, 
    Globe, 
    FileText,
    Trash2
} from 'lucide-react';
import api from '@api';

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchBrands();
    }, []);

    const handleStatusChange = async (brandId, newStatus) => {
        const actionLabel = newStatus === 'active' ? 'verify and activate' : newStatus;
        const confirmMsg = `Are you sure you want to ${actionLabel} this brand?`;
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
        const confirmMsg = `Are you sure you want to permanently delete "${brandName}"? All products and variants associated with this brand will be removed. This action cannot be undone.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await api.delete(`/admin/brands/${brandId}`);
            alert(res.data?.message || `Brand "${brandName}" was deleted.`);
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
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white">Brand Seller Directory & Governance</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Review, moderate, suspend, or configure commission overrides for independent fashion brands.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
                    </select>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search brand or email..."
                            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs w-60 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Brands Table */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4">Brand</th>
                                <th className="p-4">Owner / Contact</th>
                                <th className="p-4">Catalog & Volume</th>
                                <th className="p-4">Commission</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Moderation Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredBrands.map((b) => (
                                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                                    {/* Brand Info */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm shrink-0">
                                                {b.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{b.name}</div>
                                                <div className="text-slate-400 text-xs truncate max-w-[160px]">
                                                    {b.bio || 'Fashion Brand'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Owner Info */}
                                    <td className="p-4">
                                        <div className="text-xs">
                                            <span className="font-semibold text-white block">
                                                {b.first_name} {b.last_name}
                                            </span>
                                            <span className="text-slate-400 block">{b.owner_email}</span>
                                        </div>
                                    </td>

                                    {/* Catalog & Sales */}
                                    <td className="p-4">
                                        <div className="text-xs space-y-0.5">
                                            <span className="text-slate-300 font-medium block">
                                                {b.total_products || 0} Garments • {b.total_orders || 0} Orders
                                            </span>
                                            <span className="text-amber-400 font-bold block">
                                                ₹{Number(b.gross_volume || 0).toLocaleString('en-IN')} GMV
                                            </span>
                                        </div>
                                    </td>

                                    {/* Commission */}
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                                            <Percent size={12} /> 5% Fixed
                                        </span>
                                    </td>

                                    {/* Status Badge */}
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                                            b.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                : b.status === 'suspended'
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                        }`}>
                                            {b.status === 'active' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                            {b.status === 'pending' ? 'Pending Verification' : b.status}
                                        </span>
                                    </td>

                                    {/* Action Buttons */}
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => {
                                                    setSelectedBrand(b);
                                                    setIsDetailsOpen(true);
                                                }}
                                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                                title="View Business Details"
                                            >
                                                <Eye size={15} />
                                            </button>

                                            {b.status === 'pending' ? (
                                                <button
                                                    onClick={() => handleStatusChange(b.id, 'active')}
                                                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black border border-emerald-400 transition-all flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer"
                                                    title="Verify brand seller to allow selling garments"
                                                >
                                                    <CheckCircle2 size={13} className="text-slate-950" /> Verify & Allow Sell
                                                </button>
                                            ) : b.status === 'active' ? (
                                                <button
                                                    onClick={() => handleStatusChange(b.id, 'suspended')}
                                                    className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white text-xs font-bold border border-rose-700/60 transition-colors shadow-sm cursor-pointer"
                                                >
                                                    Suspend
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusChange(b.id, 'active')}
                                                    className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-white text-xs font-bold border border-emerald-700/60 transition-colors shadow-sm cursor-pointer"
                                                >
                                                    Activate
                                                </button>
                                            )}

                                            {/* Delete Brand Button */}
                                            <button
                                                onClick={() => handleDeleteBrand(b.id, b.name)}
                                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-700/60 transition-colors cursor-pointer"
                                                title="Delete Brand"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Brand Business Details */}
            {isDetailsOpen && selectedBrand && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 md:p-8 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-white">{selectedBrand.name}</h3>
                                <p className="text-xs text-slate-400">Official Brand Business Profile</p>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Mail size={14} className="text-indigo-400" />
                                <span>Support Email: <strong className="text-white">{selectedBrand.contact_email || selectedBrand.owner_email}</strong></span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-300">
                                <Phone size={14} className="text-indigo-400" />
                                <span>Contact Phone: <strong className="text-white">{selectedBrand.contact_phone || selectedBrand.owner_phone || 'N/A'}</strong></span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-300">
                                <Globe size={14} className="text-indigo-400" />
                                <span>Website: <strong className="text-white">{selectedBrand.website || 'N/A'}</strong></span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-300">
                                <FileText size={14} className="text-indigo-400" />
                                <span>Business Registration / CIN: <strong className="text-white">{selectedBrand.business_registration_number || 'N/A'}</strong></span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-300">
                                <FileText size={14} className="text-indigo-400" />
                                <span>GSTIN / Tax ID: <strong className="text-white">{selectedBrand.tax_id || 'N/A'}</strong></span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                                <span className="font-semibold text-slate-400 block">Return Policy:</span>
                                <p className="text-slate-300">{selectedBrand.policy_return || 'Standard marketplace policy'}</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-slate-800">
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold border border-slate-600 transition-colors shadow-sm cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminBrandsPage;
