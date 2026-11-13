import { X, Loader2 } from 'lucide-react';
import VariantManager from './VariantManager';

const GENDER_OPTIONS = ['Men', 'Women', 'Unisex', 'Kids'];

const ProductFormModal = ({
  isOpen,
  onClose,
  editingProduct,
  formData,
  setFormData,
  categories,
  submitting,
  onSubmit,
  error
}) => {
  if (!isOpen) return null;

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }));
  };

  const handleVariantImageUpload = (index, files) => {
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;

    const newPreviews = fileList.map(f => URL.createObjectURL(f));
    const targetColor = (formData.variants[index]?.color || '').trim().toLowerCase();

    setFormData(prev => {
      const currentVar = prev.variants[index];
      const mergedFiles = [...(currentVar.imageFiles || []), ...fileList].slice(0, 5);
      const mergedPreviews = [...(currentVar.imagePreviews || []), ...newPreviews].slice(0, 5);

      return {
        ...prev,
        variants: prev.variants.map((v, i) => {
          if (i === index || (targetColor && (v.color || '').trim().toLowerCase() === targetColor)) {
            return {
              ...v,
              imageFiles: mergedFiles,
              imagePreviews: mergedPreviews
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

      const targetColor = (currentVar.color || '').trim().toLowerCase();

      return {
        ...prev,
        variants: prev.variants.map((v, i) => {
          if (i === variantIndex || (targetColor && (v.color || '').trim().toLowerCase() === targetColor)) {
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

  const handleAddVariantRow = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          size: 'M',
          color: 'New Color',
          sku: '',
          price: prev.price || '',
          stock_quantity: 10,
          low_stock_threshold: 5,
          image_urls: [],
          imagePreviews: [],
          imageFiles: []
        }
      ]
    }));
  };

  const handleAddSizeToColor = (variantIndex) => {
    setFormData(prev => {
      const baseVariant = prev.variants[variantIndex];
      const color = baseVariant?.color || 'Black';
      const price = baseVariant?.price || prev.price || '';

      const newVariant = {
        size: 'L',
        color: color,
        sku: '',
        price: price,
        stock_quantity: 10,
        low_stock_threshold: 3,
        image_urls: [...(baseVariant?.image_urls || [])],
        imagePreviews: [...(baseVariant?.imagePreviews || [])],
        imageFiles: [...(baseVariant?.imageFiles || [])]
      };

      const nextVariants = [...prev.variants];
      nextVariants.splice(variantIndex + 1, 0, newVariant);
      return { ...prev, variants: nextVariants };
    });
  };

  const handleRemoveVariantRow = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl my-8 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              {editingProduct ? 'Update Garment Catalog' : 'Brand Garment Creator'}
            </span>
            <h3 className="text-lg font-black text-white">
              {editingProduct ? `Edit ${editingProduct.name}` : 'Create Brand Clothing Piece'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* General Garment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Garment Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Classic Tailored Oxford Shirt"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Category
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Gender Department
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs"
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Base Retail Price (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g. 2499"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Garment Description & Material
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Fabric composition, fit, wash instructions, styling tips..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          {/* Variants and Images Section */}
          <VariantManager
            variants={formData.variants}
            basePrice={formData.price}
            onVariantChange={handleVariantChange}
            onVariantImageUpload={handleVariantImageUpload}
            onVariantImageRemove={handleVariantImageRemove}
            onAddVariantRow={handleAddVariantRow}
            onAddSizeToColor={handleAddSizeToColor}
            onRemoveVariantRow={handleRemoveVariantRow}
          />

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving Garment...
                </>
              ) : (
                editingProduct ? 'Save Updates' : 'Publish to Catalog'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ProductFormModal;
