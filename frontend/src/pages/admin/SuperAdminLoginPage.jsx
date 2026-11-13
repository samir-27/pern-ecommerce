import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/services/Axios';

const SuperAdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        targetRole: 'admin'
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userRole', res.data.user?.role || 'admin');
        navigate('/admin');
      }
    } catch (err) {
      console.error('Super admin login error:', err);
      setError(
        err.response?.data?.error ||
        (err.request
          ? 'Unable to connect with API server. Please verify backend is running on http://localhost:5000.'
          : 'Access denied: Invalid administrator credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#EDEDED] font-ui flex items-center justify-center p-6 antialiased">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <span className="font-editorial text-3xl font-light tracking-[0.06em] text-white">
              MINIMAL<span className="text-[#843828]">.</span>
            </span>
          </Link>
          <div className="pt-2">
            <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
              Governance Gateway
            </span>
            <h1 className="font-editorial text-2xl font-light text-white">Super Admin Command Center</h1>
            <p className="text-xs text-[#71717A] max-w-xs mx-auto mt-1">
              Restricted platform administrative zone. System operator credentials required.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-[#261313] border border-[#4D1F1F] text-[#FCA5A5] text-xs flex items-center gap-2.5">
            <AlertCircle size={14} className="shrink-0 text-[#F87171]" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-[#121217] border border-[#202028] p-6 sm:p-8 space-y-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Operator Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#0A0A0C] border border-[#202028] focus:border-white text-white text-xs outline-none transition-colors"
                />
                <Mail size={13} className="absolute left-3 top-3 text-[#71717A]" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Master Security Key / Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#0A0A0C] border border-[#202028] focus:border-white text-white text-xs outline-none transition-colors"
                />
                <Lock size={13} className="absolute left-3 top-3 text-[#71717A]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white hover:bg-[#F4F4F2] text-[#0A0A0C] text-[11px] font-medium uppercase tracking-fashion transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Authenticating Platform Operator...</span>
                </>
              ) : (
                <>
                  <span>Authenticate Operator</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#1E1E26] text-center">
            <Link
              to="/"
              className="text-[11px] text-[#71717A] hover:text-white transition-colors"
            >
              ← Return to Buyer Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
