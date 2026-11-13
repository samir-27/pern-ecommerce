import { useState } from 'react';
import { Save, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@api';
import { cleanAndValidateIndianMobile } from '@/utils/indiaLocations';

const ProfileDetailsTab = ({ profile, onProfileUpdated }) => {
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccessMsg('');

    let validatedPhone = null;
    if (profileForm.phone && profileForm.phone.trim() !== '') {
      validatedPhone = cleanAndValidateIndianMobile(profileForm.phone);
      if (!validatedPhone) {
        setProfileError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    }

    try {
      setSavingProfile(true);
      await api.put('/auth/profile', {
        name: profileForm.name,
        phone: validatedPhone || ''
      });
      setProfileSuccessMsg('Profile details updated successfully');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setSavingPassword(true);
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMsg('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-ui text-[#121212]">
      {/* 1. Personal Details Form */}
      <div className="bg-white border border-[#E8E8E4] p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Personal Identity
          </span>
          <h3 className="font-editorial text-2xl font-light text-[#121212]">
            Client Particulars
          </h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            Your name and primary contact telephone for order dispatches.
          </p>
        </div>

        {profileSuccessMsg && (
          <div className="p-3 bg-[#F4F4F2] border border-[#E8E8E4] text-xs text-[#121212] flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#843828]" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 bg-[#843828]/10 border border-[#843828]/30 text-xs text-[#843828] flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Account Email
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="w-full px-3.5 py-2.5 text-xs bg-[#F4F4F2] border border-[#E8E8E4] text-[#71717A] rounded-none cursor-not-allowed font-tabular"
            />
            <span className="text-[10px] text-[#A1A1AA] mt-1 block">Account email cannot be modified.</span>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Contact Mobile (+91 India)
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={profileForm.phone}
              onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] font-tabular rounded-none focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-[#121212] hover:bg-[#843828] text-white text-[10px] font-medium uppercase tracking-fashion transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Save size={12} />
              <span>{savingProfile ? 'Saving...' : 'Save Particulars'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Password & Credential Security */}
      <div className="bg-white border border-[#E8E8E4] p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Access Security
          </span>
          <h3 className="font-editorial text-2xl font-light text-[#121212]">
            Change Password
          </h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            Update your client account credential.
          </p>
        </div>

        {passwordMsg && (
          <div className="p-3 bg-[#F4F4F2] border border-[#E8E8E4] text-xs text-[#121212] flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#843828]" />
            <span>{passwordMsg}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-[#843828]/10 border border-[#843828]/30 text-xs text-[#843828] flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-2.5 bg-[#121212] hover:bg-[#843828] text-white text-[10px] font-medium uppercase tracking-fashion transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Lock size={12} />
              <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileDetailsTab;
