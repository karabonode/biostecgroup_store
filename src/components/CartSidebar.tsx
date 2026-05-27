import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, CreditCard, ShoppingBag, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../context/AuthContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, updateItemPrice, getTotal } = useCartStore();
  const navigate = useNavigate();
  const [priceUpdates, setPriceUpdates] = useState<{ name: string; diff: number }[]>([]);
  const prevOpenRef = useRef(false);

  // Validate prices whenever the sidebar opens (false → true transition)
  useEffect(() => {
    if (!isOpen || prevOpenRef.current || items.length === 0) {
      prevOpenRef.current = isOpen;
      return;
    }
    prevOpenRef.current = true;

    const payload = items.map((i) => ({ id: i.id, priceCents: i.priceCents }));
    fetch(`${API_BASE_URL}/products/validate-cart.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: payload }),
      signal: AbortSignal.timeout(8000),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.stale && data.stale.length > 0) {
          const updates: { name: string; diff: number }[] = [];
          data.stale.forEach((s: { id: string; name: string; oldPriceCents: number; newPriceCents: number }) => {
            updateItemPrice(s.id, s.newPriceCents);
            updates.push({ name: s.name, diff: s.newPriceCents - s.oldPriceCents });
          });
          setPriceUpdates(updates);
          setTimeout(() => setPriceUpdates([]), 8000);
        }
      })
      .catch(() => { /* silent fail — price check is best-effort */ });
  }, [isOpen, items, updateItemPrice]);

  // Reset the "seen" flag when sidebar closes so it re-checks next open
  useEffect(() => {
    if (!isOpen) prevOpenRef.current = false;
  }, [isOpen]);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const gradeColors: Record<string, string> = {
    A: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    B: 'text-amber-700 bg-amber-50 border-amber-100',
    C: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Your Cart</h2>
                  <p className="text-xs text-slate-400">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price-update banner */}
            <AnimatePresence>
              {priceUpdates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mx-4 mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold mb-0.5">Prices updated</p>
                    {priceUpdates.map((u, i) => (
                      <p key={i}>
                        {u.name}: {u.diff > 0 ? '+' : ''}R{(Math.abs(u.diff) / 100).toLocaleString()}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-5">
                    <ShoppingBag className="w-9 h-9 text-slate-200" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2">Your cart is empty</h3>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Discover our collection of certified renewed business laptops.
                  </p>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-xl text-sm hover:bg-blue-800 transition-colors"
                  >
                    Browse Products
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-4 py-4 border-b border-slate-50 last:border-0"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                          <img
                            src={item.imageUrl || '/logo.png'}
                            alt={item.name}
                            className="w-full h-full object-contain p-1.5"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{item.name}</h3>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-brand-accent hover:bg-red-50 transition-all shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${gradeColors[item.grade] || gradeColors.C} mb-3`}>
                            Grade {item.grade}
                          </span>

                          <div className="flex items-center justify-between">
                            {/* Quantity */}
                            <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-100 rounded-lg p-0.5">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-brand-primary hover:bg-white transition-all"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold text-slate-800">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-brand-primary hover:bg-white transition-all"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <p className="text-sm font-bold text-slate-900">
                              R {(item.priceCents * item.quantity / 100).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
                {/* Summary */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-900">R {(getTotal() / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Delivery</span>
                    <span className="font-semibold text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-400 pt-2 border-t border-slate-100">
                    <span>VAT (15%)</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-slate-900">R {(getTotal() / 100).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2.5 py-4 bg-brand-primary text-white font-semibold rounded-xl hover:bg-blue-800 transition-all shadow-sm"
                >
                  <CreditCard className="w-5 h-5" />
                  Proceed to Checkout
                </button>

                {/* Trust note */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs text-slate-400">Secure checkout · 3-month warranty on all devices</p>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
