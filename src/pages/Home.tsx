import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, Zap, Truck, RotateCcw, CreditCard,
  ShoppingCart, ChevronLeft, ChevronRight, Loader2,
  Laptop, Smartphone, Monitor, Headphones, Wrench, Cpu,
  Star, Heart, ArrowRight, BadgeCheck, Smile, Sparkles, Headphones as HeadphonesIcon, X
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts } from '../api/products';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  grade: 'A' | 'B' | 'C';
  image: string;
  specs: { cpu: string; ram: string; storage: string };
  stock: number;
  rating?: number;
}

// ─── Slides ───────────────────────────────────────────────────────────────────
interface Slide {
  desktop: string;
  phone: string;
  alt: string;
}

const DEFAULT_SLIDES: Slide[] = [
  { desktop: '/banners/1.png', phone: '/banners/phone-1.png', alt: 'New Product – Coming Soon' },
  { desktop: '/banners/2.png', phone: '/banners/phone-2.png', alt: 'Laptop Sale – 30% Off' },
  { desktop: '/banners/3.png', phone: '/banners/phone-3.png', alt: 'Refer a Friend – 10% Cash Back' },
  { desktop: '/banners/4.png', phone: '/banners/phone-4.png', alt: 'Repair Your Laptop – Book Today' },
];

// ─── Categories ───────────────────────────────────────────────────────────────
const categories = [
  { label: 'Laptops',     icon: Laptop,      href: '/products?category=laptops',     bg: 'bg-blue-50',   icon_color: 'text-brand-primary' },
  { label: 'MacBooks',    icon: Monitor,     href: '/products?category=macbooks',    bg: 'bg-slate-50',  icon_color: 'text-slate-700' },
  { label: 'Phones',      icon: Smartphone,  href: '/products?category=phones',      bg: 'bg-rose-50',   icon_color: 'text-rose-600' },
  { label: 'Processors',  icon: Cpu,         href: '/products?category=processors',  bg: 'bg-amber-50',  icon_color: 'text-amber-600' },
  { label: 'Accessories', icon: Headphones,  href: '/products?category=accessories', bg: 'bg-violet-50', icon_color: 'text-violet-600' },
  { label: 'Repair',      icon: Wrench,      href: '/repair',                        bg: 'bg-emerald-50',icon_color: 'text-emerald-600' },
];

// ─── Trust bar ────────────────────────────────────────────────────────────────
const trustItems = [
  { icon: ShieldCheck, title: '3-Month Warranty',     sub: 'On every device we sell' },
  { icon: Truck,       title: 'Free SA Delivery',     sub: 'Fast & tracked nationwide' },
  { icon: RotateCcw,   title: '10-Day Returns',       sub: 'No questions asked' },
  { icon: CreditCard,  title: 'Secure Payments',      sub: 'Yoco · EFT · Pay later' },
];

// ─── Grade config ─────────────────────────────────────────────────────────────
const gradeConfig = {
  A: { label: 'Grade A', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  B: { label: 'Grade B', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  C: { label: 'Grade C', bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200'   },
};

// ─── Slide animation variants ─────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

// ─── Social branches ──────────────────────────────────────────────────────────
const socialBranches = [
  {
    city: 'Cape Town', emoji: '🌊', handle: '@biostecgroup.cpt',
    links: [
      { name: 'Facebook',  url: 'https://www.facebook.com/biostecgroup.cpt',     gradient: 'from-blue-600 to-blue-700', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
      { name: 'Instagram', url: 'https://www.instagram.com/biostecgroup.cpt/',   gradient: 'from-pink-500 via-rose-500 to-orange-400', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
      { name: 'TikTok',   url: 'https://www.tiktok.com/@biostecgroup.cpt',      gradient: 'from-slate-900 to-slate-800', isTikTok: true, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.11 8.11 0 004.74 1.51V6.75a4.85 4.85 0 01-.97-.06z"/></svg> },
    ],
  },
  {
    city: 'Johannesburg', emoji: '🏙️', handle: '@BiostecGroup201',
    links: [
      { name: 'Facebook',  url: 'https://www.facebook.com/BiostecGroup201/',    gradient: 'from-blue-600 to-blue-700', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
      { name: 'Instagram', url: 'https://www.instagram.com/biostecgroup/',      gradient: 'from-pink-500 via-rose-500 to-orange-400', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
      { name: 'TikTok',   url: 'https://www.tiktok.com/@biostecgroup201',      gradient: 'from-slate-900 to-slate-800', isTikTok: true, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.11 8.11 0 004.74 1.51V6.75a4.85 4.85 0 01-.97-.06z"/></svg> },
    ],
  },
];

export default function Home() {
  const [products, setProducts]           = useState<Product[]>([]);
  const [iphoneProducts, setIphoneProducts] = useState<Product[]>([]);
  const [slides, setSlides]               = useState<Slide[]>(DEFAULT_SLIDES);
  const [filter, setFilter]               = useState<'all' | 'A' | 'B'>('all');
  const [loading, setLoading]             = useState(true);
  const [showPromo, setShowPromo]         = useState(true);
  const [wishlist, setWishlist]           = useState<Set<string>>(new Set());
  const [currentSlide, setCurrentSlide]   = useState(0);
  const [direction, setDirection]         = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();

  // ── Products ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const fetchProducts = async () => {
      try {
        const filters = filter === 'all' ? undefined : { grade: filter };
        const data = await getProducts(filters);
        setProducts(data.map(p => ({
          id:            String(p.id),
          name:          p.name,
          description:   p.description || p.short_description || '',
          price:         p.price,
          originalPrice: p.compare_at_price || Math.round(p.price * 1.6),
          grade:         p.grade as 'A' | 'B' | 'C',
          image:         p.featured_image || '/logo.png',
          specs:         (p.specs || { cpu: '', ram: '', storage: '' }) as { cpu: string; ram: string; storage: string },
          stock:         p.stock_quantity,
          rating:        p.rating,
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filter]);

  // ── iPhone products ──────────────────────────────────────────────────────────
  useEffect(() => {
    getProducts({ search: 'iPhone' })
      .then(data => setIphoneProducts(data.slice(0, 8)))
      .catch(() => {});
  }, []);

  // ── Banner slides from API ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/banners/index.php')
      .then(r => r.json())
      .then(data => {
        if (data.slides && data.slides.length > 0) setSlides(data.slides);
      })
      .catch(() => {});
  }, []);

  // ── Carousel ────────────────────────────────────────────────────────────────
  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrentSlide(index);
  }, []);

  const prev = useCallback(() => {
    const next = (currentSlide - 1 + slides.length) % slides.length;
    goTo(next, -1);
  }, [currentSlide, goTo]);

  const next = useCallback(() => {
    const next = (currentSlide + 1) % slides.length;
    goTo(next, 1);
  }, [currentSlide, goTo]);

  useEffect(() => {
    const t = setInterval(next, 4800);
    return () => clearInterval(t);
  }, [next]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem({
      id:         product.id,
      name:       product.name,
      priceCents: Math.round(product.price * 100),
      grade:      product.grade,
      imageUrl:   product.image,
      specs:      product.specs,
      stock:      product.stock,
      quantity:   1,
    });
  };

  const specsLine = (specs: Product['specs']) =>
    [specs.cpu, specs.ram, specs.storage].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-white">

      {/* ── Promo strip ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPromo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-brand-primary text-white overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center relative">
              <p className="text-xs font-medium text-center">
                <span className="font-bold">🤝 Refer a Friend</span> — Share Biostec with a friend and <strong>both of you get 10% cash back</strong> on your next order · <a href="/contact" className="underline underline-offset-2 hover:opacity-80">Ask us how</a>
              </p>
              <button onClick={() => setShowPromo(false)} className="absolute right-4 hover:opacity-70 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Carousel ────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-white select-none">
        {/* Desktop slides */}
        <div className="hidden md:block relative w-full">
          <AnimatePresence custom={direction} mode="wait">
            <motion.img
              key={`d-${currentSlide}`}
              src={slides[currentSlide].desktop}
              alt={slides[currentSlide].alt}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="w-full h-auto block"
              draggable={false}
            />
          </AnimatePresence>
        </div>

        {/* Mobile slides */}
        <div className="block md:hidden relative w-full">
          <AnimatePresence custom={direction} mode="wait">
            <motion.img
              key={`p-${currentSlide}`}
              src={slides[currentSlide].phone}
              alt={slides[currentSlide].alt}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="w-full h-auto block"
              draggable={false}
            />
          </AnimatePresence>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 flex items-center justify-center bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-md transition-all hover:scale-105"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 flex items-center justify-center bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-md transition-all hover:scale-105"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > currentSlide ? 1 : -1)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-6 bg-brand-primary' : 'w-2 bg-white/60 hover:bg-white'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4 lg:py-5">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-xl shrink-0">
                  <item.icon className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop by Category ─────────────────────────────────────────────────── */}
      <section className="py-10 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                to={cat.href}
                className="group flex flex-col items-center gap-2.5 p-4 bg-white rounded-2xl border border-slate-100 hover:border-brand-primary hover:shadow-md transition-all duration-200"
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${cat.bg} group-hover:scale-110 transition-transform duration-200`}>
                  <cat.icon className={`w-6 h-6 ${cat.icon_color}`} />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-primary transition-colors text-center leading-tight">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ────────────────────────────────────────────────── */}
      <section id="products-section" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-1">Certified Renewed</p>
              <h2 className="text-2xl font-bold text-slate-900">Featured Devices</h2>
            </div>

            {/* Grade filter tabs — Revibe style */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'A', 'B'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setFilter(g)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
                    filter === g
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary hover:text-brand-primary'
                  }`}
                >
                  {g === 'all' ? 'All Devices' : `Grade ${g}`}
                </button>
              ))}
              <Link
                to="/products"
                className="px-5 py-2 rounded-full text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5"
              >
                See all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-slate-500">No products available right now.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.slice(0, 10).map((product) => {
                const grade = gradeConfig[product.grade] || gradeConfig.C;
                const isWishlisted = wishlist.has(product.id);
                const hasSavings = product.originalPrice && product.originalPrice > product.price;
                const savePct = hasSavings
                  ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                  : 0;

                return (
                  <article
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-brand-primary/30 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
                  >
                    {/* Image area */}
                    <div className="relative bg-slate-50 aspect-square overflow-hidden">
                      <img
                        src={product.image || '/logo.png'}
                        alt={product.name}
                        className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Wishlist */}
                      <button
                        onClick={(e) => toggleWishlist(product.id, e)}
                        className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:scale-110 transition-transform z-10"
                      >
                        <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-brand-accent text-brand-accent' : 'text-slate-400'}`} />
                      </button>

                      {/* Sale badge */}
                      {hasSavings && savePct > 0 && (
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="px-2 py-0.5 bg-brand-accent text-white text-[10px] font-bold rounded-md">
                            -{savePct}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 flex flex-col flex-1">
                      {/* Grade pill */}
                      <span className={`inline-flex self-start px-2 py-0.5 rounded text-[10px] font-semibold border mb-1.5 ${grade.bg} ${grade.text} ${grade.border}`}>
                        {grade.label}
                      </span>

                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug mb-1.5 flex-1">
                        {product.name}
                      </h3>

                      {specsLine(product.specs) && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">{specsLine(product.specs)}</p>
                      )}

                      {/* Pricing */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-base font-bold text-slate-900">R {product.price.toLocaleString()}</span>
                        {hasSavings && (
                          <span className="text-xs text-slate-400 line-through">R {product.originalPrice!.toLocaleString()}</span>
                        )}
                      </div>

                      {/* Add to cart — always visible (Revibe style) */}
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={product.stock === 0}
                        className={`w-full py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          product.stock === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-brand-primary text-white hover:bg-blue-800 active:scale-95'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* View all CTA */}
          {!loading && products.length > 0 && (
            <div className="text-center mt-10">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-700 transition-all text-sm"
              >
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Certified Renewed iPhones ───────────────────────────────────────── */}
      {iphoneProducts.length > 0 && (
        <section className="py-12 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-900">
                Certified Renewed iPhones
              </h2>
              <Link
                to="/products?search=iPhone"
                className="text-xs font-semibold text-slate-500 border border-slate-300 rounded-full px-4 py-1.5 hover:border-slate-500 hover:text-slate-700 transition-all"
              >
                See all
              </Link>
            </div>

            {/* Body: promo banner + horizontal card scroll */}
            <div className="flex gap-4 items-stretch">

              {/* Promo banner */}
              <div className="hidden sm:block flex-shrink-0 w-56 md:w-64 lg:w-72 rounded-2xl overflow-hidden">
                <img
                  src="/images/ui_iphone/ui_desktop/1.png"
                  alt="Up to 70% off on iPhones"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Scrollable cards */}
              <div className="flex-1 min-w-0 relative">
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {iphoneProducts.map((p) => {
                    const originalPrice = p.compare_at_price || Math.round(p.price * 1.6);
                    const savePct = Math.round(((originalPrice - p.price) / originalPrice) * 100);
                    const isWishlisted = wishlist.has(String(p.id));
                    return (
                      <article
                        key={p.id}
                        onClick={() => navigate(`/product/${p.id}`)}
                        className="snap-start flex-shrink-0 w-44 sm:w-48 bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
                      >
                        {/* Image */}
                        <div className="relative bg-slate-50 aspect-square overflow-hidden flex items-center justify-center p-3">
                          <img
                            src={p.featured_image || '/logo.png'}
                            alt={p.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Wishlist */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(String(p.id), e); }}
                            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm hover:scale-110 transition-transform z-10"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-brand-accent text-brand-accent' : 'text-slate-400'}`} />
                          </button>
                          {/* Discount badge */}
                          {savePct > 0 && (
                            <div className="absolute top-2 left-2 z-10">
                              <span className="px-1.5 py-0.5 bg-[#c2185b] text-white text-[9px] font-bold rounded">
                                -{savePct}% vs new
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-2.5 flex flex-col flex-1">
                          <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug mb-2 flex-1">
                            {p.name}
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            R {p.price.toLocaleString()}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Verified Devices ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Our Promise</p>
            <h2 className="text-2xl font-bold text-slate-900">Every Device Verified by Experts</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left */}
            <div className="space-y-8">
              {[
                { icon: Smile,      title: 'Risk Free',             desc: '10 days to return — no questions asked.' },
                { icon: BadgeCheck, title: 'One-by-One Verification', desc: '50-point quality check on screen, battery, speed and durability.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col lg:items-end text-center lg:text-right gap-2"
                >
                  <div className="flex justify-center lg:justify-end">
                    <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-brand-primary" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Centre image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <img src="/devices-showcase.png" alt="Verified devices" className="max-w-full max-h-72 object-contain drop-shadow-xl" />
            </motion.div>

            {/* Right */}
            <div className="space-y-8">
              {[
                { icon: Sparkles,    title: 'Only the Best Suppliers', desc: 'Rigorous vetting — only 1 in 4 suppliers qualifies.' },
                { icon: HeadphonesIcon, title: 'Always Here for You', desc: 'Proactive support to solve any issue, fast.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center lg:items-start text-center lg:text-left gap-2"
                >
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Social ───────────────────────────────────────────────────────────── */}
      <section className="relative py-20 bg-slate-950 overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-700/15 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-pink-700/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Stay Connected</p>
            <h2 className="text-3xl font-bold mb-3">
              Find Us on{' '}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-pink-400 to-cyan-400">
                Social Media
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Follow our Cape Town &amp; Johannesburg branches for daily deals and unboxings.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {socialBranches.map((branch, bi) => (
              <motion.div
                key={branch.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: bi * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">{branch.emoji}</span>
                  <div>
                    <h3 className="text-lg font-bold">{branch.city}</h3>
                    <p className="text-xs text-slate-400">{branch.handle}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {branch.links.map((link) => (
                    <motion.a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3.5 rounded-xl p-3.5 bg-linear-to-r ${link.gradient}`}
                    >
                      <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/20">
                        {link.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">Follow on {link.name}</p>
                        {link.isTikTok && (
                          <p className="text-[10px] opacity-70">
                            <span className="text-[#00f2ea]">Tik</span><span className="text-[#ff0050]">Tok</span>
                          </p>
                        )}
                      </div>
                      <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
