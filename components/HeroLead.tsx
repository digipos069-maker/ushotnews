'use strict';
'use client';

import React from 'react';
import { Article } from '@/types/news';
import { Clock, Bookmark, BookmarkCheck, ArrowUpRight, Flame } from 'lucide-react';
import Link from 'next/link';

interface HeroLeadProps {
  leadStory: Article;
  secondaryStory?: Article;
  recentArticles: Article[];
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
}

export default function HeroLead({
  leadStory,
  secondaryStory,
  recentArticles,
  bookmarkedIds,
  onToggleBookmark,
}: HeroLeadProps) {
  const isLeadBookmarked = bookmarkedIds.has(leadStory.id);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Lead Story (7 cols) - CNBC style: 1px solid #e0e0e0, sharp 0px radius */}
        <div className="lg:col-span-7 flex flex-col bg-white border border-[#e0e0e0] rounded-none shadow-xs">
          <Link
            href={`/article/${leadStory.slug}`}
            className="relative w-full h-72 sm:h-96 block group"
          >
            <img
              src={leadStory.imageUrl}
              alt={leadStory.title}
              className="w-full h-full object-cover rounded-none group-hover:opacity-95 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-none flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                TOP STORY
              </span>
              <span className="bg-slate-900/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-none border border-slate-700">
                {leadStory.category}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-[11px] font-bold tracking-widest text-amber-400 uppercase mb-1">
                {leadStory.kicker}
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold serif-headline leading-tight line-clamp-2">
                {leadStory.title}
              </h2>
            </div>
          </Link>

          <div className="p-6 flex-1 flex flex-col justify-between">
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {leadStory.summary}
            </p>

            <div className="pt-4 border-t border-[#e0e0e0] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={leadStory.author.avatar}
                  alt={leadStory.author.name}
                  className="w-9 h-9 rounded-none object-cover border border-[#e0e0e0]"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{leadStory.author.name}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span>{leadStory.author.role}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{leadStory.publishedAt}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(leadStory.id)}
                  className="p-2 rounded-none cursor-pointer border border-[#02237d]"
                  title={isLeadBookmarked ? "Remove Bookmark" : "Save Article"}
                >
                  {isLeadBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
                <Link
                  href={`/article/${leadStory.slug}`}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none text-white border border-[#02237d]"
                  style={{ backgroundColor: '#032EA1' }}
                >
                  <span>Read Full Story</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Secondary Featured + Fast 5 Just In (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {secondaryStory && (
            <div className="bg-white border border-[#e0e0e0] rounded-none p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-[#e0e0e0] pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#032EA1]">
                  Featured Deep Dive • {secondaryStory.category}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {secondaryStory.publishedAt}
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Link
                    href={`/article/${secondaryStory.slug}`}
                    className="block font-bold text-base text-slate-900 serif-headline hover:text-[#032EA1] leading-snug line-clamp-3 mb-2"
                  >
                    {secondaryStory.title}
                  </Link>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {secondaryStory.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      By {secondaryStory.author.name}
                    </span>
                    <Link
                      href={`/article/${secondaryStory.slug}`}
                      className="text-xs font-bold px-3 py-1.5 rounded-none flex items-center gap-1 text-white border border-[#02237d]"
                      style={{ backgroundColor: '#032EA1' }}
                    >
                      <span>Read</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
                <Link
                  href={`/article/${secondaryStory.slug}`}
                  className="w-28 h-24 sm:w-32 sm:h-28 overflow-hidden shrink-0 block border border-[#e0e0e0]"
                >
                  <img
                    src={secondaryStory.imageUrl}
                    alt={secondaryStory.title}
                    className="w-full h-full object-cover rounded-none hover:opacity-90 transition-opacity"
                  />
                </Link>
              </div>
            </div>
          )}

          {/* Just In Live Feed */}
          <div className="bg-white border border-[#e0e0e0] rounded-none p-5 shadow-xs flex-1">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e0e0] mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600"></span>
                Fast 5: Real-Time Wire
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">CNBC-style Wire</span>
            </div>

            <div className="space-y-3">
              {recentArticles.slice(0, 4).map((art, idx) => (
                <Link
                  key={art.id}
                  href={`/article/${art.slug}`}
                  className="group flex items-start gap-3 pb-2.5 border-b border-[#e0e0e0] last:border-0 last:pb-0"
                >
                  <span className="font-mono text-xs font-black text-slate-400 group-hover:text-[#032EA1] transition-colors mt-0.5">
                    0{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-[#032EA1] line-clamp-2 transition-colors leading-snug">
                      {art.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700">{art.category}</span>
                      <span>•</span>
                      <span>{art.publishedAt}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
