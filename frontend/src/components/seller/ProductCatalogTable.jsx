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
      <div className="p-12 text-center bg-white border border-[#E8E8E4] text-[#71717A] font-ui space-y-3 shadow-xs">
        <Shirt className="mx-auto text-[#71717A]" size={32} strokeWidth={1.5} />
        <h3 className="font-editorial text-2xl font-light text-[#121212]">No Garments Created Yet</h3>
        <p className="text-xs text-[#71717A] max-w-sm mx-auto leading-relaxed">
          Publish apparel garments to your atelier collection with custom colorways, sizes, and inventory allocations.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-5 py-2.5 bg-[#121212] hover:bg-black text-[#FBFBFA] text-[11px] font-medium uppercase tracking-fashion inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Add First Garment</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E8E4] overflow-hidden font-ui shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E8E8E4] bg-[#F4F4F2] text-[#71717A] text-[10px] font-semibold uppercase tracking-loose-caps">
              <th className="p-4">Garment</th>
              <th className="p-4">Category & Department</th>
              <th className="p-4">Base Price</th>
              <th className="p-4">Variants & Stock</th>
              <th className="p-4">Moderation</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E4]">
            {products.map((p) => {
              const isExpanded = expandedProductId === p.id;
              const hasLowStock = p.variants?.some(v => v.stock_quantity <= v.low_stock_threshold);
              const mainImg = p.images?.[0] || p.main_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80';

              return (
                <Fragment key={p.id}>
                  <tr className="hover:bg-[#FBFBFA] transition-colors">
                    {/* Garment Image & Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={mainImg}
                          alt={p.name}
                          className="w-10 aspect-[3/4] object-cover bg-[#F4F4F2] shrink-0 border border-[#E8E8E4]"
                        />
                        <div>
                          <div className="font-medium text-[#121212] text-xs line-clamp-1">{p.name}</div>
                          <div className="text-[10px] text-[#71717A] uppercase tracking-fashion mt-0.5">{p.category_name || 'Apparel'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Department */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="text-[#121212] font-normal block">
                          {p.category_name || 'Apparel'}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 bg-[#F4F4F2] text-[#71717A] text-[9px] uppercase tracking-fashion border border-[#E8E8E4]">
                          {p.gender || 'Unisex'}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="p-4 font-tabular font-semibold text-[#121212]">
                      {formatCurrency(p.base_price || p.price || 0)}
                    </td>

                    {/* Variant & Stock */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F4F2] hover:bg-[#E8E8E4] text-[10px] uppercase tracking-wider text-[#121212] border border-[#E8E8E4] transition-colors cursor-pointer"
                      >
                        <Layers size={11} />
                        <span>{p.variants?.length || 0} Variants</span>
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {hasLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                          <AlertTriangle size={11} />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                          <Check size={11} />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(p)}
                          className="p-1.5 text-[#71717A] hover:text-[#121212] hover:bg-[#F4F4F2] border border-transparent hover:border-[#E8E8E4] transition-colors cursor-pointer"
                          title="Edit Garment"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 text-[#71717A] hover:text-[#843828] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Delete Garment"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Variant Matrix Drawer */}
                  {isExpanded && (
                    <tr className="bg-[#FBFBFA] border-b border-[#E8E8E4]">
                      <td colSpan={6} className="p-4 sm:p-6">
                        <div className="space-y-3">
                          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
                            Size, Color & SKU Breakdown
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {p.variants?.map((v, i) => (
                              <div
                                key={i}
                                className="p-3 bg-white border border-[#E8E8E4] text-xs space-y-1.5 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-tabular font-medium text-[#121212]">{v.size}</span>
                                  <span className="text-[10px] text-[#71717A]">{v.color}</span>
                                </div>
                                <div className="text-[11px] font-tabular text-[#121212]">
                                  {formatCurrency(v.price_override || v.price || p.base_price || 0)}
                                </div>
                                <div className="text-[10px] flex items-center justify-between text-[#71717A] font-tabular pt-1 border-t border-[#E8E8E4]">
                                  <span>Qty: {v.stock_quantity}</span>
                                  {v.stock_quantity <= v.low_stock_threshold && (
                                    <span className="text-amber-700 font-semibold">Low</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
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
