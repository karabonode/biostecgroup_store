import React, { useState, useEffect } from 'react';
import { Truck, User, Mail, Phone, MapPin, Store, ShieldCheck, CreditCard, AlertTriangle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';


interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

type DeliveryMethod = 'courier' | 'pickup';

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Mpumalanga', 'North West', 'Limpopo', 'Northern Cape'
];

const PICKUP_DETAILS = {
  storeName: 'Biostec Group Johannesburg',
  address: 'Johannesburg Collection Point (Exact address shared after order)',
  contact: '+27612636912 / info@biostecgroup.co.za'
};

export default function Checkout() {
  const { items, getTotal, updateItemPrice } = useCartStore();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [priceChangedItems, setPriceChangedItems] = useState<{ name: string; diff: number }[]>([]);
  const [errors, setErrors] = useState<Partial<CustomerDetails>>({});
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier');

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=checkout');
      return;
    }
    if (items.length === 0) navigate('/');
  }, [items, navigate, user]);

  // Validate cart prices on mount so the displayed total is always current
  useEffect(() => {
    if (items.length === 0) return;
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
          const changes: { name: string; diff: number }[] = [];
          data.stale.forEach((s: { id: string; name: string; oldPriceCents: number; newPriceCents: number }) => {
            updateItemPrice(s.id, s.newPriceCents);
            changes.push({ name: s.name, diff: s.newPriceCents - s.oldPriceCents });
          });
          setPriceChangedItems(changes);
        }
      })
      .catch(() => { /* silent fail */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerDetails> = {};
    if (!customerDetails.firstName.trim()) newErrors.firstName = 'Required';
    if (!customerDetails.lastName.trim()) newErrors.lastName = 'Required';
    if (!customerDetails.email.trim()) {
      newErrors.email = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!customerDetails.phone.trim()) newErrors.phone = 'Required';
    if (deliveryMethod === 'courier') {
      if (!customerDetails.address.trim()) newErrors.address = 'Required';
      if (!customerDetails.city.trim()) newErrors.city = 'Required';
      if (!customerDetails.province) newErrors.province = 'Required';
      if (!customerDetails.postalCode.trim()) newErrors.postalCode = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (isProcessing) return;
    if (!validateForm()) return;

    setCheckoutError('');
    setIsProcessing(true);
    setCheckoutStep('Creating your order…');

    try {
      // Step 1 — create the order in the database
      const subtotal = getTotal();
      const shipping = deliveryMethod === 'pickup' ? 0 : (subtotal > 500000 ? 0 : 15000);

      const orderRes = await axios.post(`${API_BASE_URL}/orders/create.php`, {
        customer: customerDetails,
        delivery: { method: deliveryMethod, courier: deliveryMethod === 'courier' ? 'The Courier Guy' : undefined },
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.priceCents,
          grade: item.grade,
        })),
        totals: { subtotal, shipping, total: subtotal + shipping },
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.error || 'Failed to create order');
      }

      const { order_number: orderNumber } = orderRes.data as { order_number: string };

      // Step 2 — create Yoco hosted-checkout session, redirect to Yoco's page
      setCheckoutStep('Preparing payment…');

      const origin = window.location.origin;
      const payRes = await axios.post(`${API_BASE_URL}/orders/pay.php`, {
        order_number: orderNumber,
        success_url: `${origin}/checkout/success?order=${orderNumber}&result=success`,
        cancel_url:  `${origin}/checkout/success?order=${orderNumber}&result=cancelled`,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!payRes.data.success) {
        throw new Error(payRes.data.error || 'Could not start payment');
      }

      // Validate redirect stays on Yoco's domain over HTTPS before following it
      const redirectUrl: string = payRes.data.redirect_url;
      const parsedRedirect = new URL(redirectUrl);
      if (parsedRedirect.protocol !== 'https:' || !parsedRedirect.hostname.endsWith('.yoco.com')) {
        throw new Error('Unexpected payment redirect. Please contact support.');
      }
      window.location.href = redirectUrl;

    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : (err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setCheckoutError(msg);
      setIsProcessing(false);
      setCheckoutStep('');
    }
  };

  const subtotal = getTotal();
  const shipping = deliveryMethod === 'pickup' ? 0 : (subtotal > 500000 ? 0 : 15000);
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Your cart is empty</h2>
          <Link to="/products" className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-blue-600 font-semibold hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

        {priceChangedItems.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm mb-1">Some prices were updated</p>
              {priceChangedItems.map((c, i) => (
                <p key={i} className="text-amber-800 text-sm">
                  {c.name}: {c.diff > 0 ? '+' : ''}R{(Math.abs(c.diff) / 100).toLocaleString()}
                </p>
              ))}
              <p className="text-amber-700 text-xs mt-1">Your totals below reflect the latest pricing.</p>
            </div>
            <button
              onClick={() => setPriceChangedItems([])}
              className="ml-auto text-amber-400 hover:text-amber-600"
              aria-label="Dismiss"
            >✕</button>
          </div>
        )}

        {checkoutError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            {checkoutError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left column: form ── */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Personal Information */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={customerDetails.firstName}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, firstName: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="John"
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={customerDetails.lastName}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, lastName: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500`}
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={customerDetails.email}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={customerDetails.phone}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500`}
                        placeholder="+27 61 234 5678"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Delivery Method */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Delivery Method
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('courier')}
                    className={`rounded-xl border p-4 text-left transition-all ${deliveryMethod === 'courier' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src="/images/courier-guys.png"
                        alt="The Courier Guy"
                        className="w-14 h-14 object-contain rounded-lg bg-white border border-slate-200 p-1"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">Courier Delivery</p>
                        <p className="text-sm text-slate-600">Delivered by The Courier Guy</p>
                        <p className="text-xs text-slate-500 mt-1">R150 (free for orders above R5,000)</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`rounded-xl border p-4 text-left transition-all ${deliveryMethod === 'pickup' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                        <Store className="w-7 h-7 text-emerald-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Johannesburg Pickup</p>
                        <p className="text-sm text-slate-600">Collect from our Joburg branch</p>
                        <p className="text-xs text-emerald-700 mt-1">FREE</p>
                      </div>
                    </div>
                  </button>
                </div>

                {deliveryMethod === 'pickup' && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-semibold text-emerald-900">{PICKUP_DETAILS.storeName}</p>
                    <p className="text-sm text-emerald-800 mt-1">{PICKUP_DETAILS.address}</p>
                    <p className="text-sm text-emerald-800">Contact: {PICKUP_DETAILS.contact}</p>
                  </div>
                )}
              </div>

              {/* Shipping Address (courier only) */}
              {deliveryMethod === 'courier' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={customerDetails.address}
                          onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                          className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.address ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500`}
                          placeholder="123 Main Street, Apartment 4B"
                        />
                      </div>
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                        <input
                          type="text"
                          value={customerDetails.city}
                          onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.target.value })}
                          className={`w-full px-4 py-3 rounded-lg border ${errors.city ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500`}
                          placeholder="Johannesburg"
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Province *</label>
                        <select
                          value={customerDetails.province}
                          onChange={(e) => setCustomerDetails({ ...customerDetails, province: e.target.value })}
                          className={`w-full px-4 py-3 rounded-lg border ${errors.province ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Select Province</option>
                          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code *</label>
                        <input
                          type="text"
                          value={customerDetails.postalCode}
                          onChange={(e) => setCustomerDetails({ ...customerDetails, postalCode: e.target.value })}
                          className={`w-full px-4 py-3 rounded-lg border ${errors.postalCode ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500`}
                          placeholder="2000"
                          maxLength={4}
                        />
                        {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ── Right column: order summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-4">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={item.imageUrl || '/logo.png'}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">Grade {item.grade} × {item.quantity}</p>
                      <p className="text-sm font-semibold text-slate-900">
                        R {((item.priceCents * item.quantity) / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">R {(subtotal / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping'}</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'FREE' : `R ${(shipping / 100).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                  <span>Total</span>
                  <span className="text-blue-600">R {(total / 100).toLocaleString()}</span>
                </div>
                {shipping === 0 && deliveryMethod === 'courier' && (
                  <p className="text-xs text-green-600">You qualified for free shipping!</p>
                )}
              </div>

              {checkoutError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {checkoutError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {checkoutStep || 'Please wait…'}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay Now
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4" />
                <span>Secured by Yoco — PCI DSS compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
