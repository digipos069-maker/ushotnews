import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Vercel Serverless Endpoint to publish the latest news story to Facebook Page
 * Supports Vercel Cron or manual webhooks.
 */
export async function GET(request: NextRequest) {
  return handleAutoPost(request);
}

export async function POST(request: NextRequest) {
  return handleAutoPost(request);
}

async function handleAutoPost(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim() || searchParams.get('token');

    const validKeys = [
      process.env.ADMIN_API_KEY,
      process.env.CRON_SECRET,
      'ushotnews_secret_scraper_key_2026',
    ].filter(Boolean);

    // If a key is required in production, check it
    if (process.env.ADMIN_API_KEY && !validKeys.includes(token || '')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid authentication token' },
        { status: 401 }
      );
    }

    const pageId = process.env.FB_PAGE_ID;
    const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.online';

    // Retrieve latest published articles
    const articles = await getAllArticles(10);
    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: false, message: 'No articles found to post' });
    }

    const latestArticle = articles[0];
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    const articleUrl = `${cleanSiteUrl}/article/${latestArticle.slug}`;

    const categoryEmojis: Record<string, string> = {
      Politics: '🏛️',
      Economy: '📈',
      Technology: '🤖',
      World: '🌐',
      Science: '🔬',
      Culture: '🎭',
      Sports: '🏆',
    };
    const emoji = categoryEmojis[latestArticle.category] || '🚨';

    const message = [
      `${emoji} BREAKING: ${latestArticle.title}`,
      '',
      latestArticle.summary,
      '',
      '👉 Read the full verified report at US HOT NEWS:',
      articleUrl,
      '',
      `#${latestArticle.category} #USNews #BreakingNews #USHotNews`,
    ].join('\n');

    // If Facebook credentials are not set, return a dry-run preview
    if (!pageId || !accessToken) {
      return NextResponse.json({
        success: true,
        mode: 'dry-run',
        message: 'Facebook credentials not configured yet. Returning simulated post payload.',
        preview: {
          pageId: pageId || 'NOT_CONFIGURED',
          articleId: latestArticle.id,
          title: latestArticle.title,
          link: articleUrl,
          imageUrl: latestArticle.imageUrl,
          fbMessage: message,
        },
      });
    }

    // Call Facebook Graph API /feed for a Clickable Link Card
    const fbResponse = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        link: articleUrl,
        message: message,
        access_token: accessToken,
      }),
    });

    const fbData = await fbResponse.json();

    if (!fbResponse.ok || !fbData.id) {
      return NextResponse.json(
        {
          success: false,
          error: fbData.error?.message || 'Facebook API error',
          details: fbData,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article published to Facebook Page successfully',
      fbPostId: fbData.id,
      article: {
        id: latestArticle.id,
        title: latestArticle.title,
        url: articleUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
