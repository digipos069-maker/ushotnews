'use strict';
'use client';

import React from 'react';
import { Article } from '@/types/news';
import { Bookmark, BookmarkCheck, ArrowUpRight, Flame } from 'lucide-react';
import Link from 'next/link';

interface NewsCardProps {
  article: Article;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export default function NewsCard({
  article,
  isBookmarked,
  onToggleBookmark,
}: NewsCardProps) {
  return (
    <article className="bg-white border border-[#e0e0e0] rounded-none shadow-xs hover:border-slate-400 transition-colors flex flex-col justify-between group">
      <div>
        <Link
          href={`/article/${article.slug}`}
          className="block relative h-48 w-full overflow-hidden border-b border-[#e0e0e0]"
        >
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover rounded-none group-hover:opacity-95 transition-opacity"
          />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-none border border-slate-700 uppercase">
              {article.category}
            </span>
            {article.isHot && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-none flex items-center gap-0.5 uppercase">
                <Flame className="w-3 h-3 fill-current" /> Hot
              </span>
            )}
          </div>
        </Link>

        <div className="p-5">
          <p className="text-[10px] font-bold tracking-widest text-[#032EA1] uppercase mb-1">
            {article.kicker}
          </p>
          <Link
            href={`/article/${article.slug}`}
            className="block font-bold text-base text-slate-900 serif-headline group-hover:text-[#032EA1] transition-colors leading-snug line-clamp-2 mb-2"
          >
            {article.title}
          </Link>
          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {article.summary}
          </p>
        </div>
      </div>

      <div className="px-5 pb-4 pt-3 border-t border-[#e0e0e0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="w-5 h-5 rounded-none object-cover border border-[#e0e0e0]"
          />
          <div className="text-[11px] text-slate-500 font-medium">
            <span>{article.author.name}</span>
            <span className="mx-1">•</span>
            <span>{article.readTimeMinutes}m</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleBookmark(article.id)}
            className="p-1.5 rounded-none cursor-pointer border border-[#02237d]"
            title={isBookmarked ? "Remove Bookmark" : "Save Article"}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>
          <Link
            href={`/article/${article.slug}`}
            className="px-2.5 py-1 text-[11px] font-bold rounded-none flex items-center gap-1 text-white border border-[#02237d]"
            style={{ backgroundColor: '#032EA1' }}
          >
            <span>Read</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
