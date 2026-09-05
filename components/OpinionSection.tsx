'use strict';
'use client';

import React from 'react';
import { OpinionPiece } from '@/types/news';
import { Quote, BookOpen } from 'lucide-react';

interface OpinionSectionProps {
  opinions: OpinionPiece[];
}

export default function OpinionSection({ opinions }: OpinionSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-black text-slate-900 serif-headline uppercase tracking-wide">
              US Voices & Editorial Perspectives
            </h3>
            <p className="text-xs text-slate-500">
              In-depth essays, constitutional debates, and commentary from leading analysts
            </p>
          </div>
          <span className="text-xs font-bold text-[#032EA1] uppercase tracking-wider hidden sm:inline-block">
            View All Columns →
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opinions.map((op) => (
            <div
              key={op.id}
              className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={op.author.avatar}
                    alt={op.author.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{op.author.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">{op.author.title}</p>
                  </div>
                </div>

                <div className="relative mb-4">
                  <Quote className="w-6 h-6 text-blue-200 absolute -top-2 -left-1" />
                  <p className="pl-6 text-xs italic text-slate-700 font-serif leading-relaxed">
                    &ldquo;{op.pullQuote}&rdquo;
                  </p>
                </div>

                <h4 className="font-bold text-sm text-slate-900 serif-headline hover:text-[#032EA1] cursor-pointer leading-snug">
                  {op.title}
                </h4>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium mt-4">
                <span className="bg-slate-100 px-2 py-0.5 rounded-sm">{op.category}</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-slate-400" />
                  {op.readTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
