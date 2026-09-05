import React from 'react';
import { Metadata } from 'next';
import { getAllArticles } from '@/lib/articles';
import PublicUrlClient from './PublicUrlClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Public Article Directory & URL Hub | US HOT NEWS',
  description: 'Complete index of all public articles, direct URLs, and syndication links from US HOT NEWS.',
  robots: {
    index: false,
    follow: true,
  },
};

export default async function PublicUrlPage() {
  const articles = await getAllArticles(500);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.online';

  return <PublicUrlClient initialArticles={articles} siteUrl={siteUrl} />;
}
