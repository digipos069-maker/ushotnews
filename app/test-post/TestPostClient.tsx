'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ArticleOption {
  slug: string;
  title: string;
  category: string;
  imageUrl?: string;
}

interface TestPostClientProps {
  articles: ArticleOption[];
  siteUrl: string;
}

export default function TestPostClient({ articles, siteUrl }: TestPostClientProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved credentials from localStorage for ease of testing
  useEffect(() => {
    try {
      const savedPageId = localStorage.getItem('fb_test_page_id');
      const savedToken = localStorage.getItem('fb_test_access_token');
      if (savedPageId) setPageId(savedPageId);
      if (savedToken) setAccessToken(savedToken);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleTest = async (liveMode: boolean) => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Save to localStorage if provided
    try {
      if (pageId.trim()) localStorage.setItem('fb_test_page_id', pageId.trim());
      if (accessToken.trim()) localStorage.setItem('fb_test_access_token', accessToken.trim());
    } catch {
      // Ignore
    }

    try {
      const payload: any = {
        mode: liveMode ? 'live' : 'dry-run',
        slug: selectedSlug || undefined,
        page_id: pageId.trim() || undefined,
        access_token: accessToken.trim() || undefined,
      };

      const res = await fetch('/api/test-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        setError(data.error || `Request failed with status ${res.status}`);
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Network error while contacting /api/test-post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-[#032EA1] mb-2">
              🧪 Diagnostic & Simulation Tool
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Facebook Auto-Post Test Console
            </h1>
            <p className="text-slate-600 mt-1 text-sm">
              Test and verify Facebook photo auto-publishing, caption formatting, and Graph API connectivity.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/share-url"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: '#032EA1' }}
            >
              📋 View Shared Posts
            </Link>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Select Test Parameters</h2>

          <div className="space-y-4">
            {/* Article Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Article to Post
              </label>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-lg border-slate-300 border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#032EA1]"
              >
                <option value="">🎲 Auto-Select (Random from latest unposted pool)</option>
                {articles.map((art) => (
                  <option key={art.slug} value={art.slug}>
                    [{art.category}] {art.title.slice(0, 75)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Credentials Override */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="text-sm font-bold text-slate-800 mb-1">
                🔑 Facebook Credentials (Optional Override)
              </div>
              <p className="text-xs text-slate-500 mb-3">
                If already set in Vercel or environment variables (<code className="bg-slate-200 px-1 py-0.5 rounded">FB_PAGE_ID</code> &amp; <code className="bg-slate-200 px-1 py-0.5 rounded">FB_PAGE_ACCESS_TOKEN</code>), you can leave these blank. Otherwise, enter them below to test immediately.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="e.g. 1325939953941168"
                    className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#032EA1]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Page Access Token
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-[11px] text-[#032EA1] font-semibold hover:underline"
                    >
                      {showToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAAhpZCq..."
                    className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#032EA1]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {/* Dry-Run Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleTest(false)}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#032EA1' }}
              >
                {loading ? 'Processing...' : '🔍 Run Dry-Run (Preview Only)'}
              </button>

              {/* Live Test Post Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (confirm('Are you sure you want to publish a REAL post to your Facebook Page right now?')) {
                    handleTest(true);
                  }
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#032EA1' }}
              >
                {loading ? 'Publishing...' : '🚀 Publish Real Test Post to Facebook'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl mb-8">
            <div className="flex">
              <div className="text-red-500 font-bold mr-2">❌ Error:</div>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* Test Results Output */}
        {result && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div>
                <span className="font-bold uppercase text-xs tracking-wider px-2 py-0.5 rounded bg-white/60 mr-2">
                  Mode: {result.mode}
                </span>
                <span className="font-semibold text-sm">
                  {result.message || (result.success ? 'Execution succeeded' : 'Execution encountered an issue')}
                </span>
              </div>
              {result.fb_post_url && (
                <a
                  href={result.fb_post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow transition hover:opacity-95"
                  style={{ backgroundColor: '#032EA1' }}
                >
                  🔗 View on Facebook
                </a>
              )}
            </div>

            {/* Diagnostics Table */}
            {result.diagnostics && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div
                  className="px-6 py-3 text-white text-sm font-bold flex items-center justify-between"
                  style={{ backgroundColor: '#032EA1' }}
                >
                  <span>Diagnostics &amp; Facebook Identity</span>
                  <span className="text-xs font-normal opacity-90">Meta Graph API v21.0</span>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-slate-500 block text-xs">Credentials Configured</span>
                    <span className="font-semibold text-slate-800">
                      {result.diagnostics.credentials_configured ? '✅ Yes' : '❌ Missing'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-slate-500 block text-xs">Page ID</span>
                    <span className="font-mono text-slate-800">{result.diagnostics.page_id || 'Not set'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-slate-500 block text-xs">Token Verification</span>
                    <span className="font-semibold text-slate-800">
                      {result.diagnostics.token_verification?.valid ? (
                        <span className="text-emerald-600">
                          ✅ Connected: {result.diagnostics.token_verification.name}
                        </span>
                      ) : (
                        <span className="text-red-600">
                          ⚠️ {result.diagnostics.token_verification?.error || 'Unverified'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-slate-500 block text-xs">Publish Method Used</span>
                    <span className="font-mono text-slate-800">
                      {result.publish_method || (result.mode === 'dry-run' ? 'Simulation (No publish)' : 'N/A')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Post Preview Card */}
            {(result.payload || result.article) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div
                  className="px-6 py-3 text-white text-sm font-bold"
                  style={{ backgroundColor: '#032EA1' }}
                >
                  Facebook Post Preview (What Displays on Facebook)
                </div>
                <div className="p-6">
                  {(() => {
                    const post = result.payload || result.article;
                    return (
                      <div className="max-w-xl mx-auto border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                        {/* Mock Facebook Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm"
                            style={{ backgroundColor: '#032EA1' }}
                          >
                            US
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">US HOT NEWS</div>
                            <div className="text-xs text-slate-400">Just now · 🌐 Public</div>
                          </div>
                        </div>

                        {/* Caption Text */}
                        <div className="text-slate-800 text-sm whitespace-pre-line mb-3 font-sans leading-relaxed">
                          {post.caption}
                        </div>

                        {/* High-Resolution Photo */}
                        {post.image_url && (
                          <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={post.image_url}
                              alt={post.title}
                              className="w-full h-auto max-h-96 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Raw JSON Debugging Output */}
            <details className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono">
              <summary className="cursor-pointer text-slate-400 font-semibold mb-2">
                ▶ View Raw JSON Response
              </summary>
              <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
