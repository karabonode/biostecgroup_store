import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenCart: () => void;
}

const navLinks = [
  { label: 'Shop', href: '/', isShop: true },
  { label: 'Services', href: '/services' },
  { label: 'Repair', href: '/repair' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar({ onOpenCart }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleShopClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm'
          : 'bg-white'
      } border-b border-slate-100`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img src="/logo.png" alt="Biostec Group" className="h-10 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={link.isShop ? handleShopClick : undefined}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'text-brand-primary'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-blue-50 rounded-lg -z-10"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              {/* Cart */}
              <button
                onClick={onOpenCart}
                className="relative p-2.5 rounded-xl text-slate-500 hover:text-brand-primary hover:bg-slate-50 transition-all"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-brand-accent text-white text-[10px] font-bold px-1 rounded-full leading-none"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Desktop Auth */}
              <div className="hidden lg:flex items-center gap-1.5 ml-1">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="px-4 py-2 text-sm font-semibold text-brand-primary border border-brand-primary/30 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center overflow-hidden">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 text-brand-primary" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{user?.first_name}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-brand-accent hover:bg-red-50 transition-all"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-primary transition-colors rounded-lg hover:bg-slate-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition-all"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors ml-1"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMenuOpen ? (
                    <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <img src="/logo.png" alt="Biostec" className="h-8 w-auto" />
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-xl bg-slate-50 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 + 0.05 }}
                  >
                    <Link
                      to={link.href}
                      onClick={link.isShop ? handleShopClick : () => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive(link.href)
                          ? 'bg-brand-primary text-white'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Auth section */}
              <div className="px-4 py-4 border-t border-slate-100">
                {isAuthenticated ? (
                  <div className="space-y-3 px-2">
                    <div className="flex items-center justify-between">
                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{user?.first_name} {user?.last_name}</p>
                          <p className="text-xs text-slate-400">{user?.role === 'admin' ? 'Admin' : 'Member'}</p>
                        </div>
                      </Link>
                      <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-brand-accent rounded-xl hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full block py-2.5 text-center text-sm font-semibold text-brand-primary border border-brand-primary/30 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        Open Admin Panel
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full py-3 border border-slate-200 text-slate-700 text-sm font-semibold text-center rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full py-3 bg-brand-primary text-white text-sm font-semibold text-center rounded-xl hover:bg-blue-800 transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
