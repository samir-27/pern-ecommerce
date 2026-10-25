import { useState, useEffect } from 'react';
import { 
    Save, 
    Truck, 
    RotateCcw, 
    Check, 
    AlertCircle, 
    Loader2,
    Upload,
    Image
} from 'lucide-react';
import api from '@api';

const BrandProfilePage = () => {
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        logoUrl: '',
        bannerUrl: '',
        policyReturn: '',
        policyShipping: ''
    });

    const [logoFile, setLogoFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [bannerPreview, setBannerPreview] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchBrand = async () => {
            try {
                const res = await api.get('/brand/profile').catch(() => api.get('/seller/store'));
                if (res.data) {
                    setFormData({
                        name: res.data.name || '',
                        bio: res.data.bio || res.data.description || '',
                        logoUrl: res.data.logo_url || '',
                        bannerUrl: res.data.banner_url || '',
                        policyReturn: res.data.policy_return || '',
                        policyShipping: res.data.policy_shipping || ''
                    });
                    setLogoPreview(res.data.logo_url || '');
                    setBannerPreview(res.data.banner_url || '');
                }
            } catch (err) {
                console.error('Error fetching brand profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBrand();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleBannerFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleLogoUrlChange = (e) => {
        const val = e.target.value;
        setFormData(p => ({ ...p, logoUrl: val }));
        if (!logoFile) setLogoPreview(val);
    };

    const handleBannerUrlChange = (e) => {
        const val = e.target.value;
        setFormData(p => ({ ...p, bannerUrl: val }));
        if (!bannerFile) setBannerPreview(val);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatusMsg({ type: '', text: '' });

        try {
            const formDataObj = new FormData();
            formDataObj.append('name', formData.name);
            formDataObj.append('bio', formData.bio);
            formDataObj.append('policyReturn', formData.policyReturn);
            formDataObj.append('policyShipping', formData.policyShipping);

            if (logoFile) {
                formDataObj.append('logo', logoFile);
            } else if (formData.logoUrl) {
                formDataObj.append('logoUrl', formData.logoUrl);
            }

            if (bannerFile) {
                formDataObj.append('banner', bannerFile);
            } else if (formData.bannerUrl) {
                formDataObj.append('bannerUrl', formData.bannerUrl);
            }

            const res = await api.put('/brand/profile', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }).catch(() => api.put('/seller/store', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }));

            if (res.data?.brand) {
                if (res.data.brand.logo_url) setLogoPreview(res.data.brand.logo_url);
                if (res.data.brand.banner_url) setBannerPreview(res.data.brand.banner_url);
            }

            setStatusMsg({ type: 'success', text: 'Brand profile, logo, banner, and policies updated successfully.' });
            setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
        } catch (err) {
            console.error('Error saving brand profile:', err);
            setStatusMsg({ 
                type: 'error', 
                text: err.response?.data?.error || 'Failed to update brand profile.' 
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white">Store Profile & Branding</h1>
                <p className="text-slate-400 text-sm mt-1">
                    Manage your atelier brand identity, visual logo, hero banner, and fulfillment policies.
                </p>
            </div>

            {statusMsg.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                    statusMsg.type === 'success' 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                    {statusMsg.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    {statusMsg.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Brand Identity Section */}
                <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
                    <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                        Brand Identity & Creative Story
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                Brand Label Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm font-semibold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            Brand Bio & Design Philosophy
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Share your brand story, fabric sourcing, and craftsmanship standards..."
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm resize-none"
                        />
                    </div>

                    {/* Visual Brand Assets (Logo & Banner) with PC file upload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-800">
                        {/* Logo Upload Card */}
                        <div className="space-y-3 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Brand Official Logo
                            </label>
                            
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center shrink-0 relative">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Brand Logo Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Image size={24} className="text-slate-500" />
                                    )}
                                </div>
                                <div className="space-y-2 flex-1">
                                    <input
                                        type="file"
                                        id="logoFileInput"
                                        accept="image/*"
                                        onChange={handleLogoFileChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="logoFileInput"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer border border-slate-700 transition-colors shadow-sm"
                                    >
                                        <Upload size={13} className="text-amber-400" />
                                        <span>{logoFile ? 'Change Local File' : 'Upload from Local PC'}</span>
                                    </label>
                                    <p className="text-[11px] text-slate-400">
                                        {logoFile ? logoFile.name : 'PNG, JPG, WEBP (Square 1:1)'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-1">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Or Logo Web URL</span>
                                <input
                                    type="text"
                                    name="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={handleLogoUrlChange}
                                    placeholder="https://..."
                                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        {/* Banner Upload Card */}
                        <div className="space-y-3 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Storefront Hero Banner
                            </label>

                            <div className="space-y-3">
                                <div className="w-full h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center relative">
                                    {bannerPreview ? (
                                        <img src={bannerPreview} alt="Storefront Banner Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-slate-500 flex flex-col items-center">
                                            <Image size={20} />
                                            <span className="text-[10px] mt-0.5">Wide Storefront Cover</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <input
                                        type="file"
                                        id="bannerFileInput"
                                        accept="image/*"
                                        onChange={handleBannerFileChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="bannerFileInput"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer border border-slate-700 transition-colors shadow-sm"
                                    >
                                        <Upload size={13} className="text-amber-400" />
                                        <span>{bannerFile ? 'Change Local Banner' : 'Upload from Local PC'}</span>
                                    </label>
                                    <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                        {bannerFile ? bannerFile.name : '16:9 Landscape'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-1">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Or Banner Web URL</span>
                                <input
                                    type="text"
                                    name="bannerUrl"
                                    value={formData.bannerUrl}
                                    onChange={handleBannerUrlChange}
                                    placeholder="https://..."
                                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Policies Section */}
                <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
                    <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                        Brand Fulfillment & Customer Policies
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                                <RotateCcw size={14} className="text-amber-400" /> Return Policy
                            </label>
                            <textarea
                                name="policyReturn"
                                value={formData.policyReturn}
                                onChange={handleChange}
                                rows={2}
                                placeholder="e.g. 7-day complimentary doorstep returns for unworn garments with tags attached."
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                                <Truck size={14} className="text-amber-400" /> Shipping & Dispatch Policy
                            </label>
                            <textarea
                                name="policyShipping"
                                value={formData.policyShipping}
                                onChange={handleChange}
                                rows={2}
                                placeholder="e.g. Express air courier dispatch within 24 hours. Tracked delivery across India."
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Brand Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BrandProfilePage;