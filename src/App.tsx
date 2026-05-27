import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Home from './pages/Home';
import Repair from './pages/Repair';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import KaraboChat from './components/KaraboChat';

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function AppShell() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white font-sans">
      {!isAdminRoute && <Navbar onOpenCart={() => setIsCartOpen(true)} />}
      {!isAdminRoute && <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
      {!isAdminRoute && <KaraboChat />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/repair" element={<Repair />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </main>

      {!isAdminRoute && (
        <footer className="bg-slate-950 text-white">
          {/* Newsletter strip */}
          <div className="border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold mb-1">Stay in the loop</h3>
                  <p className="text-slate-400 text-sm">Get weekly deals, new arrivals &amp; tech tips.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 md:w-64 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <button className="px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main footer */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {/* Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <img src="/logo.png" alt="Biostec Group" className="h-10 w-auto mb-4 brightness-0 invert" />
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  Johannesburg &amp; Cape Town's trusted source for certified renewed laptops and devices. Quality you can count on.
                </p>
                <div className="flex items-center gap-2.5">
                  {[
                    { href: 'https://www.facebook.com/BiostecGroup201/', icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/> },
                    { href: 'https://www.instagram.com/biostecgroup/', icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/> },
                    { href: 'https://www.tiktok.com/@biostecgroup201', icon: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.11 8.11 0 004.74 1.51V6.75a4.85 4.85 0 01-.97-.06z"/> },
                  ].map((s, i) => (
                    <a
                      key={i}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-5">Quick Links</h4>
                <ul className="space-y-3">
                  {[
                    { label: 'About Us', to: '/about' },
                    { label: 'Products', to: '/products' },
                    { label: 'Services', to: '/services' },
                    { label: 'Repair Lab', to: '/repair' },
                    { label: 'Contact', to: '/contact' },
                  ].map(link => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-slate-400 text-sm hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hours */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-5">Business Hours</h4>
                <div className="space-y-3 text-sm">
                  {[
                    { day: 'Mon – Fri', hours: '09:00 – 19:00' },
                    { day: 'Saturday', hours: '10:00 – 17:00' },
                    { day: 'Sunday', hours: 'Closed' },
                  ].map((h, i) => (
                    <div key={i}>
                      <p className="text-slate-500 text-xs">{h.day}</p>
                      <p className={`font-medium ${h.hours === 'Closed' ? 'text-slate-500' : 'text-white'}`}>{h.hours}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-5">Contact</h4>
                <ul className="space-y-3.5 text-sm text-slate-400">
                  <li className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="leading-relaxed">Management House, Braamfontein, Johannesburg, 2017</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:info@biostecgroup.co.za" className="hover:text-white transition-colors">info@biostecgroup.co.za</a>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href="tel:+27612636912" className="hover:text-white transition-colors">+27 61 263 6912</a>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href="tel:+27694764300" className="hover:text-white transition-colors">+27 69 476 4300</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <p>© 2026 <Link to="/" className="text-slate-400 hover:text-white transition-colors">Biostec Group</Link>. All rights reserved.</p>
              <p>Johannesburg &amp; Cape Town, South Africa</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppShell />
      </Router>
    </AuthProvider>
  );
}
