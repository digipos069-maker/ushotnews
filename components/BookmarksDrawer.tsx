'use strict';
'use client';

import React from 'react';
import { Article } from '@/types/news';
import { X, Bookmark, Trash2, ArrowUpRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  bookmarkedIds: Set<string>;
  onRemoveBookmark: (id: string) => void;
}

export default function BookmarksDrawer({
  isOpen,
  onClose,
  articles,
  bookmarkedIds,
  onRemoveBookmark,
}: BookmarksDrawerProps) {
  if (!isOpen) return null;

  const savedArticles = articles.filter((a) => bookmarkedIds.has(a.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white flex flex-col border-l border-[#e0e0e0] rounded-none shadow-2xl">
          {/* Header */}
          <div className="p-4 bg-[#f7f7f7] border-b border-[#e0e0e0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-[#032EA1] text-white rounded-none border border-[#02237d]">
                <Bookmark className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 serif-headline uppercase tracking-wider">
                Your Saved Stories ({savedArticles.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 cursor-pointer rounded-none border border-[#02237d]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedArticles.length === 0 ? (
              <div className="text-center py-12 px-4">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700 mb-1">No Saved Articles</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click the bookmark icon on any story to save it here for future reading.
                </p>
              </div>
            ) : (
              savedArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white border border-[#e0e0e0] rounded-none p-3 flex flex-col justify-between hover:border-slate-400 transition-colors"
                >
                  <div className="flex gap-3">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-20 h-20 rounded-none object-cover border border-[#e0e0e0] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#032EA1] uppercase block mb-0.5">
                        {article.category}
                      </span>
                      <Link
                        href={`/article/${article.slug}`}
                        onClick={onClose}
                        className="font-bold text-xs text-slate-900 hover:text-[#032EA1] line-clamp-2 leading-snug"
                      >
                        {article.title}
                      </Link>
                      <p className="text-[11px] text-slate-500 mt-1">{article.publishedAt}</p>
                    </div>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-[#e0e0e0] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onRemoveBookmark(article.id)}
                      className="text-xs font-semibold px-2 py-1 rounded-none cursor-pointer flex items-center gap-1 border border-[#02237d]"
                    >
                      <Trash2 className="w-3 h-3 text-red-300" />
                      <span>Remove</span>
                    </button>
                    <Link
                      href={`/article/${article.slug}`}
                      onClick={onClose}
                      className="text-xs font-bold px-3 py-1 rounded-none flex items-center gap-1 text-white border border-[#02237d]"
                      style={{ backgroundColor: '#032EA1' }}
                    >
                      <span>Read Story</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-[#f7f7f7] border-t border-[#e0e0e0] text-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-bold uppercase tracking-wider cursor-pointer rounded-none border border-[#02237d]"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
