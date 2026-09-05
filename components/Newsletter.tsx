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

    setStatus('success');
    setEmail('');
    setErrorMessage('');
  };

  return (
    <section id="newsletter" className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="bg-slate-900 border border-[#e0e0e0] rounded-none p-8 sm:p-12 text-white relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white border border-white/20 text-xs font-semibold uppercase tracking-wider mb-4 rounded-none">
            <Mail className="w-3.5 h-3.5" />
            <span>The Morning Wire Briefing</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black serif-headline tracking-tight mb-3">
            Start Your Morning Informed, Not Overwhelmed.
          </h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8">
            Get our curated nonpartisan 5-minute rundown of Capitol Hill votes, Wall Street movers, and breaking national developments delivered straight to your inbox at 6:00 AM EST.
          </p>

          {status === 'success' ? (
            <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-none p-4 flex items-center justify-center gap-2 max-w-md mx-auto">
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
                  className="flex-1 px-4 py-2.5 rounded-none bg-white/10 border border-white/30 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-white"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 rounded-none border border-[#02237d] shrink-0"
                >
                  <span>Subscribe</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-rose-300 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Zero spam. Nonpartisan reporting. Unsubscribe anytime with 1-click.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
