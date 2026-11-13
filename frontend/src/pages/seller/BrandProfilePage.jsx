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
import api from '@/services/Axios';

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
      if (formData.logoUrl && !logoFile) formDataObj.append('logoUrl', formData.logoUrl);
      if (formData.bannerUrl && !bannerFile) formDataObj.append('bannerUrl', formData.bannerUrl);
      if (logoFile) formDataObj.append('logo', logoFile);
      if (bannerFile) formDataObj.append('banner', bannerFile);

      let res;
      try {
        res = await api.put('/brand/profile', formDataObj);
      } catch {
        res = await api.put('/seller/store', formDataObj);
      }

      if (res.data?.logo_url) {
        setLogoPreview(res.data.logo_url);
        setFormData(p => ({ ...p, logoUrl: res.data.logo_url }));
      }
      if (res.data?.banner_url) {
        setBannerPreview(res.data.banner_url);
        setFormData(p => ({ ...p, bannerUrl: res.data.banner_url }));
      }
      setLogoFile(null);
      setBannerFile(null);

      setStatusMsg({ type: 'success', text: 'Brand profile and media assets successfully saved.' });
    } catch (err) {
      console.error('Error saving brand profile:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.message || 'Failed to update brand profile.'
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">Brand Profile & Visual Identity</h1>
        <p className="text-slate-400 text-sm mt-1">
          Customize your public atelier presentation, logos, high-res banners, and buyer policies.
        </p>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
          statusMsg.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Visual Assets Showcase */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Image size={18} className="text-amber-400" /> Visual Identity Assets
          </h3>

          {/* Banner Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Brand Banner (Hero Cover)
            </label>
            <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-800 flex items-center justify-center group">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-500 p-4">
                  <Upload size={24} className="mx-auto mb-2 opacity-50" />
                  <span className="text-xs">No brand banner uploaded</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer gap-2 text-white text-xs font-bold">
                <Upload size={16} /> Upload New Banner
                <input type="file" accept="image/*" onChange={handleBannerFileChange} className="hidden" />
              </label>
            </div>
            <input
              type="text"
              name="bannerUrl"
              value={formData.bannerUrl}
              onChange={handleBannerUrlChange}
              placeholder="Or paste external banner image URL..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Brand Logo / Icon
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-800 flex items-center justify-center shrink-0 group">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={20} className="text-slate-600" />
                )}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                  <Upload size={14} />
                  <input type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
                </label>
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleLogoUrlChange}
                  placeholder="Or paste external logo image URL..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 block">Square ratio (1:1), 500x500px recommended.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Narrative & Atelier Info */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Atelier Details</h3>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Brand Label Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Brand Bio & Design Narrative
            </label>
            <textarea
              rows={4}
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell buyers about your atelier, materials used, tailoring philosophy, and aesthetic..."
              className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Policies */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Truck size={18} className="text-amber-400" /> Shipping & Return Terms
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Truck size={14} /> Shipping Policy
            </label>
            <textarea
              rows={3}
              name="policyShipping"
              value={formData.policyShipping}
              onChange={handleChange}
              placeholder="e.g. Dispatched within 24 hours. Express transit takes 2-4 business days."
              className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <RotateCcw size={14} /> Return & Exchange Policy
            </label>
            <textarea
              rows={3}
              name="policyReturn"
              value={formData.policyReturn}
              onChange={handleChange}
              placeholder="e.g. 7-day complimentary doorstep return policy if unworn with tags attached."
              className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Saving Changes...' : 'Save Brand Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandProfilePage;
