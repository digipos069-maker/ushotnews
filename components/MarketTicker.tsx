'use strict';
'use client';

import React from 'react';
import { MarketItem } from '@/types/news';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketTickerProps {
  markets: MarketItem[];
}

export default function MarketTicker({ markets }: MarketTickerProps) {
  return (
    <div className="w-full bg-slate-900 text-slate-100 py-2 px-4 sm:px-8 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>US Markets</span>
        </div>
        <div className="h-4 w-px bg-slate-700 shrink-0"></div>
        <div className="flex items-center space-x-6 sm:space-x-8 text-xs font-mono shrink-0">
          {markets.map((m) => (
            <div key={m.symbol} className="flex items-center space-x-2">
              <span className="font-bold text-white">{m.symbol}</span>
              <span className="text-slate-300 font-medium">{m.value}</span>
              <span
                className={`flex items-center gap-0.5 font-bold ${
                  m.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {m.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{m.change}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
