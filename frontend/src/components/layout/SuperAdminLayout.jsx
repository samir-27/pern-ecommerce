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
        { label: 'Executive Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Brand Sellers', path: '/admin/brands', icon: Briefcase },
        { label: 'Platform Buyers', path: '/admin/buyers', icon: Users },
        { label: 'Catalog Moderation', path: '/admin/products', icon: Shirt },
        { label: 'Marketplace Orders', path: '/admin/orders', icon: ShoppingBag },
        { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: FileText },
    ];

    return (
        <div data-admin-theme="light" className="super-admin-theme min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
            {/* Sidebar Desktop */}
            <aside className="w-full md:w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between shrink-0">
                <div>
                    {/* Header */}
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <ShieldAlert size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block">Command Center</span>
                                <h2 className="text-sm font-bold text-white">Super Admin</h2>
                            </div>
                        </div>
                        <button 
                            className="md:hidden text-slate-400 hover:text-white"
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                        >
                            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* System Status Pill */}
                    <div className="mx-4 mt-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Platform Engine
                        </span>
                        <span className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                            ONLINE
                        </span>
                    </div>

                    {/* Nav Items */}
                    <nav className={`p-4 space-y-1 ${isMobileOpen ? 'block' : 'hidden md:block'}`}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                        isActive 
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                        <span>{item.label}</span>
                                    </div>
                                    {isActive && <ChevronRight size={14} className="text-indigo-200" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                    <Link
                        to="/"
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors font-medium"
                    >
                        <span>Buyer Storefront</span>
                        <span className="text-[10px] text-slate-500">Live</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-semibold"
                    >
                        <LogOut size={14} /> Exit Admin Console
                    </button>
                </div>
            </aside>

            {/* Main Application Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Header Bar */}
                <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Lock size={12} className="text-indigo-400" />
                        <span>Platform Administration</span>
                        <span>/</span>
                        <span className="text-white font-medium capitalize">
                            {location.pathname.replace('/admin', '').replace('/', '') || 'Overview'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span>Super Admin Mode</span>
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
