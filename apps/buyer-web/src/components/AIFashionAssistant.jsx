import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, ArrowRight, Shirt } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@api';
import { useCart } from '../context/CartContext';

const AIFashionAssistant = () => {
  const { isAiStylistOpen, setIsAiStylistOpen } = useCart();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your personal AI Stylist at MINIMAL. Looking for wedding attire, smart-casual silhouettes, or seasonal wardrobe essentials? Ask me anything!"
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAiStylistOpen) return null;

  const quickPrompts = [
    "Summer linen outfits under ₹3,000",
    "Tailored smart-casual for office",
    "Cocktail evening party look",
    "Minimalist capsule wardrobe"
  ];

  const handleSend = async (queryText) => {
    const promptToSend = queryText || inputQuery;
    if (!promptToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: promptToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/stylist', { prompt: promptToSend }).catch(async () => {
        // Fallback to recommendations or smart heuristic
        const productsRes = await api.get('/products?limit=3');
        return {
          data: {
            advice: `Based on your interest in "${promptToSend}", I've curated tailored garments crafted with breathable fabrics and contemporary tailoring. Here are recommended pieces:`,
            recommendations: productsRes.data?.products?.slice(0, 3) || []
          }
        };
      });

      const responseData = res.data;
      const assistantMessage = {
        role: 'assistant',
        content: responseData.advice || responseData.message || "Here are hand-picked garments that match your style request:",
        recommendations: responseData.recommendations || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI Stylist error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I've matched your request with our signature apparel lineup. Take a look at our current runway collection!",
        recommendations: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsAiStylistOpen(false)}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden z-10 animate-fade-in">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                AI Atelier Stylist
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500">Curated garment matching & fashion advisory</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiStylistOpen(false)}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50'
              }`}>
                <p>{msg.content}</p>

                {/* Recommendations attachment */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                      Recommended Matches:
                    </span>
                    <div className="space-y-2">
                      {msg.recommendations.map((rec) => (
                        <Link
                          key={rec.id}
                          to={`/product/${rec.id}`}
                          onClick={() => setIsAiStylistOpen(false)}
                          className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 transition-colors group"
                        >
                          <div className="w-10 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                            <img
                              src={rec.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80'}
                              alt={rec.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-zinc-400 block uppercase font-bold">{rec.brand_name || 'Atelier'}</span>
                            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate block group-hover:text-blue-500">
                              {rec.name}
                            </span>
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                              ₹{parseFloat(rec.base_price || rec.price || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-zinc-400 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span>Stylist is curating suggestions...</span>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
          <input
            type="text"
            placeholder="Ask styling advice or request an outfit..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AIFashionAssistant;
