import React from 'react';
import { Metadata } from 'next';
import { getSharedPosts } from '@/lib/shareHistory';
import ShareUrlClient from './ShareUrlClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Facebook Shared URLs & Social Wire | US HOT NEWS',
  description:
    'Directory of articles published to Facebook with direct post permalinks, post IDs, and instant copy links.',
  robots: {
    index: false,
    follow: true,
  },
};

export default async function ShareUrlPage() {
  const posts = getSharedPosts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.online';

  return <ShareUrlClient initialPosts={posts} siteUrl={siteUrl} />;
}
