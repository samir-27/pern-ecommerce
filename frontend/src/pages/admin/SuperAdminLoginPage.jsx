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
          ? 'Unable to reach the server. Check that the backend is running and try again.'
          : 'Access denied: Invalid administrator credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-admin-theme="light" className="super-admin-theme min-h-screen bg-slate-950 flex items-center justify-center p-6 antialiased font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-500/25">
            <ShieldAlert size={28} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400 block pt-2">
            Platform Security Gateway
          </span>
          <h1 className="text-2xl font-black text-white">Super Admin Console</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Restricted administrative zone. Authorized platform operators only.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Admin Work Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/30"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            <span>{loading ? 'Authenticating Operator...' : 'Authenticate & Enter'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-300 transition-colors">← Back to Main Marketplace Store</Link>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
