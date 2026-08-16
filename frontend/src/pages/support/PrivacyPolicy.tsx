import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
              <Shield className="text-amber-600" size={32} />
            </div>
            <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Last Updated: May 2026</p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Eye className="text-amber-600" size={24} /> 1. Information We Collect
            </h2>
            <p>
              At SmatraPay, we collect information essential for providing smart metering services. This includes:
            </p>
            <ul>
              <li><strong>Contact Information:</strong> Name, email address, and phone number.</li>
              <li><strong>Meter Data:</strong> Meter numbers, consumption history, and location data.</li>
              <li><strong>Payment Information:</strong> M-Pesa transaction IDs and billing history.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Lock className="text-amber-600" size={24} /> 2. How We Use Your Data
            </h2>
            <p>
              Your data is used solely to facilitate utility vending, monitor meter health, and improve our services. 
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <FileText className="text-amber-600" size={24} /> 3. Data Retention
            </h2>
            <p>
              We retain transaction records for as long as required by law to support utility audits and revenue recovery 
              processes.
            </p>
          </section>

          <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 mt-20">
            <h3 className="text-lg font-bold mb-4">Questions about your privacy?</h3>
            <p className="text-sm text-slate-500 mb-6">
              If you have any questions or concerns regarding this policy, please contact our data protection officer.
            </p>
            <a href="mailto:info@tokenpap.com" className="text-amber-600 font-bold hover:underline">info@tokenpap.com</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
