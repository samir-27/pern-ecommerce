import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, PlusCircle, LogOut, Loader2, Trash2 } from 'lucide-react';
import { createProduct as createProductRequest } from '../services/ProductService';

const stats = [
  { title: 'Total Orders', value: '128', icon: ShoppingBag, accent: 'bg-secondary text-dominant' },
  { title: 'Active Users', value: '42', icon: Users, accent: 'bg-accent text-dominant' },
  { title: 'Create Product', value: 'New', icon: PlusCircle, accent: 'bg-green-600 text-white' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    category_name: '',
    description: '',
    base_price: '',
    gender: 'Unisex'
  });
  const [variants, setVariants] = useState([
    { size: 'M', color: 'Black', stock_quantity: '10', price_override: '', images: [] }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
    window.location.reload();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => prev.map((variant, variantIndex) => variantIndex === index ? { ...variant, [field]: value } : variant));
  };

  const handleVariantImagesChange = (index, e) => {
    const files = Array.from(e.target.files || []);
    setVariants((prev) => prev.map((variant, variantIndex) => variantIndex === index ? { ...variant, images: files } : variant));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { size: 'L', color: 'White', stock_quantity: '10', price_override: '', images: [] }]);
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, variantIndex) => variantIndex !== index));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormMessage('');

    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('category_name', productForm.category_name || 'General');
      formData.append('description', productForm.description);
      formData.append('base_price', productForm.base_price);
      formData.append('gender', productForm.gender);
      const normalizedVariants = variants.map((variant, index) => ({
        sku: `${productForm.name.replace(/\s+/g, '-').toLowerCase()}-${index + 1}`,
        size: variant.size,
        color: variant.color,
        stock_quantity: Number(variant.stock_quantity || 10),
        price_override: variant.price_override ? Number(variant.price_override) : null
      }));
      formData.append('variants', JSON.stringify(normalizedVariants));
      formData.append('variantImageCounts', JSON.stringify(variants.map((variant) => variant.images.length)));

      variants.forEach((variant) => {
        variant.images.forEach((imageFile) => {
          formData.append('images', imageFile);
        });
      });

      const response = await createProductRequest(formData);
      setFormMessage(response.message || 'Product created successfully.');
      setProductForm({
        name: '',
        category_name: '',
        description: '',
        base_price: '',
        gender: 'Unisex'
      });
      setVariants([{ size: 'M', color: 'Black', stock_quantity: '10', price_override: '', images: [] }]);
      setShowCreateForm(false);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create product.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-dominant py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Admin Panel</p>
            <h1 className="text-3xl font-black text-secondary">Welcome back, admin</h1>
            <p className="text-secondary/60 mt-2">Manage products, orders, and account activity from one place.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6 shadow-sm">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.accent}`}>
                  <Icon size={20} />
                </div>
                <p className="text-sm font-semibold text-secondary/60">{item.title}</p>
                <p className="mt-2 text-3xl font-black text-secondary">{item.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <LayoutDashboard className="text-accent" size={20} />
              <h2 className="text-xl font-bold text-secondary">Store Overview</h2>
            </div>
            <p className="text-sm leading-7 text-secondary/70">
              The admin dashboard is now connected to the product creation API and supports image uploads through Cloudinary.
            </p>
          </div>

          <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-secondary">Quick Actions</h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="w-full rounded-lg bg-secondary px-4 py-3 text-left font-semibold text-dominant transition hover:bg-accent"
              >
                {showCreateForm ? 'Hide Product Form' : 'Create Product'}
              </button>
              <button className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-left font-semibold text-secondary transition hover:bg-secondary/5">
                Review Orders
              </button>
              <button className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-left font-semibold text-secondary transition hover:bg-secondary/5">
                View Customers
              </button>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="mt-8 rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-secondary">Create New Product</h2>
              <p className="text-sm text-secondary/60">Upload a product image and submit it to the backend.</p>
            </div>

            {formMessage && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {formMessage}
              </div>
            )}

            {formError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-secondary/70">Product Name</label>
                <input name="name" value={productForm.name} onChange={handleInputChange} required className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3 text-secondary" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-secondary/70">Category</label>
                <input name="category_name" value={productForm.category_name} onChange={handleInputChange} required className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3 text-secondary" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-secondary/70">Gender</label>
                <select name="gender" value={productForm.gender} onChange={handleInputChange} className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3 text-secondary">
                  <option value="Unisex">Unisex</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-secondary/70">Description</label>
                <textarea name="description" value={productForm.description} onChange={handleInputChange} rows="3" className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3 text-secondary" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-secondary/70">Base Price</label>
                <input type="number" name="base_price" value={productForm.base_price} onChange={handleInputChange} required className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3 text-secondary" />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-secondary">Variants</h3>
                  <button type="button" onClick={addVariant} className="rounded-lg border border-secondary/10 px-3 py-2 text-sm font-semibold text-secondary hover:bg-secondary/5">
                    + Add Variant
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {variants.map((variant, index) => (
                    <div key={`${variant.color}-${index}`} className="rounded-xl border border-secondary/10 bg-secondary/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-secondary">Variant {index + 1}</p>
                        {variants.length > 1 && (
                          <button type="button" onClick={() => removeVariant(index)} className="flex items-center gap-2 text-sm font-semibold text-red-500">
                            <Trash2 size={16} /> Remove
                          </button>
                        )}
                      </div>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Size</label>
                          <input value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-secondary" />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Color</label>
                          <input value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-secondary" />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Stock Quantity</label>
                          <input type="number" value={variant.stock_quantity} onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)} className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-secondary" />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Price Override</label>
                          <input type="number" value={variant.price_override} onChange={(e) => handleVariantChange(index, 'price_override', e.target.value)} className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-secondary" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Upload 1–5 images for this variant</label>
                          <input type="file" accept="image/*" multiple onChange={(e) => handleVariantImagesChange(index, e)} className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-secondary" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-semibold text-dominant transition hover:bg-accent disabled:opacity-70">
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />} 
                  {formLoading ? 'Creating Product...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
