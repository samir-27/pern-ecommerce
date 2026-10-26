import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  User, 
  ShieldAlert, 
  Lock, 
  Mail, 
  ArrowRight, 
  Building2, 
  AlertCircle,
  Percent
} from 'lucide-react';
import api from '@api';

const AuthPage = ({ initialMode = 'login' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'buyer' | 'seller'
  const [roleMode, setRoleMode] = useState(searchParams.get('mode') === 'seller' ? 'seller' : 'buyer');
  // Type: 'login' | 'register'
  const [isRegister, setIsRegister] = useState(initialMode === 'register');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRegister(initialMode === 'register');
  }, [initialMode]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'seller' || mode === 'brand') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleMode('seller');
    } else if (mode === 'buyer') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleMode('buyer');
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    brandName: '',
    brandDescription: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRoleChange = (newRole) => {
    setRoleMode(newRole);
    setError('');
    // Synchronize query parameter
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('mode', newRole);
      return p;
    }, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (roleMode === 'buyer') {
          // 1. Buyer Registration Validation & Call
          if (!formData.name?.trim()) {
            throw new Error('Please enter your full name.');
          }
          if (!formData.email?.trim()) {
            throw new Error('Please enter your email address.');
          }
          if (!formData.password || formData.password.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
          }

          const res = await api.post('/auth/register', {
            name: formData.name.trim(),
            firstName: formData.name.trim().split(' ')[0],
            lastName: formData.name.trim().split(' ').slice(1).join(' ') || '',
            email: formData.email.trim(),
            password: formData.password,
          });

          localStorage.setItem('token', res.data.token);
          localStorage.setItem('userRole', 'buyer');
          navigate('/');
        } else {
          // 2. Brand Seller Registration Validation & Call
          if (!formData.brandName?.trim()) {
            throw new Error('Brand / Studio Label Name is required.');
          }
          if (!formData.name?.trim()) {
            throw new Error('Founder / Business Lead Name is required.');
          }
          if (!formData.email?.trim()) {
            throw new Error('Email address is required.');
          }
          if (!formData.password || formData.password.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
          }

          const res = await api.post('/auth/register-brand', {
            name: formData.name.trim(),
            firstName: formData.name.trim().split(' ')[0],
            lastName: formData.name.trim().split(' ').slice(1).join(' ') || '',
            email: formData.email.trim(),
            password: formData.password,
            brandName: formData.brandName.trim(),
            bio: formData.brandDescription?.trim() || `Official brand line of ${formData.brandName.trim()}`,
            brandDescription: formData.brandDescription?.trim() || `Official brand line of ${formData.brandName.trim()}`,
          });

          localStorage.setItem('token', res.data.token);
          localStorage.setItem('userRole', 'seller');
          navigate('/seller');
        }
      } else {
        // Login for either role
        if (!formData.email?.trim() || !formData.password) {
          throw new Error('Please provide both email and password.');
        }

        const targetRole = roleMode === 'seller' ? 'seller' : 'buyer';
        const res = await api.post('/auth/login', {
          email: formData.email.trim(),
          password: formData.password,
          targetRole: targetRole,
        });

        localStorage.setItem('token', res.data.token);
        const resolvedRole = res.data.user?.role || targetRole;
        localStorage.setItem('userRole', resolvedRole);

        if (resolvedRole === 'seller' || resolvedRole === 'brand') {
          navigate('/seller');
        } else if (resolvedRole === 'admin' || resolvedRole === 'super_admin') {
          navigate('/admin');
        } else {
          const redirect = searchParams.get('redirect') || '/';
          navigate(redirect);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.message && err.message !== 'Network Error') {
        setError(err.message);
      } else {
        setError('Cannot connect to API server. Please verify backend is active on http://localhost:5000.');
      }
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
              onClick={() => handleRoleChange('buyer')}
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
              onClick={() => handleRoleChange('seller')}
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
            
            {/* If Registering Brand: Default Commission & Verification Notice */}
            {isRegister && roleMode === 'seller' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs">
                  <Percent size={14} className="text-amber-500" /> Platform Commission: 5.00% Static
                </div>
                <ul className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>Standard platform fee is fixed at <strong>5.00%</strong> deducted only upon completed customer orders.</li>
                  <li>New brand accounts require Super Admin verification before garments can be listed or sold.</li>
                  <li>No hidden charges, variable take-rates, or unexpected deductions.</li>
                </ul>
              </div>
            )}

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
              onClick={() => { 
                const nextRegister = !isRegister;
                setIsRegister(nextRegister); 
                setError('');
                navigate(`${nextRegister ? '/register' : '/login'}?mode=${roleMode}`, { replace: true });
              }}
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
