import { startTransition, useState, useEffect, useEffectEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, LogOut, Trash2, Image as ImageIcon, Edit, Package, MapPin } from 'lucide-react';
import { createProduct as createProductRequest } from '../services/ProductService';
import api from '../services/Axios';

const defaultStats = [
  { title: 'Products', value: '—', icon: ShoppingBag, accent: 'bg-secondary text-dominant' },
  { title: 'Orders', value: '—', icon: Package, accent: 'bg-accent text-dominant' },
  { title: 'Users', value: '—', icon: Users, accent: 'bg-green-600 text-white' },
];

const SIZES = ['All', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Grey', 'Navy', 'Blue', 'Teal', 'Green', 'Olive', 'Yellow', 'Orange', 'Red', 'Maroon', 'Pink', 'Purple', 'Brown'];
const CATEGORIES = ['Shirt', 'T-Shirt', 'Pants', 'Shorts', 'Coats', 'Hoodie', 'Jacket', 'Sweater', 'Dress', 'Skirt', 'Activewear', 'Accessories'];
const GENDERS = ['Mens', 'Womens', 'Kids', 'Unisex'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'products', 'orders'
  const [stats, setStats] = useState(defaultStats);
  
  // Data States
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Form States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [productForm, setProductForm] = useState({
    name: '', category_name: CATEGORIES[0], description: '', base_price: '', gender: 'Unisex'
  });
  
  const [variants, setVariants] = useState([
    { size: 'M', color: 'Black', stock_quantity: '10', price_override: '', images: [] }
  ]);

  const fetchOverview = async () => {
    try {
      const overviewRes = await api.get('/admin/overview');
      setStats([
        { title: 'Products', value: overviewRes.data.products.toString(), icon: ShoppingBag, accent: 'bg-secondary text-dominant' },
        { title: 'Orders', value: overviewRes.data.orders.toString(), icon: Package, accent: 'bg-accent text-dominant' },
        { title: 'Users', value: overviewRes.data.users.toString(), icon: Users, accent: 'bg-green-600 text-white' },
      ]);
    } catch (error) {
      console.error('Could not fetch admin data', error);
    }
  };

  const fetchProducts = async () => {
    startTransition(() => setDataLoading(true));
    try {
      const response = await api.get('/admin/products');
      setProductsList(response.data || []);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchOrders = async () => {
    startTransition(() => setDataLoading(true));
    try {
      const response = await api.get('/admin/orders');
      setOrdersList(response.data || []);
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setDataLoading(false);
    }
  };

  const refreshOverview = useEffectEvent(() => fetchOverview());
  const loadActiveTab = useEffectEvent(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
  });

  useEffect(() => {
    Promise.resolve().then(refreshOverview);
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadActiveTab);
  }, [activeTab]);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts(); // Refresh list
      fetchOverview(); // Refresh stats
      alert('Product deleted successfully');
    } catch (error) {
      alert(error.response?.data?.error || 'Cannot delete product (orders might be attached).');
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${editingProduct.id}`, editForm);
      setEditingProduct(null);
      fetchProducts();
      alert('Product updated successfully');
    } catch {
      alert('Error updating product.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
    window.location.reload();
  };

  // --- Form Handlers for Create Product ---
  const handleInputChange = (e) => setProductForm({ ...productForm, [e.target.name]: e.target.value });
  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };
  const handleVariantImagesChange = (index, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      setFormError(`Max 5 images per variant. You selected ${files.length}.`);
      e.target.value = ''; return;
    }
    setFormError('');
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, images: files } : v));
  };
  const addVariant = () => setVariants((prev) => [...prev, { size: 'L', color: 'White', stock_quantity: '10', price_override: '', images: [] }]);
  const removeVariant = (index) => variants.length > 1 && setVariants((prev) => prev.filter((_, i) => i !== index));

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true); setFormError(''); setFormMessage('');

    if (variants.some(v => v.images.length === 0)) {
        setFormError('Please select at least 1 image for every variant.');
        setFormLoading(false); return;
    }

    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('category_name', productForm.category_name);
      formData.append('description', productForm.description);
      formData.append('base_price', productForm.base_price);
      formData.append('gender', productForm.gender);
      
      const normalizedVariants = variants.map((variant, index) => ({
        sku: `${productForm.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString().slice(-4)}-${index + 1}`,
        size: variant.size, color: variant.color,
        stock_quantity: Number(variant.stock_quantity || 10),
        price_override: variant.price_override ? Number(variant.price_override) : null
      }));
      
      formData.append('variants', JSON.stringify(normalizedVariants));
      formData.append('variantImageCounts', JSON.stringify(variants.map((v) => v.images.length)));

      variants.forEach((v) => v.images.forEach((img) => formData.append('images', img)));

      await createProductRequest(formData);
      setFormMessage('Product created successfully.');
      setProductForm({ name: '', category_name: CATEGORIES[0], description: '', base_price: '', gender: 'Unisex' });
      setVariants([{ size: 'M', color: 'Black', stock_quantity: '10', price_override: '', images: [] }]);
      fetchOverview();
      setTimeout(() => setShowCreateForm(false), 2000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create product.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-dominant py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Admin Panel</p>
            <h1 className="text-3xl font-black text-secondary">Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
            <LogOut size={18} /> Sign out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-4 border-b border-secondary/10 pb-4">
          <button onClick={() => setActiveTab('overview')} className={`font-semibold pb-2 ${activeTab === 'overview' ? 'border-b-2 border-accent text-accent' : 'text-secondary/60'}`}>Overview & Create</button>
          <button onClick={() => setActiveTab('products')} className={`font-semibold pb-2 ${activeTab === 'products' ? 'border-b-2 border-accent text-accent' : 'text-secondary/60'}`}>Manage Products</button>
          <button onClick={() => setActiveTab('orders')} className={`font-semibold pb-2 ${activeTab === 'orders' ? 'border-b-2 border-accent text-accent' : 'text-secondary/60'}`}>View Orders</button>
        </div>

        {/* --- TAB 1: OVERVIEW & CREATE --- */}
        {activeTab === 'overview' && (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6 shadow-sm">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.accent}`}><Icon size={20} /></div>
                    <p className="text-sm font-semibold text-secondary/60">{item.title}</p>
                    <p className="mt-2 text-3xl font-black text-secondary">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <button onClick={() => setShowCreateForm((prev) => !prev)} className="w-full md:w-auto rounded-lg bg-secondary px-6 py-3 font-semibold text-dominant transition hover:bg-accent">
                {showCreateForm ? 'Hide Product Form' : '+ Add New Product'}
              </button>
            </div>

            {/* Create Product Form (Existing code) */}
            {showCreateForm && (
              <div className="mt-8 rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm">
                 <h2 className="text-2xl font-bold text-secondary mb-6">Create New Product</h2>
                {formMessage && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{formMessage}</div>}
                {formError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>}
                <form onSubmit={handleCreateProduct} className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-secondary/70">Product Name</label>
                    <input name="name" value={productForm.name} onChange={handleInputChange} required className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-secondary/70">Category (Type)</label>
                    <select name="category_name" value={productForm.category_name} onChange={handleInputChange} required className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3">
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-secondary/70">Gender</label>
                    <select name="gender" value={productForm.gender} onChange={handleInputChange} className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3">
                      {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-secondary/70">Description</label>
                    <textarea name="description" value={productForm.description} onChange={handleInputChange} rows="3" className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-secondary/70">Base Price</label>
                    <input type="number" min="0" step="0.01" name="base_price" value={productForm.base_price} onChange={handleInputChange} required className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3" />
                  </div>
                  <div className="md:col-span-2 mt-4">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-secondary">Variants</h3>
                    <button type="button" onClick={addVariant} className="text-sm font-semibold text-secondary">+ Add Variant</button></div>
                    <div className="mt-4 space-y-4">
                      {variants.map((variant, index) => (
                        <div key={index} className="rounded-xl border border-secondary/10 bg-secondary/5 p-4">
                          <div className="flex justify-between">
                            <p className="font-semibold text-secondary">Variant {index + 1}</p>
                            <button type="button" onClick={() => removeVariant(index)} className="text-red-500 text-sm"><Trash2 size={16}/></button>
                          </div>
                          <div className="mt-3 grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="text-sm font-semibold">Size</label>
                              <select value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} className="w-full rounded-lg bg-white px-4 py-2 mt-1">
                                {SIZES.map(s => <option key={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-semibold">Color</label>
                              <select value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} className="w-full rounded-lg bg-white px-4 py-2 mt-1">
                                {COLORS.map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-semibold">Stock Qty</label>
                              <input type="number" min="0" value={variant.stock_quantity} onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)} className="w-full rounded-lg bg-white px-4 py-2 mt-1" />
                            </div>
                            <div>
                              <label className="text-sm font-semibold">Price Override</label>
                              <input type="number" min="0" value={variant.price_override} onChange={(e) => handleVariantChange(index, 'price_override', e.target.value)} className="w-full rounded-lg bg-white px-4 py-2 mt-1" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-sm font-semibold">Images (Max 5)</label>
                              <input type="file" multiple accept="image/*" onChange={(e) => handleVariantImagesChange(index, e)} className="w-full rounded-lg bg-white px-4 py-2 mt-1" />
                              {variant.images.length > 0 && <p className="text-xs text-green-600 mt-2">{variant.images.length} images selected.</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 mt-4">
                    <button type="submit" disabled={formLoading} className="w-full md:w-auto rounded-lg bg-secondary px-6 py-4 font-semibold text-dominant text-white">
                      {formLoading ? 'Submitting...' : 'Submit Product'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* --- TAB 2: MANAGE PRODUCTS --- */}
        {activeTab === 'products' && (
          <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-2xl font-bold text-secondary mb-6">Manage Products</h2>
            {dataLoading ? <p>Loading products...</p> : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-secondary/10 text-secondary/60">
                    <th className="p-3">Image</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Product details</th>
                    <th className="p-3">Variants / stock</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsList.map(prod => (
                    <tr key={prod.id} className="border-b border-secondary/5 hover:bg-secondary/5">
                      <td className="p-3">
                        {prod.main_image ? <img src={prod.main_image} alt="prod" className="w-12 h-12 object-cover rounded" /> : <ImageIcon className="text-secondary/30"/>}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold">{prod.name}</p>
                        <p className="max-w-xs text-sm text-secondary/60">{prod.description}</p>
                        <p className="mt-1 text-xs text-secondary/60">{prod.category_name} · {prod.gender}</p>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="min-w-48 space-y-1">
                          {(prod.variants || []).map(variant => (
                            <p key={variant.id}>{variant.color} / {variant.size}: {variant.stock_quantity} in stock</p>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">${prod.base_price}</td>
                      <td className="p-3 flex gap-3">
                        <button aria-label={`Edit ${prod.name}`} onClick={() => { setEditingProduct(prod); setEditForm({name: prod.name, category_name: prod.category_name || '', gender: prod.gender || 'Unisex', base_price: prod.base_price, description: prod.description || ''}); }} className="text-blue-500 hover:text-blue-700 p-2"><Edit size={18}/></button>
                        <button onClick={() => handleDeleteProduct(prod.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Quick Edit Modal Placeholder */}
            {editingProduct && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">Edit Product Info</h3>
                  <form onSubmit={handleUpdateProduct} className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold">Name</label>
                      <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Base Price</label>
                      <input type="number" min="0" step="0.01" value={editForm.base_price} onChange={e => setEditForm({...editForm, base_price: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Category</label>
                      <input value={editForm.category_name} onChange={e => setEditForm({...editForm, category_name: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Gender</label>
                      <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full border rounded-lg p-2 mt-1">
                        {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Description</label>
                      <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows="3" className="w-full border rounded-lg p-2 mt-1" />
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button type="submit" className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold">Save Changes</button>
                      <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 rounded-lg border font-semibold">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: VIEW ORDERS --- */}
        {activeTab === 'orders' && (
          <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm overflow-x-auto">
            <h2 className="text-2xl font-bold text-secondary mb-2">Customer Orders</h2>
            <p className="text-sm text-secondary/60 mb-6">Review orders and shipping addresses for fulfillment.</p>

            {dataLoading ? <p>Loading orders...</p> : (
              ordersList.length === 0 ? <p className="text-secondary/60">No orders found.</p> :
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-secondary/10 text-secondary/60">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer Info</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Shipping Address</th>
                    <th className="p-3">Total Paid</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersList.map(order => (
                    <tr key={order.id} className="border-b border-secondary/5 hover:bg-secondary/5">
                      <td className="p-3 font-semibold">#{order.id}</td>
                      <td className="p-3">
                        <p className="font-semibold">{order.user_name || 'User'}</p>
                        <p className="text-sm text-secondary/60">{order.email}</p>
                        <p className="text-xs text-secondary/50">Customer #{order.user_id}</p>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="min-w-48 space-y-2">
                          {(order.items || []).map((item, index) => (
                            <div key={`${item.variant_id}-${index}`}>
                              <p className="font-semibold">{item.product_name} x {item.quantity}</p>
                              <p className="text-secondary/60">{item.color} / {item.size} · SKU {item.sku}</p>
                              <p className="text-secondary/60">${item.price_at_purchase} each</p>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-start gap-2 max-w-xs">
                          <MapPin size={16} className="text-accent mt-1 flex-shrink-0"/>
                          <span className="text-sm">{order.shipping_address}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold">${order.total_amount}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;