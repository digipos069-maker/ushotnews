import React from 'react';
import { Metadata } from 'next';
import { getAllArticles } from '@/lib/articles';
import TestPostClient from './TestPostClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Facebook Auto-Post Test Console | US HOT NEWS',
  description:
    'Diagnostic tool to test Facebook photo auto-posting, format caption validation, and verify Meta Graph API token connectivity.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TestPostPage() {
  const articles = await getAllArticles(15);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.online';

  const formattedArticles = (articles || []).map((art) => ({
    slug: art.slug,
    title: art.title,
    category: art.category,
    imageUrl: art.imageUrl,
  }));

  return <TestPostClient articles={formattedArticles} siteUrl={siteUrl} />;
}
