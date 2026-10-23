import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  User, 
  Layers, 
  ShieldAlert, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import api from '@api';

const AuthPage = ({ initialMode = 'login' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'buyer' | 'seller'
  const [roleMode, setRoleMode] = useState(searchParams.get('mode') === 'seller' ? 'seller' : 'buyer');
  // Type: 'login' | 'register'
  const [isRegister, setIsRegister] = useState(initialMode === 'register');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    brandName: '',
    brandDescription: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (roleMode === 'buyer') {
          // 1. Buyer Registration
          const res = await api.post('/auth/register', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          });

          localStorage.setItem('token', res.data.token);
          localStorage.setItem('userRole', 'buyer');
          navigate('/');
        } else {
          // 2. Brand Seller Registration
          const res = await api.post('/auth/register-brand', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            brandName: formData.brandName || `${formData.name}'s Atelier`,
            brandDescription: formData.brandDescription || 'Independent fashion brand',
          });

          localStorage.setItem('token', res.data.token);
          localStorage.setItem('userRole', 'seller');
          navigate('/seller');
        }
      } else {
        // Login for either role
        const targetRole = roleMode === 'seller' ? 'seller' : 'buyer';
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          targetRole: targetRole,
        });

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userRole', res.data.user?.role || targetRole);

        if (res.data.user?.role === 'seller' || res.data.user?.role === 'brand') {
          navigate('/seller');
        } else if (res.data.user?.role === 'admin' || res.data.user?.role === 'super_admin') {
          navigate('/admin');
        } else {
          const redirect = searchParams.get('redirect') || '/';
          navigate(redirect);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      
      {/* Top Branding Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-block">
          <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
            MINIMAL<span className="text-blue-600 dark:text-blue-400">.</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
          {roleMode === 'buyer' 
            ? (isRegister ? 'Join the Private Atelier Club' : 'Welcome Back, Discerning Client')
            : (isRegister ? 'Register Your Clothing Brand' : 'Brand Operations Studio Sign In')
          }
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6">
          
          {/* Dual Role Selector Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => { setRoleMode('buyer'); setError(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                roleMode === 'buyer'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <User size={14} />
              <span>Buyer</span>
            </button>

            <button
              type="button"
              onClick={() => { setRoleMode('seller'); setError(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                roleMode === 'seller'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Building2 size={14} />
              <span>Brand Seller</span>
            </button>
          </div>

          {/* Error / Alert Display */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* If Registering Brand: Brand Name */}
            {isRegister && roleMode === 'seller' && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Brand / Studio Label Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="brandName"
                    required
                    placeholder="e.g. Solis Atelier"
                    value={formData.brandName}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Building2 size={14} className="absolute left-3 top-3 text-zinc-400" />
                </div>
              </div>
            )}

            {/* Founder / Buyer Name if Register */}
            {isRegister && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  {roleMode === 'seller' ? 'Founder / Business Lead Name' : 'Full Name'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Samir Sumra"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <User size={14} className="absolute left-3 top-3 text-zinc-400" />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Mail size={14} className="absolute left-3 top-3 text-zinc-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Lock size={14} className="absolute left-3 top-3 text-zinc-400" />
              </div>
            </div>

            {/* If Registering Brand: Description */}
            {isRegister && roleMode === 'seller' && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Brand Philosophy & Category
                </label>
                <textarea
                  name="brandDescription"
                  rows={2}
                  placeholder="Briefly describe your design ethos, fabrics, and clothing category..."
                  value={formData.brandDescription}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                roleMode === 'seller'
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                  : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white shadow-zinc-900/10'
              } disabled:opacity-50`}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="pt-2 text-center text-xs">
            <span className="text-zinc-500">
              {isRegister ? 'Already registered?' : "Don't have an account?"}{' '}
            </span>
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isRegister ? 'Sign In instead' : 'Create an Account'}
            </button>
          </div>

          {/* Super Admin Shortcut */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link
              to="/admin/login"
              className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center justify-center gap-1"
            >
              <ShieldAlert size={12} />
              <span>Super Administrator Portal Access →</span>
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AuthPage;
