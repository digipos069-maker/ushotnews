import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ARTICLES_DATA, MARKET_DATA } from '@/data/newsData';
import ArticleDetailClient from '@/components/ArticleDetailClient';
import MarketTicker from '@/components/MarketTicker';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import {
  ChevronRight,
  Newspaper,
  TrendingUp,
  Flame,
  ArrowUpRight,
  Clock,
  Eye,
  Mail,
} from 'lucide-react';

import { getAllArticles, getArticleBySlug } from '@/lib/articles';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

/**
 * Extracts high-value SEO keywords dynamically from the article title, summary, and content.
 */
function extractDynamicKeywords(article: any): string[] {
  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'didn', 'do', 'does', 'doesn', 'doing', 'don', 'down', 'during', 'each',
    'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers',
    'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its',
    'itself', 'just', 'll', 'm', 'ma', 'me', 'might', 'more', 'most', 'must', 'my', 'myself', 'no',
    'nor', 'not', 'now', 'o', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
    'ourselves', 'out', 'over', 'own', 're', 's', 'same', 'she', 'should', 'so', 'some', 'such',
    't', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
    'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 've', 'very', 'was',
    'wasn', 'we', 'were', 'weren', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
    'will', 'with', 'won', 'would', 'y', 'you', 'your', 'yours', 'yourself', 'yourselves', 'said',
    'says', 'according', 'also', 'new', 'one', 'two', 'first', 'last', 'per', 'since', 'including'
  ]);

  // Combine title, summary, and content text
  const contentText = Array.isArray(article.content) ? article.content.join(' ') : (article.content || '');
  const combinedText = `${article.title} ${article.summary} ${contentText}`;

  // Extract candidate words (alphanumeric, at least 3 chars)
  const words = combinedText
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w));

  // Count word frequencies
  const freqMap: Record<string, number> = {};
  for (const word of words) {
    freqMap[word] = (freqMap[word] || 0) + 1;
  }

  // Sort by frequency
  const sortedKeywords = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  // Extract high-value capitalized entity phrases (e.g. "Federal Reserve", "Wall Street", "Supreme Court")
  const entities = new Set<string>();
  const entityMatches = combinedText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g);
  if (entityMatches) {
    for (const phrase of entityMatches) {
      if (phrase.length > 5 && !phrase.includes('US HOT NEWS')) {
        entities.add(phrase);
      }
    }
  }

  const primaryKeywords = [
    article.category,
    `${article.category} News`,
    'US News',
    'Breaking News',
    article.kicker || 'Special Report',
    article.author?.name || 'US News Bureau',
    ...(article.tags || []),
    ...Array.from(entities).slice(0, 5),
    ...sortedKeywords,
  ];

  // Deduplicate case-insensitively
  const seen = new Set<string>();
  const uniqueKeywords: string[] = [];
  for (const kw of primaryKeywords) {
    if (kw && !seen.has(kw.toLowerCase())) {
      seen.add(kw.toLowerCase());
      uniqueKeywords.push(kw);
    }
  }

  return uniqueKeywords.slice(0, 15);
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested news article could not be located.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.vercel.app';
  const articleUrl = `${siteUrl}/article/${article.slug}`;
  const dynamicKeywords = extractDynamicKeywords(article);

  return {
    title: article.title,
    description: article.summary,
    keywords: dynamicKeywords,
    authors: [{ name: article.author.name }],
    creator: article.author.name,
    publisher: 'US HOT NEWS',
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: articleUrl,
      siteName: 'US HOT NEWS',
      locale: 'en_US',
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      section: article.category,
      tags: article.tags || [],
      images: [
        {
          url: article.imageUrl,
          width: 1200,
          height: 675,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      creator: '@ushotnews',
      images: [article.imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = await getAllArticles();

  // Top trending / most read stories for CNBC-style right rail
  const trendingStories = [...allArticles]
    .filter((a) => a.id !== article.id)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  // Category specific related stories
  const categoryStories = allArticles.filter(
    (a) => a.id !== article.id && a.category === article.category
  ).slice(0, 3);

  // More stories across other desks
  const moreStories = allArticles.filter(
    (a) => a.id !== article.id && a.category !== article.category
  ).slice(0, 3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.vercel.app';
  const articleUrl = `${siteUrl}/article/${article.slug}`;

  // Structured Data for Google News & Search Engines (schema.org/NewsArticle)
  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    headline: article.title,
    description: article.summary,
    image: [article.imageUrl],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
      jobTitle: article.author.role,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'US HOT NEWS',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon.png`,
      },
    },
    articleSection: article.category,
    keywords: extractDynamicKeywords(article).join(', '),
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      {/* CNBC-style Top Masthead */}
      <header className="w-full bg-white border-b border-[#e0e0e0] relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="US HOT NEWS Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl sm:text-2xl font-black serif-headline text-slate-900 uppercase group-hover:text-[#032EA1] transition-colors">
                US HOT NEWS
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-500 border-l border-[#e0e0e0] pl-4">
              <span className="text-[#032EA1] font-bold uppercase">{article.category}</span>
              <span>•</span>
              <span>Special Report</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded-none border border-[#02237d]"
              style={{ backgroundColor: '#032EA1' }}
            >
              Front Page
            </Link>
          </div>
        </div>
      </header>

      {/* Auto-scrolling Markets Bar (Smart Sticky on Scroll Up) */}
      <MarketTicker markets={MARKET_DATA} />

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-[#f7f7f7] border-b border-[#e0e0e0] py-2 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-500 overflow-x-auto no-scrollbar">
          <Link href="/" className="hover:text-[#032EA1] font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href="/" className="font-semibold text-slate-700 hover:text-[#032EA1]">
            {article.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 truncate max-w-xs sm:max-w-md">{article.title}</span>
        </div>
      </div>

      {/* CNBC Two-Column Editorial Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column (8 cols): Article Content */}
          <div className="lg:col-span-8">
            <ArticleDetailClient article={article} />
          </div>

          {/* Right Rail (4 cols): CNBC Standard Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* CNBC Market Snapshot Card */}
            <div className="bg-white border border-[#e0e0e0] rounded-none p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#e0e0e0] mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500"></span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    US Market Snapshot
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Real-time</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {MARKET_DATA.slice(0, 4).map((m) => (
                  <div key={m.symbol} className="p-2 bg-[#f8fafc] border border-[#e0e0e0] rounded-none">
                    <span className="font-bold text-slate-900 block">{m.symbol}</span>
                    <span className="text-[11px] text-slate-600 block">{m.value}</span>
                    <span className={`text-[10px] font-bold ${m.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {m.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Now / Most Read (CNBC Style Numbered List) */}
            <div className="bg-white border border-[#e0e0e0] rounded-none p-5 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e0e0] mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-none bg-red-600 text-white">
                    <Flame className="w-3 h-3 fill-current" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Trending Now
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Most Popular</span>
              </div>

              <div className="space-y-3.5">
                {trendingStories.map((story, idx) => (
                  <Link
                    key={story.id}
                    href={`/article/${story.slug}`}
                    className="flex items-start gap-3 group pb-3 border-b border-[#e0e0e0] last:border-0 last:pb-0"
                  >
                    <span className="text-2xl font-black font-mono text-slate-300 group-hover:text-[#032EA1] transition-colors leading-none w-5 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#032EA1] block mb-0.5">
                        {story.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#032EA1] transition-colors line-clamp-2 leading-snug">
                        {story.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="font-mono">{story.viewCount.toLocaleString()} reads</span>
                        <span>•</span>
                        <span>{story.readTimeMinutes}m</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* More In This Category (CNBC Desk Picks) */}
            {categoryStories.length > 0 && (
              <div className="bg-white border border-[#e0e0e0] rounded-none p-5 shadow-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e0e0] mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    More in {article.category}
                  </h3>
                  <span className="text-[11px] text-[#032EA1] font-bold">Desk Wire</span>
                </div>

                <div className="space-y-3">
                  {categoryStories.map((catStory) => (
                    <Link
                      key={catStory.id}
                      href={`/article/${catStory.slug}`}
                      className="group flex gap-3 pb-3 border-b border-[#e0e0e0] last:border-0 last:pb-0"
                    >
                      <img
                        src={catStory.imageUrl}
                        alt={catStory.title}
                        className="w-16 h-14 rounded-none object-cover border border-[#e0e0e0] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#032EA1] line-clamp-2 leading-snug">
                          {catStory.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">
                          {catStory.publishedAt}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* The Morning Wire Compact Sign-Up */}
            <div className="bg-[#f8fafc] border border-[#e0e0e0] rounded-none p-5">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#032EA1] mb-1">
                <Mail className="w-3.5 h-3.5" />
                <span>The Morning Wire</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Get the daily Washington & Wall Street briefing
              </h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Delivered every morning at 6:00 AM EST with key policy votes and market movers.
              </p>
              <a
                href="#newsletter"
                className="block text-center py-2 text-xs font-bold uppercase tracking-wider text-white rounded-none border border-[#02237d] transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#032EA1' }}
              >
                Subscribe Free
              </a>
            </div>

          </aside>
        </div>

        {/* CNBC Bottom Grid: Related Coverage */}
        <section className="mt-12 pt-8 border-t border-[#e0e0e0]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-[#032EA1]"></div>
              <h3 className="text-xl font-bold serif-headline text-slate-900">
                Related Reports & Further Wire Coverage
              </h3>
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-[#032EA1] hover:underline uppercase tracking-wider"
            >
              Browse All Desks →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {moreStories.map((rel) => (
              <div
                key={rel.id}
                className="bg-white border border-[#e0e0e0] rounded-none overflow-hidden shadow-xs hover:border-slate-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <Link href={`/article/${rel.slug}`} className="block h-40 overflow-hidden border-b border-[#e0e0e0]">
                    <img
                      src={rel.imageUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover rounded-none hover:opacity-95 transition-opacity"
                    />
                  </Link>
                  <div className="p-4">
                    <span className="text-[10px] font-bold text-[#032EA1] uppercase block mb-1">
                      {rel.category}
                    </span>
                    <Link
                      href={`/article/${rel.slug}`}
                      className="font-bold text-sm text-slate-900 serif-headline hover:text-[#032EA1] transition-colors line-clamp-2 leading-snug"
                    >
                      {rel.title}
                    </Link>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-2">
                      {rel.summary}
                    </p>
                  </div>
                </div>
                <div className="p-4 pt-2 border-t border-[#e0e0e0] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">{rel.publishedAt}</span>
                  <Link
                    href={`/article/${rel.slug}`}
                    className="px-3 py-1.5 text-xs font-bold text-white rounded-none border border-[#02237d]"
                    style={{ backgroundColor: '#032EA1' }}
                  >
                    Read Story
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter Call to Action */}
        <Newsletter />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
