import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, AlertCircle, Loader2, Moon, Sun } from 'lucide-react';
import api from '@api';
import { useSuperAdminTheme } from '../hooks/useSuperAdminTheme';

const SuperAdminLoginPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useSuperAdminTheme();
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
        <div data-admin-theme={theme} className="super-admin-theme min-h-screen bg-slate-950 flex items-center justify-center p-6 antialiased font-sans">
            <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                className="absolute right-6 top-6 rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-slate-300 transition hover:text-white"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-full max-w-md space-y-6">
                {/* Brand / Title */}
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
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2.5">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form Card */}
                <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Mail size={13} /> Admin Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@minimal.com"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Lock size={13} /> Master Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••••••"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                            {loading ? 'Authenticating...' : 'Enter Admin Console'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
                        <Link 
                            to="/"
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            ← Return to Buyer Storefront
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLoginPage;
