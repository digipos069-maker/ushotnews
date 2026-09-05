'use strict';
'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Success simulation
    setStatus('success');
    setEmail('');
    setErrorMessage('');
  };

  return (
    <section id="newsletter" className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="bg-gradient-to-br from-slate-900 via-[#032EA1]/90 to-slate-900 rounded-2xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold uppercase tracking-wider mb-4">
            <Mail className="w-3.5 h-3.5" />
            <span>The Morning Wire Briefing</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black serif-headline tracking-tight mb-3">
            Start Your Morning Informed, Not Overwhelmed.
          </h3>
          <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Get our curated nonpartisan 5-minute rundown of Capitol Hill votes, Wall Street movers, and breaking national developments delivered straight to your inbox at 6:00 AM EST.
          </p>

          {status === 'success' ? (
            <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 rounded-xl p-4 flex items-center justify-center gap-2 max-w-md mx-auto">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-semibold">
                Welcome aboard! Please check your inbox to confirm your subscription.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-xs"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider shadow-md cursor-pointer flex items-center justify-center gap-2 border border-white/20 shrink-0"
                >
                  <span>Subscribe</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-rose-300 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-300">
                Zero spam. Nonpartisan reporting. Unsubscribe anytime with 1-click.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
