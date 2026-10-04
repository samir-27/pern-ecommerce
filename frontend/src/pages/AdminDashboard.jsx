import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, PlusCircle, LogOut, Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import { createProduct as createProductRequest } from '../services/ProductService';
import api from '../services/Axios';

const defaultStats = [
  { title: 'Products', value: '—', icon: ShoppingBag, accent: 'bg-secondary text-dominant' },
  { title: 'Orders', value: '—', icon: ShoppingBag, accent: 'bg-accent text-dominant' },
  { title: 'Users', value: '—', icon: Users, accent: 'bg-green-600 text-white' },
];

// Fully Static Options
const SIZES = ['All', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Grey', 'Navy', 'Blue', 'Teal', 'Green', 'Olive', 'Yellow', 'Orange', 'Red', 'Maroon', 'Pink', 'Purple', 'Brown'];
const CATEGORIES = ['Shirt', 'T-Shirt', 'Pants', 'Shorts', 'Coats', 'Hoodie', 'Jacket', 'Sweater', 'Dress', 'Skirt', 'Activewear', 'Accessories'];
const GENDERS = ['Mens', 'Womens', 'Kids', 'Unisex'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  
  const [productForm, setProductForm] = useState({
    name: '',
    category_name: CATEGORIES[0],
    description: '',
    base_price: '',
    gender: 'Unisex'
  });
  
  const [variants, setVariants] = useState([
    { size: 'M', color: 'Black', stock_quantity: '10', price_override: '', images: [] }
  ]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const overviewRes = await api.get('/admin/overview');
        setStats([
          { title: 'Products', value: overviewRes.data.products.toString(), icon: ShoppingBag, accent: 'bg-secondary text-dominant' },
          { title: 'Orders', value: overviewRes.data.orders.toString(), icon: ShoppingBag, accent: 'bg-accent text-dominant' },
          { title: 'Users', value: overviewRes.data.users.toString(), icon: Users, accent: 'bg-green-600 text-white' },
        ]);
      } catch (error) {
        console.error('Could not fetch admin data', error);
      }
    };
    fetchAdminData();
  }, []);

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
    
    if (files.length > 5) {
      setFormError(`You can only upload a maximum of 5 images per variant. You selected ${files.length}.`);
      e.target.value = ''; 
      return;
    }
    
    setFormError(''); 
    setVariants((prev) => prev.map((variant, variantIndex) => variantIndex === index ? { ...variant, images: files } : variant));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { size: 'L', color: 'White', stock_quantity: '10', price_override: '', images: [] }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((_, variantIndex) => variantIndex !== index));
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormMessage('');

    const hasEmptyImages = variants.some(v => v.images.length === 0);
    if (hasEmptyImages) {
        setFormError('Please select at least 1 image for every variant.');
        setFormLoading(false);
        return;
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
      
      // Reset Form
      setProductForm({
        name: '',
        category_name: CATEGORIES[0],
        description: '',
        base_price: '',
        gender: 'Unisex'
      });
      setVariants([{ size: 'M', color: 'Black', stock_quantity: '10', price_override: '', images: [] }]);
      
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
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Admin Panel</p>
            <h1 className="text-3xl font-black text-secondary">Welcome back, admin</h1>
            <p className="text-secondary/60 mt-2">The available admin tools are shown below.</p>
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
              The admin dashboard is now connected to the product creation API and supports restricted image uploads (max 5 per variant) through Cloudinary.
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
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="mt-8 rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-secondary">Create New Product</h2>
              <p className="text-sm text-secondary/60">Upload a product and submit it to the backend.</p>
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
                <label className="mb-2 block text-sm font-semibold text-secondary/70">Category (Type)</label>
                <select name="category_name" value={productForm.category_name} onChange={handleInputChange} required className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3 text-secondary">
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-secondary/70">Gender</label>
                <select name="gender" value={productForm.gender} onChange={handleInputChange} className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3 text-secondary">
                  {GENDERS.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-secondary/70">Description</label>
                <textarea name="description" value={productForm.description} onChange={handleInputChange} rows="3" className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3 text-secondary" />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-secondary/70">Base Price</label>
                <input type="number" min="0" step="0.01" name="base_price" value={productForm.base_price} onChange={handleInputChange} required className="w-full rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3 text-secondary" />
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
                    <div key={`variant-${index}`} className="rounded-xl border border-secondary/10 bg-secondary/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-secondary">Variant {index + 1}</p>
                        {variants.length > 1 && (
                          <button type="button" onClick={() => removeVariant(index)} className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700">
                            <Trash2 size={16} /> Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Size</label>
                          <select value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-secondary">
                            {SIZES.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Color</label>
                          <select value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-secondary">
                            {COLORS.map(color => (
                                <option key={color} value={color}>{color}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Stock Quantity</label>
                          <input type="number" min="0" value={variant.stock_quantity} onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)} className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-secondary" />
                        </div>
                        
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Price Override (Optional)</label>
                          <input type="number" min="0" step="0.01" value={variant.price_override} onChange={(e) => handleVariantChange(index, 'price_override', e.target.value)} placeholder="Leave blank to use Base Price" className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-3 text-secondary" />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-semibold text-secondary/70">Images (Hold Ctrl/Cmd to select up to 5)</label>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={(e) => handleVariantImagesChange(index, e)} 
                            className="w-full rounded-lg border border-secondary/10 bg-white px-4 py-2 text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-secondary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary hover:file:bg-secondary/20" 
                          />
                          
                          {/* Display selected file names so the user knows multiple images were successfully chosen */}
                          {variant.images.length > 0 && (
                            <div className="mt-3 rounded-lg bg-white p-3 border border-secondary/10">
                              <p className="text-xs font-semibold text-green-600 mb-2">{variant.images.length} image(s) selected:</p>
                              <ul className="space-y-1">
                                {variant.images.map((file, fileIdx) => (
                                  <li key={fileIdx} className="flex items-center gap-2 text-xs text-secondary/70">
                                    <ImageIcon size={14} className="text-secondary/40" />
                                    <span className="truncate">{file.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 mt-4">
                <button type="submit" disabled={formLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-4 font-semibold text-dominant transition hover:bg-accent disabled:opacity-70 md:w-auto">
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />} 
                  {formLoading ? 'Creating Product...' : 'Submit Product to Database'}
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