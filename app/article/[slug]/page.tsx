import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES_DATA, MARKET_DATA } from '@/data/newsData';
import ArticleDetailClient from '@/components/ArticleDetailClient';
import MarketTicker from '@/components/MarketTicker';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import NewsCard from '@/components/NewsCard';
import { ChevronRight, Newspaper } from 'lucide-react';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ARTICLES_DATA.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES_DATA.find((a) => a.slug === slug);

  if (!article) {
    return {
      title: 'Article Not Found | US HOT NEWS',
    };
  }

  return {
    title: `${article.title} | US HOT NEWS`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: [{ url: article.imageUrl }],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = ARTICLES_DATA.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = ARTICLES_DATA.filter(
    (a) => a.id !== article.id && (a.category === article.category || a.isHot)
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Banner & Masthead Mini-Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#032EA1] flex items-center justify-center text-white shadow-xs">
              <Newspaper className="w-5 h-5" />
            </div>
            <span className="text-xl sm:text-2xl font-black serif-headline text-slate-900 uppercase">
              US HOT NEWS
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-xs"
              style={{ backgroundColor: '#032EA1' }}
            >
              Front Page
            </Link>
          </div>
        </div>
      </header>

      {/* Markets Bar */}
      <MarketTicker markets={MARKET_DATA} />

      {/* Breadcrumb Bar */}
      <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-500 overflow-x-auto no-scrollbar">
          <Link href="/" className="hover:text-[#032EA1] font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-700">{article.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 truncate max-w-xs sm:max-w-md">{article.title}</span>
        </div>
      </div>

      {/* Main Article Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-12">
        <ArticleDetailClient article={article} />

        {/* Related Coverage */}
        {relatedArticles.length > 0 && (
          <section className="pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#032EA1]"></div>
                <h3 className="text-xl font-bold serif-headline text-slate-900">
                  Related Reports & Developing Coverage
                </h3>
              </div>
              <Link
                href="/"
                className="text-xs font-bold text-[#032EA1] hover:underline"
              >
                Browse All Desks →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <Link href={`/article/${rel.slug}`} className="block h-40 overflow-hidden">
                      <img
                        src={rel.imageUrl}
                        alt={rel.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
                  <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{rel.publishedAt}</span>
                    <Link
                      href={`/article/${rel.slug}`}
                      className="px-3 py-1.5 rounded-md text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: '#032EA1' }}
                    >
                      Read Story
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter Call to Action */}
        <Newsletter />
      </main>

      {/* Footer */}
      <Footer onSelectCategory={() => {}} />
    </div>
  );
}
