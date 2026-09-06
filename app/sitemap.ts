import { MetadataRoute } from 'next';
import { getAllArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.online';
  const articles = await getAllArticles();

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/article/${article.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: article.isLeadStory ? 1.0 : article.isBreaking ? 0.9 : 0.8,
  }));

  const categories = ['Politics', 'Economy', 'Technology', 'World', 'Culture', 'Science', 'Sports'];
  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always' as const,
      priority: 1.0,
    },
    ...categoryEntries,
    ...articleEntries,
  ];
}
