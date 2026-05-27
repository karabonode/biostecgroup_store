import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Mail, MessageCircle, Wrench, Send, Loader2 } from 'lucide-react';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`;
    const mailtoLink = `mailto:info@biostecgroup.co.za?subject=${encodeURIComponent(formData.subject || 'Enquiry from website')}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Contact Cards Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Visit Us */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 shadow-sm text-center"
            >
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Visit Us</h3>
              <p className="text-slate-500 text-sm">
                Management House, Braamfontein,<br />Johannesburg, 2017
              </p>
            </motion.div>

            {/* Email Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-8 shadow-sm text-center"
            >
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Email Support</h3>
              <p className="text-slate-500 text-sm">
                info@biostecgroup.co.za
              </p>
            </motion.div>

            {/* Laptop Sales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-8 shadow-sm text-center border-b-4 border-emerald-600"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Laptop Sales</h3>
              <p className="text-slate-500 text-sm mb-3">Chat with Sales Team</p>
              <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 transition-colors">
                Online Now
              </button>
            </motion.div>

            {/* Repair Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-8 shadow-sm text-center border-b-4 border-red-600"
            >
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Repair Status</h3>
              <p className="text-slate-500 text-sm mb-3">Technical Assistance</p>
              <button className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-full hover:bg-red-700 transition-colors">
                Expert Help
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Form & Map Section */}
      <section className="py-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 rounded-xl p-8 md:p-10"
            >
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Email Client Opened!</h2>
                  <p className="text-slate-400 mb-2">Your message was prepared and your email app should have opened.</p>
                  <p className="text-slate-500 text-sm mb-6">If it didn't open, email us directly at <span className="text-blue-400">info@biostecgroup.co.za</span></p>
                  <button
                    onClick={() => { setIsSuccess(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
                    Send us a <span className="text-red-500">Direct Message</span>
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        required
                        type="text"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <input
                        required
                        type="email"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Subject (e.g., Repair or Purchase)"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />

                    <textarea
                      required
                      rows={5}
                      placeholder="Detailed Message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />

                    <button 
                      disabled={isSubmitting}
                      className="w-full bg-red-600 text-white py-4 rounded-lg font-bold uppercase tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Inquiry
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>

            {/* Google Maps */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl overflow-hidden shadow-sm h-full min-h-[400px]"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3578.9325881707576!2d28.0341!3d-26.1924!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e950c1a3e7c4c7d%3A0x8c3e1c3e1c3e1c3e!2sManagement%20House%2C%20Braamfontein%2C%20Johannesburg%2C%202017!5e0!3m2!1sen!2sza!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Biostec Group Location"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
