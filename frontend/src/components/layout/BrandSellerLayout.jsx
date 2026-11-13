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
    X
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
        <div className="min-h-screen bg-[#0C0C0E] text-[#EDEDED] font-ui flex flex-col md:flex-row antialiased">
            {/* Sidebar Desktop */}
            <aside className="w-full md:w-64 bg-[#111115] border-r border-[#202028] flex flex-col justify-between shrink-0">
                <div>
                    {/* Atelier Studio Branding Header */}
                    <div className="p-5 border-b border-[#202028] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1D1D24] border border-[#2B2B36] flex items-center justify-center font-editorial text-xl text-white">
                                {brand?.name ? brand.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
                                    Atelier Studio
                                </span>
                                <h2 className="text-xs font-semibold text-white truncate max-w-[130px]">
                                    {brand?.name || 'Fashion House'}
                                </h2>
                            </div>
                        </div>
                        <button 
                            type="button"
                            className="md:hidden text-[#71717A] hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* Brand Status Pill */}
                    {brand && (
                        <div className="mx-4 mt-4 p-2.5 bg-[#17171D] border border-[#252530] flex items-center justify-between text-xs">
                            <span className="text-[11px] text-[#A1A1AA] uppercase tracking-wider">Status</span>
                            <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 text-[10px] uppercase tracking-fashion ${
                                brand.status === 'active' 
                                    ? 'bg-[#1C281F] text-[#4ADE80] border border-[#2E4A35]' 
                                    : 'bg-[#2E2018] text-[#FBBF24] border border-[#4D3321]'
                            }`}>
                                {brand.status === 'active' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
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
                                    className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
                                        isActive 
                                            ? 'bg-white text-[#0C0C0E] font-semibold' 
                                            : 'text-[#A1A1AA] hover:text-white hover:bg-[#1A1A22]'
                                    }`}
                                >
                                    <Icon size={15} className={isActive ? 'text-[#0C0C0E]' : 'text-[#71717A]'} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-[#202028] space-y-2">
                    {brand?.slug && (
                        <Link 
                            to={`/brands/${brand.slug}`} 
                            target="_blank" 
                            className="flex items-center justify-between px-3 py-2 text-xs text-[#A1A1AA] hover:text-white hover:bg-[#17171D] transition-colors"
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
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E17564] hover:text-[#FFA090] hover:bg-[#2A1513] transition-colors font-medium cursor-pointer"
                    >
                        <LogOut size={13} /> Sign Out of Studio
                    </button>
                </div>
            </aside>

            {/* Main Workspace Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Header Sub-bar */}
                <header className="h-14 border-b border-[#202028] bg-[#0F0F13]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-xs text-[#71717A]">
                        <span>Atelier Studio</span>
                        <span>/</span>
                        <span className="text-[#EDEDED] font-medium capitalize">
                            {location.pathname.replace('/seller', '').replace('/', '') || 'Overview'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link 
                            to="/" 
                            className="text-xs text-[#A1A1AA] hover:text-white transition-colors"
                        >
                            ← Return to Buyer Store
                        </Link>
                        <div className="h-3 w-px bg-[#202028]" />
                        <span className="text-[11px] font-tabular uppercase tracking-wider text-[#A1A1AA] bg-[#181820] px-2.5 py-1 border border-[#282834]">
                            Take-Rate: 5.0% Static
                        </span>
                    </div>
                </header>

                {/* Verification Pending Banner */}
                {brand?.status === 'pending' && (
                    <div className="bg-[#241A13] border-b border-[#4A3222] px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#FDE68A]">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle size={16} className="text-[#FBBF24] shrink-0" />
                            <div>
                                <strong className="text-white block font-medium">Atelier Verification Pending:</strong>
                                <span className="text-[#D1D5DB]">Your brand registration is awaiting Super Admin verification. You will be able to publish garments once verified.</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-[#3E291B] text-[#FDE68A] text-[9px] uppercase tracking-fashion shrink-0 border border-[#68462D]">
                            Awaiting Moderation
                        </span>
                    </div>
                )}

                {/* Suspended Brand Notice */}
                {brand?.status === 'suspended' && (
                    <div className="bg-[#261313] border-b border-[#4D1F1F] px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#FCA5A5]">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle size={16} className="text-[#F87171] shrink-0" />
                            <div>
                                <strong className="text-white block font-medium">Atelier Suspended:</strong>
                                <span className="text-[#D1D5DB]">Your atelier is temporarily suspended. Garment listings are withheld from buyers.</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-[#3D1A1A] text-[#FCA5A5] text-[9px] uppercase tracking-fashion shrink-0 border border-[#662828]">
                            Suspended
                        </span>
                    </div>
                )}

                {/* Viewport Content */}
                <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-10 w-2/5 bg-[#17171E]" />
                            <div className="h-60 w-full bg-[#17171E]" />
                        </div>
                    ) : children}
                </div>
            </main>
        </div>
    );
};

export default BrandSellerLayout;
