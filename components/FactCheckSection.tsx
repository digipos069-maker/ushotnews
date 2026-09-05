'use strict';
'use client';

import React from 'react';
import { FactCheckItem } from '@/types/news';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ExternalLink } from 'lucide-react';

interface FactCheckSectionProps {
  factChecks: FactCheckItem[];
}

export default function FactCheckSection({ factChecks }: FactCheckSectionProps) {
  const getBadge = (verdict: FactCheckItem['verdict']) => {
    switch (verdict) {
      case 'True':
      case 'Mostly True':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {verdict}
          </span>
        );
      case 'Misleading':
      case 'Half True':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {verdict}
          </span>
        );
      case 'False':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold px-2.5 py-1 rounded-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {verdict}
          </span>
        );
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[#032EA1] text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 serif-headline uppercase tracking-wide">
                US Fact-Check Desk
              </h3>
              <p className="text-xs text-slate-500">
                Rigorous nonpartisan audits of claims made by political figures and viral media
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-center">
            Updated Daily
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {factChecks.map((fc) => (
            <div
              key={fc.id}
              className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:shadow-sm transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getBadge(fc.verdict)}
                  <span className="text-[11px] text-slate-500 font-medium">{fc.date}</span>
                </div>

                <div className="mb-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Claim Audited:
                  </span>
                  <p className="text-sm font-semibold text-slate-900 serif-headline italic leading-snug">
                    {fc.claim}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Source: {fc.claimant}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4 border-t border-slate-200/80 pt-3">
                  {fc.explanation}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 font-medium pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <span className="truncate pr-2">{fc.source}</span>
                <span className="text-[#032EA1] font-bold inline-flex items-center gap-0.5 shrink-0">
                  Audit <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
