import { useState, useEffect } from 'react';
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
    ChevronRight
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
                const res = await api.get('/brand/profile').catch(() => api.get('/seller/store'));
                setBrand(res.data);
            } catch (err) {
                console.error('Failed to load brand context:', err);
                const hasToken = localStorage.getItem('token');
                if (!hasToken) {
                    navigate('/login?mode=seller', { replace: true });
                } else {
                    setBrand({
                        name: 'Brand Atelier',
                        status: 'active',
                        bio: 'Independent Fashion Label'
                    });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchBrand();
    }, [navigate]);

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
        <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui flex flex-col md:flex-row antialiased selection:bg-[#121212] selection:text-white">
            {/* Sidebar Desktop */}
            <aside className="w-full md:w-64 bg-white border-r border-[#E8E8E4] flex flex-col justify-between shrink-0 shadow-xs">
                <div>
                    {/* Atelier Studio Branding Header */}
                    <div className="p-5 border-b border-[#E8E8E4] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#121212] text-[#FBFBFA] border border-[#121212] flex items-center justify-center font-editorial text-xl font-light">
                                {brand?.name ? brand.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
                                    Atelier Studio
                                </span>
                                <h2 className="text-xs font-semibold text-[#121212] truncate max-w-[130px]">
                                    {brand?.name || 'Fashion House'}
                                </h2>
                            </div>
                        </div>
                        <button 
                            type="button"
                            className="md:hidden text-[#71717A] hover:text-[#121212] cursor-pointer"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* Brand Status Pill */}
                    {brand && (
                        <div className="mx-4 mt-4 p-2.5 bg-[#F4F4F2] border border-[#E8E8E4] flex items-center justify-between text-xs">
                            <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-medium">Status</span>
                            <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 text-[9px] uppercase tracking-fashion border ${
                                brand.status === 'active' 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                    : brand.status === 'suspended'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                                {brand.status === 'active' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                {brand.status === 'pending' ? 'Verification Pending' : brand.status}
                            </span>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <nav className={`p-4 space-y-1 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
                                        isActive 
                                            ? 'bg-[#121212] text-[#FBFBFA] font-medium shadow-xs' 
                                            : 'text-[#71717A] hover:text-[#121212] hover:bg-[#F4F4F2]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon size={14} className={isActive ? 'text-[#FBFBFA]' : 'text-[#71717A]'} />
                                        <span>{item.label}</span>
                                    </div>
                                    {isActive && <ChevronRight size={12} className="text-[#FBFBFA]" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-[#E8E8E4] space-y-1.5">
                    {brand?.slug && (
                        <Link 
                            to={`/brands/${brand.slug}`} 
                            target="_blank" 
                            className="flex items-center justify-between px-3 py-2 text-xs text-[#71717A] hover:text-[#121212] hover:bg-[#F4F4F2] transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Store size={13} /> Public Atelier View
                            </span>
                            <ExternalLink size={11} />
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#843828] hover:text-[#121212] hover:bg-[#F4F4F2] transition-colors font-medium cursor-pointer"
                    >
                        <LogOut size={13} /> Sign Out of Studio
                    </button>
                </div>
            </aside>

            {/* Main Workspace Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden bg-[#FBFBFA]">
                {/* Header Sub-bar */}
                <header className="h-14 border-b border-[#E8E8E4] bg-[#FBFBFA]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-xs text-[#71717A]">
                        <span>Atelier Studio</span>
                        <span>/</span>
                        <span className="text-[#121212] font-medium capitalize">
                            {location.pathname.replace('/seller', '').replace('/', '') || 'Overview'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link 
                            to="/" 
                            className="text-xs text-[#71717A] hover:text-[#121212] transition-colors"
                        >
                            ← Return to Buyer Store
                        </Link>
                        <div className="h-3 w-px bg-[#E8E8E4]" />
                        <span className="text-[11px] font-tabular uppercase tracking-wider text-[#71717A] bg-[#F4F4F2] px-2.5 py-1 border border-[#E8E8E4]">
                            Take-Rate: 5.0% Static
                        </span>
                    </div>
                </header>

                {/* Verification Pending Banner */}
                {brand?.status === 'pending' && (
                    <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#92400E]">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle size={16} className="text-[#D97706] shrink-0" />
                            <div>
                                <strong className="text-[#92400E] block font-semibold">Atelier Verification Pending:</strong>
                                <span className="text-[#B45309]">Your brand registration is awaiting Super Admin verification. You will be able to publish garments once verified.</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] text-[9px] uppercase tracking-fashion shrink-0 border border-[#FDE68A] font-medium">
                            Awaiting Moderation
                        </span>
                    </div>
                )}

                {/* Suspended Brand Notice */}
                {brand?.status === 'suspended' && (
                    <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#991B1B]">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle size={16} className="text-[#DC2626] shrink-0" />
                            <div>
                                <strong className="text-[#991B1B] block font-semibold">Atelier Suspended:</strong>
                                <span className="text-[#B91C1C]">Your atelier is temporarily suspended. Garment listings are withheld from buyers.</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-[#FEE2E2] text-[#991B1B] text-[9px] uppercase tracking-fashion shrink-0 border border-[#FECACA] font-medium">
                            Suspended
                        </span>
                    </div>
                )}

                {/* Viewport Content */}
                <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-10 w-2/5 bg-[#E8E8E4]" />
                            <div className="h-60 w-full bg-[#E8E8E4]" />
                        </div>
                    ) : children}
                </div>
            </main>
        </div>
    );
};

export default BrandSellerLayout;
