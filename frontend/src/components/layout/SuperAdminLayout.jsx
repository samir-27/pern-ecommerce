import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    ShieldAlert, 
    LayoutDashboard, 
    Briefcase, 
    Users, 
    Shirt, 
    ShoppingBag, 
    FileText, 
    LogOut, 
    ChevronRight,
    Menu, 
    X,
    Lock
} from 'lucide-react';

const SuperAdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/admin/login');
    };

    const navItems = [
        { label: 'Executive Telemetry', path: '/admin', icon: LayoutDashboard },
        { label: 'Partner Ateliers', path: '/admin/brands', icon: Briefcase },
        { label: 'Platform Shoppers', path: '/admin/buyers', icon: Users },
        { label: 'Garment Moderation', path: '/admin/products', icon: Shirt },
        { label: 'Consignment Orders', path: '/admin/orders', icon: ShoppingBag },
        { label: 'Security Audit Trail', path: '/admin/audit-logs', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui flex flex-col md:flex-row antialiased selection:bg-[#121212] selection:text-white">
            {/* Sidebar Desktop */}
            <aside className="w-full md:w-64 bg-white border-r border-[#E8E8E4] flex flex-col justify-between shrink-0 shadow-xs">
                <div>
                    {/* Header */}
                    <div className="p-5 border-b border-[#E8E8E4] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#121212] text-[#FBFBFA] flex items-center justify-center font-editorial font-light text-base">
                                <ShieldAlert size={15} />
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
                                    Governance
                                </span>
                                <h2 className="text-xs font-semibold text-[#121212]">Platform Command</h2>
                            </div>
                        </div>
                        <button 
                            type="button"
                            className="md:hidden text-[#71717A] hover:text-[#121212] cursor-pointer"
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                        >
                            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* System Status Pill */}
                    <div className="mx-4 mt-4 p-2.5 bg-[#F4F4F2] border border-[#E8E8E4] flex items-center justify-between text-xs">
                        <span className="text-[#71717A] flex items-center gap-1.5 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Engine 2.0
                        </span>
                        <span className="text-emerald-700 font-medium text-[10px] font-tabular uppercase tracking-wider">
                            ONLINE
                        </span>
                    </div>

                    {/* Navigation Items */}
                    <nav className={`p-4 space-y-1 ${isMobileOpen ? 'block' : 'hidden md:block'}`}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileOpen(false)}
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

                {/* Footer Controls */}
                <div className="p-4 border-t border-[#E8E8E4] space-y-1.5">
                    <Link
                        to="/"
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#71717A] hover:text-[#121212] hover:bg-[#F4F4F2] transition-colors"
                    >
                        <span>Buyer Marketplace</span>
                        <span className="text-[10px] text-emerald-700 font-tabular font-medium">● Live</span>
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#843828] hover:text-[#121212] hover:bg-[#F4F4F2] transition-colors font-medium cursor-pointer"
                    >
                        <LogOut size={13} /> Exit Command Center
                    </button>
                </div>
            </aside>

            {/* Main Application Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden bg-[#FBFBFA]">
                {/* Header Bar */}
                <header className="h-14 border-b border-[#E8E8E4] bg-[#FBFBFA]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-xs text-[#71717A]">
                        <Lock size={11} className="text-[#71717A]" />
                        <span>Command Center</span>
                        <span>/</span>
                        <span className="text-[#121212] font-medium capitalize">
                            {location.pathname.replace('/admin', '').replace('/', '') || 'Executive Overview'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#F4F4F2] border border-[#E8E8E4] text-[11px] text-[#121212] font-tabular">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#843828]" />
                            <span>Super Admin Session</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default SuperAdminLayout;
