'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { MarketItem } from '@/types/news';
import { TrendingUp, TrendingDown, ArrowUp } from 'lucide-react';

interface MarketTickerProps {
  markets: MarketItem[];
  showScrollToTop?: boolean;
}

export default function MarketTicker({ markets, showScrollToTop = true }: MarketTickerProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Triple items list for smooth infinite continuous auto-scroll
  const tickerItems = [...markets, ...markets, ...markets];

  return (
    <div className="w-full bg-slate-900 text-slate-100 border-b border-[#262626] relative z-10 select-none">
      <div className="max-w-7xl mx-auto flex items-center">
        {/* Pinned Label */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-950 text-xs font-bold text-white uppercase tracking-wider shrink-0 z-20 border-r border-[#262626] rounded-none">
          <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse"></span>
          <span className="whitespace-nowrap text-[11px] sm:text-xs">US Markets</span>
        </div>

        {/* Auto-scrolling Continuous Marquee */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10" />

          <div
            tabIndex={0}
            aria-label="US Markets real-time ticker stream"
            className="animate-ticker py-2 flex items-center space-x-8 text-xs font-mono no-scrollbar cursor-pointer focus:outline-none"
            title="Hover to pause ticker"
          >
            {tickerItems.map((item, index) => (
              <div
                key={`ticker-${item.symbol}-${index}`}
                className="inline-flex items-center space-x-2 shrink-0 px-2 py-0.5 rounded-none hover:bg-slate-800 transition-colors"
              >
                <span className="font-bold text-white">{item.symbol}</span>
                <span className="text-slate-300 font-medium">{item.value}</span>
                <span
                  className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-none text-[11px] border ${
                    item.isPositive
                      ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60'
                      : 'text-rose-300 bg-rose-950/60 border-rose-800/60'
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

        {/* Quick Scroll to Top button when scrolled down */}
        {showScrollToTop && isScrolled && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-2 text-white shrink-0 hover:bg-[#02237d] transition-colors rounded-none border-l border-[#262626] cursor-pointer"
            style={{ backgroundColor: '#032EA1' }}
            title="Scroll to Top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
