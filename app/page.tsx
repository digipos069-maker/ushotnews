import React from 'react';
import HomePageClient from '@/components/HomePageClient';
import { getAllArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const articles = await getAllArticles();
  return <HomePageClient initialArticles={articles} />;
}
