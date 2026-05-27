import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Award, Users, Target, CheckCircle2, ArrowRight, Globe, Eye, Rocket, MessageCircle } from 'lucide-react';

// Counter animation hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return { count, ref };
}

function CounterCard({ icon: Icon, value, label }: { icon: React.ElementType, value: number, label: string }) {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="stat-glass-card text-center p-6 rounded-2xl shadow-lg border border-slate-700/30 h-full bg-slate-800/40 backdrop-blur-sm hover:bg-slate-800/60 transition-all hover:-translate-y-1">
      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-blue-500" />
      </div>
      <div className="flex justify-center items-baseline">
        <h2 className="text-4xl font-bold text-white mb-0">{count}</h2>
        <h2 className="text-blue-500 font-bold mb-0">+</h2>
      </div>
      <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mt-2">{label}</p>
    </div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-slate-900" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <p className="text-blue-500 font-semibold text-sm uppercase tracking-wider mb-4">
                Establishing Trust Since 2017
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Pioneering Reliable Tech at <span className="text-blue-500">Biostec Group</span>
              </h1>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Biostec Group bridges the gap between premium technology and affordability. 
                We specialize in sourcing high-performance refurbished computing solutions 
                and providing precision-led repair services.
              </p>

              {/* Vision & Mission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-slate-800 p-3 rounded-xl">
                    <Eye className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-1">Our Vision</h5>
                    <p className="text-slate-400 text-sm">To be Southern Africa's most trusted hub for sustainable, high-quality refurbished technology.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-slate-800 p-3 rounded-xl">
                    <Rocket className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-1">Our Mission</h5>
                    <p className="text-slate-400 text-sm">Empowering progress by delivering precision-repaired devices and enterprise-grade laptops to every desk.</p>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 mb-8 p-4 bg-slate-800/50 rounded-2xl">
                <div className="text-center pr-6 border-r border-slate-700">
                  <h2 className="text-4xl font-bold text-blue-500 mb-0">9+</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase">Years Expert</p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>Certified Grade-A</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>Expert Repairs</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>Nationwide Shipping</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>After-Sales Care</span>
                  </div>
                </div>
              </div>

              {/* Founder & CTA */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center bg-slate-800 p-3 rounded-full">
                  <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    MS
                  </div>
                  <div className="ml-3 pr-3">
                    <h6 className="text-white font-bold mb-0">Mahlatse Seroba</h6>
                    <p className="text-slate-400 text-sm mb-0">Founder & CEO</p>
                  </div>
                </div>
                <a 
                  href="/contact" 
                  className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  Learn More <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>

            {/* Right Images */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src="/devices-showcase.png" 
                  alt="Biostec Workshop" 
                  className="w-full h-[400px] object-cover"
                />
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-4 rounded-2xl shadow-xl">
                <h4 className="text-2xl font-bold mb-0">100%</h4>
                <small className="text-center text-blue-100 text-xs">QUALITY<br/>ASSURED</small>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <CounterCard icon={Users} value={829} label="Happy Clients" />
            <CounterCard icon={ShieldCheck} value={1500} label="Laptops Repaired" />
            <CounterCard icon={Award} value={127} label="Trusted Partners" />
            <CounterCard icon={Target} value={5000} label="Parts Replaced" />
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12">
            <div>
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">Our Capabilities</p>
              <h2 className="text-4xl font-bold text-slate-900">Engineered for <span className="text-blue-600">Performance</span></h2>
            </div>
            <div>
              <p className="text-slate-500 text-lg border-l-4 border-blue-600 pl-4">
                We don't just sell hardware; we provide the lifecycle support that modern individuals and businesses demand.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Premium Retail */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl border bg-slate-50 h-full hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <h1 className="text-6xl font-bold text-slate-200 mb-4">01</h1>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Premium Retail</h4>
              <p className="text-slate-500 mb-4">Certified pre-owned laptops that pass our rigorous 25-point hardware inspection protocol.</p>
              <a href="/products" className="text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Browse Inventory <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Precision Repair */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-3xl border bg-slate-900 text-white h-full hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <h1 className="text-6xl font-bold text-slate-700 mb-4">02</h1>
              <h4 className="text-xl font-bold mb-3">Precision Repair</h4>
              <p className="text-slate-400 mb-4">Advanced micro-soldering and board-level repairs to extend the life of your technology.</p>
              <a href="/repair" className="text-blue-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Repair Status <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Parts Hub */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-3xl border bg-slate-50 h-full hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <h1 className="text-6xl font-bold text-slate-200 mb-4">03</h1>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Parts Hub</h4>
              <p className="text-slate-500 mb-4">Authentic OEM components including high-cycle batteries, fast SSDs, and crystal-clear displays.</p>
              <a href="/contact" className="text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Inquire Parts <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Connect with our <span className="text-blue-600">Experts</span></h2>
              <p className="text-slate-500 mb-6">Our leadership team brings decades of combined technical experience to the South African tech market.</p>
              <div className="inline-flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="block text-sm text-slate-500">24/7 Support</span>
                  <span className="font-bold text-slate-900">Live Chat</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Mahlatse Seroba */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-4 rounded-3xl shadow-sm border hover:shadow-lg transition-all hover:-translate-y-2"
                >
                  <div className="w-full h-64 rounded-2xl mb-4 overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src="/images/mahlatse-seroba.jpeg"
                      alt="Mahlatse Seroba"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-2">
                    <h5 className="text-lg font-bold text-slate-900 mb-0">Mahlatse Seroba</h5>
                    <span className="text-blue-600 text-sm font-semibold">Founder / Managing Director</span>
                    <div className="mt-3 pt-3 border-t flex gap-4">
                      <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                      <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </motion.div>

                {/* Lethabo Mashigo */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-white p-4 rounded-3xl shadow-sm border hover:shadow-lg transition-all hover:-translate-y-2"
                >
                  <div className="w-full h-64 rounded-2xl mb-4 overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src="/images/lethabo-mashigo.jpeg"
                      alt="Lethabo Mashigo"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="px-2">
                    <h5 className="text-lg font-bold text-slate-900 mb-0">Lethabo Mashigo</h5>
                    <span className="text-blue-600 text-sm font-semibold">Senior Technical Lead</span>
                    <div className="mt-3 pt-3 border-t flex gap-4">
                      <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                        </svg>
                      </a>
                      <a href="#" className="text-slate-400 hover:text-pink-600 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Experience the Biostec Standard
              </h2>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                South Africa's premier destination for high-performance refurbished computing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/products"
                  className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all"
                >
                  View Inventory
                </a>
                <a 
                  href="/contact"
                  className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-full font-semibold hover:bg-white/20 transition-all"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
