import React from 'react';
import HomePageClient from '@/components/HomePageClient';
import { getAllArticles } from '@/lib/articles';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const articles = await getAllArticles();
  return <HomePageClient initialArticles={articles} />;
}
