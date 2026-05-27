import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Store, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';

interface OrderStatus {
  order_number: string;
  payment_status: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  delivery_method: 'courier' | 'pickup';
  customer_name: string;
  created_at: string;
}

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const { clearCart } = useCartStore();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order') ?? '';
  const result = (searchParams.get('result') ?? '').toLowerCase();

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToProfile = (payment: string, orderStatus: string) => {
      const params = new URLSearchParams();
      params.set('tab', 'orders');
      if (orderNumber) {
        params.set('order', orderNumber);
      }
      params.set('payment', payment);
      if (orderStatus) {
        params.set('order_status', orderStatus);
      }
      navigate(`/profile?${params.toString()}`, { replace: true });
    };

    const fetchAndRedirect = async () => {
      if (!orderNumber) {
        redirectToProfile('unknown', '');
        return;
      }

      let paymentStatus = 'pending';
      let orderStatus = '';

      try {
        if (result !== 'cancelled') {
          const verifyRes = await axios.get(`${API_BASE_URL}/orders/verify.php?order_number=${encodeURIComponent(orderNumber)}`);
          paymentStatus = (verifyRes.data?.payment_status || 'pending').toLowerCase();
        } else {
          paymentStatus = 'cancelled';
        }
      } catch (error: any) {
        const statusFromError = error?.response?.data?.payment_status;
        paymentStatus = (statusFromError || paymentStatus || 'failed').toLowerCase();
      }

      try {
        const statusRes = await axios.get(`${API_BASE_URL}/orders/status.php?order_number=${encodeURIComponent(orderNumber)}`);
        const statusData = statusRes.data as OrderStatus;
        setOrder(statusData);
        orderStatus = (statusData.status || '').toLowerCase();
        paymentStatus = (statusData.payment_status || paymentStatus).toLowerCase();

        if (paymentStatus === 'paid') {
          clearCart();
        }
      } catch {
        // keep best-known payment status if status endpoint fails
      } finally {
        setLoading(false);
        redirectToProfile(paymentStatus, orderStatus);
      }
    };

    fetchAndRedirect();
  }, [API_BASE_URL, clearCart, navigate, orderNumber, result]);

  const formatRand = (cents: number) =>
    'R ' + (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-lg">
        {/* Success card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-500 mb-8">
            Your order has been confirmed. We'll email you the details shortly.
          </p>

          {/* Order details */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-8">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading order details…</span>
            </div>
          ) : order ? (
            <div className="bg-slate-50 rounded-xl p-5 text-left mb-8 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Number</span>
                <span className="font-bold text-blue-700 text-sm">{order.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Paid</span>
                <span className="font-semibold text-slate-900">{formatRand(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Delivery</span>
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  {order.delivery_method === 'pickup'
                    ? <><Store className="w-4 h-4 text-emerald-600" /> Johannesburg Pickup</>
                    : <><Truck className="w-4 h-4 text-blue-600" /> Courier Delivery</>}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  <Package className="w-3 h-3" /> Processing
                </span>
              </div>
            </div>
          ) : orderNumber ? (
            <div className="bg-slate-50 rounded-xl p-4 text-center mb-8">
              <p className="text-sm font-semibold text-slate-800">Order: {orderNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Confirmation email on its way.</p>
            </div>
          ) : null}

          <p className="text-sm text-slate-500 mb-6">
            A confirmation has been sent to your email. Our team will contact you with{' '}
            {order?.delivery_method === 'pickup' ? 'pickup' : 'delivery'} details.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-center">
              Redirecting to your profile orders...
            </div>
          </div>
        </div>

        {/* Support note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Questions? Email{' '}
          <a href="mailto:info@biostecgroup.co.za" className="text-blue-500 hover:underline">
            info@biostecgroup.co.za
          </a>{' '}
          or call <a href="tel:+27612636912" className="text-blue-500 hover:underline">+27612636912</a>
        </p>
      </div>
    </div>
  );
}
