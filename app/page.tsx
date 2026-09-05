'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MarketTicker from '@/components/MarketTicker';
import HeroLead from '@/components/HeroLead';
import NewsCard from '@/components/NewsCard';
import TrendingRail from '@/components/TrendingRail';
import EconomicTable from '@/components/EconomicTable';
import FactCheckSection from '@/components/FactCheckSection';
import OpinionSection from '@/components/OpinionSection';
import DailyPoll from '@/components/DailyPoll';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import BookmarksDrawer from '@/components/BookmarksDrawer';
import SearchModal from '@/components/SearchModal';

import {
  ARTICLES_DATA,
  MARKET_DATA,
  FACT_CHECK_DATA,
  OPINION_DATA,
  INITIAL_POLL,
} from '@/data/newsData';
import { NewsCategory } from '@/types/news';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('All');
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Load bookmarks safely from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ushotnews_bookmarks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBookmarkedIds(new Set(parsed));
        }
      }
    } catch (e) {
      console.error('Error reading bookmarks from localStorage:', e);
    }
  }, []);

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('ushotnews_bookmarks', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Error writing bookmarks to localStorage:', e);
      }
      return next;
    });
  };

  // Lead and secondary stories
  const leadStory = ARTICLES_DATA.find((a) => a.isLeadStory) || ARTICLES_DATA[0];
  const secondaryStory = ARTICLES_DATA.find((a) => a.id !== leadStory.id && a.isHot) || ARTICLES_DATA[1];

  // Category filter
  const displayedArticles =
    activeCategory === 'All'
      ? ARTICLES_DATA.filter((a) => a.id !== leadStory.id)
      : ARTICLES_DATA.filter((a) => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        bookmarkCount={bookmarkedIds.size}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Real-time US Market Indices Bar */}
      <MarketTicker markets={MARKET_DATA} />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* If front page ('All'), display the Hero lead showcase */}
        {activeCategory === 'All' ? (
          <HeroLead
            leadStory={leadStory}
            secondaryStory={secondaryStory}
            recentArticles={ARTICLES_DATA}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />
        ) : (
          /* Category Header Banner */
          <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#032EA1]">
                  Editorial Category
                </span>
                <h2 className="text-2xl sm:text-3xl font-black serif-headline text-slate-900 mt-1">
                  {activeCategory} Desk
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Curated reports, verified briefings, and deep-dive analysis on {activeCategory.toLowerCase()}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCategory('All')}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                Back to Front Page
              </button>
            </div>
          </div>
        )}

        {/* Primary News Grid & Trending Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#032EA1]"></div>
              <h2 className="text-xl font-bold serif-headline text-slate-900">
                {activeCategory === 'All' ? 'Latest Wire & Special Reports' : `${activeCategory} Coverage`}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {displayedArticles.length} stories
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Articles Grid (8 cols) */}
            <div className="lg:col-span-8">
              {displayedArticles.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <p className="text-base font-bold text-slate-700">No stories in this category yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Check back soon or explore our other desks.</p>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('All')}
                    className="mt-4 px-4 py-2 rounded-md text-xs font-bold uppercase"
                  >
                    View All Stories
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {displayedArticles.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      isBookmarked={bookmarkedIds.has(article.id)}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar: Trending Rail & Quick Nav (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <TrendingRail articles={ARTICLES_DATA} />

              {/* Editorial Tip Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-[#032EA1]">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Editorial Wire Tip
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Have a verified news lead or primary document from Capitol Hill or regulatory agencies? Our investigative team guarantees source anonymity through secure channels.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">PGP Encrypted</span>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="text-xs font-bold px-3 py-1.5 rounded-md shadow-xs cursor-pointer"
                  >
                    Submit News Tip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* US Macroeconomic Indicators Table */}
        <EconomicTable />

        {/* Fact-Check Desk */}
        <FactCheckSection factChecks={FACT_CHECK_DATA} />

        {/* Opinion & Perspectives */}
        <OpinionSection opinions={OPINION_DATA} />

        {/* Interactive Reader Poll */}
        <DailyPoll initialPoll={INITIAL_POLL} />

        {/* Newsletter Subscription */}
        <Newsletter />
      </main>

      {/* Footer */}
      <Footer onSelectCategory={setActiveCategory} />

      {/* Bookmarks Slide-over Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        articles={ARTICLES_DATA}
        bookmarkedIds={bookmarkedIds}
        onRemoveBookmark={handleToggleBookmark}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        articles={ARTICLES_DATA}
      />
    </div>
  );
}
