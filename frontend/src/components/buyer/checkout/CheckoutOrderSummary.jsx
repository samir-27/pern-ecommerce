import { ShieldCheck, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const CheckoutOrderSummary = ({
  cartItems,
  subtotal,
  shippingCost,
  estimatedTax,
  totalAmount,
  loading,
  onPayClick
}) => {
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="bg-[#FBFBFA] border border-[#E8E8E4] p-6 sm:p-8 space-y-6 font-ui text-[#121212] sticky top-28">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E4]">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Consignment
          </span>
          <h3 className="font-editorial text-2xl font-light text-[#121212]">
            Bag Summary
          </h3>
        </div>
        <span className="text-[11px] font-tabular uppercase tracking-fashion text-[#71717A]">
          [ {totalCount} Pieces ]
        </span>
      </div>

      {/* Cart Items List */}
      <div className="divide-y divide-[#E8E8E4] max-h-60 overflow-y-auto pr-1">
        {cartItems.map((item, idx) => (
          <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 aspect-[3/4] bg-[#F4F4F2] border border-[#E8E8E4] overflow-hidden shrink-0">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-xs text-[#121212] line-clamp-1">{item.name}</p>
                <p className="text-[10px] text-[#71717A] mt-0.5">
                  {item.brand_name || 'Atelier'} · {item.selectedSize} · Qty {item.quantity}
                </p>
              </div>
            </div>
            <span className="font-tabular font-semibold text-xs text-[#121212] shrink-0">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-2.5 pt-4 border-t border-[#E8E8E4] text-xs">
        <div className="flex justify-between text-[#71717A]">
          <span>Garments Subtotal:</span>
          <span className="font-tabular font-medium text-[#121212]">
            {formatCurrency(subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-[#71717A]">
          <span>Express Air Delivery:</span>
          <span className="font-tabular font-medium text-[#121212]">
            {shippingCost === 0 ? 'COMPLIMENTARY' : formatCurrency(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between text-[#71717A]">
          <span>Applicable GST (8%):</span>
          <span className="font-tabular font-medium text-[#121212]">
            {formatCurrency(estimatedTax)}
          </span>
        </div>
        <div className="pt-3 border-t border-[#E8E8E4] flex justify-between text-base font-semibold text-[#121212]">
          <span className="font-editorial text-lg font-light">Total Payable:</span>
          <span className="font-tabular">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Payment Button */}
      <button
        type="button"
        onClick={onPayClick}
        disabled={loading || cartItems.length === 0}
        className="w-full py-4 bg-[#121212] hover:bg-[#843828] text-white text-[11px] font-medium uppercase tracking-fashion transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <>
            <CreditCard size={14} />
            <span>Complete Order · {formatCurrency(totalAmount)}</span>
          </>
        )}
      </button>

      {/* Security Badge */}
      <div className="p-3 bg-white border border-[#E8E8E4] flex items-center gap-2 text-[11px] text-[#71717A]">
        <ShieldCheck size={14} className="text-[#843828] shrink-0" />
        <span className="leading-snug">Encrypted 256-Bit Razorpay Gateway with instant GST invoice receipt.</span>
      </div>
    </div>
  );
};

export default CheckoutOrderSummary;
