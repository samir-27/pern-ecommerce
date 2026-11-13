import { ShieldCheck, Lock, CreditCard } from 'lucide-react';
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
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">
          Bag Summary
        </h3>
        <span className="text-xs font-bold text-zinc-400">
          {cartItems.reduce((acc, item) => acc + item.quantity, 0)} Items
        </span>
      </div>

      {/* Cart Items List */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-60 overflow-y-auto pr-1">
        {cartItems.map((item, idx) => (
          <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <img
                src={item.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80'}
                alt={item.name}
                className="w-10 h-12 object-cover rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0"
              />
              <div>
                <p className="font-bold text-zinc-900 dark:text-white line-clamp-1">{item.name}</p>
                <p className="text-[10px] text-zinc-400">
                  {item.brand_name || 'MINIMAL'} • {item.selectedSize} • Qty {item.quantity}
                </p>
              </div>
            </div>
            <span className="font-mono font-bold text-zinc-900 dark:text-white shrink-0">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
        <div className="flex justify-between text-zinc-500">
          <span>Bag Subtotal:</span>
          <span className="font-mono font-semibold text-zinc-900 dark:text-white">
            {formatCurrency(subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-zinc-500">
          <span>Express Courier Delivery:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between text-zinc-500">
          <span>Applicable GST (8%):</span>
          <span className="font-mono font-semibold text-zinc-900 dark:text-white">
            {formatCurrency(estimatedTax)}
          </span>
        </div>
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-base font-black text-zinc-900 dark:text-white">
          <span>Total Payable:</span>
          <span className="font-mono">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={onPayClick}
        disabled={loading || cartItems.length === 0}
        className="w-full py-4 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <CreditCard size={16} /> Pay {formatCurrency(totalAmount)} via Razorpay
          </>
        )}
      </button>

      {/* Security Badge */}
      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center gap-2.5 text-[11px] text-zinc-500">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
        <span>256-Bit SSL Encrypted Razorpay Checkout with instant Tax Invoice generation.</span>
      </div>
    </div>
  );
};

export default CheckoutOrderSummary;
