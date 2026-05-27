import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wrench, Send, CheckCircle, Clock, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../context/AuthContext';

export default function Repair() {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    deviceModel: '',
    issueDescription: '',
    customerName: user ? `${user.first_name} ${user.last_name}` : '',
    customerEmail: user?.email || '',
    customerPhone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/repairs/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to submit ticket');
      }

      setIsSuccess(true);
      setFormData({
        deviceModel: '',
        issueDescription: '',
        customerName: user ? `${user.first_name} ${user.last_name}` : '',
        customerEmail: user?.email || '',
        customerPhone: '',
      });
    } catch (error: any) {
      console.error('Repair ticket error', error);
      alert(error.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-brand-bg">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.1)] border border-slate-100 text-center"
        >
          <div className="bg-emerald-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-brand-primary mb-4 uppercase tracking-tighter">TICKET INITIALIZED</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">Our diagnostics team has received your request. We will contact you within 24 hours with a preliminary assessment.</p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="w-full bg-brand-primary text-white py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-accent transition-all shadow-2xl shadow-brand-primary/10"
          >
            Submit Another Request
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-brand-text">
        <div className="absolute inset-0 noise-bg opacity-20 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/30 via-transparent to-white z-0" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-8"
          >
            <Wrench className="w-4 h-4 text-brand-accent" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Precision Restoration Lab</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8"
          >
            RESTORE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40 text-brand-accent">PERFORMANCE.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium mb-12 leading-relaxed"
          >
            From micro-soldering to high-performance upgrades, our certified technicians 
            bring your professional hardware back to factory excellence.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-30 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white p-10 md:p-16 rounded-[3rem] shadow-premium border border-slate-100"
          >
            <div className="mb-12">
              <h2 className="text-3xl font-black text-brand-primary tracking-tighter uppercase mb-2">Initialize Ticket</h2>
              <p className="text-slate-500 font-medium">Provide details about your hardware for a rapid assessment.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Hardware Model</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. MacBook Pro 16-inch (2021)"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all font-medium text-brand-primary placeholder:text-slate-300"
                    value={formData.deviceModel}
                    onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial Number (Optional)</label>
                  <input 
                    type="text"
                    placeholder="Find it on the bottom cover"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all font-medium text-brand-primary placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Name</label>
                  <input 
                    required
                    type="text"
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all font-medium text-brand-primary placeholder:text-slate-300"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                  <input 
                    required
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all font-medium text-brand-primary placeholder:text-slate-300"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Specification</label>
                <textarea 
                  required
                  rows={5}
                  placeholder="Describe the symptoms or required upgrades in detail..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all font-medium text-brand-primary placeholder:text-slate-300 resize-none"
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                />
              </div>

              <div className="pt-4">
                <button 
                  disabled={isSubmitting}
                  className="w-full bg-brand-primary text-white py-6 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-brand-accent transition-all shadow-2xl shadow-brand-primary/10 hover:shadow-brand-accent/40 hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Restoration Ticket
                    </>
                  )}
                </button>
                
                {!isAuthenticated && (
                  <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-red-500" />
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                      Authentication required to submit tickets
                    </p>
                  </div>
                )}
              </div>
            </form>
          </motion.div>

          {/* Info Column */}
          <div className="space-y-8">
            <div className="bg-brand-primary p-10 rounded-[3rem] text-white shadow-premium">
              <Clock className="w-10 h-10 text-brand-accent mb-6" />
              <h3 className="text-2xl font-black tracking-tight mb-4 uppercase">Express <br />Turnaround.</h3>
              <p className="text-white/70 text-sm font-medium leading-relaxed">
                Most common repairs like screen and battery replacements are completed within 24-48 hours.
              </p>
            </div>

            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-premium">
              <Shield className="w-10 h-10 text-brand-primary mb-6" />
              <h3 className="text-2xl font-black text-brand-primary tracking-tight mb-4 uppercase">90-Day <br />Guarantee.</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We stand by our work. All repairs include a comprehensive 90-day warranty on parts and labor.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-8 h-8 text-brand-accent" />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">ESD-Safe Lab</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Certified Environment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
