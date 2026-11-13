import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  Building2, 
  AlertCircle
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
    <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-block">
          <span className="font-editorial text-3xl sm:text-4xl font-light tracking-[0.06em] text-[#121212]">
            MINIMAL<span className="text-[#843828]">.</span>
          </span>
        </Link>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            {roleMode === 'buyer' ? 'Client Access' : 'Partner Atelier Gateway'}
          </span>
          <h2 className="font-editorial text-2xl font-light text-[#121212]">
            {roleMode === 'buyer' 
              ? (isRegister ? 'Create Client Account' : 'Welcome to the Atelier')
              : (isRegister ? 'Register Partner Brand' : 'Brand Studio Login')
            }
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-[#E8E8E4] p-6 sm:p-8 space-y-6">
          
          {/* Dual Role Selector Tabs */}
          <div className="grid grid-cols-2 border border-[#E8E8E4] p-1 bg-[#F4F4F2]">
            <button
              type="button"
              onClick={() => handleRoleChange('buyer')}
              className={`py-2 text-[10px] font-medium uppercase tracking-fashion transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                roleMode === 'buyer'
                  ? 'bg-white text-[#121212] shadow-xs font-semibold'
                  : 'text-[#71717A] hover:text-[#121212]'
              }`}
            >
              <User size={12} /> Individual Client
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('seller')}
              className={`py-2 text-[10px] font-medium uppercase tracking-fashion transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                roleMode === 'seller'
                  ? 'bg-white text-[#121212] shadow-xs font-semibold'
                  : 'text-[#71717A] hover:text-[#121212]'
              }`}
            >
              <Building2 size={12} /> Partner Atelier
            </button>
          </div>

          {error && (
            <div className="p-3 bg-[#843828]/10 border border-[#843828]/30 text-[#843828] text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && roleMode === 'seller' && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                    Official Atelier / Brand Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="brandName"
                      required
                      value={formData.brandName}
                      onChange={handleInputChange}
                      placeholder="e.g. Maison de Silk, Urban Drape"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
                    />
                    <Building2 size={14} className="absolute left-3 top-3 text-[#A1A1AA]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                    Atelier Narrative & Design Ethos
                  </label>
                  <textarea
                    rows={2}
                    name="brandDescription"
                    value={formData.brandDescription}
                    onChange={handleInputChange}
                    placeholder="Briefly describe tailoring philosophy, textiles, or specialties..."
                    className="w-full p-3 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors placeholder-[#A1A1AA]"
                  />
                </div>

                <div className="p-3 bg-[#F4F4F2] border border-[#E8E8E4] text-[11px] text-[#71717A]">
                  <span className="font-semibold text-[#121212]">5.0% Transparent Commission: </span>
                  <span>95% of garment proceeds are disbursed directly to your atelier on completed delivery.</span>
                </div>
              </>
            )}

            {isRegister && (
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                  {roleMode === 'seller' ? 'Founder / Atelier Director Name *' : 'Full Name *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rohini Sen"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
                  />
                  <User size={14} className="absolute left-3 top-3 text-[#A1A1AA]" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="client@domain.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
                />
                <Mail size={14} className="absolute left-3 top-3 text-[#A1A1AA]" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
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
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
                />
                <Lock size={14} className="absolute left-3 top-3 text-[#A1A1AA]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#121212] hover:bg-[#843828] text-white text-[11px] font-medium uppercase tracking-fashion transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>{loading ? 'Authenticating...' : (isRegister ? 'Create Account' : 'Sign In')}</span>
              <ArrowRight size={13} />
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="text-center pt-2 border-t border-[#E8E8E4]">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-[11px] font-medium text-[#71717A] hover:text-[#121212] underline underline-offset-4 cursor-pointer"
            >
              {isRegister 
                ? 'Existing client or atelier? Sign in here' 
                : "New to MINIMAL? Register an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
