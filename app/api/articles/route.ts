import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles, saveArticle } from '@/lib/articles';
import { Article, NewsCategory } from '@/types/news';
 
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let articles = await getAllArticles();

    if (category && category !== 'All') {
      articles = articles.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      count: articles.slice(0, limit).length,
      articles: articles.slice(0, limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check API Key security if configured
    const expectedKey = process.env.ADMIN_API_KEY || 'ushotnews_secret_scraper_key_2026';
    const authHeader = request.headers.get('authorization') || request.headers.get('x-api-key');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (token && token !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.title || !body.summary) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: Title and summary are required' },
        { status: 400 }
      );
    }

    // Slug generation fallback
    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 100);

    const article: Article = {
      id: body.id || `scraped-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      slug,
      title: body.title.trim(),
      kicker: body.kicker || 'WIRE REPORT',
      summary: body.summary.trim(),
      content: Array.isArray(body.content) && body.content.length > 0
        ? body.content
        : [body.summary],
      category: (body.category as NewsCategory) || 'Politics',
      imageUrl:
        body.imageUrl ||
        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      imageCaption: body.imageCaption || '',
      author: {
        name: body.author?.name || 'US Wire Desk',
        role: body.author?.role || 'Staff Correspondent',
        avatar:
          body.author?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      },
      publishedAt: body.publishedAt || 'Just in',
      readTimeMinutes: body.readTimeMinutes || 4,
      isBreaking: Boolean(body.isBreaking),
      isLeadStory: Boolean(body.isLeadStory),
      isHot: Boolean(body.isHot),
      viewCount: body.viewCount || Math.floor(Math.random() * 2000) + 500,
      reactions: body.reactions || { likes: 14, insightful: 8, shocked: 2 },
      tags: Array.isArray(body.tags) ? body.tags : ['USNews', body.category || 'Wire'],
    };

    const result = await saveArticle(article, body.guid);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to save article' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article published successfully',
      id: article.id,
      slug: article.slug,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
