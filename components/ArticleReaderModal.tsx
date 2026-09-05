'use strict';
'use client';

import React, { useState } from 'react';
import { Article } from '@/types/news';
import {
  X,
  Bookmark,
  BookmarkCheck,
  Share2,
  Clock,
  ThumbsUp,
  Lightbulb,
  Zap,
  Check,
  Sparkles,
} from 'lucide-react';

interface ArticleReaderModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export default function ArticleReaderModal({
  article,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
}: ArticleReaderModalProps) {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [userReacted, setUserReacted] = useState<{ [key: string]: boolean }>({});
  const [copied, setCopied] = useState(false);

  if (!isOpen || !article) return null;

  const handleReaction = (type: 'likes' | 'insightful' | 'shocked') => {
    if (userReacted[type]) return;

    setUserReacted((prev) => ({ ...prev, [type]: true }));
    setReactions((prev) => ({
      ...prev,
      [type]: (prev[type] || article.reactions[type] || 0) + 1,
    }));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg leading-relaxed';
      case 'xlarge':
        return 'text-xl leading-loose';
      default:
        return 'text-base leading-relaxed';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="bg-slate-200 px-2 py-0.5 rounded-sm uppercase tracking-wider">
              {article.category}
            </span>
            <span>•</span>
            <span className="text-slate-500">{article.readTimeMinutes} min read</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Font size adjustment */}
            <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 mr-2">
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 text-xs font-bold rounded-sm ${fontSize === 'normal' ? 'ring-1 ring-white' : 'opacity-80'}`}
                title="Normal font size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 text-sm font-bold rounded-sm ${fontSize === 'large' ? 'ring-1 ring-white' : 'opacity-80'}`}
                title="Large font size"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-0.5 text-base font-bold rounded-sm ${fontSize === 'xlarge' ? 'ring-1 ring-white' : 'opacity-80'}`}
                title="Extra large font size"
              >
                A++
              </button>
            </div>

            <button
              type="button"
              onClick={() => onToggleBookmark(article.id)}
              className="p-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-300" />
                  <span className="hidden sm:inline">Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Copy share link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg shadow-xs cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Article Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6">
          <div>
            <span className="text-xs font-black tracking-widest text-[#032EA1] uppercase block mb-2">
              {article.kicker}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 serif-headline leading-tight mb-4">
              {article.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed mb-6 border-l-4 border-[#032EA1] pl-4 italic">
              {article.summary}
            </p>
          </div>

          {/* Author Byline */}
          <div className="flex items-center justify-between py-4 border-y border-slate-200">
            <div className="flex items-center gap-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900">{article.author.name}</h4>
                <p className="text-xs text-slate-500">{article.author.role}</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <span className="font-semibold block text-slate-700">{article.publishedAt}</span>
              <span className="font-mono">{article.viewCount.toLocaleString()} views</span>
            </div>
          </div>

          {/* Editorial Image */}
          <div className="rounded-xl overflow-hidden bg-slate-100">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full max-h-[420px] object-cover"
            />
            {article.imageCaption && (
              <p className="p-3 text-xs text-slate-500 bg-slate-50 italic">
                Photo: {article.imageCaption}
              </p>
            )}
          </div>

          {/* Article Full Paragraphs */}
          <div className={`text-slate-800 space-y-5 ${getFontSizeClass()} font-serif`}>
            {article.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Tags */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Topics:
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Reader Interactive Reactions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#032EA1]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                How did this reporting impact you?
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleReaction('likes')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Helpful ({reactions.likes ?? article.reactions.likes})</span>
              </button>
              <button
                type="button"
                onClick={() => handleReaction('insightful')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Insightful ({reactions.insightful ?? article.reactions.insightful})</span>
              </button>
              <button
                type="button"
                onClick={() => handleReaction('shocked')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Shocking ({reactions.shocked ?? article.reactions.shocked})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            US Hot News Editorial Standards • Nonpartisan & Independent
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
}
