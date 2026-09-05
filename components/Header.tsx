'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, Search, Bookmark, Bell, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Article, NewsCategory } from '@/types/news';
import { BREAKING_NEWS_ALERTS } from '@/data/newsData';

interface HeaderProps {
  activeCategory: NewsCategory;
  onSelectCategory: (cat: NewsCategory) => void;
  bookmarkCount: number;
  onOpenBookmarks: () => void;
  onOpenSearch: () => void;
  breakingArticles?: Article[];
}

const CATEGORIES: NewsCategory[] = [
  'All',
  'Politics',
  'Economy',
  'Technology',
  'World',
  'Culture',
  'Science',
  'Sports',
];

export default function Header({
  activeCategory,
  onSelectCategory,
  bookmarkCount,
  onOpenBookmarks,
  onOpenSearch,
  breakingArticles,
}: HeaderProps) {
  const [alertIndex, setAlertIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState('');

  // Generate alerts from database articles if available, else fallback to BREAKING_NEWS_ALERTS
  const activeAlerts: { text: string; slug?: string }[] = React.useMemo(() => {
    if (breakingArticles && breakingArticles.length > 0) {
      // Prioritize articles with isBreaking, isHot, or recent additions
      const prioritized = [...breakingArticles].sort((a, b) => {
        if (a.isBreaking && !b.isBreaking) return -1;
        if (!a.isBreaking && b.isBreaking) return 1;
        return 0;
      });

      return prioritized.slice(0, 10).map((art) => ({
        text: `${art.isBreaking ? 'BREAKING: ' : ''}${art.title}`,
        slug: art.slug,
      }));
    }

    return BREAKING_NEWS_ALERTS.map((text) => ({ text }));
  }, [breakingArticles]);

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formatted);

    const interval = setInterval(() => {
      setAlertIndex((prev) => (activeAlerts.length > 0 ? (prev + 1) % activeAlerts.length : 0));
    }, 6000);

    return () => clearInterval(interval);
  }, [activeAlerts.length]);

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-[#e0e0e0] sticky top-0 z-40 shadow-xs transition-all">
      {/* Top Utility Bar */}
      <div className="bg-[#f7f7f7] border-b border-[#e0e0e0] text-xs text-slate-700 py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-900">{currentDate || 'Saturday, September 5, 2026'}</span>
            <span className="hidden md:inline-block text-[#d0d0d0]">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-600">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500"></span>
              Washington, D.C. 72°F Mostly Sunny
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-medium text-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>US Edition</span>
            </div>
            <span className="text-[#d0d0d0]">|</span>
            <button
              onClick={onOpenBookmarks}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold cursor-pointer rounded-none border border-[#02237d]"
              title="View Bookmarked Articles"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({bookmarkCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Breaking News Ticker Bar */}
      <div className="bg-amber-50/70 border-b border-[#e0e0e0] px-4 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-1 bg-red-600 text-white font-bold px-2 py-0.5 uppercase tracking-wider text-[11px] shrink-0 rounded-none">
            <Bell className="w-3 h-3" />
            Alert
          </span>
          <div className="overflow-hidden relative h-5 flex-1">
            {activeAlerts[alertIndex]?.slug ? (
              <Link
                href={`/article/${activeAlerts[alertIndex].slug}`}
                className="font-medium text-slate-800 hover:text-[#032EA1] hover:underline truncate block transition-all duration-500"
              >
                {activeAlerts[alertIndex]?.text}
              </Link>
            ) : (
              <p className="font-medium text-slate-800 truncate transition-all duration-500">
                {activeAlerts[alertIndex]?.text || 'Loading latest alerts...'}
              </p>
            )}
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline-block font-mono">
            {alertIndex + 1}/{activeAlerts.length}
          </span>
        </div>
      </div>

      {/* Main Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative h-12 w-24 shrink-0 flex items-center justify-start">
              <Image
                src="/logo.png"
                alt="US HOT NEWS Logo"
                width={96}
                height={48}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 serif-headline uppercase group-hover:text-[#032EA1] transition-colors">
                US HOT NEWS
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-600 tracking-wide font-medium mt-0.5">
                Fast, Independent & Verified American Journalism • Real-time Wire
              </p>
            </div>
          </Link>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-xs uppercase font-bold tracking-wider cursor-pointer rounded-none border border-[#02237d]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Stories</span>
          </button>
          <a
            href="#newsletter"
            className="hidden sm:inline-flex items-center gap-1 px-4 py-2 text-xs uppercase font-bold tracking-wider cursor-pointer border border-[#032EA1] text-[#032EA1] bg-white hover:bg-slate-50 transition-colors rounded-none"
          >
            <span>The Morning Wire</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Category Navigation Bar (CNBC style: flat rectangular tabs separated by 1px borders) */}
      <nav className="border-t border-[#e0e0e0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-2 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  type="button"
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold tracking-wide whitespace-nowrap cursor-pointer rounded-none transition-all border border-[#02237d] ${
                    isActive
                      ? 'ring-2 ring-[#032EA1] ring-offset-1'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  {cat === 'All' ? '⚡ Front Page' : cat}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
