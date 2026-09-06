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

    // Retrieve top 8 latest published articles and pick randomly
    const articles = await getAllArticles(8);
    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: false, message: 'No articles found to post' });
    }

    const randomIndex = Math.floor(Math.random() * articles.length);
    const latestArticle = articles[randomIndex];
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

    // Determine post format: randomly switch between "photo" (Native HD Photo) and "link_card" (Clickable Link Card)
    const requestedFormat = searchParams.get('format');
    const hasImage = Boolean(latestArticle.imageUrl);
    let chosenFormat: 'photo' | 'link_card' = 'link_card';

    if (requestedFormat === 'photo') {
      chosenFormat = hasImage ? 'photo' : 'link_card';
    } else if (requestedFormat === 'link_card') {
      chosenFormat = 'link_card';
    } else {
      // Random 50/50 toggle if image is present
      chosenFormat = hasImage && Math.random() < 0.5 ? 'photo' : 'link_card';
    }

    // If Facebook credentials are not set, return a dry-run preview
    if (!pageId || !accessToken) {
      return NextResponse.json({
        success: true,
        mode: 'dry-run',
        format: chosenFormat,
        message: 'Facebook credentials not configured yet. Returning simulated post payload.',
        preview: {
          pageId: pageId || 'NOT_CONFIGURED',
          articleId: latestArticle.id,
          title: latestArticle.title,
          format: chosenFormat,
          link: articleUrl,
          imageUrl: latestArticle.imageUrl,
          fbMessage: message,
        },
      });
    }

    const target = pageId && pageId !== 'me' ? pageId : 'me';
    let fbData: any;
    let fbResponse: any;

    if (chosenFormat === 'photo' && latestArticle.imageUrl) {
      // 1. Attempt Native High-Res Photo upload via /{target}/photos
      fbResponse = await fetch(`https://graph.facebook.com/v21.0/${target}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          url: latestArticle.imageUrl,
          caption: message,
          access_token: accessToken,
        }),
      });
      fbData = await fbResponse.json();

      // Fallback to /me/photos if target global id rejected
      if ((!fbResponse.ok || (!fbData.post_id && !fbData.id)) && target !== 'me') {
        fbResponse = await fetch(`https://graph.facebook.com/v21.0/me/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            url: latestArticle.imageUrl,
            caption: message,
            access_token: accessToken,
          }),
        });
        fbData = await fbResponse.json();
      }

      // If photo upload still failed, fallback to Clickable Link Card
      if (!fbResponse.ok || (!fbData.post_id && !fbData.id)) {
        chosenFormat = 'link_card';
      }
    }

    if (chosenFormat === 'link_card') {
      // 2. Clickable Link Card via /{target}/feed
      fbResponse = await fetch(`https://graph.facebook.com/v21.0/${target}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          link: articleUrl,
          message: message,
          access_token: accessToken,
        }),
      });
      fbData = await fbResponse.json();

      // Fallback to /me/feed if global id error occurs
      if ((!fbResponse.ok || !fbData.id) && target !== 'me') {
        fbResponse = await fetch(`https://graph.facebook.com/v21.0/me/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            link: articleUrl,
            message: message,
            access_token: accessToken,
          }),
        });
        fbData = await fbResponse.json();
      }
    }

    const finalPostId = fbData?.post_id || fbData?.id;
    if (!fbResponse.ok || !finalPostId) {
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
      message: `Article published to Facebook Page successfully as ${chosenFormat === 'photo' ? 'Native Photo' : 'Clickable Link Card'}`,
      format: chosenFormat,
      fbPostId: finalPostId,
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
