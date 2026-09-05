'use strict';
'use client';

import React, { useState, useMemo } from 'react';
import { Article } from '@/types/news';
import { Search, X, Clock, ArrowUpRight, Filter } from 'lucide-react';
import Link from 'next/link';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
}

export default function SearchModal({
  isOpen,
  onClose,
  articles,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesQuery =
        !query.trim() ||
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.summary.toLowerCase().includes(query.toLowerCase()) ||
        article.category.toLowerCase().includes(query.toLowerCase()) ||
        article.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));

      const matchesTag = !selectedTag || article.tags.includes(selectedTag);

      return matchesQuery && matchesTag;
    });
  }, [articles, query, selectedTag]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden mt-12 border border-slate-200">
        {/* Search Bar Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search breaking stories, topics, policy, markets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-base sm:text-lg focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-xs shadow-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Tag Pills */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Filters:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${
              selectedTag === null ? 'ring-2 ring-offset-1 ring-[#032EA1]' : 'opacity-80'
            }`}
          >
            All Topics
          </button>
          {allTags.slice(0, 7).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${
                selectedTag === tag ? 'ring-2 ring-offset-1 ring-[#032EA1]' : 'opacity-80'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
            <span>Showing {filteredArticles.length} results</span>
            {query && <span>Keyword: &ldquo;{query}&rdquo;</span>}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-bold text-slate-700">No articles matched your query</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for keywords like &ldquo;Senate&rdquo;, &ldquo;AI&rdquo;, &ldquo;Inflation&rdquo;, or &ldquo;NASA&rdquo;.</p>
            </div>
          ) : (
            filteredArticles.map((art) => (
              <Link
                key={art.id}
                href={`/article/${art.slug}`}
                onClick={onClose}
                className="group flex gap-4 p-3.5 rounded-xl border border-slate-200 hover:border-[#032EA1]/40 hover:bg-slate-50 transition-all block"
              >
                <img
                  src={art.imageUrl}
                  alt={art.title}
                  className="w-24 h-20 sm:w-28 sm:h-24 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[#032EA1] uppercase">
                      {art.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.publishedAt}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#032EA1] transition-colors leading-snug line-clamp-2">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-1">{art.summary}</p>
                </div>
                <div className="self-center">
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#032EA1] transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
