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
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Lead Story (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <Link
            href={`/article/${leadStory.slug}`}
            className="relative w-full h-72 sm:h-96 block group"
          >
            <img
              src={leadStory.imageUrl}
              alt={leadStory.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                TOP STORY
              </span>
              <span className="bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-sm">
                {leadStory.category}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-1">
                {leadStory.kicker}
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold serif-headline leading-tight line-clamp-2">
                {leadStory.title}
              </h2>
            </div>
          </Link>

          <div className="p-6 flex-1 flex flex-col justify-between">
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              {leadStory.summary}
            </p>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={leadStory.author.avatar}
                  alt={leadStory.author.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
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
                  className="p-2.5 rounded-lg shadow-sm cursor-pointer"
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
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm text-white"
                  style={{ backgroundColor: '#032EA1' }}
                >
                  <span>Read Full Story</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Secondary Featured + Fast 5 Just In (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {secondaryStory && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
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
                      className="text-xs font-bold px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1 text-white"
                      style={{ backgroundColor: '#032EA1' }}
                    >
                      <span>Read</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
                <Link
                  href={`/article/${secondaryStory.slug}`}
                  className="w-28 h-24 sm:w-32 sm:h-28 rounded-lg overflow-hidden shrink-0 block"
                >
                  <img
                    src={secondaryStory.imageUrl}
                    alt={secondaryStory.title}
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  />
                </Link>
              </div>
            </div>
          )}

          {/* Just In Live Feed */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                Fast 5: Real-Time Wire
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Live Updated</span>
            </div>

            <div className="space-y-3.5">
              {recentArticles.slice(0, 4).map((art, idx) => (
                <Link
                  key={art.id}
                  href={`/article/${art.slug}`}
                  className="group flex items-start gap-3 pb-3 border-b border-slate-200/70 last:border-0 last:pb-0"
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
