import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck, ShoppingCart, CheckCircle2, Truck, Clock,
  ChevronRight, Loader2, Zap, Award, HardDrive,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { getProduct } from '../api/products';

const gradeInfo = {
  A: {
    label: 'Grade A',
    desc: 'Like new — minimal signs of use',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  B: {
    label: 'Grade B',
    desc: 'Good condition — light cosmetic wear',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  C: {
    label: 'Grade C',
    desc: 'Fair condition — functional, visible wear',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

const SPEC_META: Record<string, { label: string; Icon: React.ElementType }> = {
  cpu:     { label: 'Processor', Icon: Zap },
  ram:     { label: 'Memory',    Icon: Award },
  storage: { label: 'Storage',   Icon: HardDrive },
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Awaited<ReturnType<typeof getProduct>> | null>(null);
  const [loading, setLoading]         = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [added, setAdded]             = useState(false);
  const [showSticky, setShowSticky]   = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id).then(setProduct).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  // Show sticky bar when the Add-to-Cart button scrolls out of view
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
          <p className="text-slate-500 mb-6">This item might have been sold or removed.</p>
          <Link to="/products" className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors">
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  // Build ordered image list: featured first, then extras
  const allImages = [
    ...(product.featured_image ? [product.featured_image] : []),
    ...((product.images ?? []).filter((img) => img !== product.featured_image)),
  ].filter(Boolean);
  if (allImages.length === 0) allImages.push('/logo.png');

  const priceCents   = product.price * 100;
  const compareCents = product.compare_at_price
    ? product.compare_at_price * 100
    : Math.round(priceCents * 1.7);
  const savingsPct = Math.round(((compareCents - priceCents) / compareCents) * 100);

  const grade      = gradeInfo[product.grade] ?? gradeInfo.C;
  const specs      = (product.specs ?? {}) as Record<string, string>;
  const specEntries = Object.entries(specs).filter(([, v]) => v);
  const outOfStock = product.stock_quantity === 0;

  const handleAddToCart = () => {
    addItem({
      id: String(product.id),
      name: product.name,
      priceCents,
      quantity: 1,
      imageUrl: allImages[0],
      grade: product.grade,
      specs,
      stock: product.stock_quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const cartBtnBase = `flex items-center justify-center gap-2 font-semibold rounded-xl transition-all`;
  const cartBtnColor = outOfStock
    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
    : added
    ? 'bg-emerald-600 text-white'
    : 'bg-brand-primary text-white hover:bg-blue-800 shadow-sm';

  return (
    <div className="min-h-screen bg-white">

      {/* ── Sticky scroll bar ──────────────────────────────────── */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-md
                    transition-transform duration-200 ${showSticky ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 sm:gap-5">
          {/* Thumbnail (desktop only) */}
          <img
            src={allImages[0]}
            alt={product.name}
            className="hidden sm:block w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 p-0.5 shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
          />
          {/* Name + grade */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate leading-tight">{product.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${grade.bg} ${grade.text} ${grade.border}`}>
                {grade.label}
              </span>
              {specs.cpu && <span className="text-[11px] text-slate-400 truncate hidden sm:block">{specs.cpu}</span>}
            </div>
          </div>
          {/* Price */}
          <div className="shrink-0 text-right">
            <p className="font-bold text-slate-900">R {(priceCents / 100).toLocaleString()}</p>
            <p className="text-xs text-slate-400 line-through">R {(compareCents / 100).toLocaleString()}</p>
          </div>
          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`${cartBtnBase} ${cartBtnColor} px-4 py-2.5 text-sm shrink-0`}
          >
            {outOfStock ? 'Out of Stock' : added
              ? <><CheckCircle2 className="w-4 h-4" /> Added!</>
              : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
            }
          </button>
        </div>
      </div>

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <div className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-1 text-sm text-slate-400 flex-wrap">
            <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link to="/products" className="hover:text-brand-primary transition-colors">Products</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-slate-700 font-medium truncate max-w-[180px] sm:max-w-sm">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Main section ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* ── Image gallery ──────────────────────────────────── */}
          <div className="lg:col-span-7">

            {/* Desktop layout: vertical thumbnails + main image side by side */}
            <div className="flex gap-3">
              {allImages.length > 1 && (
                <div className="hidden md:flex flex-col gap-2 shrink-0 w-16">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImg(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all
                        ${selectedImg === i ? 'border-brand-primary shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <img
                        src={img} alt={`View ${i + 1}`}
                        className="w-full h-full object-contain p-1.5 bg-slate-50"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="flex-1 relative">
                {savingsPct > 0 && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-full shadow-lg">
                      -{savingsPct}% vs new
                    </span>
                  </div>
                )}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${grade.bg} ${grade.text} ${grade.border}`}>
                    {grade.label}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 aspect-square">
                  <img
                    src={allImages[selectedImg] ?? '/logo.png'}
                    alt={product.name}
                    className="w-full h-full object-contain p-8"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                  />
                </div>
              </div>
            </div>

            {/* Mobile: horizontal thumbnail strip below main image */}
            {allImages.length > 1 && (
              <div className="flex md:hidden gap-2.5 mt-3 overflow-x-auto pb-1 scrollbar-thin">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all
                      ${selectedImg === i ? 'border-brand-primary shadow-md' : 'border-slate-200'}`}
                  >
                    <img
                      src={img} alt={`View ${i + 1}`}
                      className="w-full h-full object-contain p-1.5 bg-slate-50"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Certified banner */}
            <div className="mt-4 flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
              <p className="text-xs text-brand-primary font-medium leading-snug">
                Every device passes a 40-point quality inspection before dispatch.
              </p>
            </div>
          </div>

          {/* ── Product info ───────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col">

            {/* Category label */}
            {product.category_name && (
              <p className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-2">
                {product.category_name}
              </p>
            )}

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
              {product.name}
            </h1>

            {/* Price block */}
            <div className="flex items-end gap-3 mb-5">
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                R {(priceCents / 100).toLocaleString()}
              </p>
              <div className="mb-1">
                <p className="text-sm text-slate-400 line-through">R {(compareCents / 100).toLocaleString()} new</p>
                <p className="text-xs font-bold text-emerald-600">Save {savingsPct}%</p>
              </div>
            </div>

            {/* Grade badge */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border mb-5 ${grade.bg} ${grade.border}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${grade.dot}`} />
              <div>
                <p className={`text-sm font-bold ${grade.text}`}>{grade.label}</p>
                <p className={`text-xs mt-0.5 ${grade.text} opacity-80`}>{grade.desc}</p>
              </div>
            </div>

            {/* Spec chips */}
            {specEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {specEntries.map(([key, value]) => {
                  const meta = SPEC_META[key];
                  const Icon = meta?.Icon ?? Zap;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                    >
                      <Icon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="text-slate-400">{meta?.label ?? key}:</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Low stock warning */}
            {!outOfStock && product.stock_quantity <= 5 && (
              <p className="text-xs font-semibold text-amber-600 mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                Only {product.stock_quantity} left in stock — order soon!
              </p>
            )}

            {/* Add to Cart — this div is watched for sticky bar trigger */}
            <div ref={ctaRef} className="mb-6">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={`${cartBtnBase} ${cartBtnColor} w-full py-4 text-base`}
              >
                {outOfStock
                  ? 'Out of Stock'
                  : added
                  ? <><CheckCircle2 className="w-5 h-5" /> Added to Cart!</>
                  : <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                }
              </button>
            </div>

            {/* Trust badges — 2×2 */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { Icon: Truck,         label: 'Free Delivery',     sub: 'Nationwide' },
                { Icon: Clock,         label: '3-Month Warranty',  sub: 'All devices' },
                { Icon: ShieldCheck,   label: 'Certified Renewed', sub: '40-point check' },
                { Icon: CheckCircle2,  label: 'Secure Checkout',   sub: 'Powered by Yoco' },
              ] as { Icon: React.ElementType; label: string; sub: string }[]).map(({ Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{label}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Technical Specifications ────────────────────────────── */}
      {specEntries.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-100 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Technical Specifications</h2>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden max-w-2xl">
              {specEntries.map(([key, value], i) => {
                const meta = SPEC_META[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-6 py-4 ${i > 0 ? 'border-t border-slate-50' : ''}`}
                  >
                    <span className="text-sm text-slate-500">
                      {meta?.label ?? (key.charAt(0).toUpperCase() + key.slice(1))}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 text-right max-w-[55%]">{value}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
                <span className="text-sm text-slate-500">Condition</span>
                <span className={`text-sm font-semibold ${grade.text}`}>{grade.label}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
                <span className="text-sm text-slate-500">Warranty</span>
                <span className="text-sm font-semibold text-slate-900">3 Months (Biostec)</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Description ─────────────────────────────────────────── */}
      {(product.description || product.short_description) && (
        <section className="py-14 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">About this device</h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              {product.description || product.short_description}
            </p>
          </div>
        </section>
      )}

    </div>
  );
}
