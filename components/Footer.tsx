'use strict';
'use client';

import React from 'react';
import { Newspaper, ArrowUp, Shield, Award, CheckSquare, Heart } from 'lucide-react';
import { NewsCategory } from '@/types/news';

interface FooterProps {
  onSelectCategory: (cat: NewsCategory) => void;
}

export default function Footer({ onSelectCategory }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 mt-12">
      {/* Editorial Standards Bar */}
      <div className="bg-slate-950 py-4 px-4 sm:px-8 border-b border-slate-800/80 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-4 h-4 text-blue-400" />
              Verified Primary Sources
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Award className="w-4 h-4 text-emerald-400" />
              Trust in News Initiative
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              Transparent Corrections Policy
            </span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#032EA1] flex items-center justify-center text-white">
                <Newspaper className="w-5 h-5" />
              </div>
              <span className="font-black text-xl text-white serif-headline tracking-wide uppercase">
                US HOT NEWS
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Delivering independent, rigorously verified journalism across the United States. Covering Capitol Hill policy, Wall Street markets, Silicon Valley tech, and cultural milestones.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              ISSN 2841-9921 • Washington, D.C. Bureau
            </p>
          </div>

          {/* News Desks */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Editorial Desks
            </h4>
            <ul className="space-y-2 text-xs">
              {(['Politics', 'Economy', 'Technology', 'World'] as NewsCategory[]).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat);
                      scrollToTop();
                    }}
                    className="hover:underline text-left py-0.5 px-2 rounded-sm text-xs font-semibold"
                  >
                    {cat} Desk
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* More Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Special Coverage
            </h4>
            <ul className="space-y-2 text-xs">
              {(['Science', 'Culture', 'Sports'] as NewsCategory[]).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat);
                      scrollToTop();
                    }}
                    className="hover:underline text-left py-0.5 px-2 rounded-sm text-xs font-semibold"
                  >
                    {cat} Reports
                  </button>
                </li>
              ))}
              <li>
                <a href="#newsletter" className="hover:text-white transition-colors">
                  The Morning Wire Briefing
                </a>
              </li>
            </ul>
          </div>

          {/* Ethics & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Standards & Legal
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Editorial Independence Policy</li>
              <li>Code of Ethics & Sourcing</li>
              <li>Submit a News Tip / Leak</li>
              <li>Corrections & Retractions Log</li>
              <li>Privacy Policy & Terms of Service</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 US Hot News Media Group Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Designed with modern Next.js</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Built for speed & clarity
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
