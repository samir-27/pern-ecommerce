import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  Building2, 
  AlertCircle,
  Percent
} from 'lucide-react';
import api from '@/services/Axios';

const AuthPage = ({ initialMode = 'login' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'buyer' | 'seller'
  const [roleMode, setRoleMode] = useState(searchParams.get('mode') === 'seller' ? 'seller' : 'buyer');
  // Type: 'login' | 'register'
  const [isRegister, setIsRegister] = useState(initialMode === 'register');

  useEffect(() => {
    setIsRegister(initialMode === 'register');
  }, [initialMode]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'seller' || mode === 'brand') {
      setRoleMode('seller');
    } else if (mode === 'buyer') {
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
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleMode === 'buyer'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <User size={14} /> Individual Client
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('seller')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleMode === 'seller'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Building2 size={14} /> Brand Partner
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && roleMode === 'seller' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Official Brand Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="brandName"
                      required
                      value={formData.brandName}
                      onChange={handleInputChange}
                      placeholder="e.g. Maison de Silk, Urban Drape"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Building2 size={16} className="absolute left-3 top-3 text-zinc-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Brand Narrative / Design Aesthetic
                  </label>
                  <textarea
                    rows={2}
                    name="brandDescription"
                    value={formData.brandDescription}
                    onChange={handleInputChange}
                    placeholder="Briefly describe your design philosophy, fabrics, or couture specialties..."
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Percent size={14} className="shrink-0 text-blue-500" />
                  <span>Transparent 5% platform take-rate applied strictly on confirmed delivered orders.</span>
                </div>
              </>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {roleMode === 'seller' ? 'Founder / Operations Contact Name *' : 'Full Name *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <User size={16} className="absolute left-3 top-3 text-zinc-400" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Work Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Mail size={16} className="absolute left-3 top-3 text-zinc-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Lock size={16} className="absolute left-3 top-3 text-zinc-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : (isRegister ? 'Complete Onboarding' : 'Sign In')}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {isRegister 
                ? 'Already have an account? Sign in here' 
                : "Don't have an account yet? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
