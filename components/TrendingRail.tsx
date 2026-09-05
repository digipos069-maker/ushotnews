'use strict';
'use client';

import React from 'react';
import { Article } from '@/types/news';
import { Flame, Eye, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface TrendingRailProps {
  articles: Article[];
}

export default function TrendingRail({ articles }: TrendingRailProps) {
  const hotList = [...articles].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-sm bg-red-600 text-white">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            The Hot 5: Most Read
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Real-time Traffic</span>
      </div>

      <div className="space-y-4">
        {hotList.map((article, idx) => (
          <Link
            key={article.id}
            href={`/article/${article.slug}`}
            className="flex items-start gap-3 group pb-3 border-b border-slate-100 last:border-0 last:pb-0"
          >
            <span className="text-2xl font-black font-mono text-slate-300 group-hover:text-[#032EA1] transition-colors leading-none w-6 text-center shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#032EA1] block mb-0.5">
                {article.category}
              </span>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#032EA1] transition-colors line-clamp-2 leading-snug">
                {article.title}
              </h4>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Eye className="w-3 h-3 text-slate-400" />
                  {article.viewCount.toLocaleString()}
                </span>
                <span>•</span>
                <span>{article.readTimeMinutes}m read</span>
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
