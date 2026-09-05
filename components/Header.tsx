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

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="w-full bg-white border-b border-[#e0e0e0] sticky top-0 z-40 shadow-xs select-none">
      {/* 1. Top Utility Strip (CNBC Style: Date, Edition, Watchlist/Saved) - Collapses slightly on scroll */}
      <div className={`bg-[#f7f7f7] border-b border-[#e0e0e0] text-xs text-slate-700 px-4 sm:px-8 transition-all duration-200 ${
        isScrolled ? 'py-1 hidden sm:block' : 'py-1.5'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="font-semibold text-slate-900">{currentDate || 'Saturday, September 5, 2026'}</span>
            <span className="hidden md:inline-block text-[#d0d0d0]">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500"></span>
              Washington, D.C. • Real-Time Editorial Wire
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1 font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>US Edition</span>
            </div>
            <span className="text-[#d0d0d0]">|</span>
            <button
              onClick={onOpenBookmarks}
              type="button"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold cursor-pointer rounded-none border border-[#02237d]"
              title="View Bookmarked Articles"
            >
              <Bookmark className="w-3 h-3" />
              <span>Watchlist ({bookmarkCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CNBC-Style Breaking News Alert Ticker */}
      <div className="bg-[#fff9e6] border-b border-[#e0e0e0] px-4 sm:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1 bg-red-600 text-white font-black px-2 py-0.5 uppercase tracking-wider text-[10px] shrink-0 rounded-none">
            <Bell className="w-3 h-3" />
            Breaking
          </span>
          <div className="overflow-hidden relative h-5 flex-1">
            {activeAlerts[alertIndex]?.slug ? (
              <Link
                href={`/article/${activeAlerts[alertIndex].slug}`}
                className="font-semibold text-slate-900 hover:text-[#032EA1] hover:underline truncate block transition-all duration-300"
              >
                {activeAlerts[alertIndex]?.text}
              </Link>
            ) : (
              <p className="font-semibold text-slate-900 truncate transition-all duration-300">
                {activeAlerts[alertIndex]?.text || 'Loading latest breaking news wire...'}
              </p>
            )}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline-block font-mono font-bold">
            {alertIndex + 1}/{activeAlerts.length}
          </span>
        </div>
      </div>

      {/* 3. Main Masthead (CNBC Style: Left Logo + Title, Right Search + Tools) */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-8 transition-all duration-200 flex items-center justify-between ${
        isScrolled ? 'py-2' : 'py-3.5'
      }`}>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`relative shrink-0 flex items-center justify-start transition-all duration-200 ${
              isScrolled ? 'h-8 w-18' : 'h-10 w-22'
            }`}>
              <Image
                src="/logo.png"
                alt="US HOT NEWS Logo"
                width={88}
                height={40}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div className="border-l border-[#e0e0e0] pl-3">
              <h1 className={`font-black tracking-tight text-slate-900 uppercase group-hover:text-[#032EA1] transition-all leading-none ${
                isScrolled ? 'text-xl' : 'text-2xl sm:text-3xl'
              }`} style={{ fontFamily: 'Georgia, serif' }}>
                US HOT NEWS
              </h1>
              {!isScrolled && (
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold tracking-wider uppercase mt-1">
                  Markets • Politics • Technology • Business
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-bold tracking-wider cursor-pointer rounded-none border border-[#02237d]"
            title="Search US News wire"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <a
            href="#newsletter"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs uppercase font-bold tracking-wider cursor-pointer border border-[#032EA1] text-[#032EA1] bg-white hover:bg-slate-50 transition-colors rounded-none"
          >
            <span>Newsletters</span>
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 4. CNBC Category Navigation Bar (Sharp hairline borders, rectangular high-density tabs) */}
      <nav className="border-t border-[#e0e0e0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center space-x-0.5 overflow-x-auto py-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  type="button"
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer rounded-none transition-all border ${
                    isActive
                      ? 'border-[#02237d] ring-1 ring-[#032EA1]'
                      : 'border-transparent opacity-90 hover:opacity-100 hover:border-[#02237d]'
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
