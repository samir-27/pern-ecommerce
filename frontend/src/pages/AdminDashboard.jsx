import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, ShoppingBag, LogOut, Package, MapPin,
    DollarSign, Shield, CheckCircle2, XCircle, Sparkles, Bot
} from 'lucide-react';
import api from '../services/Axios';
import { formatCurrency } from '../services/Currency';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, sellers, applications, products, orders, commissions, payouts, returns, audit, ai_analytics

    // Overview Stats
    const [stats, setStats] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);

    // Lists
    const [productsList, setProductsList] = useState([]);
    const [ordersList, setOrdersList] = useState([]);
    const [sellersList, setSellersList] = useState([]);
    const [applicationsList, setApplicationsList] = useState([]);
    const [commissionsList, setCommissionsList] = useState([]);
    const [payoutsList, setPayoutsList] = useState([]);
    const [returnsList, setReturnsList] = useState([]);
    const [auditLogsList, setAuditLogsList] = useState([]);

    // AI Analytics Assistant State
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiAnswer, setAiAnswer] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    // New Commission Rule Form
    const [showNewRuleModal, setShowNewRuleModal] = useState(false);
    const [newRule, setNewRule] = useState({ ruleType: 'category', targetId: '', rate: '10' });

    // Review Application Modal
    const [reviewingApp, setReviewingApp] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');

    const fetchOverview = async () => {
        try {
            const res = await api.get('/admin/overview');
            setStats(res.data);
        } catch (error) {
            console.error('Could not fetch admin overview', error);
        }
    };

    useEffect(() => {
        let isMounted = true;
        api.get('/admin/overview').then(res => {
            if (isMounted) setStats(res.data);
        }).catch(err => console.error(err));
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        const loadTab = async () => {
            setDataLoading(true);
            try {
                if (activeTab === 'products') {
                    const res = await api.get('/admin/products');
                    setProductsList(res.data || []);
                } else if (activeTab === 'orders') {
                    const res = await api.get('/admin/orders');
                    setOrdersList(res.data || []);
                } else if (activeTab === 'sellers') {
                    const res = await api.get('/admin/sellers');
                    setSellersList(res.data || []);
                } else if (activeTab === 'applications') {
                    const res = await api.get('/admin/seller-applications');
                    setApplicationsList(res.data || []);
                } else if (activeTab === 'commissions') {
                    const res = await api.get('/admin/commissions');
                    setCommissionsList(res.data || []);
                } else if (activeTab === 'payouts') {
                    const res = await api.get('/admin/payouts');
                    setPayoutsList(res.data || []);
                } else if (activeTab === 'returns') {
                    const res = await api.get('/admin/returns');
                    setReturnsList(res.data || []);
                } else if (activeTab === 'audit') {
                    const res = await api.get('/admin/audit-logs');
                    setAuditLogsList(res.data || []);
                }
            } catch (err) {
                console.error(`Error loading ${activeTab}:`, err);
            } finally {
                setDataLoading(false);
            }
        };
        loadTab();
    }, [activeTab]);

    const handleModerateProduct = async (id, status) => {
        try {
            await api.put(`/admin/products/${id}/moderation`, { status });
            setProductsList(prev => prev.map(p => p.id === id ? { ...p, status } : p));
            fetchOverview();
            alert(`Listing marked as ${status}`);
        } catch {
            alert('Failed to update product moderation.');
        }
    };

    const handleReviewApplication = async (status) => {
        if (!reviewingApp) return;
        try {
            await api.put(`/admin/seller-applications/${reviewingApp.id}`, {
                status,
                adminNotes: reviewNotes
            });
            setReviewingApp(null);
            setReviewNotes('');
            const res = await api.get('/admin/seller-applications');
            setApplicationsList(res.data || []);
            fetchOverview();
            alert(`Application ${status} successfully.`);
        } catch {
            alert('Failed to review application.');
        }
    };

    const handleProcessPayout = async (id, status) => {
        const refId = prompt('Enter Bank / UTR Reference ID:');
        if (!refId && status === 'completed') return;

        try {
            await api.put(`/admin/payouts/${id}`, {
                status,
                referenceId: refId || 'MANUAL-PROCESSED'
            });
            const res = await api.get('/admin/payouts');
            setPayoutsList(res.data || []);
            fetchOverview();
            alert(`Payout marked as ${status}`);
        } catch {
            alert('Failed to update payout.');
        }
    };

    const handleResolveReturn = async (id, status, restock = false) => {
        try {
            await api.put(`/admin/returns/${id}`, { status, restockInventory: restock });
            const res = await api.get('/admin/returns');
            setReturnsList(res.data || []);
            alert(`Return request marked as ${status}`);
        } catch {
            alert('Failed to update return request.');
        }
    };

    const handleAskAIAnalytics = async (e) => {
        e.preventDefault();
        if (!aiQuestion.trim() || aiLoading) return;

        setAiLoading(true);
        try {
            const res = await api.post('/ai/admin-analytics', { question: aiQuestion.trim() });
            setAiAnswer(res.data);
        } catch {
            alert('AI analytics query failed.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
        window.location.reload();
    };

    return (
        <div className="min-h-[85vh] bg-dominant py-8 max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
                        <Shield size={16} /> Super Admin Control Center
                    </div>
                    <h1 className="text-3xl font-black text-secondary mt-1">Platform Governance</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/seller')}
                        className="px-4 py-2 text-sm font-semibold border border-secondary/15 rounded-xl hover:bg-secondary/5 transition"
                    >
                        Seller Hub
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8 flex gap-2 border-b border-secondary/10 pb-2 overflow-x-auto text-sm">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'sellers', label: `Sellers (${stats?.activeSellers || 0})` },
                    { id: 'applications', label: `Applications (${stats?.pendingApplications || 0})` },
                    { id: 'products', label: `Products (${stats?.products || 0})` },
                    { id: 'orders', label: `Orders (${stats?.orders || 0})` },
                    { id: 'commissions', label: 'Commissions' },
                    { id: 'payouts', label: 'Payouts' },
                    { id: 'returns', label: 'Returns' },
                    { id: 'audit', label: 'Audit Logs' },
                    { id: 'ai_analytics', label: 'AI Analytics' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                            activeTab === tab.id ? 'bg-secondary text-dominant shadow-sm' : 'text-secondary/60 hover:text-secondary'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6">
                            <div className="w-10 h-10 rounded-xl bg-green-500/15 text-green-600 flex items-center justify-center mb-3">
                                <DollarSign size={20} />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Gross Merchandise Value (GMV)</p>
                            <h3 className="text-3xl font-black text-secondary mt-1">{formatCurrency(stats?.gmv || 0)}</h3>
                        </div>

                        <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center mb-3">
                                <DollarSign size={20} />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Platform Commission Revenue</p>
                            <h3 className="text-3xl font-black text-secondary mt-1">{formatCurrency(stats?.platformRevenue || 0)}</h3>
                        </div>

                        <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6">
                            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-3">
                                <ShoppingBag size={20} />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Active Marketplace Listings</p>
                            <h3 className="text-3xl font-black text-secondary mt-1">{stats?.products || 0}</h3>
                        </div>

                        <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 text-yellow-600 flex items-center justify-center mb-3">
                                <Users size={20} />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Pending Seller Reviews</p>
                            <h3 className="text-3xl font-black text-secondary mt-1">{stats?.pendingApplications || 0}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl border border-secondary/10 bg-dominant">
                            <h3 className="text-lg font-bold text-secondary mb-3">Marketplace Governance</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-secondary/5">
                                    <span className="text-secondary/70">Total Customers</span>
                                    <span className="font-bold text-secondary">{stats?.users || 0}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-secondary/5">
                                    <span className="text-secondary/70">Approved Active Stores</span>
                                    <span className="font-bold text-secondary">{stats?.activeSellers || 0}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-secondary/5">
                                    <span className="text-secondary/70">Pending Listing Approvals</span>
                                    <span className="font-bold text-accent">{stats?.pendingProducts || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-secondary/10 bg-dominant col-span-2">
                            <h3 className="text-lg font-bold text-secondary mb-3">Operational Fast Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                <button
                                    onClick={() => setActiveTab('applications')}
                                    className="p-3 text-left rounded-xl bg-secondary/5 hover:bg-secondary/10 transition flex items-center justify-between"
                                >
                                    <span className="text-sm font-semibold">Review Pending Applications</span>
                                    <span className="px-2 py-0.5 rounded-full bg-accent text-dominant text-xs font-bold">{stats?.pendingApplications || 0}</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className="p-3 text-left rounded-xl bg-secondary/5 hover:bg-secondary/10 transition flex items-center justify-between"
                                >
                                    <span className="text-sm font-semibold">Moderate Product Listings</span>
                                    <span className="px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-bold">{stats?.pendingProducts || 0}</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('commissions')}
                                    className="p-3 text-left rounded-xl bg-secondary/5 hover:bg-secondary/10 transition flex items-center justify-between"
                                >
                                    <span className="text-sm font-semibold">Configure Commission Rules</span>
                                    <DollarSign size={16} className="text-green-600" />
                                </button>
                                <button
                                    onClick={() => setActiveTab('ai_analytics')}
                                    className="p-3 text-left rounded-xl bg-secondary/5 hover:bg-secondary/10 transition flex items-center justify-between"
                                >
                                    <span className="text-sm font-semibold">Query Executive AI Assistant</span>
                                    <Sparkles size={16} className="text-purple-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: SELLER APPLICATIONS */}
            {activeTab === 'applications' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <h2 className="text-xl font-bold text-secondary mb-6">Seller Onboarding Applications</h2>
                    {dataLoading ? <p className="text-sm text-secondary/60">Loading applications...</p> : (
                        applicationsList.length === 0 ? <p className="text-sm text-secondary/60">No applications found.</p> : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase">
                                        <th className="py-3 px-4">Applicant</th>
                                        <th className="py-3 px-4">Business Info</th>
                                        <th className="py-3 px-4">Tax ID & Docs</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applicationsList.map(app => (
                                        <tr key={app.id} className="border-b border-secondary/5 hover:bg-secondary/5 transition">
                                            <td className="py-3 px-4">
                                                <p className="font-bold text-secondary">{app.user_name}</p>
                                                <p className="text-xs text-secondary/60">{app.user_email}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-semibold text-secondary">{app.business_name}</p>
                                                <p className="text-xs text-secondary/60">{app.business_email} · {app.phone || 'No phone'}</p>
                                            </td>
                                            <td className="py-3 px-4 text-xs">
                                                <p><span className="font-semibold">Tax ID:</span> {app.tax_id || 'N/A'}</p>
                                                {app.document_urls?.[0] && (
                                                    <a href={app.document_urls[0]} target="_blank" rel="noreferrer" className="text-accent underline">View Document</a>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {app.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setReviewingApp(app);
                                                                handleReviewApplication('approved');
                                                            }}
                                                            className="p-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                                                            title="Approve Seller"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setReviewingApp(app);
                                                                const note = prompt('Reason for rejection:');
                                                                setReviewNotes(note || '');
                                                                handleReviewApplication('rejected');
                                                            }}
                                                            className="p-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                                                            title="Reject Seller"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}
                </div>
            )}

            {/* TAB: SELLERS */}
            {activeTab === 'sellers' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <h2 className="text-xl font-bold text-secondary mb-6">Registered Marketplace Sellers</h2>
                    {dataLoading ? <p className="text-sm text-secondary/60">Loading sellers...</p> : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase">
                                    <th className="py-3 px-4">Store Name</th>
                                    <th className="py-3 px-4">Owner</th>
                                    <th className="py-3 px-4">Catalog & Orders</th>
                                    <th className="py-3 px-4">Gross Sales</th>
                                    <th className="py-3 px-4">Commission %</th>
                                    <th className="py-3 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sellersList.map(s => (
                                    <tr key={s.id} className="border-b border-secondary/5 hover:bg-secondary/5 transition">
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-secondary">{s.name}</p>
                                            <p className="text-xs text-secondary/60">/stores/{s.slug}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-secondary">{s.owner_name}</p>
                                            <p className="text-xs text-secondary/60">{s.email}</p>
                                        </td>
                                        <td className="py-3 px-4 text-xs">
                                            <p>{s.total_products} products listed</p>
                                            <p className="text-secondary/60">{s.total_orders} orders fulfilled</p>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-secondary">{formatCurrency(s.total_sales || 0)}</td>
                                        <td className="py-3 px-4 font-semibold">{s.commission_rate || 10}%</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={async () => {
                                                    const newStatus = !s.is_active;
                                                    await api.put(`/admin/sellers/${s.id}`, { isActive: newStatus });
                                                    setSellersList(prev => prev.map(item => item.id === s.id ? { ...item, is_active: newStatus } : item));
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                                                    s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {s.is_active ? 'Active' : 'Suspended'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB: PRODUCTS MODERATION */}
            {activeTab === 'products' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <h2 className="text-xl font-bold text-secondary mb-6">Product Catalog Moderation</h2>
                    {dataLoading ? <p className="text-sm text-secondary/60">Loading products...</p> : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase">
                                    <th className="py-3 px-4">Image</th>
                                    <th className="py-3 px-4">Title & Store</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Price</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Moderation Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productsList.map(prod => (
                                    <tr key={prod.id} className="border-b border-secondary/5 hover:bg-secondary/5 transition">
                                        <td className="py-3 px-4">
                                            <div className="w-12 h-14 rounded-lg bg-secondary/10 overflow-hidden">
                                                {prod.main_image ? <img src={prod.main_image} alt={prod.name} className="w-full h-full object-cover" /> : <Package size={18} />}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-secondary">{prod.name}</p>
                                            <p className="text-xs text-secondary/60">Store: <span className="font-semibold text-secondary">{prod.store_name || 'Flagship Store'}</span></p>
                                        </td>
                                        <td className="py-3 px-4 text-xs">{prod.category_name} · {prod.gender}</td>
                                        <td className="py-3 px-4 font-bold text-secondary">{formatCurrency(prod.base_price)}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                prod.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                prod.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {prod.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {prod.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleModerateProduct(prod.id, 'approved')}
                                                        className="px-2.5 py-1 bg-green-600 text-white rounded text-xs font-bold"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {prod.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => handleModerateProduct(prod.id, 'rejected')}
                                                        className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-bold"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB: ORDERS */}
            {activeTab === 'orders' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <h2 className="text-xl font-bold text-secondary mb-6">Marketplace Order Oversight</h2>
                    {dataLoading ? <p className="text-sm text-secondary/60">Loading orders...</p> : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase">
                                    <th className="py-3 px-4">Order ID</th>
                                    <th className="py-3 px-4">Customer Info</th>
                                    <th className="py-3 px-4">Items & Sellers</th>
                                    <th className="py-3 px-4">Shipping Address</th>
                                    <th className="py-3 px-4">Total Amount</th>
                                    <th className="py-3 px-4">Payment Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordersList.map(order => (
                                    <tr key={order.id} className="border-b border-secondary/5 hover:bg-secondary/5 transition">
                                        <td className="py-3 px-4 font-bold text-secondary">#{order.id}</td>
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-secondary">{order.user_name}</p>
                                            <p className="text-xs text-secondary/60">{order.email}</p>
                                        </td>
                                        <td className="py-3 px-4 text-xs space-y-1">
                                            {(order.items || []).map((item, idx) => (
                                                <p key={idx}>
                                                    <span className="font-semibold">{item.product_name}</span> x {item.quantity} · {item.store_name || 'Flagship'}
                                                </p>
                                            ))}
                                        </td>
                                        <td className="py-3 px-4 text-xs max-w-xs text-secondary/70">
                                            <div className="flex items-start gap-1">
                                                <MapPin size={14} className="text-accent flex-shrink-0 mt-0.5" />
                                                <span>{order.shipping_address}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-secondary">{formatCurrency(order.total_amount)}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                {order.status || 'Paid'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB: COMMISSIONS */}
            {activeTab === 'commissions' && (
                <div className="space-y-6">
                    <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-secondary">Platform Commission Architecture</h2>
                                <p className="text-xs text-secondary/60">Configure global default commission rate and seller or category-specific overrides.</p>
                            </div>
                            <button
                                onClick={() => setShowNewRuleModal(true)}
                                className="px-4 py-2 bg-secondary text-dominant text-sm font-bold rounded-lg hover:bg-accent transition"
                            >
                                + Add Override Rule
                            </button>
                        </div>

                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase">
                                    <th className="py-3 px-4">Rule Scope</th>
                                    <th className="py-3 px-4">Target</th>
                                    <th className="py-3 px-4">Commission %</th>
                                    <th className="py-3 px-4">Effective Date</th>
                                    <th className="py-3 px-4">Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissionsList.map(rule => (
                                    <tr key={rule.id} className="border-b border-secondary/5">
                                        <td className="py-3 px-4 font-bold text-secondary capitalize">{rule.rule_type}</td>
                                        <td className="py-3 px-4">{rule.target_name || 'All Catalog'}</td>
                                        <td className="py-3 px-4 font-black text-accent">{rule.rate}%</td>
                                        <td className="py-3 px-4 text-xs text-secondary/60">{new Date(rule.effective_from).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Active</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: PAYOUTS */}
            {activeTab === 'payouts' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <h2 className="text-xl font-bold text-secondary mb-6">Seller Payouts Oversight</h2>
                    {dataLoading ? <p className="text-sm text-secondary/60">Loading payouts...</p> : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase">
                                    <th className="py-3 px-4">Store</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4">Requested On</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Reference</th>
                                    <th className="py-3 px-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payoutsList.map(p => (
                                    <tr key={p.id} className="border-b border-secondary/5 hover:bg-secondary/5 transition">
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-secondary">{p.store_name || p.seller_name}</p>
                                            <p className="text-xs text-secondary/60">{p.seller_email}</p>
                                        </td>
                                        <td className="py-3 px-4 font-black text-secondary">{formatCurrency(p.amount)}</td>
                                        <td className="py-3 px-4 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-secondary/60">{p.reference_id || 'Pending'}</td>
                                        <td className="py-3 px-4">
                                            {p.status === 'pending' && (
                                                <button
                                                    onClick={() => handleProcessPayout(p.id, 'completed')}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold"
                                                >
                                                    Mark Completed
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB: RETURNS & DISPUTES */}
            {activeTab === 'returns' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <h2 className="text-xl font-bold text-secondary mb-6">Returns & Buyer Disputes</h2>
                    {dataLoading ? <p className="text-sm text-secondary/60">Loading returns...</p> : (
                        returnsList.length === 0 ? <p className="text-sm text-secondary/60">No return requests recorded.</p> : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase">
                                        <th className="py-3 px-4">Order & Item</th>
                                        <th className="py-3 px-4">Customer</th>
                                        <th className="py-3 px-4">Seller Store</th>
                                        <th className="py-3 px-4">Reason</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returnsList.map(r => (
                                        <tr key={r.id} className="border-b border-secondary/5 hover:bg-secondary/5 transition">
                                            <td className="py-3 px-4">
                                                <p className="font-bold text-secondary">#{r.order_id} - {r.product_name}</p>
                                                <p className="text-xs text-secondary/60">{r.color} / {r.size}</p>
                                            </td>
                                            <td className="py-3 px-4 text-xs">{r.customer_email}</td>
                                            <td className="py-3 px-4 text-xs font-semibold">{r.store_name}</td>
                                            <td className="py-3 px-4 text-xs max-w-xs">{r.reason}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    r.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    r.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {r.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleResolveReturn(r.id, 'completed', true)}
                                                            className="px-2.5 py-1 bg-green-600 text-white text-xs rounded font-bold"
                                                        >
                                                            Refund & Restock
                                                        </button>
                                                        <button
                                                            onClick={() => handleResolveReturn(r.id, 'rejected')}
                                                            className="px-2.5 py-1 bg-red-600 text-white text-xs rounded font-bold"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}
                </div>
            )}

            {/* TAB: AUDIT LOGS */}
            {activeTab === 'audit' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <h2 className="text-xl font-bold text-secondary mb-6">Security & Administrative Audit Trail</h2>
                    {dataLoading ? <p className="text-sm text-secondary/60">Loading audit trail...</p> : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase">
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Admin / Actor</th>
                                    <th className="py-3 px-4">Action</th>
                                    <th className="py-3 px-4">Entity</th>
                                    <th className="py-3 px-4">Audit Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogsList.map(log => (
                                    <tr key={log.id} className="border-b border-secondary/5 text-xs">
                                        <td className="py-3 px-4 text-secondary/60">{new Date(log.created_at).toLocaleString()}</td>
                                        <td className="py-3 px-4 font-semibold text-secondary">{log.user_email || 'System'}</td>
                                        <td className="py-3 px-4 font-bold text-accent">{log.action}</td>
                                        <td className="py-3 px-4">{log.target_entity} #{log.target_id}</td>
                                        <td className="py-3 px-4 text-secondary/60 font-mono text-[11px] max-w-xs truncate">
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB: AI ANALYTICS */}
            {activeTab === 'ai_analytics' && (
                <div className="space-y-6">
                    <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={22} className="text-accent" />
                            <h2 className="text-xl font-bold text-secondary">Super Admin AI Analytics Assistant</h2>
                        </div>
                        <p className="text-xs text-secondary/60 mb-6">
                            Ask complex questions in natural language. Translated into verified read-only PostgreSQL aggregates with zero hallucination.
                        </p>

                        <form onSubmit={handleAskAIAnalytics} className="flex gap-3 mb-6">
                            <input
                                required
                                value={aiQuestion}
                                onChange={e => setAiQuestion(e.target.value)}
                                placeholder="e.g. Which categories generated the highest GMV? or Which sellers are top performers?"
                                className="flex-1 p-3.5 bg-secondary/5 border border-secondary/15 rounded-xl text-sm text-secondary focus:outline-none focus:border-accent"
                            />
                            <button
                                type="submit"
                                disabled={aiLoading}
                                className="px-6 py-3.5 bg-secondary text-dominant rounded-xl text-sm font-bold hover:bg-accent transition flex items-center gap-2"
                            >
                                <Bot size={18} /> {aiLoading ? 'Analyzing...' : 'Ask AI'}
                            </button>
                        </form>

                        {aiAnswer && (
                            <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/10">
                                <h3 className="font-bold text-secondary mb-3">Executive Summary</h3>
                                <div className="text-sm text-secondary/80 whitespace-pre-line leading-relaxed mb-6">
                                    {aiAnswer.answer}
                                </div>

                                <div className="p-4 rounded-xl bg-dominant border border-secondary/10">
                                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Verified Database Snapshot</h4>
                                    <pre className="text-[11px] text-secondary/70 overflow-x-auto">
                                        {JSON.stringify(aiAnswer.dataSnapshot, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: ADD COMMISSION RULE */}
            {showNewRuleModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-dominant border border-secondary/15 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-secondary mb-4">Add Commission Override Rule</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            await api.post('/admin/commissions', newRule);
                            setShowNewRuleModal(false);
                            const res = await api.get('/admin/commissions');
                            setCommissionsList(res.data || []);
                        }} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Rule Scope</label>
                                <select
                                    value={newRule.ruleType}
                                    onChange={e => setNewRule({ ...newRule, ruleType: e.target.value })}
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                >
                                    <option value="global">Global Platform Default</option>
                                    <option value="category">Category Override</option>
                                    <option value="seller">Seller Store Override</option>
                                </select>
                            </div>

                            {newRule.ruleType !== 'global' && (
                                <div>
                                    <label className="text-xs font-bold text-secondary uppercase block mb-1">Target ID (Category or User ID)</label>
                                    <input
                                        required
                                        type="number"
                                        value={newRule.targetId}
                                        onChange={e => setNewRule({ ...newRule, targetId: e.target.value })}
                                        placeholder="Target numeric ID"
                                        className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Commission Rate (%)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={newRule.rate}
                                    onChange={e => setNewRule({ ...newRule, rate: e.target.value })}
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowNewRuleModal(false)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-secondary text-dominant rounded-xl text-sm font-bold">Save Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
