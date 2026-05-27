import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Code2, Globe, ShoppingBag, LayoutDashboard, Smartphone,
  Zap, ArrowRight, CheckCircle, ExternalLink, Send, Loader2,
  Users, Star, Palette, Database
} from 'lucide-react';

const portfolioSites = [
  {
    name: 'Karabo Node',
    url: 'https://karabonode.co.za',
    description: 'AI-powered platform and technology hub — home to custom software solutions and developer tools.',
    tags: ['Web App', 'AI', 'Technology'],
    gradient: 'from-blue-600 to-indigo-700',
    icon: '🤖',
  },
  {
    name: 'Nature Talks Tours',
    url: 'https://naturetalkstours.co.za',
    description: 'Eco-tourism booking website showcasing guided nature tours across South Africa.',
    tags: ['Tourism', 'Booking', 'Website'],
    gradient: 'from-emerald-500 to-teal-600',
    icon: '🌿',
  },
  {
    name: 'The Mudau\'s',
    url: 'https://themudaus.co.za',
    description: 'A professional family brand website with a clean, modern identity and content management.',
    tags: ['Brand', 'Personal', 'Website'],
    gradient: 'from-amber-500 to-orange-600',
    icon: '🏡',
  },
  {
    name: 'EduPulse',
    url: 'https://edupulse.karabonode.co.za',
    description: 'Smart e-learning web application connecting students with study resources and tutors.',
    tags: ['EdTech', 'Web App', 'Platform'],
    gradient: 'from-violet-600 to-purple-700',
    icon: '📚',
  },
];

const services = [
  { icon: Globe,          title: 'Business Website',     desc: 'A professional online presence that represents your brand 24/7.' },
  { icon: ShoppingBag,    title: 'E-commerce Store',      desc: 'Sell products online with payments, inventory and order management.' },
  { icon: LayoutDashboard,title: 'Web Application',       desc: 'Custom platforms, dashboards, portals or internal tools.' },
  { icon: Smartphone,     title: 'Landing Page',          desc: 'High-converting single-page sites for campaigns or launches.' },
  { icon: Palette,        title: 'Brand & Design',        desc: 'Logo, brand identity, and UI/UX design tailored to your audience.' },
  { icon: Database,       title: 'API & Backend',         desc: 'Robust backends, databases, and API integrations for your systems.' },
];

const whyUs = [
  { icon: Zap,       title: 'Fast Delivery',   desc: 'We move quickly — most sites ship within 2–4 weeks.' },
  { icon: Star,      title: 'Quality Work',    desc: 'Clean code, polished design, real results.' },
  { icon: Users,     title: 'Local Team',      desc: 'South African team that understands your market.' },
  { icon: CheckCircle, title: 'Full Support',  desc: 'Post-launch support so your site stays live and up to date.' },
];

const websiteTypes = [
  'Business Website',
  'E-commerce Store',
  'Web Application / Platform',
  'Landing Page',
  'Portfolio Website',
  'Blog / News Website',
  'Booking & Reservation System',
  'Other / Not Sure',
];

const budgets = [
  'Under R 5,000',
  'R 5,000 – R 15,000',
  'R 15,000 – R 30,000',
  'R 30,000 – R 60,000',
  'R 60,000+',
  'Not sure yet',
];

const timelines = [
  'As soon as possible',
  'Within 1 month',
  '1 – 3 months',
  '3 – 6 months',
  'Flexible / No rush',
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  websiteType: string;
  budget: string;
  timeline: string;
  message: string;
}

const EMPTY: FormData = {
  name: '', email: '', phone: '', company: '',
  websiteType: '', budget: '', timeline: '', message: '',
};

export default function Dev() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const set = (key: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact/dev-inquiry.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('sent');
        setForm(EMPTY);
      } else {
        setStatus('error');
      }
    } catch {
      // Fallback: open email client
      const subject = encodeURIComponent(`Web Development Inquiry – ${form.websiteType || 'Website'}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nCompany: ${form.company}\n\nWebsite Type: ${form.websiteType}\nBudget: ${form.budget}\nTimeline: ${form.timeline}\n\nMessage:\n${form.message}`
      );
      window.location.href = `mailto:info@biostecgroup.co.za?subject=${subject}&body=${body}`;
      setStatus('sent');
      setForm(EMPTY);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all';
  const selectClass =
    'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all appearance-none cursor-pointer';

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-24 md:py-32">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/20 border border-brand-primary/30 rounded-full text-xs font-bold text-blue-300 uppercase tracking-widest mb-6">
              <Code2 className="w-3.5 h-3.5" />
              Biostec Group Dev
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              We Build{' '}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-cyan-400">
                Websites
              </span>{' '}
              &amp;{' '}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-pink-400">
                Web Apps
              </span>{' '}
              That Work.
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
              From a simple business landing page to a fully custom web application —
              Biostec Group Dev delivers fast, modern, and affordable digital solutions
              for South African businesses and beyond.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#get-started"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
              >
                Start Your Project
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#portfolio"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 border border-white/15 text-white font-semibold rounded-xl hover:bg-white/15 transition-all"
              >
                See Our Work
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── What We Offer ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">What We Build</p>
            <h2 className="text-3xl font-bold text-slate-900">One team. Every digital need.</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Whether you need a sleek brochure site or a full-stack web platform, we have you covered.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-brand-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-all">
                  <s.icon className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portfolio ─────────────────────────────────────────────────────────── */}
      <section id="portfolio" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Our Work</p>
            <h2 className="text-3xl font-bold text-slate-900">Sites We've Built</h2>
            <p className="mt-3 text-slate-500 max-w-md mx-auto">
              Real projects, live on the web. Each one built with care, speed, and purpose.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {portfolioSites.map((site, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Gradient banner */}
                <div className={`bg-linear-to-br ${site.gradient} h-36 flex items-center justify-center relative overflow-hidden`}>
                  <span className="text-5xl">{site.icon}</span>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 text-base mb-1">{site.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1">{site.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {site.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-blue-800 transition-colors"
                  >
                    Visit Site
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            ))}

            {/* Coming soon card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center min-h-[260px] bg-slate-50 sm:col-span-2 lg:col-span-1"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-slate-400" />
              </div>
              <p className="font-bold text-slate-500 mb-1">More Coming Soon</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                New sites are launching every month. Yours could be next.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Why Us</p>
            <h2 className="text-3xl font-bold">Built different. Delivered right.</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-primary/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-bold text-white mb-1.5">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inquiry Form ──────────────────────────────────────────────────────── */}
      <section id="get-started" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Get Started</p>
            <h2 className="text-3xl font-bold text-slate-900">Tell us about your project</h2>
            <p className="mt-3 text-slate-500 max-w-md mx-auto">
              Fill in the form below and our team will reach out within 24 hours with a plan and quote.
            </p>
          </motion.div>

          {status === 'sent' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-emerald-100 p-12 text-center shadow-sm"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">We got your request!</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                Our dev team will review your details and get back to you at <strong>{form.email || 'your email'}</strong> within 24 hours.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-6 px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Submit another request
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6"
            >
              {/* Personal details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Your Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name <span className="text-brand-accent">*</span></label>
                    <input type="text" required placeholder="Lethabo Mashigo" value={form.name} onChange={set('name')} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address <span className="text-brand-accent">*</span></label>
                    <input type="email" required placeholder="you@company.co.za" value={form.email} onChange={set('email')} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number</label>
                    <input type="tel" placeholder="+27 61 263 6912" value={form.phone} onChange={set('phone')} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company / Brand Name</label>
                    <input type="text" placeholder="Biostec Group" value={form.company} onChange={set('company')} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Project details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Project Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type of Website <span className="text-brand-accent">*</span></label>
                    <div className="relative">
                      <select required value={form.websiteType} onChange={set('websiteType')} className={selectClass}>
                        <option value="" disabled>Select type...</option>
                        {websiteTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Budget Range</label>
                    <div className="relative">
                      <select value={form.budget} onChange={set('budget')} className={selectClass}>
                        <option value="">Select budget...</option>
                        {budgets.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Timeline</label>
                    <div className="relative">
                      <select value={form.timeline} onChange={set('timeline')} className={selectClass}>
                        <option value="">Select timeline...</option>
                        {timelines.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tell us more about your project</label>
                  <textarea
                    rows={4}
                    placeholder="Describe what you need — features, content, goals, anything that helps us understand your vision..."
                    value={form.message}
                    onChange={set('message')}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                  Something went wrong. Please email us directly at{' '}
                  <a href="mailto:info@biostecgroup.co.za" className="font-semibold underline">info@biostecgroup.co.za</a>.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
              >
                {status === 'sending' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Project Request</>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                Or email us directly at{' '}
                <a href="mailto:info@biostecgroup.co.za" className="text-brand-primary font-semibold hover:underline">
                  info@biostecgroup.co.za
                </a>
              </p>
            </motion.form>
          )}
        </div>
      </section>
    </div>
  );
}
