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
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-2 py-0.5 rounded-none">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {verdict}
          </span>
        );
      case 'Misleading':
      case 'Half True':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold px-2 py-0.5 rounded-none">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {verdict}
          </span>
        );
      case 'False':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold px-2 py-0.5 rounded-none">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {verdict}
          </span>
        );
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      <div className="bg-white border border-[#e0e0e0] rounded-none p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-[#e0e0e0]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#032EA1] text-white rounded-none border border-[#02237d]">
              <ShieldCheck className="w-4 h-4" />
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
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 border border-[#e0e0e0] rounded-none self-start sm:self-center">
            Updated Daily
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {factChecks.map((fc) => (
            <div
              key={fc.id}
              className="bg-white border border-[#e0e0e0] rounded-none p-5 flex flex-col justify-between hover:border-slate-400 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getBadge(fc.verdict)}
                  <span className="text-[11px] text-slate-500 font-mono">{fc.date}</span>
                </div>

                <div className="mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Claim Audited:
                  </span>
                  <p className="text-sm font-semibold text-slate-900 serif-headline italic leading-snug">
                    {fc.claim}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Speaker: {fc.claimant}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4 border-t border-[#e0e0e0] pt-3">
                  {fc.explanation}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 font-medium pt-3 border-t border-[#e0e0e0] flex items-center justify-between">
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
