import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart, Loader2, ChevronDown, X, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  category?: string;
}

const gradeConfig = {
  A: { label: 'Grade A', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  B: { label: 'Grade B', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  C: { label: 'Grade C', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

const colorOptions = [
  { name: 'Black', value: '#1a1a1a' },
  { name: 'White', value: '#f5f5f5' },
  { name: 'Silver', value: '#c0c0c0' },
  { name: 'Gray', value: '#718096' },
  { name: 'Blue', value: '#3182ce' },
  { name: 'Red', value: '#e53e3e' },
  { name: 'Green', value: '#38a169' },
  { name: 'Gold', value: '#d69e2e' },
  { name: 'Purple', value: '#805ad5' },
];

const productColors: Record<string, string[]> = {
  iPhone: ['#1a1a1a', '#f5f5f5', '#4a5568', '#e53e3e', '#3182ce'],
  MacBook: ['#1a1a1a', '#f5f5f5', '#718096'],
  Dell: ['#1a1a1a', '#f5f5f5', '#c0c0c0'],
  HP: ['#1a1a1a', '#f5f5f5', '#718096'],
  Lenovo: ['#1a1a1a', '#f5f5f5'],
  Samsung: ['#1a1a1a', '#f5f5f5', '#3182ce'],
  default: ['#1a1a1a', '#f5f5f5', '#718096'],
};

const getProductColors = (name: string) => {
  for (const [key, colors] of Object.entries(productColors)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return colors;
  }
  return productColors.default;
};

const extractStorageGB = (s: string) => {
  const m = s?.match(/(\d+)\s*(GB|TB|G|T)/i);
  if (!m) return 0;
  return m[2].toUpperCase().startsWith('T') ? parseInt(m[1]) * 1000 : parseInt(m[1]);
};

const extractRAMGB = (s: string) => {
  const m = s?.match(/(\d+)\s*GB/i);
  return m ? parseInt(m[1]) : 0;
};

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-slate-100 pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-sm font-semibold text-slate-800 mb-3"
      >
        {title}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [selectedRAM, setSelectedRAM] = useState<string[]>([]);
  const [selectedCPU, setSelectedCPU] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  const category = searchParams.get('category') || 'all';

  useEffect(() => {
    setLoading(true);
    getProducts().then(data => {
      const mapped = data.map(p => ({
        id: String(p.id),
        name: p.name,
        description: p.description || p.short_description || '',
        price: p.price,
        originalPrice: p.compare_at_price || Math.round(p.price * 1.9),
        grade: p.grade as 'A' | 'B' | 'C',
        image: p.featured_image || '/logo.png',
        specs: (p.specs || { cpu: '', ram: '', storage: '' }) as { cpu: string; ram: string; storage: string },
        stock: p.stock_quantity,
        rating: p.rating,
        category: p.category_name || 'laptop',
      }));
      setProducts(mapped);
      setFilteredProducts(mapped);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filterOptions = useMemo(() => {
    const storage = new Set<string>();
    const ram = new Set<string>();
    const cpus = new Set<string>();
    products.forEach(p => {
      if (p.specs.storage) storage.add(p.specs.storage);
      if (p.specs.ram) ram.add(p.specs.ram);
      if (p.specs.cpu) {
        const c = p.specs.cpu.toLowerCase();
        if (c.includes('i3')) cpus.add('Intel Core i3');
        else if (c.includes('i5')) cpus.add('Intel Core i5');
        else if (c.includes('i7')) cpus.add('Intel Core i7');
        else if (c.includes('i9')) cpus.add('Intel Core i9');
        else if (c.includes('ryzen 3')) cpus.add('AMD Ryzen 3');
        else if (c.includes('ryzen 5')) cpus.add('AMD Ryzen 5');
        else if (c.includes('ryzen 7')) cpus.add('AMD Ryzen 7');
        else if (c.includes('ryzen 9')) cpus.add('AMD Ryzen 9');
        else cpus.add(p.specs.cpu.split(' ').slice(0, 3).join(' '));
      }
    });
    return {
      storage: Array.from(storage).sort((a, b) => extractStorageGB(a) - extractStorageGB(b)),
      ram: Array.from(ram).sort((a, b) => extractRAMGB(a) - extractRAMGB(b)),
      cpus: Array.from(cpus).sort(),
    };
  }, [products]);

  useEffect(() => {
    let filtered = [...products];
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (category !== 'all') {
      const catLower = category.toLowerCase();
      const LAPTOP_CATS = ['laptops', 'laptop', 'business laptops', 'business-laptops', 'ultrabooks', 'workstations'];
      const MACBOOK_CATS = ['macbooks', 'macbook'];
      const PHONE_CATS = ['phones', 'phone'];
      const PROCESSOR_CATS = ['processors', 'processor'];
      const ACCESSORY_CATS = ['accessories', 'accessory'];
      filtered = filtered.filter(p => {
        const pCat = p.category?.toLowerCase() || '';
        if (LAPTOP_CATS.includes(catLower)) return LAPTOP_CATS.some(c => pCat.includes(c));
        if (MACBOOK_CATS.includes(catLower)) return MACBOOK_CATS.some(c => pCat === c);
        if (PHONE_CATS.includes(catLower)) return PHONE_CATS.some(c => pCat === c);
        if (PROCESSOR_CATS.includes(catLower)) return PROCESSOR_CATS.some(c => pCat === c);
        if (ACCESSORY_CATS.includes(catLower)) return ACCESSORY_CATS.some(c => pCat === c);
        return pCat === catLower || p.name.toLowerCase().includes(catLower);
      });
    }
    if (selectedGrades.length) filtered = filtered.filter(p => selectedGrades.includes(p.grade));
    if (selectedStorage.length) filtered = filtered.filter(p => selectedStorage.some(s => p.specs.storage === s));
    if (selectedRAM.length) filtered = filtered.filter(p => selectedRAM.some(r => p.specs.ram === r));
    if (selectedCPU.length) {
      filtered = filtered.filter(p => {
        const c = p.specs.cpu?.toLowerCase() || '';
        return selectedCPU.some(sel => {
          const sl = sel.toLowerCase();
          if (sl.includes('i3')) return c.includes('i3');
          if (sl.includes('i5')) return c.includes('i5');
          if (sl.includes('i7')) return c.includes('i7');
          if (sl.includes('i9')) return c.includes('i9');
          if (sl.includes('ryzen 3')) return c.includes('ryzen 3');
          if (sl.includes('ryzen 5')) return c.includes('ryzen 5');
          if (sl.includes('ryzen 7')) return c.includes('ryzen 7');
          if (sl.includes('ryzen 9')) return c.includes('ryzen 9');
          return c.includes(sl);
        });
      });
    }
    if (selectedColors.length) {
      filtered = filtered.filter(p =>
        selectedColors.some(sc => getProductColors(p.name).includes(sc))
      );
    }
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, priceRange, category, selectedStorage, selectedRAM, selectedCPU, selectedGrades, selectedColors]);

  useEffect(() => {
    setExpandedCategories(new Set(filteredProducts.map(p => p.category || 'Others')));
  }, [filteredProducts]);

  const toggleFilter = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
  };

  const clearAllFilters = () => {
    setPriceRange([0, 50000]);
    setSelectedStorage([]);
    setSelectedRAM([]);
    setSelectedCPU([]);
    setSelectedGrades([]);
    setSelectedColors([]);
  };

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activeFiltersCount = selectedStorage.length + selectedRAM.length + selectedCPU.length + selectedGrades.length + selectedColors.length;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const filterSidebar = (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900 text-base">Filters</h3>
        {activeFiltersCount > 0 && (
          <button onClick={clearAllFilters} className="flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:text-brand-accent transition-colors">
            <X className="w-3.5 h-3.5" />
            Clear ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Price */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wide">Min</label>
              <input
                type="number"
                value={priceRange[0]}
                onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-full mt-0.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
            <span className="text-slate-300 mt-4">—</span>
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wide">Max</label>
              <input
                type="number"
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || 50000])}
                className="w-full mt-0.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
          </div>
          <input
            type="range" min="0" max="50000" step="500"
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-primary"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>R {priceRange[0].toLocaleString()}</span>
            <span>R {priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </FilterSection>

      {/* Grade */}
      <FilterSection title="Grade">
        <div className="space-y-2">
          {(['A', 'B', 'C'] as const).map(grade => {
            const cfg = gradeConfig[grade];
            return (
              <label key={grade} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedGrades.includes(grade)}
                  onChange={() => toggleFilter(grade, setSelectedGrades)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
                />
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  {cfg.label}
                </span>
                <span className="text-xs text-slate-400 ml-auto">
                  ({products.filter(p => p.grade === grade).length})
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Storage */}
      {filterOptions.storage.length > 0 && (
        <FilterSection title="Storage">
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {filterOptions.storage.map(s => (
              <label key={s} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedStorage.includes(s)}
                  onChange={() => toggleFilter(s, setSelectedStorage)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-sm text-slate-700">{s}</span>
                <span className="text-xs text-slate-400 ml-auto">({products.filter(p => p.specs.storage === s).length})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* RAM */}
      {filterOptions.ram.length > 0 && (
        <FilterSection title="RAM">
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {filterOptions.ram.map(r => (
              <label key={r} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedRAM.includes(r)}
                  onChange={() => toggleFilter(r, setSelectedRAM)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-sm text-slate-700">{r}</span>
                <span className="text-xs text-slate-400 ml-auto">({products.filter(p => p.specs.ram === r).length})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* CPU */}
      {filterOptions.cpus.length > 0 && (
        <FilterSection title="Processor">
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {filterOptions.cpus.map(cpu => (
              <label key={cpu} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCPU.includes(cpu)}
                  onChange={() => toggleFilter(cpu, setSelectedCPU)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-sm text-slate-700">{cpu}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Color */}
      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(color => (
            <button
              key={color.value}
              onClick={() => toggleFilter(color.value, setSelectedColors)}
              title={color.name}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                selectedColors.includes(color.value) ? 'border-brand-primary scale-110 ring-2 ring-brand-primary/20' : 'border-white shadow-sm'
              }`}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-1">Shop Renewed Tech</h1>
          <p className="text-slate-400 text-sm">Business-ready laptops and devices — tested and guaranteed.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 sticky top-20 shadow-card">
              {filterSidebar}
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center bg-brand-primary text-white text-[10px] font-bold rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-900">{filteredProducts.length}</span> products
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={e => setItemsPerPage(parseInt(e.target.value))}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedGrades.map(g => (
                  <button key={g} onClick={() => toggleFilter(g, setSelectedGrades)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded-full hover:bg-brand-primary/20 transition-colors">
                    Grade {g} <X className="w-3 h-3" />
                  </button>
                ))}
                {selectedStorage.map(s => (
                  <button key={s} onClick={() => toggleFilter(s, setSelectedStorage)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded-full hover:bg-brand-primary/20 transition-colors">
                    {s} <X className="w-3 h-3" />
                  </button>
                ))}
                {selectedRAM.map(r => (
                  <button key={r} onClick={() => toggleFilter(r, setSelectedRAM)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded-full hover:bg-brand-primary/20 transition-colors">
                    {r} <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            {/* Products */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-slate-500 mb-2">No products match your filters.</p>
                <button onClick={clearAllFilters} className="px-5 py-2 bg-brand-primary text-white text-sm font-medium rounded-xl hover:bg-blue-800 transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Grouped by category */}
                {(() => {
                  const grouped = new Map<string, typeof paginatedProducts>();
                  paginatedProducts.forEach(p => {
                    const cat = p.category || 'Others';
                    if (!grouped.has(cat)) grouped.set(cat, []);
                    grouped.get(cat)!.push(p);
                  });

                  return Array.from(grouped.entries()).map(([cat, prods]) => (
                    <div key={cat} className="mb-10">
                      <div
                        className="flex items-center gap-3 mb-5 cursor-pointer group"
                        onClick={() => {
                          setExpandedCategories(prev => {
                            const next = new Set(prev);
                            next.has(cat) ? next.delete(cat) : next.add(cat);
                            return next;
                          });
                        }}
                      >
                        <h2 className="text-xl font-bold text-slate-900 capitalize">{cat}</h2>
                        <span className="px-2.5 py-0.5 bg-blue-50 text-brand-primary text-xs font-semibold rounded-full">
                          {prods.length}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ml-auto ${expandedCategories.has(cat) ? 'rotate-180' : ''}`} />
                      </div>

                      {expandedCategories.has(cat) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                          {prods.map(product => {
                            const grade = gradeConfig[product.grade] || gradeConfig.C;
                            const isWishlisted = wishlist.has(product.id);
                            const specsLine = [product.specs.cpu, product.specs.ram, product.specs.storage].filter(Boolean).join(' · ');
                            return (
                              <motion.article
                                key={product.id}
                                whileHover={{ y: -4 }}
                                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card hover:shadow-card-hover hover:border-slate-200 transition-all duration-200 cursor-pointer"
                                onClick={() => navigate(`/product/${product.id}`)}
                              >
                                <div className="relative aspect-square bg-slate-50 overflow-hidden">
                                  <img
                                    src={product.image || '/logo.png'}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute top-2.5 left-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${grade.bg} ${grade.text} ${grade.border}`}>
                                      {grade.label}
                                    </span>
                                  </div>
                                  <button
                                    onClick={e => toggleWishlist(product.id, e)}
                                    className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:scale-110 transition-transform"
                                  >
                                    <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-brand-accent text-brand-accent' : 'text-slate-400'}`} />
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 p-2.5">
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        addItem({
                                          id: product.id,
                                          name: product.name,
                                          priceCents: Math.round(product.price * 100),
                                          imageUrl: product.image,
                                          grade: product.grade,
                                          specs: product.specs,
                                          stock: product.stock,
                                          quantity: 1,
                                        });
                                      }}
                                      className="w-full py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:bg-blue-800 transition-colors"
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                      Add to Cart
                                    </button>
                                  </div>
                                </div>

                                <div className="p-3.5">
                                  <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">{product.name}</h3>
                                  {specsLine && <p className="text-xs text-slate-400 line-clamp-1 mb-2">{specsLine}</p>}
                                  <div className="flex items-center justify-between">
                                    <p className="text-base font-bold text-slate-900">R {product.price.toLocaleString()}</p>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                      <p className="text-xs text-slate-400 line-through">R {product.originalPrice.toLocaleString()}</p>
                                    )}
                                  </div>
                                </div>
                              </motion.article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ));
                })()}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-10">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        page = currentPage - 2 + i;
                        if (page > totalPages) page = totalPages - (4 - i);
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-brand-primary text-white'
                              : 'border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-80 bg-white z-50 lg:hidden flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Filters</h3>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-xl bg-slate-50 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {filterSidebar}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="w-full py-3 bg-brand-primary text-white text-sm font-semibold rounded-xl"
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
