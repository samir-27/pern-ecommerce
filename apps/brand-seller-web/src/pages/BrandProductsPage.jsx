import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Shirt, 
    Edit, 
    Trash2, 
    ChevronDown, 
    ChevronUp, 
    AlertTriangle, 
    Check, 
    X, 
    Loader2, 
    Layers,
    Tag,
    Image as ImageIcon,
    Upload
} from 'lucide-react';
import api from '@api';
import { buildProductPayload, getSellerErrorMessage, normalizeSellerProduct } from '../services/sellerData';

const BrandProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProductId, setExpandedProductId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [brandStatus, setBrandStatus] = useState('active');

    const CLOTHING_SIZES = [
        'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size',
        '28', '30', '32', '34', '36', '38', '40', '42'
    ];

    const GENDER_OPTIONS = ['Men', 'Women', 'Unisex', 'Kids'];

    // Initial form state
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

    const fetchCatalog = async () => {
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
            if (catRes.data?.length > 0 && !formData.category_id) {
                setFormData(prev => ({ ...prev, category_id: catRes.data[0].id }));
            }
        } catch (err) {
            console.error('Error fetching brand catalog:', err);
            setError(getSellerErrorMessage(err, 'Unable to load your catalog. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const openAddModal = () => {
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

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'price') {
                updated.variants = prev.variants.map(v => {
                    if (!v.isCustomPrice) {
                        return { ...v, price: value };
                    }
                    return v;
                });
            }
            return updated;
        });
    };

    const handleVariantChange = (index, field, value) => {
        setFormData(prev => {
            const nextVariants = [...prev.variants];
            nextVariants[index] = { 
                ...nextVariants[index], 
                [field]: value,
                ...(field === 'price' ? { isCustomPrice: value !== '' && value !== prev.price } : {})
            };
            return { ...prev, variants: nextVariants };
        });
    };

    const handleVariantImagesAdd = (index, files) => {
        const fileList = Array.from(files || []);
        if (fileList.length === 0) return;

        setFormData(prev => {
            const nextVariants = [...prev.variants];
            const currentVar = nextVariants[index];
            const existingFiles = currentVar.imageFiles || [];
            const existingUrls = currentVar.image_urls || [];
            
            const totalCurrent = existingFiles.length + existingUrls.length;
            const remainingSlots = Math.max(0, 5 - totalCurrent);
            if (remainingSlots <= 0) return prev;

            const filesToAdd = fileList.slice(0, remainingSlots);
            const newPreviews = filesToAdd.map(f => URL.createObjectURL(f));
            const newFiles = [...existingFiles, ...filesToAdd];
            const newPreviewsList = [...(currentVar.imagePreviews || existingUrls), ...newPreviews];

            const currentColor = (currentVar.color || '').trim().toLowerCase();

            // Sync photos across all sizes sharing this exact colorway
            return {
                ...prev,
                variants: nextVariants.map((v, i) => {
                    if (i === index || (currentColor && (v.color || '').trim().toLowerCase() === currentColor)) {
                        return {
                            ...v,
                            imageFiles: newFiles,
                            imagePreviews: newPreviewsList,
                            image_urls: currentVar.image_urls || []
                        };
                    }
                    return v;
                })
            };
        });
    };

    const handleVariantImageRemove = (variantIndex, imageIndex) => {
        setFormData(prev => {
            const currentVar = prev.variants[variantIndex];
            const nextUrls = [...(currentVar.image_urls || [])];
            const nextFiles = [...(currentVar.imageFiles || [])];
            const nextPreviews = [...(currentVar.imagePreviews || [])];

            if (imageIndex < nextUrls.length) {
                nextUrls.splice(imageIndex, 1);
            } else {
                const fileIdx = imageIndex - nextUrls.length;
                nextFiles.splice(fileIdx, 1);
            }
            nextPreviews.splice(imageIndex, 1);

            const currentColor = (currentVar.color || '').trim().toLowerCase();

            return {
                ...prev,
                variants: prev.variants.map((v, i) => {
                    if (i === variantIndex || (currentColor && (v.color || '').trim().toLowerCase() === currentColor)) {
                        return {
                            ...v,
                            image_urls: nextUrls,
                            imageFiles: nextFiles,
                            imagePreviews: nextPreviews
                        };
                    }
                    return v;
                })
            };
        });
    };

    const addVariantRow = () => {
        setFormData(prev => ({
            ...prev,
            variants: [
                ...prev.variants,
                { size: 'M', color: 'New Color', sku: '', price: prev.price || '', stock_quantity: 10, low_stock_threshold: 5, isCustomPrice: false, image_urls: [], imagePreviews: [], imageFiles: [] }
            ]
        }));
    };

    const addSizeToColor = (variantIndex, targetSize) => {
        setFormData(prev => {
            const baseVariant = prev.variants[variantIndex];
            const color = baseVariant?.color || 'Black';
            const price = baseVariant?.price || prev.price || '';
            const existingSizesForColor = prev.variants
                .filter(v => (v.color || '').trim().toLowerCase() === color.trim().toLowerCase())
                .map(v => v.size);

            let newSize = targetSize;
            if (!newSize) {
                newSize = CLOTHING_SIZES.find(s => !existingSizesForColor.includes(s)) || 'XL';
            }

            const newVariant = {
                size: newSize,
                color: color,
                sku: '',
                price: price,
                stock_quantity: 10,
                low_stock_threshold: baseVariant?.low_stock_threshold || 3,
                isCustomPrice: baseVariant?.isCustomPrice || false,
                image_urls: [...(baseVariant?.image_urls || [])],
                imagePreviews: [...(baseVariant?.imagePreviews || [])],
                imageFiles: [...(baseVariant?.imageFiles || [])]
            };

            const nextVariants = [...prev.variants];
            // Insert right after the last variant of this color
            let insertPos = variantIndex + 1;
            for (let i = variantIndex + 1; i < prev.variants.length; i++) {
                if ((prev.variants[i].color || '').trim().toLowerCase() === color.trim().toLowerCase()) {
                    insertPos = i + 1;
                }
            }

            nextVariants.splice(insertPos, 0, newVariant);
            return { ...prev, variants: nextVariants };
        });
    };

    const removeVariantRow = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = buildProductPayload(formData, categories);
            const uploadData = new FormData();
            Object.entries(payload).forEach(([key, value]) => uploadData.append(key, value));

            // Append files mapped to each variant in order, tracking count per variant
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
            {/* Header */}
            {error && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    <span>{error}</span>
                    <button type="button" onClick={fetchCatalog} className="font-semibold underline">Retry</button>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white">Brand Garment Catalog</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Create apparel collections, configure size/color variants with up to 5 photos each, and oversee real-time inventory.
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    disabled={brandStatus === 'pending'}
                    title={brandStatus === 'pending' ? 'Verification required to list garments' : 'Add new clothing piece'}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${
                        brandStatus === 'pending'
                            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    }`}
                >
                    <Plus size={16} /> {brandStatus === 'pending' ? 'Verification Pending' : 'New Clothing Piece'}
                </button>
            </div>

            {/* Products Table */}
            {products.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
                    <Shirt className="mx-auto text-slate-600 mb-3" size={40} />
                    <h3 className="text-base font-bold text-white">No products created yet</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Add clothing garments to your brand catalogue with tailored colorway images, size charts, and stock numbers.
                    </p>
                    <button
                        onClick={openAddModal}
                        className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                    >
                        <Plus size={14} /> Add First Garment
                    </button>
                </div>
            ) : (
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="p-4">Garment</th>
                                    <th className="p-4">Category & Gender</th>
                                    <th className="p-4">Base Price</th>
                                    <th className="p-4">Variants & Stock</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {products.map((p) => {
                                    const isExpanded = expandedProductId === p.id;
                                    const hasLowStock = p.variants?.some(v => v.stock_quantity <= v.low_stock_threshold);
                                    const mainImg = p.images?.[0] || p.main_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80';

                                    return (
                                        <React.Fragment key={p.id}>
                                            <tr className="hover:bg-slate-800/40 transition-colors">
                                                {/* Garment Image & Name */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={mainImg}
                                                            alt={p.name}
                                                            className="w-12 h-14 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                                                        />
                                                        <div>
                                                            <div className="font-bold text-white text-sm line-clamp-1">{p.name}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{p.category_name || 'Apparel'}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category & Department */}
                                                <td className="p-4">
                                                    <div className="text-xs space-y-1">
                                                        <span className="text-slate-200 font-semibold block">
                                                            {p.category_name || 'Apparel'}
                                                        </span>
                                                        <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold text-[10px] uppercase tracking-wider border border-slate-700/60">
                                                            {p.gender || 'Unisex'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Price */}
                                                <td className="p-4 font-bold text-amber-400">
                                                    ₹{Number(p.base_price || p.price || 0).toLocaleString('en-IN')}
                                                </td>

                                                {/* Variant & Stock */}
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                                                    >
                                                        <Layers size={13} className="text-amber-400" />
                                                        {p.variant_count || 0} Variants ({p.total_stock || 0} in stock)
                                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>
                                                    {hasLowStock && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 mt-1 block">
                                                            <AlertTriangle size={12} /> Low variant stock
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                                                        p.status === 'approved'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                                    }`}>
                                                        {p.status === 'approved' ? <Check size={12} /> : null}
                                                        {p.status}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditModal(p)}
                                                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                                            title="Edit Product"
                                                        >
                                                            <Edit size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(p.id)}
                                                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expandable Variants Drawer */}
                                            {isExpanded && (
                                                <tr className="bg-slate-950/80">
                                                    <td colSpan={6} className="p-4 pl-12 border-b border-slate-800">
                                                        <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                                                            Variant Inventory Breakdown & Photos
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                            {p.variants?.map((v) => (
                                                                <div 
                                                                    key={v.id} 
                                                                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                                                                        v.stock_quantity <= v.low_stock_threshold
                                                                            ? 'bg-amber-950/20 border-amber-500/40'
                                                                            : 'bg-slate-900 border-slate-800'
                                                                    }`}
                                                                >
                                                                    <div>
                                                                        <div className="flex items-center justify-between font-bold text-white mb-1">
                                                                            <span>Size {v.size}</span>
                                                                            <span className="text-amber-400 font-semibold">{v.color}</span>
                                                                        </div>
                                                                        <div className="text-slate-400 text-[11px] truncate">SKU: {v.sku}</div>
                                                                        <div className="mt-2 flex items-center justify-between">
                                                                            <span className="font-bold text-white">₹{Number(v.price || p.base_price || 0).toLocaleString('en-IN')}</span>
                                                                            <span className={`font-semibold ${
                                                                                v.stock_quantity <= v.low_stock_threshold ? 'text-amber-400' : 'text-slate-300'
                                                                            }`}>
                                                                                Stock: {v.stock_quantity}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Colorway Photos Strip */}
                                                                    {v.image_urls && v.image_urls.length > 0 && (
                                                                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                                                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1.5">
                                                                                <span>Colorway Photos</span>
                                                                                <span className="text-amber-400 font-bold">{v.image_urls.length}/5</span>
                                                                            </div>
                                                                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                                                                                {v.image_urls.slice(0, 5).map((imgUrl, imgIdx) => (
                                                                                    <img
                                                                                        key={imgIdx}
                                                                                        src={imgUrl}
                                                                                        alt={`${v.color} - ${imgIdx + 1}`}
                                                                                        className="w-10 h-12 rounded object-cover border border-slate-700/80 shrink-0 bg-slate-950"
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Add / Edit Product */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl my-8 p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {editingProduct ? 'Edit Garment Details' : 'Add New Designer Garment'}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Configure clothing specifications, pricing, and variant photos (up to 5 photos per colorway).
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-white p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Garment Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        required
                                        placeholder="e.g. Structured Tailored Linen Shirt"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Clothing Category *
                                    </label>
                                    <select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                                    >
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Department / Gender *
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold text-sm focus:outline-none focus:border-amber-500"
                                    >
                                        {GENDER_OPTIONS.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Base Price (INR ₹) *
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleFormChange}
                                        required
                                        placeholder="1899"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                    Description & Editorial Styling Notes
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    rows={3}
                                    placeholder="Crafted with precise tailoring, selected fabrics, and premium silhouette drape..."
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
                                />
                            </div>

                            {/* Variants & Multi-Image per Variant Section */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                                Garment Colorways & Size Variants
                                            </span>
                                            {formData.price && (
                                                <span className="text-[11px] text-slate-400 font-medium">
                                                    (Base Price: ₹{formData.price})
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Each variant supports up to 5 photos (e.g. 5 black photos for Black, 5 white photos for White).
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {formData.price && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        variants: prev.variants.map(v => ({ ...v, price: prev.price, isCustomPrice: false }))
                                                    }));
                                                }}
                                                className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-medium"
                                            >
                                                Apply Base Price to All
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={addVariantRow}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 border border-slate-700"
                                        >
                                            <Plus size={14} /> Add New Colorway
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {formData.variants.map((v, idx) => {
                                        const currentPhotosCount = v.imagePreviews?.length || 0;
                                        return (
                                            <div key={idx} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                                                {/* Variant Inputs Row */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="w-28">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Size *</label>
                                                        <select
                                                            value={v.size}
                                                            onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                                                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                                        >
                                                            {CLOTHING_SIZES.map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex-1 min-w-[140px]">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Color / Colorway</label>
                                                        <input
                                                            type="text"
                                                            value={v.color}
                                                            onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                                                            placeholder="e.g. Black, White, Oatmeal"
                                                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-semibold"
                                                        />
                                                    </div>
                                                    <div className="w-24">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Stock</label>
                                                        <input
                                                            type="number"
                                                            value={v.stock_quantity}
                                                            onChange={(e) => handleVariantChange(idx, 'stock_quantity', e.target.value)}
                                                            placeholder="10"
                                                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                                                        />
                                                    </div>
                                                    <div className="w-28">
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Price (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={v.price !== undefined && v.price !== null && v.price !== '' ? v.price : (formData.price || '')}
                                                            onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                                                            placeholder={formData.price ? `₹${formData.price}` : "Price ₹"}
                                                            title="Variant Price (defaults to Base Price)"
                                                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                                                        />
                                                    </div>
                                                    {formData.variants.length > 1 && (
                                                        <div className="pt-5">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVariantRow(idx)}
                                                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                                                                title="Remove this size variant"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Multi-Size Quick Selector for Same Colorway */}
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1 border-t border-slate-900">
                                                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 mr-1">
                                                        <Plus size={12} /> Add multiple sizes for &ldquo;{v.color || 'this color'}&rdquo;:
                                                    </span>
                                                    {CLOTHING_SIZES.filter(s => s !== v.size).slice(0, 10).map(s => {
                                                        const alreadyAdded = formData.variants.some(
                                                            other => (other.color || '').trim().toLowerCase() === (v.color || '').trim().toLowerCase() && other.size === s
                                                        );
                                                        if (alreadyAdded) return null;
                                                        return (
                                                            <button
                                                                key={s}
                                                                type="button"
                                                                onClick={() => addSizeToColor(idx, s)}
                                                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/50 transition-colors shadow-sm"
                                                                title={`Quick-add size ${s} for ${v.color}`}
                                                            >
                                                                +{s}
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        type="button"
                                                        onClick={() => addSizeToColor(idx)}
                                                        className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors ml-1"
                                                    >
                                                        + Next Size
                                                    </button>
                                                </div>

                                                {/* Variant Images: Up to 5 images per variant */}
                                                <div className="pt-2 border-t border-slate-800/80">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <ImageIcon size={14} className="text-amber-400" />
                                                            <span className="text-xs font-bold text-slate-200">
                                                                Photos for {v.color || `Variant #${idx + 1}`}
                                                            </span>
                                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                                                currentPhotosCount >= 5 
                                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                                                    : 'bg-slate-800 text-slate-400'
                                                            }`}>
                                                                {currentPhotosCount} / 5 photos
                                                            </span>
                                                        </div>
                                                        {currentPhotosCount < 5 && (
                                                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm">
                                                                <Upload size={12} />
                                                                <span>Upload {v.color || 'Variant'} Photos</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    multiple
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        handleVariantImagesAdd(idx, e.target.files);
                                                                        e.target.value = '';
                                                                    }}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>

                                                    {/* Previews Reel */}
                                                    {v.imagePreviews && v.imagePreviews.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2.5 pt-1">
                                                            {v.imagePreviews.map((previewUrl, imgIdx) => (
                                                                <div key={imgIdx} className="relative group w-16 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                                                                    <img
                                                                        src={previewUrl}
                                                                        alt={`Photo ${imgIdx + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleVariantImageRemove(idx, imgIdx)}
                                                                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-white hover:bg-red-600 transition-colors opacity-90 group-hover:opacity-100"
                                                                        title="Remove photo"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                    <span className="absolute bottom-1 left-1 px-1 rounded bg-black/70 text-[9px] font-bold text-white">
                                                                        #{imgIdx + 1}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-2.5 px-3 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                                                            No photos uploaded yet for this colorway. Click above to add up to 5 photos (e.g. front, back, detail, zoom).
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving Garment & Photos...' : 'Save Garment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandProductsPage;
