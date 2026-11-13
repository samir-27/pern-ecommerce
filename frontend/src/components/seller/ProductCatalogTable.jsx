import { Fragment, useState } from 'react';
import { 
  Shirt, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Check, 
  Layers, 
  Plus 
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const ProductCatalogTable = ({
  products,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduct
}) => {
  const [expandedProductId, setExpandedProductId] = useState(null);

  if (products.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
        <Shirt className="mx-auto text-slate-600 mb-3" size={40} />
        <h3 className="text-base font-bold text-white">No products created yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Add clothing garments to your brand catalogue with tailored colorway images, size charts, and stock numbers.
        </p>
        <button
          onClick={onOpenAddModal}
          className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-amber-400 transition-colors"
        >
          <Plus size={14} /> Add First Garment
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
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
                <Fragment key={p.id}>
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
                    <td className="p-4 font-bold text-amber-400 font-mono">
                      {formatCurrency(p.base_price || p.price || 0)}
                    </td>

                    {/* Variant & Stock */}
                    <td className="p-4">
                      <button
                        onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                      >
                        <Layers size={13} className="text-amber-400" />
                        {p.variant_count || p.variants?.length || 0} Variants ({p.total_stock || 0} in stock)
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
                          onClick={() => onOpenEditModal(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
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
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                          Variant Inventory Breakdown & Photos
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {p.variants?.map((v) => (
                            <div 
                              key={v.id} 
                              className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                                v.stock_quantity <= v.low_stock_threshold 
                                  ? 'border-amber-500/40 bg-amber-500/5' 
                                  : 'border-slate-800 bg-slate-900/60'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold text-white uppercase tracking-wider">
                                    {v.size} / {v.color}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                    v.stock_quantity <= v.low_stock_threshold
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {v.stock_quantity} left
                                  </span>
                                </div>
                                <div className="text-slate-400 font-mono text-[11px] mb-2">
                                  SKU: {v.sku}
                                </div>
                              </div>

                              {/* Photo Previews */}
                              {v.image_urls && v.image_urls.length > 0 && (
                                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 overflow-x-auto">
                                  {v.image_urls.map((img, imgIdx) => (
                                    <img
                                      key={imgIdx}
                                      src={img}
                                      alt={`${v.color} ${imgIdx}`}
                                      className="w-8 h-10 object-cover rounded border border-slate-700/80 shrink-0 bg-slate-800"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductCatalogTable;
