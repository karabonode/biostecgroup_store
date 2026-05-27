import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Package, 
  Wrench, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import axios from 'axios';

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
  items: Array<{
    product_id?: number;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

interface RepairTicket {
  id: string;
  deviceModel: string;
  status: string;
  createdAt: any;
}

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isLoading, isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [tickets] = useState<RepairTicket[]>([]);
  const initialTab = (searchParams.get('tab') || 'orders') as 'orders' | 'repairs' | 'settings';
  const [activeTab, setActiveTab] = useState<'orders' | 'repairs' | 'settings'>(
    ['orders', 'repairs', 'settings'].includes(initialTab) ? initialTab : 'orders'
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const paymentResult = (searchParams.get('payment') || '').toLowerCase();
  const highlightedOrder = searchParams.get('order') || '';
  const [showPaymentPopup, setShowPaymentPopup] = useState(Boolean(paymentResult));
  
  // Settings state
  const [settings, setSettings] = useState({
    twoFactor: false,
    techBriefs: true,
    orderNotifications: true
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  React.useEffect(() => {
    const tab = (searchParams.get('tab') || '').toLowerCase();
    if (tab === 'orders' || tab === 'repairs' || tab === 'settings') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  React.useEffect(() => {
    setShowPaymentPopup(Boolean(paymentResult));
  }, [paymentResult]);

  React.useEffect(() => {
    if (!token || !isAuthenticated) {
      return;
    }

    let cancelled = false;
    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      setOrdersError('');
      try {
        const response = await axios.get(`${API_BASE_URL}/orders/list.php`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!cancelled) {
          setOrders((response.data?.data || []) as Order[]);
        }
      } catch (error: any) {
        if (!cancelled) {
          setOrdersError(error?.response?.data?.error || 'Could not load orders');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOrders(false);
        }
      }
    };

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated]);

  const paymentBanner =
    paymentResult === 'paid'
      ? 'Payment successful. Your order has been confirmed.'
      : paymentResult === 'failed'
        ? 'Payment failed. Please retry payment from your order details.'
        : paymentResult === 'cancelled'
          ? 'Payment was cancelled. You can try again when ready.'
          : paymentResult === 'pending'
            ? 'Payment is still pending. We will update your order once confirmed.'
            : '';

  const getDisplayPaymentStatus = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'paid' || normalized === 'approved') {
      return { label: 'Approved', classes: 'bg-emerald-100 text-emerald-700' };
    }
    if (normalized === 'failed' || normalized === 'cancelled') {
      return { label: 'Failed', classes: 'bg-red-100 text-red-700' };
    }
    return { label: 'Pending', classes: 'bg-orange-100 text-orange-700' };
  };

  const dismissPaymentPopup = () => {
    setShowPaymentPopup(false);
    const params = new URLSearchParams(searchParams);
    params.delete('payment');
    params.delete('order_status');
    if (!params.get('tab')) {
      params.set('tab', 'orders');
    }
    navigate(`/profile?${params.toString()}`, { replace: true });
  };

  const handleOrderAgain = (order: Order) => {
    const firstProductId = order.items?.find((item) => !!item.product_id)?.product_id;
    if (firstProductId) {
      navigate(`/product/${firstProductId}`);
      return;
    }
    navigate('/products');
  };

  const paymentPopupType =
    paymentResult === 'paid'
      ? 'approved'
      : paymentResult === 'failed' || paymentResult === 'cancelled'
        ? 'failed'
        : 'pending';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-12 bg-white rounded-[3rem] shadow-premium max-w-md">
          <UserIcon className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-brand-primary uppercase tracking-tighter mb-4">Authentication Required</h2>
          <p className="text-slate-500 font-medium mb-8">Please sign in to access your enterprise dashboard and order history.</p>
          <Link to="/login" className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100 text-center">
              <div className="relative inline-block mb-6">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-xl" alt={`${user.first_name} ${user.last_name}`} />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-xl bg-blue-100 flex items-center justify-center">
                    <UserIcon className="w-16 h-16 text-blue-600" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-brand-accent p-2 rounded-xl shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-brand-primary tracking-tight uppercase mb-1">{user?.first_name} {user?.last_name}</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">{user?.email}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-50">
                <div>
                  <p className="text-2xl font-black text-brand-primary tracking-tighter">{orders.length}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-primary tracking-tighter">{tickets.length}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Repairs</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-brand-text p-8 rounded-[2.5rem] shadow-premium text-white">
              <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mb-6">Quick Actions</h4>
              <div className="space-y-3">
                <Link to="/" className="flex items-center justify-between w-full p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                  <span className="text-[10px] font-black uppercase tracking-widest">Shop Inventory</span>
                  <ChevronRight className="w-4 h-4 text-brand-accent group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/repair" className="flex items-center justify-between w-full p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                  <span className="text-[10px] font-black uppercase tracking-widest">New Repair Ticket</span>
                  <ChevronRight className="w-4 h-4 text-brand-accent group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <nav className="bg-white p-4 rounded-[2.5rem] shadow-premium border border-slate-100 space-y-2">
              {[
                { id: 'orders', icon: Package, label: 'Order History' },
                { id: 'repairs', icon: Wrench, label: 'Repair Status' },
                { id: 'settings', icon: Settings, label: 'Account Settings' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                    activeTab === item.id 
                      ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? 'rotate-90' : ''}`} />
                </button>
              ))}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-brand-accent hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest"
              >
                <LogOut className="w-5 h-5" />
                Terminate Session
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 md:p-16 rounded-[4rem] shadow-premium border border-slate-100 min-h-[600px]"
            >
              {activeTab === 'orders' && (
                <div>
                  <div className="flex justify-between items-end mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-brand-primary tracking-tighter uppercase mb-2">Order History.</h3>
                      <p className="text-slate-500 font-medium">Track your hardware acquisitions and invoices.</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <Package className="w-6 h-6 text-brand-primary" />
                    </div>
                  </div>

                  {paymentBanner && (
                    <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-900">
                      {paymentBanner}
                    </div>
                  )}

                  {ordersError && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">
                      {ordersError}
                    </div>
                  )}

                  {isLoadingOrders ? (
                    <div className="py-20 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                      Loading orders...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-24 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No transactions recorded yet.</p>
                      <Link to="/" className="mt-6 inline-block text-brand-accent font-black uppercase tracking-widest text-[10px] hover:underline">Browse Inventory</Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        (() => {
                          const payment = getDisplayPaymentStatus(order.payment_status);
                          return (
                        <div
                          key={order.id}
                          className={`group p-8 rounded-[2.5rem] border transition-all ${
                            highlightedOrder && highlightedOrder === order.order_number
                              ? 'bg-blue-50 border-blue-200 shadow-xl'
                              : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-xl'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex gap-6">
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                {/* Icon placeholder */}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order: {order.order_number}</p>
                                <p className="text-xl font-black text-brand-primary uppercase tracking-tight mb-2">R {(order.total_amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                <div className="flex items-center gap-3">
                                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${payment.classes}`}>
                                    Payment: {payment.label}
                                  </span>
                                  <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-[8px] font-black uppercase tracking-widest">
                                    Order: {order.status}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="bg-white text-brand-primary px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 hover:border-brand-accent hover:text-brand-accent transition-all"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                          );
                        })()
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'repairs' && (
                <div>
                  <div className="flex justify-between items-end mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-brand-primary tracking-tighter uppercase mb-2">Repair Queue.</h3>
                      <p className="text-slate-500 font-medium">Real-time tracking of your technical service tickets.</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <Wrench className="w-6 h-6 text-brand-accent" />
                    </div>
                  </div>

                  {tickets.length === 0 ? (
                    <div className="py-24 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active repair tickets.</p>
                      <Link to="/repair" className="mt-6 inline-block text-brand-accent font-black uppercase tracking-widest text-[10px] hover:underline">Book a Repair</Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="group p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all">
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex gap-6">
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Wrench className="w-8 h-8 text-brand-accent" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket ID: {ticket.id.slice(0, 8)}</p>
                                <p className="text-xl font-black text-brand-primary uppercase tracking-tight mb-2">{ticket.deviceModel}</p>
                                <div className="flex items-center gap-3">
                                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    ticket.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                    ticket.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    {ticket.status}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ticket.createdAt}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-3xl font-black text-brand-primary tracking-tighter uppercase mb-12">Account Settings.</h3>
                  <div className="space-y-8">
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Security Protocol</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-4 border-b border-slate-200">
                          <span className="text-xs font-bold text-brand-primary uppercase">Two-Factor Authentication</span>
                          <button 
                            onClick={() => setSettings(s => ({...s, twoFactor: !s.twoFactor}))}
                            className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                              settings.twoFactor ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {settings.twoFactor ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-slate-200">
                          <span className="text-xs font-bold text-brand-primary uppercase">Active Sessions</span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Current Device Only</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Communication Preferences</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-4 border-b border-slate-200">
                          <span className="text-xs font-bold text-brand-primary uppercase">Technical Briefs</span>
                          <button 
                            onClick={() => setSettings(s => ({...s, techBriefs: !s.techBriefs}))}
                            className={`w-10 h-5 rounded-full relative transition-all ${settings.techBriefs ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.techBriefs ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-slate-200">
                          <span className="text-xs font-bold text-brand-primary uppercase">Order Notifications</span>
                          <button 
                            onClick={() => setSettings(s => ({...s, orderNotifications: !s.orderNotifications}))}
                            className={`w-10 h-5 rounded-full relative transition-all ${settings.orderNotifications ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.orderNotifications ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-brand-primary/90 backdrop-blur-md"
            onClick={() => setSelectedOrder(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-accent" />
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-3xl font-black text-brand-primary uppercase tracking-tighter mb-2">Order Details</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">ID: {selectedOrder.id}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <AlertCircle className="w-6 h-6 text-slate-300 rotate-45" />
              </button>
            </div>

            <div className="space-y-6 mb-10">
              {selectedOrder.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-brand-primary uppercase">{item.product_name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                      {item.product_id ? (
                        <button
                          onClick={() => {
                            setSelectedOrder(null);
                            navigate(`/product/${item.product_id}`);
                          }}
                          className="mt-2 rounded-lg bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100"
                        >
                          Order Again
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm font-black text-brand-primary uppercase">R {((item.unit_price * item.quantity) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Investment</span>
              <span className="text-2xl font-black text-brand-primary uppercase tracking-tighter">R {(selectedOrder.total_amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <button 
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-8 bg-brand-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent transition-all"
            >
              Close Details
            </button>

            <button
              onClick={() => handleOrderAgain(selectedOrder)}
              className="w-full mt-3 border border-blue-200 text-blue-700 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all"
            >
              Order Again
            </button>
          </motion.div>
        </div>
      )}

      {/* Payment Result Popup */}
      {showPaymentPopup && paymentResult && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50" onClick={dismissPaymentPopup} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-4 flex justify-center">
              {paymentPopupType === 'approved' ? (
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              ) : paymentPopupType === 'failed' ? (
                <XCircle className="h-12 w-12 text-red-600" />
              ) : (
                <AlertCircle className="h-12 w-12 text-orange-500" />
              )}
            </div>
            <h3 className="text-center text-xl font-black uppercase tracking-tight text-brand-primary">
              {paymentPopupType === 'approved' ? 'Payment Approved' : paymentPopupType === 'failed' ? 'Payment Failed' : 'Payment Pending'}
            </h3>
            <p className="mt-3 text-center text-sm text-slate-600">
              {paymentPopupType === 'approved'
                ? 'Your payment was successful and your order has been approved.'
                : paymentPopupType === 'failed'
                  ? 'Your payment did not complete successfully. Please try again from your order details.'
                  : 'Your payment is still pending. Please check your order status again shortly.'}
            </p>
            <button
              onClick={dismissPaymentPopup}
              className="mt-6 w-full rounded-xl bg-brand-primary py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-brand-accent"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
