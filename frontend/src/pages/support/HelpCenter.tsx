import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, HelpCircle, MessageCircle, Phone, ChevronDown, Zap, Droplets, CreditCard } from 'lucide-react';

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const categories = [
    { icon: <Zap className="text-amber-500" />, title: 'Electricity', desc: 'Meter setup and tokens' },
    { icon: <Droplets className="text-blue-500" />, title: 'Water', desc: 'Smart water metering' },
    { icon: <CreditCard className="text-emerald-500" />, title: 'Payments', desc: 'M-Pesa & Bank help' },
  ];

  const faqs = [
    { q: "How do I load a token?", a: "Once you receive your 20-digit token via SMS, enter it directly into your prepaid meter's keypad and press the 'Enter' or 'Accept' button (usually green or blue)." },
    { q: "My token was rejected, what now?", a: "Ensure you entered the meter number correctly. If the error persists, it may be due to a tariff change or a tamper lock. Contact our support team immediately." },
    { q: "How long does M-Pesa take?", a: "Transactions are processed instantly. You should receive your token within 30 seconds of the M-Pesa confirmation." },
    { q: "Can I track my consumption history?", a: "Yes, use the 'Track Token' feature on the landing page or log in to your customer dashboard for detailed analytics." },
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20">
      {/* Hero */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-20 mb-16 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-black mb-6">How can we help?</h1>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6">
        {/* Categories */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {categories.map((cat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center"
            >
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {cat.icon}
              </div>
              <h3 className="font-bold mb-2">{cat.title}</h3>
              <p className="text-xs text-slate-500">{cat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
            <HelpCircle className="text-amber-600" /> Common Questions
          </h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left flex justify-between items-center"
                >
                  <span className="font-bold text-slate-900 dark:text-white">{faq.q}</span>
                  <ChevronDown className={`text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="p-6 pt-0 text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800 mt-2">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-32 text-center pb-20">
          <h2 className="text-2xl font-black mb-12">Still need help?</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {/* WhatsApp Chat */}
            <a 
              href="https://wa.me/254741099909" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-emerald-500/5 hover:bg-emerald-500/10 p-4 rounded-3xl transition-colors border border-emerald-500/10"
            >
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <MessageCircle />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-emerald-600">WhatsApp Chat</p>
                <p className="font-bold">Chat with us now</p>
              </div>
            </a>

            {/* Email Support */}
            <a 
              href="mailto:info@tokenpap.com"
              className="flex items-center gap-4 bg-amber-500/5 hover:bg-amber-500/10 p-4 rounded-3xl transition-colors border border-amber-500/10"
            >
              <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Search />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-amber-600">Email Support</p>
                <p className="font-bold">info@tokenpap.com</p>
              </div>
            </a>

            {/* Call Support */}
            <a 
              href="tel:+254741099909"
              className="flex items-center gap-4 bg-slate-900/5 hover:bg-slate-900/10 p-4 rounded-3xl transition-colors border border-slate-900/10"
            >
              <div className="w-12 h-12 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-lg">
                <Phone />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-slate-400">Call Us</p>
                <p className="font-bold">+254 741 099 909</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
