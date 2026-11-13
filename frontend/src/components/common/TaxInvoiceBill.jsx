import { Printer, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const TaxInvoiceBill = ({ order, onClose, showHeaderControls = true }) => {
  if (!order) return null;

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(order.id).padStart(5, '0')}`;
  const invoiceDate = new Date(order.created_at || new Date().toISOString()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const items = order.items || [];
  const pricing = order.pricing || {
    subtotal: order.subtotal || order.total_amount || 0,
    shipping: order.shipping ?? 0,
    tax: order.tax ?? 0,
    total: order.total_amount || 0
  };

  const shipping = order.shipping || {};

  return (
    <div className="space-y-6">
      {showHeaderControls && (
        <div className="no-print p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                Payment Authorized & Verified
              </span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Payment Received {order.razorpay_payment_id ? `• Razorpay #${order.razorpay_payment_id}` : ''}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={15} /> Print / Save Bill
            </button>
            {onClose ? (
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <X size={15} /> Close
              </button>
            ) : (
              <Link
                to="/profile"
                className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                My Orders
              </Link>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL TAX INVOICE CARD */}
      <div id="printable-bill" className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-8 sm:p-12 shadow-xl space-y-8">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-zinc-200 dark:border-zinc-800 gap-6">
          <div>
            <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
              MINIMAL<span className="text-blue-600 dark:text-blue-400">.</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mt-1">
              Contemporary Atelier & Luxury Apparel Inc.
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">
              GSTIN: 27AABCM8291Q1ZT • Registered Fashion Marketplace
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              PAID IN FULL
            </span>
            <h3 className="text-base font-black text-zinc-900 dark:text-white">TAX INVOICE</h3>
            <p className="text-xs text-zinc-500 font-mono">Invoice: {invoiceNumber}</p>
            <p className="text-xs text-zinc-500">Date: {invoiceDate}</p>
          </div>
        </div>

        {/* Billed To & Payment Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Billed & Shipped To:
            </span>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">
              {shipping.fullName || order.shipping_address?.split(',')[0] || 'Valued Client'}
            </h4>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {shipping.address || order.shipping_address || 'Registered Shipping Address'}<br />
              {shipping.city ? `${shipping.city}, ${shipping.state} - ${shipping.pincode}` : ''}<br />
              {shipping.phone ? `Phone: ${shipping.phone}` : ''}
            </p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Payment Verification Details:
            </span>
            <p className="text-zinc-700 dark:text-zinc-300 font-medium">
              Payment Method: <span className="font-bold text-zinc-900 dark:text-white">Razorpay Online Gateway</span>
            </p>
            <p className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
              Payment ID: <span className="text-blue-600 dark:text-blue-400 font-semibold">{order.razorpay_payment_id || 'Captured via Gateway'}</span>
            </p>
            <p className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
              Order Token: {order.razorpay_order_id || `ORD-${order.id}`}
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              Status: 256-Bit Encrypted & Captured
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                <th className="py-3">Garment Item</th>
                <th className="py-3">Brand / Atelier</th>
                <th className="py-3 text-center">Size</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((item, index) => {
                const itemPrice = Number(item.price || item.price_at_purchase || 0);
                const itemQty = Number(item.quantity || 1);
                return (
                  <tr key={index} className="text-zinc-800 dark:text-zinc-200">
                    <td className="py-3.5 font-bold">
                      {item.name || item.product_name}
                    </td>
                    <td className="py-3.5 text-zinc-500">
                      {item.brand_name || item.store_name || 'MINIMAL Atelier'}
                    </td>
                    <td className="py-3.5 text-center font-mono">
                      {item.selectedSize || item.size || 'Standard'}
                    </td>
                    <td className="py-3.5 text-center font-bold">
                      {itemQty}
                    </td>
                    <td className="py-3.5 text-right font-mono">
                      ₹{itemPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right font-black font-mono">
                      ₹{(itemPrice * itemQty).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Ledger */}
        <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-zinc-900 dark:text-white font-mono">
                ₹{Number(pricing.subtotal || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Express Courier:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {Number(pricing.shipping || 0) === 0 ? 'FREE' : `₹${pricing.shipping}`}
              </span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>CGST + SGST (8%):</span>
              <span className="font-semibold text-zinc-900 dark:text-white font-mono">
                ₹{Number(pricing.tax || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-base font-black text-zinc-900 dark:text-white">
              <span>Total Paid:</span>
              <span className="font-mono">
                ₹{Number(pricing.total || order.total_amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaxInvoiceBill;
