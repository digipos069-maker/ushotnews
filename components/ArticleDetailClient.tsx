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
  Quote,
  TrendingUp,
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

  // Generate CNBC-style bullet key points from summary and content
  const keyPoints = [
    article.summary,
    article.content[1] || 'Federal regulators and congressional leaders are coordinating standards across all 50 states.',
    article.content[2] || 'Major industry stakeholders expressed cautious support for unified national guidelines.',
  ];

  return (
    <article className="bg-white border border-[#e0e0e0] rounded-none shadow-xs overflow-hidden">
      {/* CNBC Breadcrumb & Back Navigation */}
      <div className="px-6 py-2.5 bg-[#f7f7f7] border-b border-[#e0e0e0] flex items-center justify-between text-xs">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-[#032EA1] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
          <span className="text-slate-400">/</span>
          <span className="text-[#032EA1] uppercase">{article.category}</span>
        </Link>

        {/* Font Size Adjuster Controls */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500 font-medium mr-1 hidden sm:inline">Text Size:</span>
          <div className="flex items-center bg-white border border-[#e0e0e0] rounded-none">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 text-xs font-bold rounded-none ${
                fontSize === 'normal' ? 'ring-1 ring-white' : 'opacity-80'
              }`}
              title="Standard text"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 text-sm font-bold rounded-none ${
                fontSize === 'large' ? 'ring-1 ring-white' : 'opacity-80'
              }`}
              title="Larger text"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-0.5 text-base font-bold rounded-none ${
                fontSize === 'xlarge' ? 'ring-1 ring-white' : 'opacity-80'
              }`}
              title="Extra large text"
            >
              A++
            </button>
          </div>
        </div>
      </div>

      {/* Main Editorial Content Container */}
      <div className="p-6 sm:p-10 space-y-6">
        
        {/* Category kicker & CNBC Headline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#032EA1]">
              {article.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold tracking-widest text-slate-600 uppercase">
              {article.kicker}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {article.title}
          </h1>
        </div>

        {/* CNBC Hallmark: The "KEY POINTS" Box */}
        <div className="bg-[#f8fafc] border-l-4 border-[#032EA1] border-y border-r border-[#e0e0e0] p-5 rounded-none">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#032EA1]"></span>
            KEY POINTS
          </h2>
          <ul className="space-y-2.5">
            {keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-slate-800 leading-snug">
                <span className="text-[#032EA1] font-bold text-base leading-none">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CNBC Byline & Timestamp Bar */}
        <div className="py-3 border-y border-[#e0e0e0] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className="w-10 h-10 rounded-none object-cover border border-[#e0e0e0]"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{article.author.name}</span>
                <span className="text-[11px] font-mono text-slate-500 uppercase">({article.author.role})</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono tracking-tight flex items-center gap-1.5 mt-0.5">
                <span>PUBLISHED SAT, SEP 5 2026</span>
                <span>•</span>
                <span className="text-[11px] text-slate-400 font-sans normal-case font-normal">({article.publishedAt})</span>
              </p>
            </div>
          </div>

          {/* Action Bar (Share, Save) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleBookmark}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer rounded-none border border-[#02237d]"
              title={isBookmarked ? "Remove from bookmarks" : "Save article"}
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

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer rounded-none border border-[#02237d]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Link Copied</span>
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

        {/* Lead Visual & Caption */}
        <div className="border border-[#e0e0e0] rounded-none overflow-hidden bg-slate-100">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full max-h-[500px] object-cover rounded-none"
          />
          {article.imageCaption && (
            <div className="p-3 bg-[#f7f7f7] border-t border-[#e0e0e0] text-xs text-slate-600 flex items-center justify-between">
              <span>{article.imageCaption}</span>
              <span className="font-mono text-slate-400 shrink-0 ml-2">US Hot News Wire</span>
            </div>
          )}
        </div>

        {/* CNBC Article Body Paragraphs */}
        <div className={`text-slate-800 space-y-6 ${getFontSizeClass()} font-serif`}>
          {article.content.map((paragraph, index) => {
            // Insert a CNBC pull-quote or highlight box after paragraph 1
            if (index === 1) {
              return (
                <React.Fragment key={index}>
                  <p className="leading-relaxed">{paragraph}</p>
                  <div className="my-6 p-5 bg-[#f8fafc] border-l-4 border-[#032EA1] border-y border-r border-[#e0e0e0] rounded-none not-italic">
                    <Quote className="w-6 h-6 text-blue-300 mb-2" />
                    <p className="text-base sm:text-lg font-bold text-slate-900 serif-headline italic leading-snug">
                      &ldquo;This legislation represents a critical inflection point in balancing American technological leadership with constitutional safety protections.&rdquo;
                    </p>
                    <span className="text-xs font-sans font-semibold text-slate-500 uppercase mt-2 block">
                      — Congressional Commerce Committee Briefing
                    </span>
                  </div>
                </React.Fragment>
              );
            }
            return (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* CNBC Sourcing / Disclosure Footer */}
        <div className="p-4 bg-[#f7f7f7] border border-[#e0e0e0] rounded-none text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-700 uppercase tracking-wider">
            Editorial Verification & Disclosure
          </p>
          <p>
            Reporting contributed by the Washington D.C. and New York bureaus. All government filings and legislative bills cited are cross-referenced with primary congressional committee records.
          </p>
        </div>

        {/* Topic Tags */}
        <div className="pt-4 border-t border-[#e0e0e0] flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Filed Under:
          </span>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="bg-[#f7f7f7] text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-none border border-[#e0e0e0]"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Reader Reactions Desk */}
        <div className="bg-[#f8fafc] border border-[#e0e0e0] rounded-none p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#032EA1]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Reader Reactions to this Reporting
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleReaction('likes')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-none border border-[#02237d] cursor-pointer"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Helpful ({reactions.likes ?? article.reactions.likes})</span>
            </button>
            <button
              type="button"
              onClick={() => handleReaction('insightful')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-none border border-[#02237d] cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Insightful ({reactions.insightful ?? article.reactions.insightful})</span>
            </button>
            <button
              type="button"
              onClick={() => handleReaction('shocked')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-none border border-[#02237d] cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Shocking ({reactions.shocked ?? article.reactions.shocked})</span>
            </button>
          </div>
        </div>

      </div>
    </article>
  );
}
