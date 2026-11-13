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
        <div className="min-h-screen bg-[#0A0A0C] text-[#EDEDED] font-ui flex flex-col md:flex-row antialiased">
            {/* Sidebar Desktop */}
            <aside className="w-full md:w-64 bg-[#101014] border-r border-[#1E1E26] flex flex-col justify-between shrink-0">
                <div>
                    {/* Header */}
                    <div className="p-5 border-b border-[#1E1E26] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white text-[#0A0A0C] flex items-center justify-center font-editorial font-light text-base">
                                <ShieldAlert size={16} />
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
                                    Governance
                                </span>
                                <h2 className="text-xs font-semibold text-white">Platform Command</h2>
                            </div>
                        </div>
                        <button 
                            type="button"
                            className="md:hidden text-[#71717A] hover:text-white"
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                        >
                            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* System Status Pill */}
                    <div className="mx-4 mt-4 p-2.5 bg-[#141419] border border-[#202028] flex items-center justify-between text-xs">
                        <span className="text-[#A1A1AA] flex items-center gap-1.5 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" /> Engine 2.0
                        </span>
                        <span className="text-[#4ADE80] font-medium text-[10px] font-tabular uppercase tracking-wider">
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
                                            ? 'bg-white text-[#0A0A0C] font-semibold' 
                                            : 'text-[#A1A1AA] hover:text-white hover:bg-[#181820]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon size={14} className={isActive ? 'text-[#0A0A0C]' : 'text-[#71717A]'} />
                                        <span>{item.label}</span>
                                    </div>
                                    {isActive && <ChevronRight size={12} className="text-[#0A0A0C]" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-[#1E1E26] space-y-2">
                    <Link
                        to="/"
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#71717A] hover:text-white hover:bg-[#16161D] transition-colors"
                    >
                        <span>Buyer Marketplace</span>
                        <span className="text-[10px] text-[#4ADE80] font-tabular">● Live</span>
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E17564] hover:text-[#FFA090] hover:bg-[#2A1513] transition-colors font-medium cursor-pointer"
                    >
                        <LogOut size={13} /> Exit Command Center
                    </button>
                </div>
            </aside>

            {/* Main Application Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Header Bar */}
                <header className="h-14 border-b border-[#1E1E26] bg-[#0E0E12]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-xs text-[#71717A]">
                        <Lock size={11} className="text-[#A1A1AA]" />
                        <span>Command Center</span>
                        <span>/</span>
                        <span className="text-white font-medium capitalize">
                            {location.pathname.replace('/admin', '').replace('/', '') || 'Executive Overview'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#16161D] border border-[#242430] text-[11px] text-[#EDEDED] font-tabular">
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
