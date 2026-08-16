import React, { useState } from 'react';
import { Search, ArrowLeft, Zap, Calendar, Hash, AlertCircle, Phone, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import SmatraPayLogo from '@/components/SmatraPayLogo';
import { ThemeToggle } from '@/components/theme-toggle';

interface Transaction {
  _id: string;
  created_at: string;
  amount: number;
  tokens: string[];
  status: string;
  description: string;
  meter?: {
    meter_number: string;
  };
}

const TrackToken: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await api.get(`/tokens/search?q=${encodeURIComponent(query.trim())}`);
      setTransactions(response.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No meter or recent transactions found for this number.');
        setTransactions([]);
      } else {
        setError('An error occurred while fetching transactions. Please try again.');
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-amber-500/30 flex flex-col">
      {/* Simple Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
             <div className="h-10">
                <SmatraPayLogo className="h-full w-auto" />
             </div>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              to="/"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 mb-6 shadow-sm border border-amber-200 dark:border-amber-800/50">
              <Zap size={32} className="drop-shadow-sm" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Find Your <span className="text-amber-600">Tokens</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Enter your meter number or registered phone number to fetch your latest token purchases instantly.
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200 dark:border-gray-800 mb-8 transition-all">
            <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition-colors">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. 0422... or 07..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-lg text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </form>
            
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
               <div className="flex items-center gap-1.5"><Hash size={14}/> Meter Number</div>
               <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
               <div className="flex items-center gap-1.5"><Phone size={14}/> Phone Number</div>
            </div>
          </div>

          {/* Results Area */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Search Failed</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && hasSearched && transactions.length === 0 && (
            <div className="text-center py-12 animate-in fade-in">
              <p className="text-slate-500 dark:text-slate-400 text-lg">No token transactions found.</p>
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white px-2">
                Latest Tokens
              </h2>
              {transactions.map((tx, idx) => (
                <div
                  key={tx._id || idx}
                  className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800/50 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <Zap size={18} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Amount Paid</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">
                            KES {tx.amount.toLocaleString()}
                          </p>
                       </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end text-sm text-slate-500 dark:text-slate-400 gap-1.5">
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 px-2.5 py-1 rounded-md border border-gray-100 dark:border-gray-800">
                         <Calendar size={14} className="text-gray-400" />
                         <span>{formatDate(tx.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs">Meter:</span>
                         <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                           {tx.meter?.meter_number || 'N/A'}
                         </span>
                      </div>
                    </div>
                  </div>

                  {tx.tokens && tx.tokens.length > 0 ? (
                    <div className="space-y-3">
                      {tx.tokens.map((token, tIdx) => (
                        <div key={tIdx} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                           <div className="flex-1 text-center sm:text-left">
                              <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Token Number</p>
                              <p className="font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-amber-400 tracking-[0.2em]">
                                {token.match(/.{1,4}/g)?.join('-') || token}
                              </p>
                           </div>
                           <button
                             onClick={() => copyToClipboard(token)}
                             className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                               copiedToken === token 
                               ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' 
                               : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                             }`}
                           >
                             {copiedToken === token ? (
                               <>
                                 <CheckCircle2 size={16} />
                                 Copied!
                               </>
                             ) : (
                               <>
                                 <Copy size={16} />
                                 Copy Token
                               </>
                             )}
                           </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
                       <p className="text-sm font-medium text-slate-500">No tokens generated for this transaction.</p>
                       <p className="text-xs text-slate-400 mt-1">{tx.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TrackToken;
