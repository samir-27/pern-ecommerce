import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Shirt, 
    PackageCheck, 
    BarChart3, 
    Store, 
    Settings, 
    LogOut, 
    ExternalLink, 
    AlertCircle, 
    CheckCircle2, 
    Menu, 
    X,
    Sparkles
} from 'lucide-react';
import api from '@api';

const BrandSellerLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [brand, setBrand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchBrand = async () => {
            try {
                const res = await api.get('/brand/profile');
                setBrand(res.data);
            } catch (err) {
                console.error('Failed to load brand context:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBrand();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const navItems = [
        { label: 'Overview', path: '/seller', icon: LayoutDashboard },
        { label: 'Clothing Catalog', path: '/seller/products', icon: Shirt },
        { label: 'Orders & Dispatch', path: '/seller/orders', icon: PackageCheck },
        { label: 'Revenue Analytics', path: '/seller/analytics', icon: BarChart3 },
        { label: 'Brand Profile', path: '/seller/profile', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
            {/* Sidebar Desktop */}
            <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between shrink-0">
                <div>
                    {/* Brand Portal Branding Header */}
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20">
                                {brand?.name ? brand.name.charAt(0).toUpperCase() : 'B'}
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 block">Brand Portal</span>
                                <h2 className="text-sm font-bold text-white truncate max-w-[130px]">{brand?.name || 'Brand Studio'}</h2>
                            </div>
                        </div>
                        <button 
                            className="md:hidden text-slate-400 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>

                    {/* Brand Status Pill */}
                    {brand && (
                        <div className="mx-4 mt-4 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Status</span>
                            <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] uppercase tracking-wider ${
                                brand.status === 'active' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                                {brand.status === 'active' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                {brand.status}
                            </span>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <nav className={`p-4 space-y-1.5 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        isActive 
                                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold shadow-sm' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                    {brand?.slug && (
                        <Link 
                            to={`/stores/${brand.slug}`} 
                            target="_blank" 
                            className="flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800/40 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Store size={14} /> Public Storefront
                            </span>
                            <ExternalLink size={12} />
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                    >
                        <LogOut size={14} /> Sign Out of Portal
                    </button>
                </div>
            </aside>

            {/* Main Workspace Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Header Sub-bar */}
                <header className="h-14 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Brand Portal</span>
                        <span>/</span>
                        <span className="text-white font-medium capitalize">
                            {location.pathname.replace('/seller', '').replace('/', '') || 'Overview'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link 
                            to="/" 
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            ← Return to Buyer Store
                        </Link>
                        <div className="h-4 w-px bg-slate-800" />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            Commission: {brand?.commission_rate || '10'}%
                        </span>
                    </div>
                </header>

                {/* Viewport Content */}
                <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default BrandSellerLayout;
