import React, { useEffect, useState } from 'react';
import { User, Package, Key, LogOut, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/Axios';
import { getOrders } from '../services/Order';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);

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
                const [profileResponse, ordersResponse] = await Promise.all([
                    api.get('/auth/profile'),
                    getOrders()
                ]);

                const profileData = profileResponse.data || {};
                setUser(profileData);
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

            setUser(response.data.user || response.data);
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

    const formatDate = (value) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleDateString();
    };

    const getStatusClass = (status = 'pending') => {
        const normalized = status.toLowerCase();
        if (normalized === 'delivered' || normalized === 'completed') {
            return 'bg-green-100 text-green-700';
        }
        if (normalized === 'cancelled' || normalized === 'failed') {
            return 'bg-red-100 text-red-700';
        }
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <div className="bg-dominant min-h-[80vh] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-secondary mb-2">My Account</h1>
                    <p className="text-secondary/60">Manage your personal information and orders.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    <aside className="w-full lg:w-64 shrink-0">
                        <div className="sticky top-24 flex flex-col space-y-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-semibold ${activeTab === 'profile' ? 'bg-secondary text-dominant' : 'text-secondary/70 hover:bg-secondary/5 hover:text-secondary'}`}
                            >
                                <User size={18} /> Personal Details
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-semibold ${activeTab === 'orders' ? 'bg-secondary text-dominant' : 'text-secondary/70 hover:bg-secondary/5 hover:text-secondary'}`}
                            >
                                <Package size={18} /> Order History
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-semibold ${activeTab === 'security' ? 'bg-secondary text-dominant' : 'text-secondary/70 hover:bg-secondary/5 hover:text-secondary'}`}
                            >
                                <Key size={18} /> Password & Security
                            </button>

                            <hr className="my-4 border-secondary/10" />

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 text-red-500 font-semibold hover:bg-red-50 rounded-lg transition-colors text-left"
                            >
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1 max-w-3xl">
                        {error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                {success}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-secondary mb-6">Personal Details</h2>
                                {pageLoading ? (
                                    <div className="flex items-center gap-3 rounded-xl border border-secondary/10 bg-secondary/5 px-4 py-6 text-secondary/70">
                                        <Loader2 className="animate-spin" size={18} />
                                        Loading your profile...
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-secondary/70">First Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.first_name}
                                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                    className="w-full bg-secondary/5 border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-secondary/70">Last Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.last_name}
                                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                    className="w-full bg-secondary/5 border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-secondary/70">Email Address</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-secondary/5 border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors font-medium"
                                            />
                                        </div>
                                        <button disabled={loading} className="px-8 py-3 bg-secondary text-dominant font-bold rounded-lg hover:bg-accent transition-colors flex items-center gap-2">
                                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                                        </button>
                                    </form>
                                )}
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
                                    <button disabled={loading} className="px-8 py-3 bg-secondary text-dominant font-bold rounded-lg hover:bg-accent transition-colors flex items-center gap-2">
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
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div key={order.id} className="border-2 border-secondary/10 rounded-xl p-6 hover:border-secondary/30 transition-colors">
                                                <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                            <h3 className="font-bold text-lg text-secondary">Order #{order.id}</h3>
                                                            <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${getStatusClass(order.status)}`}>
                                                                {order.status || 'pending'}
                                                            </span>
                                                        </div>
                                                        <p className="text-secondary/60 text-sm font-medium">
                                                            Placed on {formatDate(order.created_at)}
                                                        </p>
                                                        {order.shipping_address && (
                                                            <p className="text-secondary/60 text-sm font-medium mt-1">
                                                                {order.shipping_address}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col sm:items-end gap-2">
                                                        <span className="font-black text-xl text-secondary">${Number(order.total_amount || 0).toFixed(2)}</span>
                                                        <span className="text-sm text-secondary/60 font-medium">
                                                            {Array.isArray(order.items) ? `${order.items.length} item${order.items.length > 1 ? 's' : ''}` : 'Items available'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {Array.isArray(order.items) && order.items.length > 0 && (
                                                    <div className="space-y-3 border-t border-secondary/10 pt-4">
                                                        {order.items.map((item, index) => (
                                                            <div key={`${order.id}-${index}`} className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg bg-secondary/5 p-3">
                                                                {item.image_urls?.[0] && (
                                                                    <img src={item.image_urls[0]} alt={item.product_name || 'Order item'} className="h-20 w-20 rounded-lg object-cover" />
                                                                )}
                                                                <div className="flex-1">
                                                                    <p className="font-semibold text-secondary">{item.product_name || 'Product'}</p>
                                                                    <p className="text-sm text-secondary/60">
                                                                        {item.color && `${item.color}`} {item.size && `• ${item.size}`}
                                                                    </p>
                                                                    <p className="text-sm text-secondary/60">Qty: {item.quantity}</p>
                                                                </div>
                                                                <div className="text-sm font-semibold text-secondary">
                                                                    ${Number(item.price_at_purchase || 0).toFixed(2)} each
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
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;