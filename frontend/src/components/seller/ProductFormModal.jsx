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
          color: 'New Colorway',
          sku: '',
          price: prev.price || '',
          stock_quantity: 10,
          low_stock_threshold: 3,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto font-ui text-[#EDEDED]">
      <div className="bg-[#141419] border border-[#23232C] w-full max-w-3xl my-8 p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23232C]">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
              {editingProduct ? 'Garment Revision' : 'Atelier Garment Creator'}
            </span>
            <h3 className="font-editorial text-2xl font-light text-white">
              {editingProduct ? `Edit ${editingProduct.name}` : 'Publish New Atelier Piece'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[#261313] border border-[#4D1F1F] text-[#FCA5A5] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* General Garment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Garment Title *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Bespoke Double-Breasted Wool Overcoat"
                className="w-full px-3.5 py-2.5 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white outline-none text-xs transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Category *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white outline-none text-xs transition-colors cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Department *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white outline-none text-xs transition-colors cursor-pointer"
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Base Retail Price (INR ₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g. 5490"
                className="w-full px-3.5 py-2.5 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white font-tabular outline-none text-xs transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Garment Description, Textile & Silhouette Notes
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Textile blend, weave density, silhouette drape, wash & maintenance guidelines..."
                className="w-full p-3 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white outline-none text-xs transition-colors"
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#23232C]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#23232C] hover:border-white text-[#A1A1AA] hover:text-white text-[10px] font-medium uppercase tracking-fashion transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-white hover:bg-[#F4F4F2] text-[#0C0C0E] text-[10px] font-medium uppercase tracking-fashion transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Uploading to Cloudinary & Saving...</span>
                </>
              ) : (
                <span>{editingProduct ? 'Update Garment' : 'Publish to Atelier'}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ProductFormModal;
