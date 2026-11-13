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
    if (!window.confirm('Are you sure you want to remove this piece from your atelier catalog?')) return;
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
      <div className="h-[60vh] flex items-center justify-center font-ui text-[#EDEDED]">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui text-[#EDEDED]">
      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 border border-[#4D1F1F] bg-[#261313] p-4 text-xs text-[#FCA5A5]">
          <span>{error}</span>
          <button type="button" onClick={fetchCatalog} className="font-semibold underline cursor-pointer">Retry</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#23232C]">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Atelier Portfolio
          </span>
          <h1 className="font-editorial text-3xl font-light text-white">Garment Catalog</h1>
          <p className="text-xs text-[#71717A] mt-0.5">Manage luxury ready-to-wear lines, variant colorways, and real-time inventory.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="px-5 py-2.5 bg-white hover:bg-[#F4F4F2] text-[#0C0C0E] text-[11px] font-medium uppercase tracking-fashion inline-flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={13} />
          <span>New Garment</span>
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
