import { Plus, Trash2, X, Upload } from 'lucide-react';

export const CLOTHING_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size',
  '28', '30', '32', '34', '36', '38', '40', '42'
];

const VariantManager = ({
  variants,
  basePrice,
  onVariantChange,
  onVariantImageUpload,
  onVariantImageRemove,
  onAddVariantRow,
  onAddSizeToColor,
  onRemoveVariantRow
}) => {
  return (
    <div className="space-y-4 font-ui text-[#EDEDED]">
      <div className="flex items-center justify-between pb-2 border-b border-[#23232C]">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-fashion text-white">
            Garment Variants & Inventory Allocation
          </h4>
          <p className="text-[11px] text-[#71717A] mt-0.5">
            Configure sizes, colorways, individual SKU stock levels, and upload up to 5 photos per color.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddVariantRow}
          className="px-3 py-1.5 bg-white hover:bg-[#F4F4F2] text-[#0C0C0E] text-[10px] font-medium uppercase tracking-fashion flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus size={11} />
          <span>New Colorway</span>
        </button>
      </div>

      <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
        {variants.map((v, index) => {
          const previews = v.imagePreviews || [];
          const isFirstOfColor = index === 0 || (variants[index - 1].color || '').trim().toLowerCase() !== (v.color || '').trim().toLowerCase();

          return (
            <div
              key={index}
              className={`p-4 border transition-colors space-y-3 ${
                isFirstOfColor
                  ? 'border-[#2D2D3A] bg-[#141419]'
                  : 'border-[#23232C] bg-[#101014] ml-3'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#1E1E28] text-[#A1A1AA] text-[10px] font-tabular font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-white uppercase tracking-wider">
                    {v.color || 'Colorway'} · Size {v.size}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAddSizeToColor(index)}
                    className="px-2.5 py-1 bg-[#1E1E28] hover:bg-[#282836] text-white text-[10px] font-medium uppercase tracking-fashion flex items-center gap-1 transition-colors cursor-pointer border border-[#2B2B3A]"
                  >
                    <Plus size={10} />
                    <span>Add Size</span>
                  </button>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveVariantRow(index)}
                      className="p-1 text-[#71717A] hover:text-[#E17564] transition-colors cursor-pointer"
                      title="Remove Variant"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1">
                    Colorway Name
                  </label>
                  <input
                    type="text"
                    required
                    value={v.color}
                    onChange={(e) => onVariantChange(index, 'color', e.target.value)}
                    placeholder="e.g. Obsidian Black"
                    className="w-full px-3 py-2 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1">
                    Garment Size
                  </label>
                  <select
                    value={v.size}
                    onChange={(e) => onVariantChange(index, 'size', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white text-xs outline-none transition-colors cursor-pointer"
                  >
                    {CLOTHING_SIZES.map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={v.stock_quantity ?? 10}
                    onChange={(e) => onVariantChange(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white font-tabular text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1">
                    Price Override (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Default: ₹${basePrice || 0}`}
                    value={v.price_override ?? v.price ?? ''}
                    onChange={(e) => onVariantChange(index, 'price', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0C0C0E] border border-[#23232C] focus:border-white text-white font-tabular text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Photo Upload Strip for Colorway */}
              {isFirstOfColor && (
                <div className="pt-2 border-t border-[#23232C]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#71717A]">
                      Editorial Images for {v.color || 'this colorway'} ({previews.length}/5)
                    </span>
                    <label className="text-[10px] uppercase tracking-fashion text-white hover:underline flex items-center gap-1 cursor-pointer">
                      <Upload size={10} />
                      <span>Upload Photos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onVariantImageUpload(index, e.target.files)}
                      />
                    </label>
                  </div>

                  {previews.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {previews.map((prev, pIdx) => (
                        <div key={pIdx} className="w-14 aspect-[3/4] bg-[#0C0C0E] border border-[#282834] relative group shrink-0">
                          <img src={prev} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => onVariantImageRemove(index, pIdx)}
                            className="absolute top-1 right-1 p-0.5 bg-black/80 text-white hover:text-[#E17564] transition-colors cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VariantManager;
