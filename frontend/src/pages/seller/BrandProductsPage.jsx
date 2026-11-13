import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import api from '@/services/Axios';
import { buildProductPayload, getSellerErrorMessage, normalizeSellerProduct } from '@/services/sellerData';
import ProductCatalogTable from '@/components/seller/ProductCatalogTable';
import ProductFormModal from '@/components/seller/ProductFormModal';

const BrandProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [brandStatus, setBrandStatus] = useState('active');

  const initialFormState = {
    name: '',
    description: '',
    price: '',
    category_id: '',
    gender: 'Men',
    variants: [
      { size: 'S', color: 'Black', sku: '', price: '', stock_quantity: 10, low_stock_threshold: 3, isCustomPrice: false, image_urls: [], imagePreviews: [], imageFiles: [] },
      { size: 'M', color: 'Black', sku: '', price: '', stock_quantity: 15, low_stock_threshold: 5, isCustomPrice: false, image_urls: [], imagePreviews: [], imageFiles: [] },
      { size: 'L', color: 'Black', sku: '', price: '', stock_quantity: 10, low_stock_threshold: 3, isCustomPrice: false, image_urls: [], imagePreviews: [], imageFiles: [] }
    ]
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, profileRes] = await Promise.all([
        api.get('/seller/products'),
        api.get('/products/categories'),
        api.get('/brand/profile').catch(() => ({ data: null }))
      ]);
      setProducts((prodRes.data || []).map(normalizeSellerProduct));
      setCategories(catRes.data || []);
      if (profileRes.data?.status) {
        setBrandStatus(profileRes.data.status);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching brand catalog:', err);
      setError(getSellerErrorMessage(err, 'Unable to load your catalog. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const openAddModal = () => {
    if (brandStatus === 'suspended') {
      alert('Your brand account is currently suspended by platform administration. Garment creation is disabled until reactivated.');
      return;
    }
    if (brandStatus === 'pending') {
      alert('Your brand account is currently pending Super Admin verification. You will be able to create and sell garments once verified by the administrator.');
      return;
    }
    setEditingProduct(null);
    setFormData({
      ...initialFormState,
      category_id: categories[0]?.id || '',
      gender: 'Men',
      variants: [
        { size: 'S', color: 'Black', sku: '', price: '', stock_quantity: 10, low_stock_threshold: 3, isCustomPrice: false, image_urls: [], imagePreviews: [], imageFiles: [] },
        { size: 'M', color: 'Black', sku: '', price: '', stock_quantity: 15, low_stock_threshold: 5, isCustomPrice: false, image_urls: [], imagePreviews: [], imageFiles: [] },
        { size: 'L', color: 'Black', sku: '', price: '', stock_quantity: 10, low_stock_threshold: 3, isCustomPrice: false, image_urls: [], imagePreviews: [], imageFiles: [] }
      ]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || product.base_price || '',
      category_id: product.category_id || categories[0]?.id || '',
      gender: product.gender || 'Unisex',
      variants: product.variants?.length > 0 ? product.variants.map(v => ({
        ...v,
        size: v.size || 'M',
        color: v.color || 'Standard',
        stock_quantity: v.stock_quantity ?? 10,
        price: v.price ?? v.price_override ?? product.price ?? product.base_price ?? '',
        image_urls: Array.isArray(v.image_urls) ? v.image_urls : [],
        imagePreviews: Array.isArray(v.image_urls) ? [...v.image_urls] : [],
        imageFiles: []
      })) : [
        { size: 'M', color: 'Default', sku: '', price: product.price, stock_quantity: 10, low_stock_threshold: 3, image_urls: [], imagePreviews: [], imageFiles: [] }
      ]
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = buildProductPayload(formData, categories);
      const uploadData = new FormData();
      Object.entries(payload).forEach(([key, value]) => uploadData.append(key, value));

      const variantImageCounts = [];
      formData.variants.forEach((v) => {
        const files = v.imageFiles || [];
        variantImageCounts.push(files.length);
        files.forEach((file) => uploadData.append('images', file));
      });
      uploadData.append('variantImageCounts', JSON.stringify(variantImageCounts));

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, uploadData);
      } else {
        await api.post('/products', uploadData);
      }
      setError('');
      setIsModalOpen(false);
      await fetchCatalog();
    } catch (err) {
      console.error('Failed to save brand garment:', err);
      setError(getSellerErrorMessage(err, 'Failed to save product.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this clothing item from your catalog?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Failed to delete garment:', err);
      setError(getSellerErrorMessage(err, 'Failed to delete product.'));
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <span>{error}</span>
          <button type="button" onClick={fetchCatalog} className="font-semibold underline">Retry</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Brand Garment Catalog</h1>
          <p className="text-sm text-slate-400 mt-1">Manage luxury clothing lines, multi-colorways, and size inventory.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-colors"
        >
          <Plus size={16} /> Add Garment
        </button>
      </div>

      <ProductCatalogTable
        products={products}
        onOpenAddModal={openAddModal}
        onOpenEditModal={openEditModal}
        onDeleteProduct={handleDelete}
      />

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        submitting={submitting}
        onSubmit={handleSubmit}
        error={error}
      />
    </div>
  );
};

export default BrandProductsPage;
