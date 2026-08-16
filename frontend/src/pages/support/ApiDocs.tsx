import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ShieldCheck, Cpu } from 'lucide-react';
const ApiDocs: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="sticky top-32 space-y-8">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Documentation</h3>
                <ul className="space-y-3">
                  <li><button onClick={() => document.getElementById('intro')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold text-amber-600 hover:text-amber-500">Introduction</button></li>
                  <li><button onClick={() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors">Authentication</button></li>
                  <li><button onClick={() => document.getElementById('endpoints')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors">Endpoints</button></li>
                  <li><button onClick={() => document.getElementById('errors')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors">Error Handling</button></li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose dark:prose-invert prose-amber max-w-none"
            >
              <h1 className="text-4xl font-black mb-8">API Documentation</h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-12">
                Integrate SmatraPay's smart metering infrastructure into your own applications with our robust REST API.
              </p>

              <section id="intro" className="mb-16">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <BookOpen className="text-amber-600" /> Introduction
                </h2>
                <p>
                  The SmatraPay API provides developers with programmatic access to meter readings, token generation,
                  and transaction history. Our API is built on REST principles and returns JSON-encoded responses.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 my-6">
                  <p className="font-mono text-sm text-amber-600 mb-2 font-bold">Base URL</p>
                  <code className="text-slate-900 dark:text-white">https://api.tokenpap.com/v1</code>
                </div>
              </section>

              <section id="auth" className="mb-16">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <ShieldCheck className="text-amber-600" /> Authentication
                </h2>
                <p>
                  To access the API, you need an API Key which can be generated in your Vendor Dashboard.
                  Include this key in the Authorization header of every request.
                </p>
                <pre className="bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono text-sm overflow-x-auto">
                  Authorization: Bearer YOUR_API_KEY
                </pre>
              </section>

              <section id="endpoints" className="mb-16">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Cpu className="text-amber-600" /> Key Endpoints
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Search Transactions</h3>
                    <div className="flex gap-2 mb-2">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded uppercase">GET</span>
                      <code className="text-xs">/tokens/search?q={"{query}"}</code>
                    </div>
                    <p className="text-sm text-slate-500">Query transactions by meter number or phone number.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-2">Generate Token</h3>
                    <div className="flex gap-2 mb-2">
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded uppercase">POST</span>
                      <code className="text-xs">/tokens/generate</code>
                    </div>
                    <p className="text-sm text-slate-500">Initiate a vending transaction and generate an STS token.</p>
                  </div>
                </div>
              </section>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
