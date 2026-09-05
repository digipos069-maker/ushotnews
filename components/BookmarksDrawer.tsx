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
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#032EA1] text-white">
                <Bookmark className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-slate-900 serif-headline">
                Your Saved Stories ({savedArticles.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg shadow-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {savedArticles.length === 0 ? (
              <div className="text-center py-12 px-4">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700 mb-1">No Saved Articles Yet</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click the bookmark icon on any story to save it here for offline reading or future review.
                </p>
              </div>
            ) : (
              savedArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="flex gap-3">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#032EA1] uppercase block mb-1">
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

                  <div className="pt-3 mt-3 border-t border-slate-200/70 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onRemoveBookmark(article.id)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md shadow-xs cursor-pointer flex items-center gap-1 opacity-90 hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3 text-red-300" />
                      <span>Remove</span>
                    </button>
                    <Link
                      href={`/article/${article.slug}`}
                      onClick={onClose}
                      className="text-xs font-bold px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1 text-white"
                      style={{ backgroundColor: '#032EA1' }}
                    >
                      <span>Read Story</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
