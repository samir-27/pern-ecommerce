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
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Garment Variants & Inventory
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize sizes, colorways, individual stock levels, and upload up to 5 photos per color.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddVariantRow}
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
        >
          <Plus size={14} /> Add Colorway
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {variants.map((v, index) => {
          const previews = v.imagePreviews || [];
          const isFirstOfColor = index === 0 || (variants[index - 1].color || '').trim().toLowerCase() !== (v.color || '').trim().toLowerCase();

          return (
            <div
              key={index}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isFirstOfColor
                  ? 'border-slate-700 bg-slate-900/90'
                  : 'border-slate-800/80 bg-slate-900/40 ml-4'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center font-mono">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-white uppercase">
                    {v.color || 'Colorway'} • Size {v.size}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAddSizeToColor(index)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} /> Add Size
                  </button>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveVariantRow(index)}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove Variant"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Color Name
                  </label>
                  <input
                    type="text"
                    required
                    value={v.color}
                    onChange={(e) => onVariantChange(index, 'color', e.target.value)}
                    placeholder="e.g. Navy Blue"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Size
                  </label>
                  <select
                    value={v.size}
                    onChange={(e) => onVariantChange(index, 'size', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs"
                  >
                    {CLOTHING_SIZES.map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={v.stock_quantity}
                    onChange={(e) => onVariantChange(index, 'stock_quantity', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Default: ₹${basePrice || 0}`}
                    value={v.price || ''}
                    onChange={(e) => onVariantChange(index, 'price', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Photos upload area (only show for first variant of each color or if unique) */}
              {isFirstOfColor && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Photos for {v.color || 'this color'} ({previews.length}/5)
                    </span>
                    {previews.length < 5 && (
                      <label className="cursor-pointer text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                        <Upload size={12} /> Upload Photos
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => onVariantImageUpload(index, e.target.files)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {previews.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {previews.map((preview, pIdx) => (
                        <div key={pIdx} className="relative group w-12 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                          <img src={preview} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => onVariantImageRemove(index, pIdx)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                            title="Remove Photo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No photos uploaded for this colorway.</p>
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
