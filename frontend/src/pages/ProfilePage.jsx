import { useEffect, useState } from 'react';
import { User, Package, Key, LogOut, Loader2, RotateCcw, Truck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/Axios';
import { getOrders } from '../services/Order';
import { formatCurrency } from '../services/Currency';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile'); // profile, orders, returns, security
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [orders, setOrders] = useState([]);
    const [returns, setReturns] = useState([]);

    // Return Request Form Modal State
    const [returnModalItem, setReturnModalItem] = useState(null);
    const [returnReason, setReturnReason] = useState('Fit or sizing issue');
    const [returnDetails, setReturnDetails] = useState('');
    const [returnLoading, setReturnLoading] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        currentPassword: '',
        newPassword: ''
    });

    useEffect(() => {
        const fetchProfileData = async () => {
            setPageLoading(true);
            setError('');

            try {
                const [profileResponse, ordersResponse, returnsResponse] = await Promise.all([
                    api.get('/auth/profile'),
                    getOrders(),
                    api.get('/orders/returns/my').catch(() => ({ data: [] }))
                ]);

                const profileData = profileResponse.data || {};
                setFormData(prev => ({
                    ...prev,
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    email: profileData.email || ''
                }));

                const normalizedOrders = Array.isArray(ordersResponse)
                    ? ordersResponse
                    : ordersResponse?.orders || [];
                setOrders(normalizedOrders);
                setReturns(returnsResponse.data || []);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load your account details.');
            } finally {
                setPageLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
        window.location.reload();
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.put('/auth/profile', {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email
            });

            setSuccess(response.data.message || 'Profile updated successfully.');
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.put('/auth/password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            setSuccess(response.data.message || 'Password updated successfully.');
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        } catch (err) {
            setError(err.response?.data?.error || 'Unable to update password.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        if (!returnModalItem) return;

        setReturnLoading(true);
        try {
            const res = await api.post('/orders/returns', {
                orderItemId: returnModalItem.order_item_id,
                reason: returnReason,
                details: returnDetails
            });

            alert(res.data.message || 'Return request submitted.');
            setReturnModalItem(null);
            setReturnDetails('');
            const updatedReturns = await api.get('/orders/returns/my');
            setReturns(updatedReturns.data || []);
            setActiveTab('returns');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit return request.');
        } finally {
            setReturnLoading(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleDateString();
    };

    const getStatusClass = (status = 'pending') => {
        const normalized = status.toLowerCase();
        if (normalized === 'delivered' || normalized === 'completed' || normalized === 'paid') {
            return 'bg-green-100 text-green-700';
        }
        if (normalized === 'cancelled' || normalized === 'failed' || normalized === 'rejected') {
            return 'bg-red-100 text-red-700';
        }
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <div className="bg-dominant min-h-[80vh] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-secondary mb-2">My Account</h1>
                    <p className="text-secondary/60">Manage your personal information, orders, and returns.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    <aside className="w-full lg:w-64 shrink-0">
                        <div className="sticky top-24 flex flex-col space-y-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-semibold cursor-pointer ${activeTab === 'profile' ? 'bg-secondary text-dominant' : 'text-secondary/70 hover:bg-secondary/5 hover:text-secondary'}`}
                            >
                                <User size={18} /> Personal Details
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-semibold cursor-pointer ${activeTab === 'orders' ? 'bg-secondary text-dominant' : 'text-secondary/70 hover:bg-secondary/5 hover:text-secondary'}`}
                            >
                                <Package size={18} /> Order History ({orders.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('returns')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-semibold cursor-pointer ${activeTab === 'returns' ? 'bg-secondary text-dominant' : 'text-secondary/70 hover:bg-secondary/5 hover:text-secondary'}`}
                            >
                                <RotateCcw size={18} /> Returns & Refunds ({returns.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-semibold cursor-pointer ${activeTab === 'security' ? 'bg-secondary text-dominant' : 'text-secondary/70 hover:bg-secondary/5 hover:text-secondary'}`}
                            >
                                <Key size={18} /> Password & Security
                            </button>

                            <hr className="my-4 border-secondary/10" />

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 text-red-500 font-semibold hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
                            >
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1">
                        {error && <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600 border border-red-200 text-sm font-medium">{error}</div>}
                        {success && <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700 border border-green-200 text-sm font-medium flex items-center gap-2"><CheckCircle2 size={18}/>{success}</div>}

                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-secondary mb-6">Personal Details</h2>
                                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-secondary/70">First Name</label>
                                            <input
                                                type="text"
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full bg-secondary/5 border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-secondary/70">Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full bg-secondary/5 border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-secondary/70">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-secondary/5 border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                    <button disabled={loading} className="px-8 py-3 bg-secondary text-dominant font-bold rounded-lg hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-secondary mb-6">Change Password</h2>
                                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-secondary/70">Current Password</label>
                                        <input
                                            type="password"
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            className="w-full bg-secondary/5 border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-secondary/70">New Password</label>
                                        <input
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="w-full bg-secondary/5 border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                    <button disabled={loading} className="px-8 py-3 bg-secondary text-dominant font-bold rounded-lg hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-secondary mb-6">Order History</h2>

                                {pageLoading ? (
                                    <div className="flex items-center gap-3 rounded-xl border border-secondary/10 bg-secondary/5 px-4 py-6 text-secondary/70">
                                        <Loader2 className="animate-spin" size={18} />
                                        Loading orders...
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-12 bg-secondary/5 rounded-xl border-2 border-dashed border-secondary/20">
                                        <Package className="mx-auto text-secondary/30 mb-4" size={48} />
                                        <p className="text-secondary/70 font-medium">You haven't placed any orders yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {orders.map((order) => (
                                            <div key={order.id} className="border-2 border-secondary/10 rounded-2xl p-6 hover:border-secondary/30 transition-colors bg-dominant shadow-sm">
                                                <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                            <h3 className="font-bold text-lg text-secondary">Marketplace Order #{order.id}</h3>
                                                            <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${getStatusClass(order.status)}`}>
                                                                {order.status || 'paid'}
                                                            </span>
                                                        </div>
                                                        <p className="text-secondary/60 text-xs font-medium">
                                                            Placed on {formatDate(order.created_at)}
                                                        </p>
                                                        {order.shipping_address && (
                                                            <p className="text-secondary/60 text-xs font-medium mt-1">
                                                                Shipping: {order.shipping_address}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col sm:items-end gap-1">
                                                        <span className="font-black text-2xl text-secondary">{formatCurrency(order.total_amount)}</span>
                                                        <span className="text-xs text-secondary/60 font-medium">
                                                            {Array.isArray(order.items) ? `${order.items.length} item${order.items.length > 1 ? 's' : ''}` : 'Items'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Line Items with Seller Isolation & Tracking */}
                                                {Array.isArray(order.items) && order.items.length > 0 && (
                                                    <div className="space-y-3 border-t border-secondary/10 pt-4">
                                                        {order.items.map((item, index) => (
                                                            <div key={`${order.id}-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-secondary/5 p-4">
                                                                <div className="flex items-center gap-3">
                                                                    {item.image_urls?.[0] ? (
                                                                        <img src={item.image_urls[0]} alt={item.product_name} className="h-16 w-16 rounded-lg object-cover" />
                                                                    ) : (
                                                                        <div className="h-16 w-16 rounded-lg bg-secondary/10 flex items-center justify-center"><Package size={20}/></div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-bold text-secondary text-sm">{item.product_name}</p>
                                                                        <p className="text-xs text-secondary/60">
                                                                            Store: <span className="font-semibold text-secondary">{item.store_name || 'Flagship Store'}</span> · {item.color} / {item.size} · Qty: {item.quantity}
                                                                        </p>
                                                                        {item.tracking_number && (
                                                                            <p className="text-xs text-accent font-semibold flex items-center gap-1 mt-1">
                                                                                <Truck size={14} /> {item.shipping_carrier || 'Carrier'}: {item.tracking_number}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                                                                    <span className="font-bold text-secondary text-sm">{formatCurrency(item.price_at_purchase * item.quantity)}</span>
                                                                    <button
                                                                        onClick={() => setReturnModalItem(item)}
                                                                        className="text-xs font-bold text-secondary/70 hover:text-accent underline cursor-pointer"
                                                                    >
                                                                        Request Return
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'returns' && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-secondary mb-6">Returns & Refund Requests</h2>
                                {returns.length === 0 ? (
                                    <div className="text-center py-12 bg-secondary/5 rounded-xl border-2 border-dashed border-secondary/20">
                                        <RotateCcw className="mx-auto text-secondary/30 mb-4" size={48} />
                                        <p className="text-secondary/70 font-medium">You have no active return requests.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {returns.map(ret => (
                                            <div key={ret.id} className="p-4 rounded-xl border border-secondary/10 bg-dominant flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-secondary text-sm">{ret.product_name}</h4>
                                                    <p className="text-xs text-secondary/60">Reason: {ret.reason}</p>
                                                    <p className="text-xs text-secondary/50 mt-1">Submitted: {new Date(ret.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(ret.status)}`}>
                                                        {ret.status}
                                                    </span>
                                                    <p className="text-xs font-bold text-secondary mt-1">{formatCurrency(ret.refund_amount)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* MODAL: RETURN REQUEST */}
            {returnModalItem && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-dominant border border-secondary/15 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-secondary mb-2">Request Return for {returnModalItem.product_name}</h3>
                        <p className="text-xs text-secondary/60 mb-4">Eligible within 14 days of receipt. The seller and Super Admin will review your return.</p>
                        <form onSubmit={handleSubmitReturn} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Reason for Return</label>
                                <select
                                    value={returnReason}
                                    onChange={e => setReturnReason(e.target.value)}
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                >
                                    <option value="Fit or sizing issue">Fit or sizing issue</option>
                                    <option value="Color not as expected">Color not as expected</option>
                                    <option value="Fabric or defect problem">Fabric or defect problem</option>
                                    <option value="Changed mind">Changed mind</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Additional Details</label>
                                <textarea
                                    rows="3"
                                    value={returnDetails}
                                    onChange={e => setReturnDetails(e.target.value)}
                                    placeholder="Please describe why this item is being returned..."
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setReturnModalItem(null)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
                                <button type="submit" disabled={returnLoading} className="px-5 py-2 bg-secondary text-dominant rounded-xl text-sm font-bold">
                                    {returnLoading ? 'Submitting...' : 'Submit Return'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
