'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { Article } from '@/types/news';
import {
  Bookmark,
  BookmarkCheck,
  Share2,
  ThumbsUp,
  Lightbulb,
  Zap,
  Check,
  Sparkles,
  ArrowLeft,
  Clock,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface ArticleDetailClientProps {
  article: Article;
}

export default function ArticleDetailClient({ article }: ArticleDetailClientProps) {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [userReacted, setUserReacted] = useState<{ [key: string]: boolean }>({});
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ushotnews_bookmarks');
      if (saved) {
        const list: string[] = JSON.parse(saved);
        if (list.includes(article.id)) {
          setIsBookmarked(true);
        }
      }
    } catch (e) {
      console.error('Error reading bookmark status:', e);
    }
  }, [article.id]);

  const toggleBookmark = () => {
    try {
      const saved = localStorage.getItem('ushotnews_bookmarks');
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (list.includes(article.id)) {
        list = list.filter((id) => id !== article.id);
        setIsBookmarked(false);
      } else {
        list.push(article.id);
        setIsBookmarked(true);
      }
      localStorage.setItem('ushotnews_bookmarks', JSON.stringify(list));
    } catch (e) {
      console.error('Error updating bookmark:', e);
    }
  };

  const handleReaction = (type: 'likes' | 'insightful' | 'shocked') => {
    if (userReacted[type]) return;

    setUserReacted((prev) => ({ ...prev, [type]: true }));
    setReactions((prev) => ({
      ...prev,
      [type]: (prev[type] || article.reactions[type] || 0) + 1,
    }));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg leading-relaxed sm:text-xl';
      case 'xlarge':
        return 'text-xl leading-loose sm:text-2xl';
      default:
        return 'text-base leading-relaxed sm:text-lg';
    }
  };

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-none shadow-xs overflow-hidden">
      {/* Top Action Bar */}
      <div className="px-6 py-3 bg-[#f7f7f7] border-b border-[#e0e0e0] flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#032EA1] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Front Page</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Font Size Adjuster */}
          <div className="flex items-center gap-1 bg-white border border-[#e0e0e0] rounded-none p-0.5 mr-2">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 text-xs font-bold rounded-none ${
                fontSize === 'normal' ? 'ring-1 ring-white' : 'opacity-80'
              }`}
              title="Standard typography size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 text-sm font-bold rounded-none ${
                fontSize === 'large' ? 'ring-1 ring-white' : 'opacity-80'
              }`}
              title="Enlarge typography size"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-0.5 text-base font-bold rounded-none ${
                fontSize === 'xlarge' ? 'ring-1 ring-white' : 'opacity-80'
              }`}
              title="Maximum typography size"
            >
              A++
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={toggleBookmark}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold cursor-pointer rounded-none border border-[#02237d]"
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold cursor-pointer rounded-none border border-[#02237d]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Article Content */}
      <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-7">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#032EA1] text-white text-[11px] font-black px-2 py-0.5 uppercase tracking-wider rounded-none">
              {article.category} Desk
            </span>
            <span className="text-xs font-bold tracking-widest text-[#032EA1] uppercase">
              {article.kicker}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 serif-headline leading-tight mb-5">
            {article.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-700 font-serif leading-relaxed border-l-4 border-[#032EA1] pl-4 italic">
            {article.summary}
          </p>
        </div>

        {/* Byline & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[#e0e0e0]">
          <div className="flex items-center gap-3">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className="w-10 h-10 rounded-none object-cover border border-[#e0e0e0]"
            />
            <div>
              <h4 className="font-bold text-sm text-slate-900">{article.author.name}</h4>
              <p className="text-xs text-slate-500">{article.author.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Published {article.publishedAt}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {article.viewCount.toLocaleString()} Reads
            </span>
            <span>•</span>
            <span>{article.readTimeMinutes} Min Read</span>
          </div>
        </div>

        {/* Featured Editorial Photo */}
        <div className="rounded-none overflow-hidden bg-slate-100 border border-[#e0e0e0]">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full max-h-[480px] object-cover rounded-none"
          />
          {article.imageCaption && (
            <p className="p-2.5 text-xs text-slate-600 bg-slate-50 italic border-t border-[#e0e0e0]">
              Caption: {article.imageCaption}
            </p>
          )}
        </div>

        {/* Story Body Paragraphs */}
        <div className={`text-slate-800 space-y-6 ${getFontSizeClass()} font-serif`}>
          {article.content.map((paragraph, index) => (
            <p key={index} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Topic Tags */}
        <div className="pt-6 border-t border-[#e0e0e0] flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Filed Under:
          </span>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-none border border-[#e0e0e0]"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Reader Reactions Box */}
        <div className="bg-slate-50 border border-[#e0e0e0] rounded-none p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#032EA1]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Reader Reactions to this Coverage
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleReaction('likes')}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-none border border-[#02237d] cursor-pointer"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Helpful ({reactions.likes ?? article.reactions.likes})</span>
            </button>
            <button
              type="button"
              onClick={() => handleReaction('insightful')}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-none border border-[#02237d] cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Insightful ({reactions.insightful ?? article.reactions.insightful})</span>
            </button>
            <button
              type="button"
              onClick={() => handleReaction('shocked')}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-none border border-[#02237d] cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Shocking ({reactions.shocked ?? article.reactions.shocked})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
