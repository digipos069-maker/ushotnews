'use strict';
'use client';

import React from 'react';
import { MarketItem } from '@/types/news';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketTickerProps {
  markets: MarketItem[];
}

export default function MarketTicker({ markets }: MarketTickerProps) {
  // Duplicate markets list to create an infinite, seamless auto-scroll loop
  const tickerItems = [...markets, ...markets, ...markets];

  return (
    <div className="w-full bg-slate-900 text-slate-100 border-b border-slate-800 relative z-10 select-none">
      <div className="max-w-7xl mx-auto flex items-center">
        {/* Pinned Label */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/90 text-xs font-bold text-white uppercase tracking-wider shrink-0 z-20 shadow-md border-r border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="whitespace-nowrap">US Markets</span>
        </div>

        {/* Auto-scrolling Ticker Track with Fade Edges */}
        <div className="relative flex-1 overflow-hidden">
          {/* Subtle Left & Right Gradient Fades */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10" />

          {/* Continuous Auto-Scrolling Container */}
          <div
            tabIndex={0}
            aria-label="US Markets real-time ticker stream"
            className="animate-ticker py-2.5 flex items-center space-x-8 text-xs font-mono no-scrollbar cursor-pointer focus:outline-none"
            title="Hover to pause ticker"
          >
            {tickerItems.map((item, index) => (
              <div
                key={`${item.symbol}-${index}`}
                className="inline-flex items-center space-x-2.5 shrink-0 px-2 py-0.5 rounded-md hover:bg-slate-800/80 transition-colors"
              >
                <span className="font-bold text-white">{item.symbol}</span>
                <span className="text-slate-300 font-medium">{item.value}</span>
                <span
                  className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-xs text-[11px] ${
                    item.isPositive
                      ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/50'
                      : 'text-rose-300 bg-rose-950/60 border border-rose-800/50'
                  }`}
                >
                  {item.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{item.change}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
