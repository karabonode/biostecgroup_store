import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Code2, Globe, ShoppingBag, LayoutDashboard, Smartphone,
  Zap, ArrowRight, CheckCircle, ExternalLink, Send, Loader2,
  Users, Star, Palette, Database, Monitor
} from 'lucide-react';

// ── Portfolio data ─────────────────────────────────────────────────────────────
const portfolio = [
  {
    name: 'Karabo Node',
    tagline: 'South African Tech Node',
    url: 'https://karabonode.co.za',
    description: 'AI-powered technology hub and developer community platform — home to Karabo Academy, custom software, and open-source tools.',
    tags: ['Web App', 'AI', 'EdTech'],
    type: 'karabo',
  },
  {
    name: 'Nature Talks Tours',
    tagline: 'Travel & Tours — Cape Town',
    url: 'https://naturetalkstours.co.za',
    description: "Eco-tourism booking platform for private and small-group guided tours through Cape Town and South Africa's natural wonders.",
    tags: ['Tourism', 'Booking', 'Business'],
    type: 'nature',
  },
  {
    name: 'Mudaus Projects',
    tagline: 'Engineering Excellence',
    url: 'https://themudaus.co.za',
    description: 'Professional engineering and project management firm website showcasing precision-engineered solutions for industrial leaders.',
    tags: ['Engineering', 'Corporate', 'Website'],
    type: 'mudaus',
  },
  {
    name: 'EduPulse',
    tagline: 'Smart Learning Platform',
    url: 'https://edupulse.karabonode.co.za',
    description: 'Smart e-learning web application connecting South African students with curated study resources and tutors.',
    tags: ['EdTech', 'Platform', 'Web App'],
    type: 'edupulse',
  },
];

// ── Site-specific mock previews ────────────────────────────────────────────────
function KaraboPreview() {
  return (
    <div className="w-full h-full bg-[#05061a] relative overflow-hidden select-none">
      {/* grid lines */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-600/30 blur-2xl" />
      <div className="absolute bottom-0 left-4 w-24 h-24 rounded-full bg-violet-600/25 blur-2xl" />
      <div className="relative p-5 pt-4">
        {/* badge */}
        <div className="inline-flex items-center gap-1.5 border border-blue-500/40 bg-blue-500/10 rounded px-2 py-0.5 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">South African Tech Node // Active</span>
        </div>
        {/* headline */}
        <div className="font-extrabold text-white leading-none mb-1" style={{ fontSize: '18px' }}>BRIDGING THE</div>
        <div className="font-extrabold leading-none mb-3" style={{ fontSize: '18px' }}>
          <span className="text-blue-400">GAP </span>
          <span className="text-violet-400">IN </span>
          <span className="text-cyan-400">TECH.</span>
        </div>
        <p className="text-[8px] text-slate-400 leading-relaxed mb-4 max-w-40">
          Building pathways out of limitation — from free roadmaps to structured mastery.
        </p>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-blue-600 rounded text-[8px] font-bold text-white">START LEARNING</div>
          <div className="px-3 py-1.5 bg-white/10 border border-white/20 rounded text-[8px] font-bold text-white">JOIN WAITLIST</div>
        </div>
      </div>
    </div>
  );
}

function NaturePreview() {
  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      {/* photo bg simulation */}
      <div className="absolute inset-0 bg-linear-to-br from-teal-800 via-teal-600/80 to-slate-700" />
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />
      <div className="relative p-5 pt-4">
        {/* nav pill */}
        <div className="inline-flex items-center gap-1.5 border border-white/30 bg-white/10 backdrop-blur rounded-full px-3 py-1 mb-3">
          <span className="text-[8px] font-semibold text-white uppercase tracking-widest">Experience Cape Town With Local Experts</span>
        </div>
        {/* headline */}
        <h3 className="font-extrabold text-white leading-tight mb-3" style={{ fontSize: '14px' }}>
          Private and small-group<br />tours designed around<br />the best of Cape Town
        </h3>
        <p className="text-[8px] text-white/70 leading-relaxed mb-4 max-w-40">
          Guided by experienced local experts. Table Mountain, Cape Point, wildlife and more.
        </p>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-orange-500 rounded-full text-[8px] font-bold text-white flex items-center gap-1">View Tours →</div>
          <div className="px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-[8px] font-semibold text-white">WhatsApp Now</div>
        </div>
      </div>
    </div>
  );
}

function MudausPreview() {
  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      {/* construction photo bg simulation */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-700 via-slate-800 to-slate-900" />
      {/* texture */}
      <div className="absolute inset-0 opacity-15"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 0px, transparent 50%)', backgroundSize: '8px 8px' }} />
      <div className="relative p-5 pt-4">
        {/* badge */}
        <div className="inline-flex items-center gap-1.5 bg-cyan-500 rounded px-2 py-0.5 mb-3">
          <span className="text-[8px] font-bold text-white uppercase tracking-widest">Engineering Excellence</span>
        </div>
        {/* headline */}
        <div className="font-extrabold text-white leading-tight mb-3" style={{ fontSize: '13px' }}>
          Delivering{' '}
          <span className="text-cyan-400">Results-</span><br />
          <span className="text-pink-400">Driven</span>{' '}Engineering<br />Solutions
        </div>
        <p className="text-[8px] text-slate-300 leading-relaxed mb-4 max-w-40">
          Precision-engineered solutions and complex project management for global industrial leaders.
        </p>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-pink-500 rounded text-[8px] font-bold text-white">REQUEST A QUOTE →</div>
          <div className="px-3 py-1.5 border border-cyan-400 rounded text-[8px] font-bold text-cyan-400">OUR CAPABILITIES</div>
        </div>
      </div>
    </div>
  );
}

function EduPulsePreview() {
  return (
    <div className="w-full h-full bg-[#0f0a2e] relative overflow-hidden select-none">
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 20% 80%, #2563eb 0%, transparent 40%)' }} />
      <div className="relative p-5 pt-4">
        <div className="inline-flex items-center gap-1.5 border border-violet-500/40 bg-violet-500/10 rounded-full px-2 py-0.5 mb-3">
          <span className="text-[8px] font-bold text-violet-300 uppercase tracking-widest">Smart Learning Platform</span>
        </div>
        <div className="font-extrabold text-white leading-tight mb-3" style={{ fontSize: '15px' }}>
          Learn Smarter.<br />
          <span className="text-violet-400">Grow Faster.</span>
        </div>
        <p className="text-[8px] text-slate-400 leading-relaxed mb-4 max-w-40">
          Connecting South African students with curated resources, tutors and structured learning paths.
        </p>
        <div className="flex gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-violet-600 rounded-lg text-[8px] font-bold text-white">Start Learning</div>
          <div className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-[8px] font-semibold text-white">Browse Courses</div>
        </div>
      </div>
    </div>
  );
}

const previewMap: Record<string, React.FC> = {
  karabo:   KaraboPreview,
  nature:   NaturePreview,
  mudaus:   MudausPreview,
  edupulse: EduPulsePreview,
};

const tagColors: Record<string, string> = {
  'Web App':     'bg-blue-50 text-blue-700',
  'AI':          'bg-violet-50 text-violet-700',
  'EdTech':      'bg-purple-50 text-purple-700',
  'Tourism':     'bg-emerald-50 text-emerald-700',
  'Booking':     'bg-teal-50 text-teal-700',
  'Business':    'bg-slate-100 text-slate-700',
  'Engineering': 'bg-orange-50 text-orange-700',
  'Corporate':   'bg-slate-100 text-slate-600',
  'Website':     'bg-sky-50 text-sky-700',
  'Platform':    'bg-indigo-50 text-indigo-700',
};

// ── Services ───────────────────────────────────────────────────────────────────
const services = [
  { icon: Globe,           title: 'Business Website',      desc: 'A professional online presence that represents your brand 24/7.' },
  { icon: ShoppingBag,     title: 'E-commerce Store',       desc: 'Sell products online with payments, inventory and order management.' },
  { icon: LayoutDashboard, title: 'Web Application',        desc: 'Custom platforms, dashboards, portals or internal tools.' },
  { icon: Smartphone,      title: 'Landing Page',           desc: 'High-converting single-page sites for campaigns or launches.' },
  { icon: Palette,         title: 'Brand & Design',         desc: 'Logo, brand identity, and UI/UX design tailored to your audience.' },
  { icon: Database,        title: 'API & Backend',          desc: 'Robust backends, databases, and API integrations for your systems.' },
];

const whyUs = [
  { icon: Zap,         title: 'Fast Delivery',   desc: 'We move quickly — most sites ship within 2–4 weeks.' },
  { icon: Star,        title: 'Quality Work',    desc: 'Clean code, polished design, real results.' },
  { icon: Users,       title: 'Local Team',      desc: 'South African team that understands your market.' },
  { icon: CheckCircle, title: 'Full Support',    desc: 'Post-launch support so your site stays live and up to date.' },
];

const websiteTypes = [
  'Business Website', 'E-commerce Store', 'Web Application / Platform',
  'Landing Page', 'Portfolio Website', 'Blog / News Website',
  'Booking & Reservation System', 'Other / Not Sure',
];
const budgets   = ['Under R 5,000', 'R 5,000 – R 15,000', 'R 15,000 – R 30,000', 'R 30,000 – R 60,000', 'R 60,000+', 'Not sure yet'];
const timelines = ['As soon as possible', 'Within 1 month', '1 – 3 months', '3 – 6 months', 'Flexible / No rush'];

interface FormData {
  name: string; email: string; phone: string; company: string;
  websiteType: string; budget: string; timeline: string; message: string;
}
const EMPTY: FormData = { name: '', email: '', phone: '', company: '', websiteType: '', budget: '', timeline: '', message: '' };

export default function Dev() {
  const [form, setForm]     = useState<FormData>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact/dev-inquiry.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setStatus('sent'); setForm(EMPTY); }
      else setStatus('error');
    } catch {
      const subject = encodeURIComponent(`Web Development Inquiry – ${form.websiteType || 'Website'}`);
      const body    = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nCompany: ${form.company}\n\nWebsite Type: ${form.websiteType}\nBudget: ${form.budget}\nTimeline: ${form.timeline}\n\nMessage:\n${form.message}`);
      window.location.href = `mailto:info@biostecgroup.co.za?subject=${subject}&body=${body}`;
      setStatus('sent'); setForm(EMPTY);
    }
  };

  const inputClass  = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all';
  const selectClass = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all appearance-none cursor-pointer';

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-24 md:py-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 w-150 h-150 rounded-full bg-brand-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-150 h-150 rounded-full bg-violet-600/15 blur-3xl" />
          {/* grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/20 border border-brand-primary/30 rounded-full text-xs font-bold text-blue-300 uppercase tracking-widest mb-7">
                <Code2 className="w-3.5 h-3.5" />
                Biostec Group Dev
              </span>
              <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] mb-6">
                We Build<br />
                <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-cyan-400">Websites</span>{' '}&amp;{' '}
                <span className="bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-pink-400">Web Apps</span><br />
                That Work.
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
                From a clean landing page to a full-stack platform — Biostec Group Dev delivers fast, modern, and
                affordable digital solutions for South African businesses.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#get-started" className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                  Start Your Project <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#portfolio" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 border border-white/15 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur">
                  See Our Work
                </a>
              </div>
            </motion.div>

            {/* stat cards */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="hidden lg:grid grid-cols-2 gap-4"
            >
              {[
                { value: '4+', label: 'Live Sites Built', color: 'from-blue-600 to-blue-700' },
                { value: '2–4', label: 'Weeks to Launch', color: 'from-violet-600 to-purple-700' },
                { value: '100%', label: 'SA-Based Team', color: 'from-emerald-600 to-teal-700' },
                { value: '∞', label: 'Post-Launch Support', color: 'from-pink-600 to-rose-700' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className={`bg-linear-to-br ${s.color} rounded-2xl p-6 flex flex-col`}
                >
                  <span className="text-4xl font-extrabold text-white mb-1">{s.value}</span>
                  <span className="text-sm text-white/70 font-medium">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">What We Build</p>
            <h2 className="text-3xl font-bold text-slate-900">One team. Every digital need.</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">Whether you need a sleek brochure site or a full-stack web platform, we have you covered.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-brand-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-brand-primary transition-colors">
                  <s.icon className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portfolio ────────────────────────────────────────────────────────────── */}
      <section id="portfolio" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Our Work</p>
            <h2 className="text-3xl font-bold text-slate-900">Live Sites We've Built</h2>
            <p className="mt-3 text-slate-500 max-w-md mx-auto">Real projects, live on the web. Each one built with care, speed, and purpose.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {portfolio.map((site, i) => {
              const Preview = previewMap[site.type];
              return (
                <motion.div
                  key={site.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-2xl transition-all duration-300 flex flex-col bg-white"
                >
                  {/* Browser chrome */}
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="w-3 h-3 rounded-full bg-yellow-400" />
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 text-[10px] text-slate-400 font-mono truncate flex items-center gap-1.5">
                      <Globe className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                      {site.url.replace('https://', '')}
                    </div>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-slate-200 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 transition-colors" />
                    </a>
                  </div>

                  {/* Preview window */}
                  <div className="relative overflow-hidden" style={{ height: '220px' }}>
                    <Preview />
                    {/* Hover overlay */}
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl shadow-xl transform scale-95 group-hover:scale-100 transition-transform duration-200">
                        <Monitor className="w-4 h-4" /> Visit Live Site
                      </span>
                    </a>
                  </div>

                  {/* Card info */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{site.name}</h3>
                        <p className="text-xs text-slate-400">{site.tagline}</p>
                      </div>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-blue-50 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">{site.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {site.tags.map(tag => (
                        <span key={tag} className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tagColors[tag] || 'bg-slate-100 text-slate-600'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Coming soon */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 py-12 flex flex-col items-center justify-center text-center bg-slate-50"
          >
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-brand-primary" />
            </div>
            <p className="font-bold text-slate-700 mb-1 text-lg">More Sites Launching Soon</p>
            <p className="text-sm text-slate-400 max-w-xs">New projects go live every month. Yours could be next.</p>
            <a href="#get-started" className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all">
              Start Your Project <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Why Us ───────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Why Us</p>
            <h2 className="text-3xl font-bold">Built different. Delivered right.</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* ── Inquiry Form ─────────────────────────────────────────────────────────── */}
      <section id="get-started" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Get Started</p>
            <h2 className="text-3xl font-bold text-slate-900">Tell us about your project</h2>
            <p className="mt-3 text-slate-500 max-w-md mx-auto">
              Fill in the form and our team will reach out within 24 hours with a plan and quote.
            </p>
          </motion.div>

          {status === 'sent' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-emerald-100 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">We got your request!</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">Our dev team will get back to you within 24 hours.</p>
              <button onClick={() => setStatus('idle')} className="mt-6 px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                Submit another request
              </button>
            </motion.div>
          ) : (
            <motion.form initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">

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

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Project Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Type of Website', key: 'websiteType' as const, options: websiteTypes, placeholder: 'Select type...', required: true },
                    { label: 'Budget Range',     key: 'budget'      as const, options: budgets,       placeholder: 'Select budget...' },
                    { label: 'Timeline',         key: 'timeline'    as const, options: timelines,     placeholder: 'Select timeline...' },
                  ].map(({ label, key, options, placeholder, required }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        {label} {required && <span className="text-brand-accent">*</span>}
                      </label>
                      <div className="relative">
                        <select required={required} value={form[key]} onChange={set(key)} className={selectClass}>
                          <option value="" disabled>{placeholder}</option>
                          {options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  Something went wrong. Email us directly at{' '}
                  <a href="mailto:info@biostecgroup.co.za" className="font-semibold underline">info@biostecgroup.co.za</a>.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-sm shadow-lg shadow-blue-500/20"
              >
                {status === 'sending'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><Send className="w-4 h-4" /> Send Project Request</>}
              </button>

              <p className="text-center text-xs text-slate-400">
                Or email us at{' '}
                <a href="mailto:info@biostecgroup.co.za" className="text-brand-primary font-semibold hover:underline">info@biostecgroup.co.za</a>
              </p>
            </motion.form>
          )}
        </div>
      </section>
    </div>
  );
}
