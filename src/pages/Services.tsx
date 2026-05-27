import React from 'react';
import { motion } from 'motion/react';
import { Headphones, Tag, Shield, Wrench, Truck, UserCheck } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: Headphones,
      title: 'Expert Consultation',
      desc: 'Personalized hardware matching to ensure your laptop choice aligns perfectly with your workflow or study requirements.',
      color: 'blue'
    },
    {
      icon: Tag,
      title: 'Value Engineering',
      desc: 'Premium Grade-A laptops at competitive price points, making high-performance computing accessible to everyone.',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Warranty Assurance',
      desc: 'Every device undergoes a 25-point inspection and is backed by our comprehensive hardware warranty for total peace of mind.',
      color: 'blue'
    },
    {
      icon: Wrench,
      title: 'Precision Repairs',
      desc: 'From micro-soldering to screen replacements, our technicians restore your devices to peak factory performance.',
      color: 'slate'
    },
    {
      icon: Truck,
      title: 'Swift Logistics',
      desc: 'Secure, nationwide delivery options ensuring your tech investment arrives safely at your doorstep.',
      color: 'slate'
    },
    {
      icon: UserCheck,
      title: 'Lifetime Support',
      desc: 'Access to our dedicated helpdesk long after your purchase for software optimization and technical advice.',
      color: 'slate'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-4">
              Expertise
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Our Specialized <span className="text-blue-600">Services</span>
            </h1>
            <p className="max-w-2xl mx-auto text-slate-500 text-lg">
              Bridging the gap between premium technology and affordability through expert refurbishment and technical support.
            </p>
          </motion.div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all border-b-4 ${
                  service.color === 'blue' ? 'border-blue-600' : 'border-slate-700'
                }`}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                  service.color === 'blue' ? 'bg-blue-100' : 'bg-slate-100'
                }`}>
                  <service.icon className={`w-7 h-7 ${
                    service.color === 'blue' ? 'text-blue-600' : 'text-slate-700'
                  }`} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-slate-500 text-sm leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6"
            >
              <p className="text-4xl font-bold text-blue-600 mb-2">5000+</p>
              <p className="text-slate-600">Devices Refurbished</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6"
            >
              <p className="text-4xl font-bold text-blue-600 mb-2">98%</p>
              <p className="text-slate-600">Customer Satisfaction</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6"
            >
              <p className="text-4xl font-bold text-blue-600 mb-2">3 Month</p>
              <p className="text-slate-600">Warranty on All Devices</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Browse our inventory of certified renewed laptops or contact us for a personalized consultation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="/products"
                className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all"
              >
                Browse Products
              </a>
              <a 
                href="/contact"
                className="px-8 py-4 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-all"
              >
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
