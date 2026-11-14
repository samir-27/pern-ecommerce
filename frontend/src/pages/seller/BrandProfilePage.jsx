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

      await api.put('/brand/profile', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStatusMsg({ type: 'success', text: 'Brand atelier profile and policies updated successfully.' });
    } catch (err) {
      console.error('Error updating brand profile:', err);
      setStatusMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update brand profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center font-ui text-[#121212]">
        <Loader2 className="animate-spin text-[#121212]" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui text-[#121212] max-w-4xl">
      <div className="pb-4 border-b border-[#E8E8E4]">
        <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
          Brand Atelier Identity
        </span>
        <h1 className="font-editorial text-3xl font-light text-[#121212]">Visual Presentation & Policies</h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          Customize your public atelier hero cover, monogram logo, bio description, and client return guidelines.
        </p>
      </div>

      {statusMsg.text && (
        <div className={`p-3.5 flex items-center gap-2.5 text-xs font-medium ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
        }`}>
          {statusMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Visual Assets Showcase */}
        <div className="p-6 bg-white border border-[#E8E8E4] space-y-6 shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-fashion text-[#121212] flex items-center gap-2">
            <Image size={14} className="text-[#843828]" />
            <span>Brand Imagery Assets</span>
          </h3>

          {/* Banner Upload */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A]">
              Hero Cover Banner
            </label>
            <div className="relative h-44 bg-[#F4F4F2] border border-dashed border-[#E8E8E4] flex items-center justify-center group overflow-hidden">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-[#71717A] p-4">
                  <Upload size={20} className="mx-auto mb-1.5 opacity-40 text-[#71717A]" />
                  <span className="text-xs">No brand banner uploaded</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer gap-2 text-white text-xs font-medium uppercase tracking-fashion">
                <Upload size={14} /> Upload Banner
                <input type="file" accept="image/*" onChange={handleBannerFileChange} className="hidden" />
              </label>
            </div>
            <input
              type="text"
              name="bannerUrl"
              value={formData.bannerUrl}
              onChange={handleBannerUrlChange}
              placeholder="Or enter image URL..."
              className="w-full px-3.5 py-2 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs outline-none transition-colors shadow-2xs"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A]">
              Atelier Logo Monogram
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 bg-[#F4F4F2] border border-dashed border-[#E8E8E4] flex items-center justify-center shrink-0 group overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={16} className="text-[#71717A]" />
                )}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                  <Upload size={13} />
                  <input type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
                </label>
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleLogoUrlChange}
                  placeholder="Or enter logo image URL..."
                  className="w-full px-3.5 py-2 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs outline-none transition-colors shadow-2xs"
                />
                <span className="text-[10px] text-[#71717A] block">Square 1:1 ratio recommended.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Narrative & Atelier Info */}
        <div className="p-6 bg-white border border-[#E8E8E4] space-y-4 shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-fashion text-[#121212]">Atelier Manifesto & Narrative</h3>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Brand Label Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs outline-none transition-colors shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Design Philosophy & Biography
            </label>
            <textarea
              rows={3}
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Describe your design aesthetics, fabric sourcing heritage, and atelier ethos..."
              className="w-full p-3 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs outline-none transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Shipping & Return Policies */}
        <div className="p-6 bg-white border border-[#E8E8E4] space-y-4 shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-fashion text-[#121212]">Client Service Policies</h3>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5 flex items-center gap-1.5">
              <RotateCcw size={11} /> Return & Exchange Policy
            </label>
            <textarea
              rows={2}
              name="policyReturn"
              value={formData.policyReturn}
              onChange={handleChange}
              placeholder="e.g. 7-day complimentary return on unworn garments with original atelier tags intact."
              className="w-full p-3 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs outline-none transition-colors shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5 flex items-center gap-1.5">
              <Truck size={11} /> Shipping & Courier Schedule
            </label>
            <textarea
              rows={2}
              name="policyShipping"
              value={formData.policyShipping}
              onChange={handleChange}
              placeholder="e.g. Dispatched via BlueDart / Delhivery Priority Air Cargo within 24 hours of confirmation."
              className="w-full p-3 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs outline-none transition-colors shadow-2xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#121212] hover:bg-black text-[#FBFBFA] text-[11px] font-medium uppercase tracking-fashion transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Save size={13} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandProfilePage;
