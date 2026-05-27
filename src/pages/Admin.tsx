import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Routes, Route, Link, NavLink } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { getProducts, createProduct, updateProduct, uploadImage, getOrders, updateOrder, getRepairTickets, updateRepairTicket, Product, ProductInput, Order, RepairTicket } from '../api/products';
import { 
  LayoutDashboard,
  Package,
  Wrench,
  Plus,
  Search,
  Edit2,
  Trash2,
  LogOut,
  Camera,
  X,
  Loader2,
  Users,
  DollarSign,
  ShieldCheck,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  ChevronRight,
  Eye,
  PackageCheck,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash,
  ChevronLeft,
  UserX,
  UserCheck,
  TrendingUp,
  UserCog
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminStats {
  revenue: { all_time: number; this_month: number; last_month: number; growth_pct: number | null };
  orders: { total: number; pending: number; processing: number; shipped: number; delivered: number; cancelled: number; paid: number; pending_payment: number };
  products: { total: number; low_stock: number; out_of_stock: number; by_category: { category: string; count: number }[] };
  customers: { total: number; new_this_month: number };
  repairs: { total: number; pending: number; in_progress: number; ready: number };
  recent_orders: { order_number: string; customer_name: string; total_amount: number; status: string; payment_status: string; created_at: string }[];
  daily_revenue: { day: string; label: string; revenue: number }[];
  low_stock_items: { id: number; name: string; stock_quantity: number; price: number; featured_image: string | null }[];
}

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  order_count: number;
  total_spent: number;
}

interface UserOrder {
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  item_count: number;
}

function fmt(rands: number) {
  return `R ${rands.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Dashboard Component ───────────────────────────────────────────────────────
function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/admin/stats.php`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }
  if (!stats) {
    return <div className="text-center py-20 text-slate-500">Could not load dashboard data.</div>;
  }

  const { revenue, orders, products, customers, repairs, recent_orders } = stats;

  const orderStatusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-6">

      {/* ── Row 1: Primary KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            {revenue.growth_pct !== null && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${revenue.growth_pct >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {revenue.growth_pct >= 0 ? '+' : ''}{revenue.growth_pct}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmt(revenue.this_month)}</p>
          <p className="text-sm text-slate-500 mt-1">Revenue this month</p>
          <p className="text-xs text-slate-400 mt-1">All time: {fmt(revenue.all_time)}</p>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            {orders.pending_payment > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                {orders.pending_payment} awaiting payment
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-800">{orders.total}</p>
          <p className="text-sm text-slate-500 mt-1">Total orders</p>
          <p className="text-xs text-slate-400 mt-1">{orders.paid} paid · {orders.processing} processing</p>
        </div>

        {/* Products */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            {(products.low_stock + products.out_of_stock) > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-600">
                {products.low_stock + products.out_of_stock} alerts
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-800">{products.total}</p>
          <p className="text-sm text-slate-500 mt-1">Active products</p>
          <p className="text-xs text-slate-400 mt-1">{products.out_of_stock} out of stock · {products.low_stock} low</p>
        </div>

        {/* Customers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            {customers.new_this_month > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-violet-50 text-violet-600">
                +{customers.new_this_month} this month
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-800">{customers.total}</p>
          <p className="text-sm text-slate-500 mt-1">Customers</p>
          <p className="text-xs text-slate-400 mt-1">{repairs.total > 0 ? `${repairs.in_progress + repairs.pending} repairs open` : 'No open repairs'}</p>
        </div>
      </div>

      {/* ── Row 2: Order Status Breakdown ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Order Status Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {([
            ['Pending', orders.pending, 'bg-amber-50 border-amber-100 text-amber-700'],
            ['Processing', orders.processing, 'bg-blue-50 border-blue-100 text-blue-700'],
            ['Shipped', orders.shipped, 'bg-purple-50 border-purple-100 text-purple-700'],
            ['Delivered', orders.delivered, 'bg-emerald-50 border-emerald-100 text-emerald-700'],
            ['Cancelled', orders.cancelled, 'bg-red-50 border-red-100 text-red-700'],
            ['Refunded', orders.refunded, 'bg-slate-50 border-slate-200 text-slate-600'],
          ] as [string, number, string][]).map(([label, count, cls]) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 3: Recent Orders + Category Stock ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recent_orders.length === 0 ? (
              <p className="text-center py-10 text-slate-400 text-sm">No orders yet</p>
            ) : recent_orders.map(order => (
              <div key={order.order_number} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{order.order_number}</p>
                  <p className="text-xs text-slate-400 truncate">{order.customer_name || 'Guest'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${orderStatusBadge[order.status] || 'bg-slate-100 text-slate-600'}`}>
                    {order.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {order.payment_status}
                  </span>
                  <p className="text-sm font-bold text-slate-800 w-20 text-right">{fmt(order.total_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock by Category */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Stock by Category</h3>
          </div>
          <div className="px-6 py-3 space-y-3">
            {products.by_category.filter(c => c.count > 0).length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-sm">No products yet</p>
            ) : products.by_category.filter(c => c.count > 0).map(cat => (
              <div key={cat.category} className="flex items-center justify-between">
                <p className="text-sm text-slate-600 truncate">{cat.category}</p>
                <span className="text-sm font-semibold text-slate-800 ml-2">{cat.count}</span>
              </div>
            ))}
            {products.by_category.filter(c => c.count === 0).length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Empty categories</p>
                {products.by_category.filter(c => c.count === 0).map(cat => (
                  <div key={cat.category} className="flex items-center justify-between py-0.5">
                    <p className="text-xs text-slate-400 truncate">{cat.category}</p>
                    <span className="text-xs text-slate-300 ml-2">0</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: 7-Day Revenue Chart + Low Stock Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 7-Day Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-700">Revenue — Last 7 Days</h3>
            </div>
            <span className="text-xs text-slate-400">Paid orders only</span>
          </div>
          {stats.daily_revenue && stats.daily_revenue.length > 0 ? (
            <div className="flex items-end gap-2 h-28 mt-2">
              {(() => {
                const maxRev = Math.max(...stats.daily_revenue.map(d => d.revenue), 1);
                const today  = new Date().toISOString().slice(0, 10);
                return stats.daily_revenue.map(d => {
                  const pct = d.revenue > 0 ? Math.max((d.revenue / maxRev) * 100, 6) : 3;
                  const isToday = d.day === today;
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.revenue > 0 ? `R${d.revenue.toLocaleString()}` : '–'}
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{ height: `${pct}%`, background: isToday ? '#003399' : '#93c5fd' }}
                      />
                      <span className={`text-[10px] font-medium ${isToday ? 'text-slate-800' : 'text-slate-400'}`}>{d.label}</span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400 py-10">No revenue data yet</p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">Low Stock</h3>
            </div>
            <Link to="/admin/inventory" className="text-xs text-blue-600 hover:underline font-medium">Manage</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {!stats.low_stock_items || stats.low_stock_items.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">All products stocked</p>
            ) : stats.low_stock_items.map(item => (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  <img
                    src={item.featured_image || '/logo.png'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="flex-1 text-sm text-slate-700 truncate">{item.name}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                  item.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {item.stock_quantity === 0 ? 'Out' : `${item.stock_quantity} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

// ── Spec templates keyed by category slug group ───────────────────────────────
const CATEGORY_SPECS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  laptop: [
    { key: 'cpu',     label: 'CPU',              placeholder: 'Intel Core i5-1235U' },
    { key: 'ram',     label: 'RAM',              placeholder: '16GB DDR4' },
    { key: 'storage', label: 'Storage',          placeholder: '512GB SSD' },
    { key: 'display', label: 'Display',          placeholder: '15.6" FHD 1920×1080' },
    { key: 'battery', label: 'Battery',          placeholder: '56Wh / ~8 hrs' },
    { key: 'os',      label: 'Operating System', placeholder: 'Windows 11 Pro' },
  ],
  macbook: [
    { key: 'cpu',     label: 'Chip',             placeholder: 'Apple M2 / M3 Pro' },
    { key: 'ram',     label: 'Unified Memory',   placeholder: '16GB' },
    { key: 'storage', label: 'Storage',          placeholder: '512GB SSD' },
    { key: 'display', label: 'Display',          placeholder: '13.3" Retina 2560×1600' },
    { key: 'battery', label: 'Battery',          placeholder: '~18 hrs' },
    { key: 'os',      label: 'macOS Version',    placeholder: 'macOS Sonoma 14' },
  ],
  processor: [
    { key: 'cpu',          label: 'Processor',        placeholder: 'Intel Core i7-13700K' },
    { key: 'socket',       label: 'Socket',           placeholder: 'LGA1700 / AM5' },
    { key: 'cores',        label: 'Cores / Threads',  placeholder: '16 cores / 24 threads' },
    { key: 'base_clock',   label: 'Base Clock',       placeholder: '3.4 GHz' },
    { key: 'boost_clock',  label: 'Boost Clock',      placeholder: '5.4 GHz' },
    { key: 'tdp',          label: 'TDP',              placeholder: '125W' },
  ],
  phone: [
    { key: 'storage', label: 'Storage',     placeholder: '128GB' },
    { key: 'ram',     label: 'RAM',         placeholder: '8GB' },
    { key: 'screen',  label: 'Screen',      placeholder: '6.7" AMOLED 120Hz' },
    { key: 'battery', label: 'Battery',     placeholder: '5000mAh' },
    { key: 'os',      label: 'OS',          placeholder: 'Android 14 / iOS 17' },
    { key: 'network', label: 'Network',     placeholder: '5G' },
    { key: 'color',   label: 'Color',       placeholder: 'Midnight Black' },
  ],
  playstation: [
    { key: 'model',       label: 'Model',                placeholder: 'PS5 / PS4 Pro / PS4 Slim' },
    { key: 'storage',     label: 'Storage',              placeholder: '1TB' },
    { key: 'color',       label: 'Color',                placeholder: 'White / Black' },
    { key: 'controllers', label: 'Controllers Included', placeholder: '1× DualSense' },
    { key: 'region',      label: 'Region',               placeholder: 'PAL' },
  ],
  accessory: [
    { key: 'type',          label: 'Type',                  placeholder: 'Charger / Battery / Mouse' },
    { key: 'compatibility', label: 'Compatibility',         placeholder: 'Universal / Dell / HP' },
    { key: 'wattage',       label: 'Wattage / Capacity',    placeholder: '65W / 4000mAh' },
    { key: 'color',         label: 'Color',                 placeholder: 'Black' },
  ],
};

function getSpecType(slug: string): keyof typeof CATEGORY_SPECS {
  if (['business-laptops', 'ultrabooks', 'workstations', 'laptops'].includes(slug)) return 'laptop';
  if (['macbooks', 'macbook'].includes(slug)) return 'macbook';
  if (['processors', 'processor'].includes(slug)) return 'processor';
  if (['phones', 'phone'].includes(slug)) return 'phone';
  if (slug === 'playstation') return 'playstation';
  return 'accessory';
}

// Inventory Component
function Inventory() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductInput & { images: string[] }>({
    name: '',
    description: '',
    price: 0,
    grade: 'A',
    stock_quantity: 0,
    specs: {},
    featured_image: '',
    images: [],
    rating: 5,
  });

  // Derive active spec template from selected category
  const selectedCatSlug = categories.find(c => c.id === formData.category_id)?.slug ?? '';
  const activeSpecType = getSpecType(selectedCatSlug);
  const activeSpecFields = CATEGORY_SPECS[activeSpecType];

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/products/categories.php');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const specText = Object.values(p.specs || {}).join(' ').toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || specText.includes(search.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || p.grade === gradeFilter;
    const matchesCategory = categoryFilter === 'all' || p.category_name === categoryFilter;
    return matchesSearch && matchesGrade && matchesCategory;
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', price: 0, grade: 'A', stock_quantity: 0, specs: {}, featured_image: '', images: [], rating: 5, category_id: undefined });
    setEditingProduct(null);
    setFormError('');
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      grade: product.grade,
      stock_quantity: product.stock_quantity,
      specs: product.specs || {},
      featured_image: product.featured_image || '',
      images: product.images || [],
      rating: product.rating,
      category_id: product.category_id ?? categories.find(c => c.name === product.category_name)?.id,
    });
    setIsModalOpen(true);
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingImage(true);
    try {
      const url = await uploadImage(file, token);
      setFormData(prev => ({ ...prev, featured_image: url }));
    } catch (err: any) {
      setFormError('Image upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;

    setUploadingImage(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i], token);
        urls.push(url);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err: any) {
      setFormError('Image upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validation
    if (!formData.name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (formData.price <= 0) {
      setFormError('Price must be greater than 0');
      return;
    }
    const filledSpecs = Object.values(formData.specs || {}).filter(v => v.trim() !== '');
    if (activeSpecFields.length > 0 && filledSpecs.length === 0) {
      setFormError('Please fill in at least one specification');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = { ...formData };
      if (editingProduct) {
        await updateProduct(editingProduct.id, submitData, token);
      } else {
        await createProduct(submitData, token);
      }
      setIsModalOpen(false);
      resetForm();
      loadProducts();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Grades</option>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="aspect-video bg-slate-100 relative">
              <img
                src={product.featured_image || '/logo.png'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  product.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  Grade {product.grade}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  product.stock_quantity === 0 ? 'bg-red-100 text-red-700' :
                  product.stock_quantity < 5 ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {product.stock_quantity} in stock
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-800">{product.name}</h3>
              </div>
              {product.category_name && (
                <p className="text-xs text-blue-600 font-medium mb-2 bg-blue-50 px-2 py-1 rounded w-fit">
                  {product.category_name}
                </p>
              )}
              <p className="text-sm text-slate-500 mb-3">
                {Object.values(product.specs || {}).filter(Boolean).slice(0, 2).join(' • ') || <span className="italic">No specs</span>}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-blue-600">R {product.price?.toLocaleString()}</p>
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}

              {/* Featured Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Featured Image
                  {formData.featured_image && <span className="ml-2 text-emerald-600">✓ Uploaded</span>}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden">
                    {formData.featured_image ? (
                      <img src={formData.featured_image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFeaturedImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-medium hover:border-blue-500 transition-all"
                    >
                      {uploadingImage ? 'Uploading...' : formData.featured_image ? 'Change Featured Image' : 'Upload Featured Image'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Gallery Images Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gallery Images ({formData.images.length} uploaded)
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={handleGalleryImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-medium hover:border-blue-500 transition-all"
                  >
                    {uploadingImage ? 'Uploading...' : 'Add Gallery Images'}
                  </button>
                  
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {formData.images.map((url, index) => (
                        <div key={index} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
                          <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Product Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Dell Latitude 7490"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price (R) *</label>
                  <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="4500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value as 'A' | 'B' | 'C' })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => {
                      const newId = e.target.value ? Number(e.target.value) : undefined;
                      const newSlug = categories.find(c => c.id === newId)?.slug ?? '';
                      const oldSlug = categories.find(c => c.id === formData.category_id)?.slug ?? '';
                      const specsToKeep = getSpecType(newSlug) === getSpecType(oldSlug) ? formData.specs : {};
                      setFormData({ ...formData, category_id: newId, specs: specsToKeep });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">No Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Dynamic spec fields — change based on selected category */}
              {activeSpecFields.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Specifications <span className="text-slate-400 font-normal">({activeSpecType})</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {activeSpecFields.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                        <input
                          type="text"
                          value={(formData.specs as Record<string, string>)[field.key] ?? ''}
                          onChange={e => setFormData(prev => ({ ...prev, specs: { ...prev.specs, [field.key]: e.target.value } }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{editingProduct ? 'Saving…' : 'Adding…'}</>
                  ) : (
                    editingProduct ? 'Update Product' : 'Add Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Orders Component
function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await getOrders(token!, filters);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token, statusFilter]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
                         o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                         o.customer_email?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleUpdateStatus = async (orderId: number, status: string) => {
    setUpdating(true);
    try {
      await updateOrder(orderId, { status }, token!);
      loadOrders();
    } catch (err) {
      console.error('Failed to update order:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders by number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Order</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{order.order_number}</p>
                      <p className="text-xs text-slate-500">{order.items?.length || 0} items</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-slate-800">{order.customer_name || 'Guest'}</p>
                      <p className="text-xs text-slate-500">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">R {order.total_amount?.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">No orders found</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Order {selectedOrder.order_number}</h2>
                <p className="text-sm text-slate-500">Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Actions */}
              <div className="flex flex-wrap gap-3">
                <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
                <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  selectedOrder.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  Payment: {selectedOrder.payment_status}
                </span>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status !== 'processing' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Mark Processing
                  </button>
                )}
                {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                    disabled={updating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                  >
                    Mark Shipped
                  </button>
                )}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                    disabled={updating}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Mark Delivered
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Customer</h3>
                  <p className="text-slate-800">{selectedOrder.customer_name || 'Guest'}</p>
                  <p className="text-sm text-slate-500">{selectedOrder.customer_email}</p>
                  <p className="text-sm text-slate-500">{selectedOrder.customer_phone}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Shipping Address</h3>
                  {selectedOrder.shipping_address ? (
                    <div className="text-sm text-slate-600">
                      <p>{selectedOrder.shipping_address.street}</p>
                      <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.province}</p>
                      <p>{selectedOrder.shipping_address.postalCode}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No address provided</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <img src={item.product_image || '/logo.png'} alt={item.product_name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.product_sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-800">R {item.unit_price?.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-slate-100 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-800">R {selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shipping</span>
                    <span className="text-slate-800">R {selectedOrder.shipping_cost?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax</span>
                    <span className="text-slate-800">R {selectedOrder.tax_amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-800">Total</span>
                    <span className="font-bold text-blue-600">R {selectedOrder.total_amount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Repairs Component
function Repairs() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    estimated_cost: 0,
    technician_notes: ''
  });

  const loadTickets = async () => {
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await getRepairTickets(token!, filters);
      setTickets(data);
    } catch (err) {
      console.error('Failed to load repair tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadTickets();
    }
  }, [token, statusFilter]);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
                         t.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                         t.device_model?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await updateRepairTicket(selectedTicket.id, {
        status: editForm.status || selectedTicket.status,
        priority: editForm.priority || selectedTicket.priority,
        estimated_cost: editForm.estimated_cost || selectedTicket.estimated_cost,
        technician_notes: editForm.technician_notes
      }, token!);
      loadTickets();
      setSelectedTicket(null);
    } catch (err) {
      console.error('Failed to update ticket:', err);
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = (ticket: RepairTicket) => {
    setSelectedTicket(ticket);
    setEditForm({
      status: ticket.status,
      priority: ticket.priority,
      estimated_cost: ticket.estimated_cost || 0,
      technician_notes: ticket.technician_notes || ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'diagnosing': return 'bg-blue-100 text-blue-700';
      case 'waiting_parts': return 'bg-orange-100 text-orange-700';
      case 'repairing': return 'bg-purple-100 text-purple-700';
      case 'ready': return 'bg-cyan-100 text-cyan-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by number, customer, or device..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="diagnosing">Diagnosing</option>
          <option value="waiting_parts">Waiting Parts</option>
          <option value="repairing">Repairing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Ticket</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Device</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{ticket.ticket_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-slate-800">{ticket.customer_name}</p>
                      <p className="text-xs text-slate-500">{ticket.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-800">{ticket.device_model}</p>
                    <p className="text-xs text-slate-500">{ticket.device_brand}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEditModal(ticket)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-20">
          <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">No repair tickets found</p>
        </div>
      )}

      {/* Ticket Edit Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Ticket {selectedTicket.ticket_number}</h2>
                <p className="text-sm text-slate-500">Created on {new Date(selectedTicket.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer & Device Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Customer</h3>
                  <p className="text-slate-800">{selectedTicket.customer_name}</p>
                  <p className="text-sm text-slate-500">{selectedTicket.customer_email}</p>
                  <p className="text-sm text-slate-500">{selectedTicket.customer_phone}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Device</h3>
                  <p className="text-slate-800">{selectedTicket.device_model}</p>
                  <p className="text-sm text-slate-500">{selectedTicket.device_brand}</p>
                  <p className="text-sm text-slate-500">SN: {selectedTicket.device_serial || 'N/A'}</p>
                </div>
              </div>

              {/* Issue Description */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Issue Description</h3>
                <p className="text-sm text-slate-600">{selectedTicket.issue_description}</p>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Update Ticket</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="diagnosing">Diagnosing</option>
                      <option value="waiting_parts">Waiting Parts</option>
                      <option value="repairing">Repairing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Cost (R)</label>
                  <input
                    type="number"
                    value={editForm.estimated_cost}
                    onChange={(e) => setEditForm({ ...editForm, estimated_cost: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Technician Notes</label>
                  <textarea
                    value={editForm.technician_notes}
                    onChange={(e) => setEditForm({ ...editForm, technician_notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Add notes about diagnosis, parts needed, etc."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTicket}
                  disabled={updating}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── User Management Component ─────────────────────────────────────────────────
function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState<'all' | 'active' | 'blocked' | 'unverified'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userOrders, setUserOrders]     = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);

  const loadUsers = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/admin/users.php`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) loadUsers(); }, [token]);

  const viewOrders = async (user: AdminUser) => {
    setSelectedUser(user);
    setOrdersLoading(true);
    setUserOrders([]);
    try {
      const res  = await fetch(`${API_BASE_URL}/admin/users.php?action=orders&user_id=${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUserOrders(data.orders);
    } catch (err) { console.error(err); }
    finally { setOrdersLoading(false); }
  };

  const handleAction = async (action: 'block' | 'unblock' | 'delete', userId: number) => {
    setActionLoading(userId);
    try {
      const res  = await fetch(`${API_BASE_URL}/admin/users.php`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, user_id: userId }),
      });
      const data = await res.json();
      if (data.success) { loadUsers(); setDeleteConfirm(null); if (selectedUser?.id === userId) setSelectedUser(null); }
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const filtered = users.filter(u => {
    const name       = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'active'     && u.is_active && u.email_verified) ||
      (filter === 'blocked'    && !u.is_active) ||
      (filter === 'unverified' && !u.email_verified);
    return matchSearch && matchFilter;
  });

  const counts = {
    total:      users.length,
    active:     users.filter(u => u.is_active && u.email_verified).length,
    blocked:    users.filter(u => !u.is_active).length,
    unverified: users.filter(u => !u.email_verified && u.is_active).length,
  };

  const orderStatusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700', refunded: 'bg-slate-100 text-slate-600',
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          ['Total Users',  counts.total,      'bg-blue-50',    'text-blue-600',    Users],
          ['Active',       counts.active,     'bg-emerald-50', 'text-emerald-600', UserCheck],
          ['Blocked',      counts.blocked,    'bg-red-50',     'text-red-600',     UserX],
          ['Unverified',   counts.unverified, 'bg-amber-50',   'text-amber-600',   AlertTriangle],
        ] as [string, number, string, string, React.ElementType][]).map(([label, count, bg, fg, Icon]) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${fg}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'blocked', 'unverified'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Last Login</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Orders</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Total Spent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-blue-700">
                          {user.first_name[0]?.toUpperCase()}{user.last_name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        {user.phone && <p className="text-xs text-slate-400">{user.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {user.is_active ? 'Active' : 'Blocked'}
                      </span>
                      {!user.email_verified && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold w-fit bg-amber-100 text-amber-700">
                          Unverified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => viewOrders(user)}
                      className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                    >
                      {user.order_count} orders <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{fmt(user.total_spent)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {user.is_active ? (
                        <button
                          onClick={() => handleAction('block', user.id)}
                          disabled={actionLoading === user.id}
                          title="Block user"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                        >
                          {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction('unblock', user.id)}
                          disabled={actionLoading === user.id}
                          title="Unblock user"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-40"
                        >
                          {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(user)}
                        title="Delete user"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No users found</p>
          </div>
        )}
      </div>

      {/* ── User Orders Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedUser.first_name} {selectedUser.last_name}</h2>
                <p className="text-sm text-slate-500">{selectedUser.email} · {selectedUser.order_count} orders · {fmt(selectedUser.total_spent)} total</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {ordersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
              ) : userOrders.length === 0 ? (
                <p className="text-center py-10 text-slate-400">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {userOrders.map(order => (
                    <div key={order.order_number} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{order.order_number}</p>
                        <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()} · {order.item_count} item{order.item_count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${orderStatusColor[order.status] || 'bg-slate-100 text-slate-600'}`}>
                          {order.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {order.payment_status}
                        </span>
                        <span className="text-sm font-bold text-slate-800 w-20 text-right">{fmt(order.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center mb-1">
              {deleteConfirm.order_count > 0 ? 'Block' : 'Delete'} {deleteConfirm.first_name} {deleteConfirm.last_name}?
            </h3>
            <p className="text-sm text-slate-500 text-center">{deleteConfirm.email}</p>
            {deleteConfirm.order_count > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl mt-3 text-center">
                This user has {deleteConfirm.order_count} order(s). The account will be blocked to preserve order history.
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('delete', deleteConfirm.id)}
                disabled={actionLoading === deleteConfirm.id}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === deleteConfirm.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteConfirm.order_count > 0 ? 'Block Account' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HomeBanners ─────────────────────────────────────────────────────────────
interface BannerSlide {
  desktop: string;
  phone: string;
  alt: string;
}

function HomeBanners() {
  const { token } = useAuth();
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [uploading, setUploading] = useState<{ idx: number; field: 'desktop' | 'phone' } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/banners/index.php`)
      .then(r => r.json())
      .then(data => { if (data.slides) setSlides(data.slides); })
      .catch(() => {});
  }, []);

  const uploadImage = async (idx: number, field: 'desktop' | 'phone', file: File) => {
    setUploading({ idx, field });
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_BASE_URL}/banners/upload.php`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: data.url } : s));
      } else {
        setStatus({ type: 'error', msg: data.error || 'Upload failed' });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Upload failed' });
    } finally {
      setUploading(null);
    }
  };

  const addSlide = () => setSlides(prev => [...prev, { desktop: '', phone: '', alt: '' }]);

  const removeSlide = (idx: number) => setSlides(prev => prev.filter((_, i) => i !== idx));

  const updateAlt = (idx: number, val: string) =>
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, alt: val } : s));

  const saveAll = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/banners/index.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slides }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', msg: 'Banners saved successfully!' });
      } else {
        setStatus({ type: 'error', msg: data.error || 'Save failed' });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Homepage Banners</h1>
          <p className="text-slate-500 mt-1">Manage the hero carousel images shown on the homepage.</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Save All
        </button>
      </div>

      {status && (
        <div className={`mb-6 flex items-center gap-2 p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {status.msg}
        </div>
      )}

      <div className="space-y-6">
        {slides.map((slide, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Slide {idx + 1}</h3>
              <button
                onClick={() => removeSlide(idx)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {(['desktop', 'phone'] as const).map(field => (
                <div key={field}>
                  <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                    {field === 'desktop' ? 'Desktop Image' : 'Mobile Image'}
                  </p>
                  <label className="block group cursor-pointer">
                    <div className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors ${slide[field] ? 'border-slate-200' : 'border-slate-300 hover:border-blue-400'}`}
                         style={{ aspectRatio: field === 'desktop' ? '16/5' : '4/5', maxHeight: field === 'desktop' ? '140px' : '200px' }}>
                      {slide[field] ? (
                        <img src={slide[field]} alt={`${field} preview`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          <span className="text-xs">Click to upload</span>
                        </div>
                      )}
                      {uploading?.idx === idx && uploading.field === field && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(idx, field, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Alt Text</label>
              <input
                type="text"
                value={slide.alt}
                onChange={e => updateAlt(idx, e.target.value)}
                placeholder="Describe the banner for accessibility"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addSlide}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Slide
      </button>
    </div>
  );
}

// Main Admin Layout
export default function Admin() {
  const navigate = useNavigate();
  const { user, logout, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Biostec" className="h-8" />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {([
            { to: '/admin',          end: true,  Icon: LayoutDashboard, label: 'Dashboard'  },
            { to: '/admin/inventory',end: false, Icon: Package,          label: 'Inventory'  },
            { to: '/admin/orders',   end: false, Icon: ShoppingCart,     label: 'Orders'     },
            { to: '/admin/repairs',  end: false, Icon: Wrench,           label: 'Repairs'    },
            { to: '/admin/users',    end: false, Icon: UserCog,          label: 'Users'      },
            { to: '/admin/banners',  end: false, Icon: ImageIcon,        label: 'Banners'    },
          ]).map(({ to, end, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                  {label}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-2 flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/repairs" element={<Repairs />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/banners" element={<HomeBanners />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
