import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, Truck, CheckCircle2, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder as createOrderRequest } from '../services/Order';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cartItems, cartTotal, removeFromCart } = useCart();
    
    const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderInfo, setOrderInfo] = useState(null);

    const [shippingData, setShippingData] = useState({
        fullName: '',
        addressLine1: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
    });

    const subtotal = cartTotal;
    const shipping = subtotal > 150 ? 0 : 15.00;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    useEffect(() => {
        if (cartItems.length === 0 && step !== 3) {
            // Uncomment in production: navigate('/products');
        }
    }, [cartItems, navigate, step]);

    const handleInputChange = (e) => {
        setShippingData({ ...shippingData, [e.target.name]: e.target.value });
    };

    const handleProceedToPayment = (e) => {
        e.preventDefault();
        setStep(2);
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        setError('');

        try {
            const orderPayload = {
                shippingAddress: `${shippingData.fullName}\n${shippingData.addressLine1}, ${shippingData.city}, ${shippingData.state} ${shippingData.zipCode}, ${shippingData.country}`,
                orderItems: cartItems.map(item => ({
                    variant_id: item.variant_id,
                    quantity: item.quantity
                }))
            };

            const response = await createOrderRequest(orderPayload);
            
            setOrderInfo(response.order);
            setStep(3);

            cartItems.forEach(item => removeFromCart(item.variant_id));

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={48} className="text-green-600" />
                </div>
                <h1 className="text-4xl font-black text-secondary mb-4">Order Confirmed!</h1>
                <p className="text-lg text-secondary/70 mb-2">Thank you for your purchase.</p>
                <p className="text-secondary/60 mb-8 font-medium">Your order number is <span className="font-bold text-secondary">{orderInfo?.id || 'Pending'}</span></p>
                <button 
                    onClick={() => navigate('/profile')}
                    className="px-8 py-4 bg-secondary text-dominant font-bold rounded-lg hover:bg-accent transition-colors"
                >
                    View Order Status
                </button>
            </div>
        );
    }

    return (
        <div className="bg-dominant min-h-[90vh] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-secondary/60 hover:text-secondary mb-8 transition-colors font-medium">
                    <ArrowLeft size={18} /> Back to Shop
                </button>

                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* LEFT SIDE: Form & Workflow */}
                    <div className="w-full lg:w-2/3">
                        <div className="mb-8">
                            <h1 className="text-3xl font-black text-secondary mb-2">Checkout</h1>
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                                <span className={step === 1 ? 'text-secondary' : 'text-secondary/40'}>1. Shipping</span>
                                <span className="text-secondary/30">/</span>
                                <span className={step === 2 ? 'text-secondary' : 'text-secondary/40'}>2. Payment</span>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 font-medium border border-red-200">
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleProceedToPayment} className="animate-in slide-in-from-right-4 duration-300">
                                <div className="bg-secondary/5 rounded-2xl p-8 border border-secondary/10">
                                    <h2 className="text-xl font-bold text-secondary mb-6 flex items-center gap-2">
                                        <Truck size={20} /> Shipping Details
                                    </h2>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-secondary/70 mb-2">Full Name</label>
                                            <input required type="text" name="fullName" value={shippingData.fullName} onChange={handleInputChange} className="w-full bg-dominant border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-secondary/70 mb-2">Address</label>
                                            <input required type="text" name="addressLine1" value={shippingData.addressLine1} onChange={handleInputChange} className="w-full bg-dominant border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-secondary/70 mb-2">City</label>
                                                <input required type="text" name="city" value={shippingData.city} onChange={handleInputChange} className="w-full bg-dominant border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-secondary/70 mb-2">State / Province</label>
                                                <input required type="text" name="state" value={shippingData.state} onChange={handleInputChange} className="w-full bg-dominant border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-secondary/70 mb-2">ZIP / Postal Code</label>
                                                <input required type="text" name="zipCode" value={shippingData.zipCode} onChange={handleInputChange} className="w-full bg-dominant border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-secondary/70 mb-2">Country</label>
                                                <select required name="country" value={shippingData.country} onChange={handleInputChange} className="w-full bg-dominant border-2 border-secondary/10 rounded-lg px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors appearance-none">
                                                    <option value="US">United States</option>
                                                    <option value="CA">Canada</option>
                                                    <option value="UK">United Kingdom</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button type="submit" className="px-8 py-4 bg-secondary text-dominant font-bold rounded-lg hover:bg-accent transition-colors w-full sm:w-auto">
                                        Continue to Payment
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="animate-in slide-in-from-right-4 duration-300">
                                <div className="bg-secondary/5 rounded-2xl p-8 border border-secondary/10">
                                    <h2 className="text-xl font-bold text-secondary mb-6 flex items-center gap-2">
                                        <CreditCard size={20} /> Payment Method
                                    </h2>
                                    
                                    <div className="border-2 border-secondary/20 rounded-xl p-6 mb-6 bg-dominant">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="font-bold text-secondary">Credit Card</span>
                                            <div className="flex gap-2 opacity-50">
                                                <div className="w-8 h-5 bg-secondary rounded-sm"></div>
                                                <div className="w-8 h-5 bg-secondary rounded-sm"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-secondary/50 mb-1 uppercase tracking-wider">Card Number</label>
                                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-transparent border-b-2 border-secondary/20 pb-2 text-lg text-secondary focus:outline-none focus:border-accent font-mono" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-secondary/50 mb-1 uppercase tracking-wider">Expiry</label>
                                                    <input type="text" placeholder="MM/YY" className="w-full bg-transparent border-b-2 border-secondary/20 pb-2 text-lg text-secondary focus:outline-none focus:border-accent font-mono" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-secondary/50 mb-1 uppercase tracking-wider">CVC</label>
                                                    <input type="text" placeholder="123" className="w-full bg-transparent border-b-2 border-secondary/20 pb-2 text-lg text-secondary focus:outline-none focus:border-accent font-mono" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm font-medium text-secondary/60 flex items-center gap-2 justify-center mt-4">
                                        <ShieldCheck size={16} className="text-green-500" />
                                        Your payment information is securely encrypted.
                                    </p>
                                </div>

                                <div className="mt-8 flex justify-between items-center">
                                    <button onClick={() => setStep(1)} className="text-secondary/60 hover:text-secondary font-bold transition-colors">
                                        Back to Shipping
                                    </button>
                                    <button 
                                        onClick={handlePlaceOrder}
                                        disabled={loading}
                                        className="px-8 py-4 bg-accent text-dominant font-bold rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 shadow-lg"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : `Pay $${total.toFixed(2)}`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE: Order Summary */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-secondary/5 rounded-2xl p-8 border border-secondary/10 sticky top-24">
                            <h2 className="text-xl font-bold text-secondary mb-6">Order Summary</h2>
                            
                            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {cartItems.map(item => (
                                    <div key={item.variant_id} className="flex gap-4">
                                        <img src={item.image || "https://placehold.co/100x120"} className="w-16 h-20 object-cover rounded-md border border-secondary/10" alt={item.name} />
                                        <div className="flex-1 text-sm">
                                            <h4 className="font-bold text-secondary leading-tight mb-1">{item.name}</h4>
                                            <p className="text-secondary/60 mb-1">{item.color} / {item.size}</p>
                                            <p className="font-medium text-secondary">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-bold text-secondary">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-secondary/10 pt-4 space-y-3">
                                <div className="flex justify-between text-secondary/70 font-medium">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-secondary/70 font-medium">
                                    <span>Shipping</span>
                                    <span>{shipping === 0 ? <span className="text-green-600 font-bold">FREE</span> : `$${shipping.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between text-secondary/70 font-medium">
                                    <span>Estimated Tax</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between items-end pt-4 mt-2 border-t border-secondary/10">
                                    <span className="font-bold text-lg text-secondary">Total</span>
                                    <span className="text-3xl font-black text-secondary">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--color-secondary); opacity: 0.1; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default CheckoutPage;