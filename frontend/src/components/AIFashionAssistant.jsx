import { useState } from 'react';
import { Sparkles, X, Send, Bot, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/Axios';
import { formatCurrency } from '../services/Currency';

const AIFashionAssistant = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            text: "Hello! I am your AI Fashion Stylist for MINIMAL. Looking for something specific? Ask me like: 'Find black oversized cotton t-shirts under ₹1,000' or ask about order status & return policies."
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMsg = { sender: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Determine if query is shopping search or support
            const lower = trimmed.toLowerCase();
            const isSupport = lower.includes('return') || lower.includes('shipping policy') || lower.includes('delivery time') || lower.includes('refund');

            if (isSupport) {
                const res = await api.post('/ai/support', { question: trimmed });
                setMessages(prev => [...prev, { sender: 'ai', text: res.data.answer }]);
            } else {
                const res = await api.post('/ai/shop-assistant', { message: trimmed });
                setMessages(prev => [...prev, {
                    sender: 'ai',
                    text: res.data.reply,
                    products: res.data.products || []
                }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                sender: 'ai',
                text: "I'm having a little trouble connecting to the styling engine right now. Please try again or browse our Shop All catalog."
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Slide-over Drawer */}
            <div className="relative z-10 w-full max-w-md bg-dominant border-l border-secondary/15 h-full flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-secondary/10 flex items-center justify-between bg-secondary/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-accent text-dominant flex items-center justify-center font-bold shadow-sm">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-secondary text-base">MINIMAL. AI Stylist</h3>
                            <p className="text-xs text-secondary/60">Catalog recommendations & support</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-secondary/60 hover:text-secondary rounded-lg cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                msg.sender === 'user'
                                    ? 'bg-secondary text-dominant rounded-br-none'
                                    : 'bg-secondary/10 text-secondary rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>

                            {/* Render matching products if available */}
                            {msg.products && msg.products.length > 0 && (
                                <div className="mt-3 space-y-2 w-full">
                                    {msg.products.map(prod => (
                                        <div
                                            key={prod.id}
                                            onClick={() => {
                                                onClose();
                                                navigate(`/product/${prod.id}`);
                                            }}
                                            className="flex items-center gap-3 p-2.5 bg-dominant border border-secondary/15 rounded-xl hover:border-accent hover:shadow-md transition cursor-pointer"
                                        >
                                            <div className="w-12 h-14 rounded-lg bg-secondary/10 overflow-hidden flex-shrink-0">
                                                {prod.main_image ? (
                                                    <img src={prod.main_image} alt={prod.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-secondary/40">
                                                        <ShoppingBag size={18} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-secondary text-sm truncate">{prod.name}</h4>
                                                <p className="text-xs text-secondary/60">{prod.store_name || 'Independent Store'}</p>
                                                <p className="text-xs font-bold text-accent mt-0.5">{formatCurrency(prod.base_price)}</p>
                                            </div>
                                            <ArrowRight size={16} className="text-secondary/40 mr-1 flex-shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-center gap-2 text-xs text-secondary/60 bg-secondary/5 px-3 py-2 rounded-xl w-fit">
                            <Bot size={16} className="animate-pulse text-accent" />
                            Stylist is curating recommendations...
                        </div>
                    )}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSend} className="p-4 border-t border-secondary/10 bg-dominant">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask stylist (e.g. Linen shirts under ₹1,500)..."
                            className="w-full pr-12 pl-4 py-3 bg-secondary/5 border border-secondary/15 rounded-xl text-sm text-secondary focus:outline-none focus:border-accent"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2 p-2 bg-secondary text-dominant rounded-lg hover:bg-accent disabled:opacity-40 transition cursor-pointer"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AIFashionAssistant;
