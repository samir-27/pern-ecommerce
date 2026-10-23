import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Package, DollarSign, AlertTriangle, Sparkles,
    Trash2, Edit, Truck, Store, ExternalLink, Loader2, ArrowUpRight
} from 'lucide-react';
import api from '../services/Axios';
import { formatCurrency } from '../services/Currency';

const CATEGORIES = ['Shirt', 'T-Shirt', 'Pants', 'Shorts', 'Coats', 'Hoodie', 'Jacket', 'Sweater', 'Dress', 'Skirt', 'Activewear', 'Accessories'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Grey', 'Navy', 'Blue', 'Teal', 'Green', 'Olive', 'Yellow', 'Orange', 'Red', 'Maroon', 'Pink', 'Purple', 'Brown'];
const GENDERS = ['Mens', 'Womens', 'Kids', 'Unisex'];

const SellerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, products, orders, inventory, payouts, store

    // Data States
    const [overview, setOverview] = useState(null);
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [payouts, setPayouts] = useState({ payouts: [], availableBalance: 0, lifetimeEarnings: 0, totalPaid: 0 });
    const [loading, setLoading] = useState(true);

    // Create Product Form State
    const [showCreateProduct, setShowCreateProduct] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '',
        category_name: CATEGORIES[0],
        gender: 'Unisex',
        base_price: '',
        brand: '',
        fabric_material: '',
        fit: 'Regular Fit',
        season: 'All Season',
        care_instructions: '',
        description: ''
    });
    const [variants, setVariants] = useState([
        { size: 'M', color: 'Black', stock_quantity: '10', price_override: '', compare_at_price: '', images: [] }
    ]);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);

    // Edit Product State
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Fulfillment State
    const [fulfillingOrder, setFulfillingOrder] = useState(null);
    const [fulfillmentForm, setFulfillmentForm] = useState({ trackingNumber: '', shippingCarrier: 'BlueDart', status: 'shipped' });

    // Payout Request State
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutNotes, setPayoutNotes] = useState('');

    // Fetch dashboard core data
    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                const [overviewRes, storeRes] = await Promise.all([
                    api.get('/seller/overview'),
                    api.get('/seller/store')
                ]);
                setOverview(overviewRes.data);
                setStore(storeRes.data);
            } catch (err) {
                if (err.response?.status === 403) {
                    navigate('/seller/apply');
                }
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, [navigate]);

    // Tab-specific data loading
    useEffect(() => {
        const loadTabData = async () => {
            try {
                if (activeTab === 'products') {
                    const res = await api.get('/seller/products');
                    setProducts(res.data || []);
                } else if (activeTab === 'orders') {
                    const res = await api.get('/seller/orders');
                    setOrders(res.data || []);
                } else if (activeTab === 'inventory') {
                    const res = await api.get('/ai/inventory-forecast');
                    setForecast(res.data.forecast || []);
                } else if (activeTab === 'payouts') {
                    const res = await api.get('/seller/payouts');
                    setPayouts(res.data);
                }
            } catch (err) {
                console.error(`Error loading ${activeTab}:`, err);
            }
        };
        loadTabData();
    }, [activeTab]);

    // AI Product Assistant Trigger
    const handleGenerateAICopy = async () => {
        if (!productForm.name) {
            setFormError('Please enter at least a product name before asking the AI Stylist.');
            return;
        }

        setAiGenerating(true);
        setFormError('');

        try {
            const res = await api.post('/ai/product-assistant', {
                name: productForm.name,
                category: productForm.category_name,
                gender: productForm.gender,
                fabric: productForm.fabric_material,
                fit: productForm.fit,
                season: productForm.season
            });

            if (res.data) {
                setProductForm(prev => ({
                    ...prev,
                    name: res.data.suggestedTitle || prev.name,
                    description: res.data.suggestedDescription || prev.description,
                    care_instructions: res.data.careInstructions || prev.care_instructions,
                    category_name: res.data.suggestedCategory || prev.category_name
                }));
            }
        } catch (err) {
            setFormError(err.response?.data?.error || 'AI copy generation failed.');
        } finally {
            setAiGenerating(false);
        }
    };

    // Create Product Submit
    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        setFormSuccess('');

        try {
            const formData = new FormData();
            formData.append('name', productForm.name);
            formData.append('category_name', productForm.category_name);
            formData.append('description', productForm.description);
            formData.append('base_price', productForm.base_price);
            formData.append('gender', productForm.gender);
            formData.append('brand', productForm.brand || store?.name || '');
            formData.append('fabric_material', productForm.fabric_material);
            formData.append('fit', productForm.fit);
            formData.append('season', productForm.season);
            formData.append('care_instructions', productForm.care_instructions);

            const normalizedVariants = variants.map((v, i) => ({
                sku: `${productForm.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString().slice(-4)}-${i + 1}`,
                size: v.size,
                color: v.color,
                stock_quantity: Number(v.stock_quantity || 10),
                price_override: v.price_override ? Number(v.price_override) : null,
                compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null
            }));

            formData.append('variants', JSON.stringify(normalizedVariants));
            formData.append('variantImageCounts', JSON.stringify(variants.map(v => v.images.length)));
            variants.forEach(v => v.images.forEach(img => formData.append('images', img)));

            const res = await api.post('/products', formData);
            setFormSuccess(res.data.message || 'Product created successfully.');

            // Refresh products
            const prodRes = await api.get('/seller/products');
            setProducts(prodRes.data || []);

            setTimeout(() => {
                setShowCreateProduct(false);
                setFormSuccess('');
            }, 1800);

        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to create product.');
        } finally {
            setFormLoading(false);
        }
    };

    // Update fulfillment tracking
    const handleUpdateFulfillment = async (e) => {
        e.preventDefault();
        if (!fulfillingOrder) return;

        try {
            await api.put(`/seller/orders/${fulfillingOrder.id}/fulfill`, fulfillmentForm);
            setFulfillingOrder(null);
            const res = await api.get('/seller/orders');
            setOrders(res.data || []);
            alert('Fulfillment tracking updated successfully.');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update fulfillment.');
        }
    };

    // Request Payout
    const handleRequestPayout = async (e) => {
        e.preventDefault();
        try {
            await api.post('/seller/payouts/request', {
                amount: Number(payoutAmount),
                notes: payoutNotes
            });
            setShowPayoutModal(false);
            setPayoutAmount('');
            const res = await api.get('/seller/payouts');
            setPayouts(res.data);
            alert('Payout request submitted to Super Admin.');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to request payout.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] py-8 max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest">
                        <Store size={16} /> Seller Hub
                    </div>
                    <h1 className="text-3xl font-black text-secondary mt-1">{store?.name || 'Seller Dashboard'}</h1>
                </div>

                <div className="flex items-center gap-3">
                    {store?.slug && (
                        <a
                            href={`/stores/${store.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-secondary/15 text-sm font-semibold text-secondary hover:bg-secondary/5 transition"
                        >
                            View Public Storefront <ExternalLink size={16} />
                        </a>
                    )}
                    <button
                        onClick={() => setShowCreateProduct(true)}
                        className="px-5 py-2.5 bg-accent text-dominant font-bold text-sm rounded-xl hover:bg-secondary transition flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                        + Create Product
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-secondary/10 pb-2 mb-8 overflow-x-auto text-sm">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 font-bold rounded-lg transition ${activeTab === 'overview' ? 'bg-secondary text-dominant' : 'text-secondary/60 hover:text-secondary'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 font-bold rounded-lg transition ${activeTab === 'products' ? 'bg-secondary text-dominant' : 'text-secondary/60 hover:text-secondary'}`}
                >
                    Products ({products.length || overview?.totalProducts || 0})
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 font-bold rounded-lg transition ${activeTab === 'orders' ? 'bg-secondary text-dominant' : 'text-secondary/60 hover:text-secondary'}`}
                >
                    Orders & Fulfillment ({overview?.pendingFulfillment || 0} pending)
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-4 py-2 font-bold rounded-lg transition flex items-center gap-1.5 ${activeTab === 'inventory' ? 'bg-secondary text-dominant' : 'text-secondary/60 hover:text-secondary'}`}
                >
                    <Sparkles size={15} /> AI Inventory Forecast
                </button>
                <button
                    onClick={() => setActiveTab('payouts')}
                    className={`px-4 py-2 font-bold rounded-lg transition ${activeTab === 'payouts' ? 'bg-secondary text-dominant' : 'text-secondary/60 hover:text-secondary'}`}
                >
                    Payouts & Earnings
                </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 rounded-2xl border border-secondary/10 bg-secondary/5">
                            <div className="w-10 h-10 rounded-xl bg-green-500/15 text-green-600 flex items-center justify-center mb-3">
                                <DollarSign size={20} />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Net Earnings</p>
                            <h3 className="text-2xl font-black text-secondary mt-1">{formatCurrency(overview?.totalEarnings || 0)}</h3>
                        </div>

                        <div className="p-6 rounded-2xl border border-secondary/10 bg-secondary/5">
                            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-3">
                                <Package size={20} />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Assigned Orders</p>
                            <h3 className="text-2xl font-black text-secondary mt-1">{overview?.totalOrders || 0}</h3>
                        </div>

                        <div className="p-6 rounded-2xl border border-secondary/10 bg-secondary/5">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 text-yellow-600 flex items-center justify-center mb-3">
                                <Truck size={20} />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Pending Fulfillment</p>
                            <h3 className="text-2xl font-black text-secondary mt-1">{overview?.pendingFulfillment || 0}</h3>
                        </div>

                        <div className="p-6 rounded-2xl border border-secondary/10 bg-secondary/5">
                            <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center mb-3">
                                <AlertTriangle size={20} />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Low Stock Variants</p>
                            <h3 className="text-2xl font-black text-secondary mt-1">{overview?.lowStockCount || 0}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl border border-secondary/10 bg-dominant">
                            <h3 className="text-lg font-bold text-secondary mb-2">Store Profile Snapshot</h3>
                            <p className="text-sm text-secondary/70 mb-4">{store?.bio || 'No bio specified. Visit Store settings to update your brand story.'}</p>
                            <div className="text-xs space-y-2 text-secondary/60 border-t border-secondary/10 pt-4">
                                <p><span className="font-semibold text-secondary">Store Slug:</span> /stores/{store?.slug}</p>
                                <p><span className="font-semibold text-secondary">Platform Commission:</span> {store?.commission_rate || 10}%</p>
                                <p><span className="font-semibold text-secondary">Account Status:</span> {store?.is_active ? 'Active & Approved' : 'Suspended'}</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-secondary/10 bg-dominant">
                            <h3 className="text-lg font-bold text-secondary mb-2">Quick Actions</h3>
                            <div className="space-y-3 mt-4">
                                <button
                                    onClick={() => setShowCreateProduct(true)}
                                    className="w-full text-left p-3 rounded-xl bg-secondary/5 hover:bg-secondary/10 transition text-sm font-semibold flex items-center justify-between"
                                >
                                    <span>Add clothing listing with AI Assistant</span>
                                    <Sparkles size={16} className="text-accent" />
                                </button>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className="w-full text-left p-3 rounded-xl bg-secondary/5 hover:bg-secondary/10 transition text-sm font-semibold flex items-center justify-between"
                                >
                                    <span>Print packing slips & add tracking</span>
                                    <Truck size={16} className="text-secondary/60" />
                                </button>
                                <button
                                    onClick={() => setActiveTab('payouts')}
                                    className="w-full text-left p-3 rounded-xl bg-secondary/5 hover:bg-secondary/10 transition text-sm font-semibold flex items-center justify-between"
                                >
                                    <span>Request payout balance</span>
                                    <ArrowUpRight size={16} className="text-green-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: PRODUCTS */}
            {activeTab === 'products' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-secondary">My Product Catalog</h2>
                        <button onClick={() => setShowCreateProduct(true)} className="px-4 py-2 bg-secondary text-dominant text-sm font-bold rounded-lg hover:bg-accent transition">
                            + Add Product
                        </button>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-12 text-secondary/60">
                            <p className="text-base font-semibold">No products created yet.</p>
                            <p className="text-xs mt-1">Add your first fashion listing using our AI-assisted copywriter.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4">Image</th>
                                    <th className="py-3 px-4">Title & Details</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Variants / Stock</th>
                                    <th className="py-3 px-4">Base Price</th>
                                    <th className="py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(prod => (
                                    <tr key={prod.id} className="border-b border-secondary/5 hover:bg-secondary/5 transition">
                                        <td className="py-3 px-4">
                                            <div className="w-12 h-14 rounded-lg bg-secondary/10 overflow-hidden">
                                                {prod.main_image ? (
                                                    <img src={prod.main_image} alt={prod.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-secondary/40"><ShoppingBag size={18} /></div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-secondary">{prod.name}</p>
                                            <p className="text-xs text-secondary/60">{prod.category_name} · {prod.gender} · {prod.brand || 'Store Brand'}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                prod.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                prod.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {prod.status === 'approved' ? 'Active' : prod.status === 'pending_approval' ? 'Pending Approval' : prod.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="space-y-1">
                                                {(prod.variants || []).map(v => (
                                                    <p key={v.id} className="text-xs text-secondary/70">
                                                        {v.color} / {v.size}: <span className={v.stock_quantity <= 3 ? 'text-red-500 font-bold' : 'font-semibold'}>{v.stock_quantity} in stock</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-secondary">{formatCurrency(prod.base_price)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingProduct(prod);
                                                        setEditForm({ name: prod.name, base_price: prod.base_price, category_name: prod.category_name, description: prod.description });
                                                    }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to delete this listing?')) {
                                                            await api.delete(`/products/${prod.id}`);
                                                            setProducts(prev => prev.filter(p => p.id !== prod.id));
                                                        }
                                                    }}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB: ORDERS & FULFILLMENT */}
            {activeTab === 'orders' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    <h2 className="text-xl font-bold text-secondary mb-4">Assigned Fulfillment Orders</h2>
                    <p className="text-xs text-secondary/60 mb-6">Fulfill only the items assigned to your store. Add carrier tracking numbers once shipped.</p>

                    {orders.length === 0 ? (
                        <div className="text-center py-12 text-secondary/60">
                            <p className="text-base font-semibold">No assigned orders yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4">Order ID</th>
                                    <th className="py-3 px-4">Customer Details</th>
                                    <th className="py-3 px-4">Store Items</th>
                                    <th className="py-3 px-4">Net Earnings</th>
                                    <th className="py-3 px-4">Status & Tracking</th>
                                    <th className="py-3 px-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="border-b border-secondary/5 hover:bg-secondary/5 transition">
                                        <td className="py-3 px-4 font-bold text-secondary">#{order.id}</td>
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-secondary">{order.customer_name}</p>
                                            <p className="text-xs text-secondary/60 max-w-xs">{order.shipping_address}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="space-y-1">
                                                {(order.items || []).map((item, idx) => (
                                                    <p key={idx} className="text-xs text-secondary/80">
                                                        <span className="font-bold">{item.product_name}</span> ({item.color} / {item.size}) x {item.quantity}
                                                    </p>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-green-600">{formatCurrency(order.seller_net_earnings)}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                            {order.tracking_number && (
                                                <p className="text-xs text-secondary/60 mt-1">{order.shipping_carrier}: {order.tracking_number}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => {
                                                    setFulfillingOrder(order);
                                                    setFulfillmentForm({
                                                        trackingNumber: order.tracking_number || '',
                                                        shippingCarrier: order.shipping_carrier || 'BlueDart',
                                                        status: order.status || 'shipped'
                                                    });
                                                }}
                                                className="px-3 py-1.5 bg-secondary text-dominant rounded-lg text-xs font-semibold hover:bg-accent transition"
                                            >
                                                Update Tracking
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB: AI INVENTORY FORECAST */}
            {activeTab === 'inventory' && (
                <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={20} className="text-accent" />
                        <h2 className="text-xl font-bold text-secondary">AI Fashion Inventory Forecasting</h2>
                    </div>
                    <p className="text-xs text-secondary/60 mb-6">Estimates inventory runway, flags imminent stockouts, and recommends restocking quantities based on 30-day velocity.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {forecast.map(item => (
                            <div key={item.variantId} className={`p-4 rounded-xl border ${
                                item.riskLevel === 'Critical' ? 'border-red-300 bg-red-50/50' :
                                item.riskLevel === 'Moderate' ? 'border-yellow-300 bg-yellow-50/50' : 'border-secondary/10 bg-secondary/5'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-secondary text-sm">{item.productName}</h4>
                                        <p className="text-xs text-secondary/60">{item.color} / Size {item.size} · SKU: {item.sku}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        item.riskLevel === 'Critical' ? 'bg-red-200 text-red-800' :
                                        item.riskLevel === 'Moderate' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {item.riskLevel} Risk
                                    </span>
                                </div>
                                <div className="mt-3 text-xs space-y-1 text-secondary/70">
                                    <p><span className="font-semibold text-secondary">Current Stock:</span> {item.currentStock} units</p>
                                    <p><span className="font-semibold text-secondary">Estimated Runway:</span> ~{item.estimatedDaysOfRunway} days</p>
                                    {item.suggestedReorderQuantity > 0 && (
                                        <p className="text-red-700 font-bold mt-2">Suggested Reorder: +{item.suggestedReorderQuantity} units</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: PAYOUTS */}
            {activeTab === 'payouts' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl border border-secondary/10 bg-secondary/5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Available For Withdrawal</p>
                            <h3 className="text-3xl font-black text-secondary mt-1">{formatCurrency(payouts.availableBalance || 0)}</h3>
                            <button
                                onClick={() => setShowPayoutModal(true)}
                                disabled={payouts.availableBalance < 100}
                                className="mt-4 px-4 py-2 bg-secondary text-dominant text-xs font-bold rounded-lg hover:bg-accent disabled:opacity-40 transition"
                            >
                                Request Payout
                            </button>
                        </div>

                        <div className="p-6 rounded-2xl border border-secondary/10 bg-secondary/5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Total Paid Out</p>
                            <h3 className="text-3xl font-black text-secondary mt-1">{formatCurrency(payouts.totalPaid || 0)}</h3>
                        </div>

                        <div className="p-6 rounded-2xl border border-secondary/10 bg-secondary/5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">Lifetime Earnings</p>
                            <h3 className="text-3xl font-black text-secondary mt-1">{formatCurrency(payouts.lifetimeEarnings || 0)}</h3>
                        </div>
                    </div>

                    <div className="bg-dominant border border-secondary/10 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-secondary mb-4">Payout Transaction History</h3>
                        {payouts.payouts?.length === 0 ? (
                            <p className="text-sm text-secondary/60">No payout records yet.</p>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-secondary/10 text-secondary/60 text-xs uppercase">
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Amount</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Reference ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.payouts.map(p => (
                                        <tr key={p.id} className="border-b border-secondary/5">
                                            <td className="py-3 px-4">{new Date(p.created_at).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 font-bold text-secondary">{formatCurrency(p.amount)}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-secondary/60">{p.reference_id || 'Pending reconciliation'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: CREATE PRODUCT */}
            {showCreateProduct && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-dominant border border-secondary/15 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-secondary">Create Clothing Listing</h3>
                                <p className="text-xs text-secondary/60">Add variants, stock, and let AI generate compelling fashion copy.</p>
                            </div>
                            <button onClick={() => setShowCreateProduct(false)} className="text-secondary/60 hover:text-secondary font-bold">✕</button>
                        </div>

                        {formError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs">{formError}</div>}
                        {formSuccess && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-xs">{formSuccess}</div>}

                        <form onSubmit={handleCreateProduct} className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-secondary uppercase">Product Title *</label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateAICopy}
                                        disabled={aiGenerating}
                                        className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Sparkles size={14} /> {aiGenerating ? 'Stylist writing...' : 'AI Enhance Copy'}
                                    </button>
                                </div>
                                <input
                                    required
                                    value={productForm.name}
                                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                    placeholder="e.g. Minimalist Cotton Boxy Tee"
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm text-secondary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-secondary uppercase block mb-1">Category *</label>
                                    <select
                                        value={productForm.category_name}
                                        onChange={e => setProductForm({ ...productForm, category_name: e.target.value })}
                                        className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm text-secondary"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-secondary uppercase block mb-1">Gender *</label>
                                    <select
                                        value={productForm.gender}
                                        onChange={e => setProductForm({ ...productForm, gender: e.target.value })}
                                        className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm text-secondary"
                                    >
                                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-secondary uppercase block mb-1">Base Price (₹) *</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={productForm.base_price}
                                        onChange={e => setProductForm({ ...productForm, base_price: e.target.value })}
                                        placeholder="999.00"
                                        className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm text-secondary"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-secondary uppercase block mb-1">Fabric & Material</label>
                                    <input
                                        value={productForm.fabric_material}
                                        onChange={e => setProductForm({ ...productForm, fabric_material: e.target.value })}
                                        placeholder="e.g. 100% Combed Organic Cotton"
                                        className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm text-secondary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={productForm.description}
                                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                    placeholder="Product silhouette, styling notes, and occasions..."
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm text-secondary"
                                />
                            </div>

                            {/* Variants Section */}
                            <div className="border-t border-secondary/10 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-secondary">Size & Color Variants</h4>
                                    <button
                                        type="button"
                                        onClick={() => setVariants([...variants, { size: 'L', color: 'White', stock_quantity: '10', price_override: '', compare_at_price: '', images: [] }])}
                                        className="text-xs font-bold text-accent hover:underline"
                                    >
                                        + Add Variant
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {variants.map((v, i) => (
                                        <div key={i} className="p-3 bg-secondary/5 rounded-xl border border-secondary/10 grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-secondary/60">Size</label>
                                                <select
                                                    value={v.size}
                                                    onChange={e => {
                                                        const updated = [...variants];
                                                        updated[i].size = e.target.value;
                                                        setVariants(updated);
                                                    }}
                                                    className="w-full p-2 bg-dominant border border-secondary/15 rounded-lg text-xs"
                                                >
                                                    {SIZES.map(s => <option key={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-secondary/60">Color</label>
                                                <select
                                                    value={v.color}
                                                    onChange={e => {
                                                        const updated = [...variants];
                                                        updated[i].color = e.target.value;
                                                        setVariants(updated);
                                                    }}
                                                    className="w-full p-2 bg-dominant border border-secondary/15 rounded-lg text-xs"
                                                >
                                                    {COLORS.map(c => <option key={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-secondary/60">Stock</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={v.stock_quantity}
                                                    onChange={e => {
                                                        const updated = [...variants];
                                                        updated[i].stock_quantity = e.target.value;
                                                        setVariants(updated);
                                                    }}
                                                    className="w-full p-2 bg-dominant border border-secondary/15 rounded-lg text-xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-secondary/60">Photos</label>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={e => {
                                                        const updated = [...variants];
                                                        updated[i].images = Array.from(e.target.files || []);
                                                        setVariants(updated);
                                                    }}
                                                    className="w-full text-[10px]"
                                                />
                                            </div>

                                            <div className="flex justify-end pt-3">
                                                {variants.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-secondary/10">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateProduct(false)}
                                    className="px-5 py-2.5 rounded-xl border border-secondary/20 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-6 py-2.5 bg-secondary text-dominant rounded-xl text-sm font-bold hover:bg-accent transition"
                                >
                                    {formLoading ? 'Submitting Listing...' : 'Publish Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT PRODUCT */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-dominant border border-secondary/15 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-secondary mb-4">Edit Product Listing</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await api.put(`/products/${editingProduct.id}`, editForm);
                                setEditingProduct(null);
                                const res = await api.get('/seller/products');
                                setProducts(res.data || []);
                                alert('Product updated successfully.');
                            } catch {
                                alert('Failed to update product.');
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Product Name</label>
                                <input
                                    required
                                    value={editForm.name || ''}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-2.5 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Base Price (₹)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.base_price || ''}
                                    onChange={e => setEditForm({ ...editForm, base_price: e.target.value })}
                                    className="w-full p-2.5 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={editForm.description || ''}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full p-2.5 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-secondary text-dominant rounded-xl text-sm font-bold">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: UPDATE FULFILLMENT */}
            {fulfillingOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-dominant border border-secondary/15 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-secondary mb-4">Update Order #{fulfillingOrder.id} Fulfillment</h3>
                        <form onSubmit={handleUpdateFulfillment} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Shipping Carrier</label>
                                <input
                                    value={fulfillmentForm.shippingCarrier}
                                    onChange={e => setFulfillmentForm({ ...fulfillmentForm, shippingCarrier: e.target.value })}
                                    placeholder="e.g. BlueDart, FedEx, Delhivery"
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Tracking Number</label>
                                <input
                                    required
                                    value={fulfillmentForm.trackingNumber}
                                    onChange={e => setFulfillmentForm({ ...fulfillmentForm, trackingNumber: e.target.value })}
                                    placeholder="e.g. BD-984729184"
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Status</label>
                                <select
                                    value={fulfillmentForm.status}
                                    onChange={e => setFulfillmentForm({ ...fulfillmentForm, status: e.target.value })}
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                >
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setFulfillingOrder(null)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-secondary text-dominant rounded-xl text-sm font-bold">Save Tracking</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: PAYOUT WITHDRAWAL */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-dominant border border-secondary/15 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-secondary mb-2">Request Payout Withdrawal</h3>
                        <p className="text-xs text-secondary/60 mb-4">Available balance: {formatCurrency(payouts.availableBalance)}</p>
                        <form onSubmit={handleRequestPayout} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Amount (₹)</label>
                                <input
                                    required
                                    type="number"
                                    min="100"
                                    max={payouts.availableBalance}
                                    value={payoutAmount}
                                    onChange={e => setPayoutAmount(e.target.value)}
                                    placeholder="100.00"
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase block mb-1">Bank / Withdrawal Notes</label>
                                <textarea
                                    rows="2"
                                    value={payoutNotes}
                                    onChange={e => setPayoutNotes(e.target.value)}
                                    placeholder="Account number or reference notes..."
                                    className="w-full p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowPayoutModal(false)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-secondary text-dominant rounded-xl text-sm font-bold">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;
