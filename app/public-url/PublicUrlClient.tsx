'use strict';
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article, NewsCategory } from '@/types/news';
import { Copy, Check, ExternalLink, Filter, Search, ArrowLeft, Globe, Newspaper, Share2 } from 'lucide-react';

interface PublicUrlClientProps {
  initialArticles: Article[];
  siteUrl: string;
}

const CATEGORIES: (NewsCategory | 'All')[] = [
  'All',
  'Politics',
  'Economy',
  'Technology',
  'World',
  'Culture',
  'Science',
  'Sports',
];

export default function PublicUrlClient({ initialArticles, siteUrl }: PublicUrlClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [copiedTitleId, setCopiedTitleId] = useState<string | null>(null);

  // Filter articles based on Category and optional search query
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        art.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.slug.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  const displayedArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  const handleCopyUrl = async (article: Article) => {
    const fullUrl = `${siteUrl}/article/${article.slug}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedUrlId(article.id);
      setTimeout(() => {
        setCopiedUrlId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleCopyTitle = async (article: Article) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(article.title);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = article.title;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedTitleId(article.id);
      setTimeout(() => {
        setCopiedTitleId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy title:', err);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const handleCategoryChange = (cat: NewsCategory | 'All') => {
    setSelectedCategory(cat);
    setVisibleCount(20); // reset visible count to 20 when category changes
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      {/* Header Bar */}
      <header className="w-full bg-white border-b border-[#e0e0e0] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative shrink-0 flex items-center justify-start h-8 w-18">
                <Image
                  src="/logo.png"
                  alt="US HOT NEWS Logo"
                  width={72}
                  height={32}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <div className="border-l border-[#e0e0e0] pl-3">
                <span
                  className="font-black tracking-tight text-slate-900 uppercase group-hover:text-[#032EA1] transition-all leading-none text-xl sm:text-2xl"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  US HOT NEWS
                </span>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                  Public Article Directory & URL Hub
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/share-url"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white border border-[#02237d] rounded-none cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#032EA1' }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Facebook Posts</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white border border-[#02237d] rounded-none cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#032EA1' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Front Page</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        {/* Page Title & Stats */}
        <div className="bg-white border border-[#e0e0e0] rounded-none p-6 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 bg-[#032EA1]"></span>
                <span className="text-xs font-black uppercase tracking-wider text-[#032EA1]">
                  Editorial Publishing Wire
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black serif-headline text-slate-900">
                Article URLs & Distribution Links
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Browse and copy direct publication URLs for syndication, social sharing, and distribution.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 border border-[#e0e0e0] px-3.5 py-2 rounded-none text-center">
                <span className="block text-lg font-black font-mono text-[#032EA1]">
                  {filteredArticles.length}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Total Stories
                </span>
              </div>
              <div className="bg-slate-100 border border-[#e0e0e0] px-3.5 py-2 rounded-none text-center">
                <span className="block text-lg font-black font-mono text-emerald-700">
                  {Math.min(visibleCount, filteredArticles.length)}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Showing Now
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-5 pt-5 border-t border-[#e0e0e0] flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(20);
                }}
                placeholder="Search headlines or slugs..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-[#e0e0e0] rounded-none focus:outline-none focus:border-[#032EA1] text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 border border-[#e0e0e0] rounded-none cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Row (CNBC Tabs Style) */}
        <div className="bg-white border border-[#e0e0e0] rounded-none p-3 shadow-xs mb-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 pr-3 mr-2 border-r border-[#e0e0e0] select-none">
              <Filter className="w-3.5 h-3.5 text-[#032EA1]" />
              <span className="uppercase tracking-wider text-[11px]">Filter Desk:</span>
            </div>

            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-all border ${
                    isActive
                      ? 'text-white border-[#02237d] shadow-xs'
                      : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-[#e0e0e0]'
                  }`}
                  style={isActive ? { backgroundColor: '#032EA1' } : {}}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles Table / List */}
        <div className="bg-white border border-[#e0e0e0] rounded-none shadow-xs overflow-hidden">
          {displayedArticles.length === 0 ? (
            <div className="p-12 text-center">
              <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">No articles matched your filter</p>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting "All Categories" or clearing your search term.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setVisibleCount(20);
                }}
                className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white border border-[#02237d] rounded-none cursor-pointer"
                style={{ backgroundColor: '#032EA1' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-xs uppercase tracking-wider border-b border-[#e0e0e0]">
                    <th className="py-3 px-4 font-bold w-12 text-center border-r border-[#e0e0e0]">#</th>
                    <th className="py-3 px-4 font-bold border-r border-[#e0e0e0]">Headline & Category</th>
                    <th className="py-3 px-4 font-bold border-r border-[#e0e0e0] hidden md:table-cell">Published</th>
                    <th className="py-3 px-4 font-bold text-right w-64 sm:w-72">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0] text-xs">
                  {displayedArticles.map((art, idx) => {
                    const isUrlCopied = copiedUrlId === art.id;
                    const isTitleCopied = copiedTitleId === art.id;
                    const fullUrl = `${siteUrl}/article/${art.slug}`;

                    return (
                      <tr
                        key={art.id}
                        className="hover:bg-slate-50 transition-colors group bg-white"
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-center">
                          {String(idx + 1).padStart(2, '0')}
                        </td>

                        {/* Article Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-none bg-slate-100 text-slate-700 border border-[#e0e0e0]">
                              {art.category}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs hidden sm:inline">
                              /{art.slug}
                            </span>
                          </div>
                          <Link
                            href={`/article/${art.slug}`}
                            target="_blank"
                            className="font-bold text-sm text-slate-900 group-hover:text-[#032EA1] transition-colors leading-snug line-clamp-2"
                          >
                            {art.title}
                          </Link>
                        </td>

                        {/* Published Time */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap hidden md:table-cell">
                          {art.publishedAt}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Title Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyTitle(art)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-all border ${
                                isTitleCopied
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'text-white border-[#02237d] hover:opacity-90'
                              }`}
                              style={!isTitleCopied ? { backgroundColor: '#032EA1' } : {}}
                              title={`Copy title: "${art.title}"`}
                            >
                              {isTitleCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Title</span>
                                </>
                              )}
                            </button>

                            {/* Copy URL Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(art)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-all border ${
                                isUrlCopied
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'text-white border-[#02237d] hover:opacity-90'
                              }`}
                              style={!isUrlCopied ? { backgroundColor: '#032EA1' } : {}}
                              title={`Copy ${fullUrl}`}
                            >
                              {isUrlCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy URL</span>
                                </>
                              )}
                            </button>

                            <Link
                              href={`/article/${art.slug}`}
                              target="_blank"
                              className="p-1.5 text-slate-500 hover:text-[#032EA1] hover:bg-slate-100 border border-[#e0e0e0] rounded-none transition-colors"
                              title="Open Article in New Tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Load More Button & Footer Counter */}
          {filteredArticles.length > 0 && (
            <div className="p-4 border-t border-[#e0e0e0] bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-mono">
                Showing {Math.min(visibleCount, filteredArticles.length)} of {filteredArticles.length} articles
              </span>

              {hasMore ? (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white border border-[#02237d] rounded-none cursor-pointer transition-opacity hover:opacity-90 flex items-center gap-2"
                  style={{ backgroundColor: '#032EA1' }}
                >
                  <span>Load More (+20 Stories)</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-200/60 px-3 py-1.5 rounded-none border border-slate-300">
                  All {filteredArticles.length} Stories Loaded
                </span>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-[#e0e0e0] py-6 mt-12 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} US HOT NEWS. All rights reserved. Public URL Syndication Index.</p>
        </div>
      </footer>
    </div>
  );
}
