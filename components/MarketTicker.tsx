'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MarketItem } from '@/types/news';
import { TrendingUp, TrendingDown, Newspaper, ArrowUp } from 'lucide-react';
import Link from 'next/link';

interface MarketTickerProps {
  markets: MarketItem[];
}

export default function MarketTicker({ markets }: MarketTickerProps) {
  const [isSticky, setIsSticky] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const lastScrollY = useRef(0);

  // Triple items list for smooth infinite continuous auto-scroll
  const tickerItems = [...markets, ...markets, ...markets];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const threshold = 140;

      if (currentScrollY <= threshold) {
        setIsSticky(false);
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsSticky(true);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 1. Natural In-flow Ticker (CNBC style: sharp 1px borders, rounded-none) */}
      <div className="w-full bg-slate-900 text-slate-100 border-b border-[#262626] relative z-10 select-none">
        <div className="max-w-7xl mx-auto flex items-center">
          {/* Pinned Label */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 text-xs font-bold text-white uppercase tracking-wider shrink-0 z-20 border-r border-[#262626] rounded-none">
            <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse"></span>
            <span className="whitespace-nowrap">US Markets</span>
          </div>

          {/* Auto-scrolling Continuous Marquee */}
          <div className="relative flex-1 overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10" />

            <div
              tabIndex={0}
              aria-label="US Markets real-time ticker stream"
              className="animate-ticker py-2.5 flex items-center space-x-8 text-xs font-mono no-scrollbar cursor-pointer focus:outline-none"
              title="Hover to pause ticker"
            >
              {tickerItems.map((item, index) => (
                <div
                  key={`inline-${item.symbol}-${index}`}
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
        </div>
      </div>

      {/* 2. Floating Sticky Ticker (slides into view at top-0 when user scrolls UP) */}
      {isSticky && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md text-slate-100 border-b border-[#333333] shadow-md transition-all duration-300 ease-in-out select-none ${
            isVisible
              ? 'translate-y-0 opacity-100'
              : '-translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center">
            {/* Quick Home Brand Link */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-white text-xs font-black uppercase tracking-wider shrink-0 transition-opacity hover:opacity-90 border-r border-[#262626] rounded-none"
              style={{ backgroundColor: '#032EA1' }}
              title="Return to Front Page"
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>US Hot News</span>
            </Link>

            {/* Pinned Label */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-950 text-xs font-bold text-white uppercase tracking-wider shrink-0 border-r border-[#262626] rounded-none">
              <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse"></span>
              <span className="whitespace-nowrap text-[11px] sm:text-xs">US Markets</span>
            </div>

            {/* Auto-scrolling Ticker Track */}
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/95 to-transparent pointer-events-none z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/95 to-transparent pointer-events-none z-10" />

              <div
                tabIndex={0}
                aria-label="US Markets real-time sticky ticker stream"
                className="animate-ticker py-2 flex items-center space-x-8 text-xs font-mono no-scrollbar cursor-pointer focus:outline-none"
                title="Hover to pause ticker"
              >
                {tickerItems.map((item, index) => (
                  <div
                    key={`sticky-${item.symbol}-${index}`}
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

            {/* Quick Scroll to Top button */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-2 text-white shrink-0 hover:bg-[#02237d] transition-colors rounded-none border-l border-[#262626]"
              style={{ backgroundColor: '#032EA1' }}
              title="Scroll to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
