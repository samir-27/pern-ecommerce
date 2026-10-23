import React, { useState, useEffect } from 'react';
import { 
    Save, 
    Globe, 
    Mail, 
    Phone, 
    FileText, 
    Truck, 
    RotateCcw, 
    Check, 
    AlertCircle, 
    Loader2 
} from 'lucide-react';
import api from '@api';

const BrandProfilePage = () => {
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        website: '',
        contact_email: '',
        contact_phone: '',
        business_registration_number: '',
        tax_id: '',
        logo_url: '',
        banner_url: '',
        policy_return: '',
        policy_shipping: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchBrand = async () => {
            try {
                const res = await api.get('/brand/profile');
                if (res.data) {
                    setFormData({
                        name: res.data.name || '',
                        bio: res.data.bio || '',
                        website: res.data.website || '',
                        contact_email: res.data.contact_email || '',
                        contact_phone: res.data.contact_phone || '',
                        business_registration_number: res.data.business_registration_number || '',
                        tax_id: res.data.tax_id || '',
                        logo_url: res.data.logo_url || '',
                        banner_url: res.data.banner_url || '',
                        policy_return: res.data.policy_return || '',
                        policy_shipping: res.data.policy_shipping || ''
                    });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatusMsg({ type: '', text: '' });

        try {
            await api.put('/brand/profile', formData);
            setStatusMsg({ type: 'success', text: 'Brand profile and policies updated successfully.' });
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
                <h1 className="text-2xl md:text-3xl font-black text-white">Brand Profile & Business Settings</h1>
                <p className="text-slate-400 text-sm mt-1">
                    Manage your brand identity, official business credentials, and fulfillment policies across the marketplace.
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
                <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
                    <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                        Brand Identity & Creative Story
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                Brand Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                                <Globe size={13} /> Official Website
                            </label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://yourbrand.com"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                Brand Logo Image URL
                            </label>
                            <input
                                type="text"
                                name="logo_url"
                                value={formData.logo_url}
                                onChange={handleChange}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                Storefront Banner URL
                            </label>
                            <input
                                type="text"
                                name="banner_url"
                                value={formData.banner_url}
                                onChange={handleChange}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Business Registration Details */}
                <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
                    <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                        <FileText size={18} className="text-amber-400" /> Business Credentials & Support
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                                <Mail size={13} /> Support Contact Email
                            </label>
                            <input
                                type="email"
                                name="contact_email"
                                value={formData.contact_email}
                                onChange={handleChange}
                                placeholder="support@brand.com"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                                <Phone size={13} /> Support Phone
                            </label>
                            <input
                                type="text"
                                name="contact_phone"
                                value={formData.contact_phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                Business Registration / CIN
                            </label>
                            <input
                                type="text"
                                name="business_registration_number"
                                value={formData.business_registration_number}
                                onChange={handleChange}
                                placeholder="e.g. U74999MH2024PTC123456"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                GSTIN / Tax ID
                            </label>
                            <input
                                type="text"
                                name="tax_id"
                                value={formData.tax_id}
                                onChange={handleChange}
                                placeholder="27AAAAA0000A1Z5"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                            />
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
                                name="policy_return"
                                value={formData.policy_return}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                                <Truck size={14} className="text-amber-400" /> Shipping & Dispatch Policy
                            </label>
                            <textarea
                                name="policy_shipping"
                                value={formData.policy_shipping}
                                onChange={handleChange}
                                rows={2}
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
