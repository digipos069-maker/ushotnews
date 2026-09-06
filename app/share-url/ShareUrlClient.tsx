'use strict';
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SharedPost } from '@/lib/shareHistory';
import {
  Copy,
  Check,
  ExternalLink,
  Search,
  ArrowLeft,
  Share2,
  Filter,
  RefreshCw,
  Globe,
} from 'lucide-react';

interface ShareUrlClientProps {
  initialPosts: SharedPost[];
  siteUrl: string;
}

export default function ShareUrlClient({ initialPosts, siteUrl }: ShareUrlClientProps) {
  const [posts, setPosts] = useState<SharedPost[]>(initialPosts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'All' | 'photo' | 'link_card'>('All');
  const [copiedFbUrlId, setCopiedFbUrlId] = useState<string | null>(null);
  const [copiedArticleUrlId, setCopiedArticleUrlId] = useState<string | null>(null);
  const [copiedTitleId, setCopiedTitleId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter posts based on search query and format
  const filteredPosts = useMemo(() => {
    return (posts || []).filter((post) => {
      const matchesFormat =
        selectedFormat === 'All' ||
        (post.format && post.format.toLowerCase() === selectedFormat.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        (post.title && post.title.toLowerCase().includes(query)) ||
        (post.slug && post.slug.toLowerCase().includes(query)) ||
        (post.fb_post_id && post.fb_post_id.toLowerCase().includes(query));

      return matchesFormat && matchesSearch;
    });
  }, [posts, selectedFormat, searchQuery]);

  // Safe clipboard helper with legacy fallback
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (err) {
      console.error('Clipboard copy error:', err);
      return false;
    }
  };

  const handleCopyFbUrl = async (post: SharedPost) => {
    const url = post.fb_post_url;
    if (!url) return;
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedFbUrlId(post.id || post.fb_post_id);
      setTimeout(() => setCopiedFbUrlId(null), 2000);
    }
  };

  const handleCopyArticleUrl = async (post: SharedPost) => {
    const url = post.article_url || post.url || `${siteUrl}/article/${post.slug}`;
    if (!url) return;
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedArticleUrlId(post.id || post.fb_post_id);
      setTimeout(() => setCopiedArticleUrlId(null), 2000);
    }
  };

  const handleCopyTitle = async (post: SharedPost) => {
    const title = post.title;
    if (!title) return;
    const ok = await copyToClipboard(title);
    if (ok) {
      setCopiedTitleId(post.id || post.fb_post_id);
      setTimeout(() => setCopiedTitleId(null), 2000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/share-url', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      }
    } catch (error) {
      console.error('Failed to refresh shared posts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
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
                  Facebook Shared Post URLs & Syndication
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/public-url"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white border border-[#02237d] rounded-none cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#032EA1' }}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Article Directory</span>
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
                  Social Media Wire
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black serif-headline text-slate-900">
                Facebook Shared Post URLs
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Direct Facebook post links, permalinks, and publication records with 1-click copy tools.
              </p>
            </div>

            {/* Quick Stats & Refresh */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 border border-[#e0e0e0] px-3.5 py-2 rounded-none text-center">
                <span className="block text-lg font-black font-mono text-[#032EA1]">
                  {filteredPosts.length}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Total Shared
                </span>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-white border border-[#02237d] rounded-none cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#032EA1' }}
                title="Reload latest posts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Format Filters */}
          <div className="mt-5 pt-5 border-t border-[#e0e0e0] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by story headline, slug, or Facebook post ID..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-[#e0e0e0] rounded-none focus:outline-none focus:border-[#032EA1] text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-2 text-xs font-bold text-white border border-[#02237d] rounded-none cursor-pointer hover:opacity-90"
                style={{ backgroundColor: '#032EA1' }}
              >
                Clear Search
              </button>
            )}

            {/* Format Filter Buttons */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-500 pr-2 border-r border-[#e0e0e0]">
                <Filter className="w-3.5 h-3.5 text-[#032EA1]" />
                <span className="uppercase tracking-wider text-[11px]">Format:</span>
              </div>
              {(['All', 'link_card', 'photo'] as const).map((fmt) => {
                const isActive = selectedFormat === fmt;
                const label = fmt === 'All' ? 'All' : fmt === 'photo' ? 'Native Photo' : 'Link Card';
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-all border ${
                      isActive
                        ? 'text-white border-[#02237d] shadow-xs'
                        : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-[#e0e0e0]'
                    }`}
                    style={isActive ? { backgroundColor: '#032EA1' } : {}}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Facebook Posts Table */}
        <div className="bg-white border border-[#e0e0e0] rounded-none shadow-xs overflow-hidden">
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center">
              <Share2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">No Facebook posts found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || selectedFormat !== 'All'
                  ? 'Try clearing your search query or selecting "All" formats.'
                  : 'Published articles to Facebook Page will automatically appear here.'}
              </p>
              {(searchQuery || selectedFormat !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFormat('All');
                  }}
                  className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white border border-[#02237d] rounded-none cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: '#032EA1' }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-left border-collapse"
                style={{ backgroundColor: '#032EA1' }}
              >
                <thead>
                  <tr className="text-white text-xs uppercase tracking-wider border-b border-[#02237d]">
                    <th className="py-3.5 px-4 font-bold w-12 text-center border-r border-[#02237d]">#</th>
                    <th className="py-3.5 px-4 font-bold border-r border-[#02237d]">Headline & Story</th>
                    <th className="py-3.5 px-4 font-bold border-r border-[#02237d]">Facebook Post URL</th>
                    <th className="py-3.5 px-4 font-bold border-r border-[#02237d] hidden lg:table-cell">Published</th>
                    <th className="py-3.5 px-4 font-bold text-right w-72">Copy Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0] text-xs bg-white">
                  {filteredPosts.map((post, idx) => {
                    const postKey = post.id || post.fb_post_id;
                    const isFbUrlCopied = copiedFbUrlId === postKey;
                    const isArticleUrlCopied = copiedArticleUrlId === postKey;
                    const isTitleCopied = copiedTitleId === postKey;
                    const formatLabel =
                      post.format === 'photo' ? 'Photo' : 'Link Card';

                    return (
                      <tr
                        key={postKey}
                        className="hover:bg-slate-50 transition-colors group bg-white"
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-center border-r border-[#e0e0e0]">
                          {String(idx + 1).padStart(2, '0')}
                        </td>

                        {/* Story Headline & Info */}
                        <td className="py-3.5 px-4 border-r border-[#e0e0e0] max-w-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-none bg-blue-50 text-[#032EA1] border border-blue-200">
                              {formatLabel}
                            </span>
                            {post.fb_post_id && (
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                                ID: {post.fb_post_id}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/article/${post.slug}`}
                            target="_blank"
                            className="font-bold text-sm text-slate-900 group-hover:text-[#032EA1] transition-colors leading-snug line-clamp-2"
                          >
                            {post.title}
                          </Link>
                        </td>

                        {/* Facebook Post URL Column */}
                        <td className="py-3.5 px-4 border-r border-[#e0e0e0] max-w-xs">
                          {post.fb_post_url ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={post.fb_post_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-[#032EA1] hover:underline truncate max-w-[240px] inline-block font-semibold"
                                title={post.fb_post_url}
                              >
                                {post.fb_post_url}
                              </a>
                              <a
                                href={post.fb_post_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-[#032EA1] shrink-0"
                                title="Open on Facebook"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic font-mono text-[11px]">
                              URL pending
                            </span>
                          )}
                        </td>

                        {/* Published Date */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap hidden lg:table-cell border-r border-[#e0e0e0]">
                          {formatDate(post.posted_at)}
                        </td>

                        {/* Copy Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy FB Post URL */}
                            <button
                              type="button"
                              onClick={() => handleCopyFbUrl(post)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-all border ${
                                isFbUrlCopied
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'text-white border-[#02237d] hover:opacity-90'
                              }`}
                              style={!isFbUrlCopied ? { backgroundColor: '#032EA1' } : {}}
                              title="Copy direct Facebook Post URL to clipboard"
                            >
                              {isFbUrlCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied FB</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy FB URL</span>
                                </>
                              )}
                            </button>

                            {/* Copy Article URL */}
                            <button
                              type="button"
                              onClick={() => handleCopyArticleUrl(post)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-all border ${
                                isArticleUrlCopied
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'text-white border-[#02237d] hover:opacity-90'
                              }`}
                              style={!isArticleUrlCopied ? { backgroundColor: '#032EA1' } : {}}
                              title="Copy US HOT NEWS article link to clipboard"
                            >
                              {isArticleUrlCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied Web</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Web URL</span>
                                </>
                              )}
                            </button>

                            {/* Copy Headline */}
                            <button
                              type="button"
                              onClick={() => handleCopyTitle(post)}
                              className={`flex items-center gap-1 px-2 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-all border ${
                                isTitleCopied
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'text-white border-[#02237d] hover:opacity-90'
                              }`}
                              style={!isTitleCopied ? { backgroundColor: '#032EA1' } : {}}
                              title="Copy Headline"
                            >
                              {isTitleCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e0e0e0] bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} US HOT NEWS - Social Media Distribution Desk</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#032EA1]">
              Front Page
            </Link>
            <Link href="/public-url" className="hover:text-[#032EA1]">
              Article Directory
            </Link>
            <Link href="/share-url" className="text-[#032EA1] font-bold">
              Facebook Share Hub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
