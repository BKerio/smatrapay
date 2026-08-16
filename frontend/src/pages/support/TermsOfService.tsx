import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose dark:prose-invert prose-amber max-w-none"
        >
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Scale className="text-amber-600" size={32} />
            </div>
            <h1 className="text-4xl font-black mb-4">Terms of Service</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Agreement for SmatraPay Services</p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <CheckCircle2 className="text-amber-600" size={24} /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the SmatraPay platform, you agree to be bound by these Terms of Service.
              Our platform facilitates the vending of utility tokens and management of smart meters.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Gavel className="text-amber-600" size={24} /> 2. User Responsibilities
            </h2>
            <p>
              Users are responsible for the accuracy of the meter numbers entered during transactions. 
              SmatraPay is not liable for tokens generated for incorrectly entered meter numbers.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <AlertCircle className="text-amber-600" size={24} /> 3. Service Limitations
            </h2>
            <p>
              While we strive for 99.9% uptime, SmatraPay does not guarantee uninterrupted service during
              third-party utility network outages or maintenance.
            </p>
          </section>

          <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10 mt-20">
            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
              These terms are governed by the laws of Kenya. Any disputes arising from the use of SmatraPay
              shall be settled through arbitration in Nairobi.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
