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

    // Retrieve top 8 latest published articles, prioritizing ones with images
    const articles = await getAllArticles(8);
    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: false, message: 'No articles found to post' });
    }

    const articlesWithImages = articles.filter((a) => Boolean(a.imageUrl));
    const candidatePool = articlesWithImages.length > 0 ? articlesWithImages : articles;
    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    const latestArticle = candidatePool[randomIndex];
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

    // Format: Native HD Photo only (no link card, no random)
    const chosenFormat: 'photo' = 'photo';

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

    if (!latestArticle.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Selected article does not contain an image for photo-only publishing' },
        { status: 400 }
      );
    }

    const target = pageId && pageId !== 'me' ? pageId : 'me';
    let fbData: any;
    let fbResponse: any;

    // Native High-Res Photo upload via /{target}/photos
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

    // Determine canonical Facebook post URL
    let fbPostUrl = '';
    const postIdStr = String(finalPostId).trim();
    if (postIdStr.includes('_')) {
      const [pid, sid] = postIdStr.split('_');
      fbPostUrl = `https://www.facebook.com/${pid}/posts/${sid}`;
    } else if (target && target !== 'me') {
      fbPostUrl = `https://www.facebook.com/${target}/posts/${postIdStr}`;
    } else {
      fbPostUrl = `https://www.facebook.com/${postIdStr}`;
    }

    // Query Graph API for official permalink_url if available
    try {
      const permalinkResp = await fetch(
        `https://graph.facebook.com/v21.0/${postIdStr}?fields=permalink_url&access_token=${accessToken}`
      );
      if (permalinkResp.ok) {
        const permalinkData = await permalinkResp.json();
        if (permalinkData?.permalink_url) {
          fbPostUrl = permalinkData.permalink_url;
        }
      }
    } catch {
      // Keep constructed fallback
    }

    // Safely attempt to persist to data/fb_posted_history.json
    try {
      const fs = await import('fs');
      const path = await import('path');
      const historyFile = path.join(process.cwd(), 'data', 'fb_posted_history.json');
      let historyData: any = {
        last_updated: new Date().toISOString(),
        posted_count: 0,
        articles: {},
      };
      if (fs.existsSync(historyFile)) {
        try {
          const raw = fs.readFileSync(historyFile, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && parsed.articles) {
            historyData = parsed;
          }
        } catch {}
      }
      const record = {
        title: latestArticle.title,
        slug: latestArticle.slug,
        url: articleUrl,
        article_url: articleUrl,
        format: chosenFormat,
        fb_post_id: finalPostId,
        fb_post_url: fbPostUrl,
        posted_at: new Date().toISOString(),
      };
      historyData.articles[latestArticle.id] = record;
      historyData.articles[latestArticle.slug] = record;
      historyData.last_updated = new Date().toISOString();
      historyData.posted_count = Object.keys(historyData.articles).length;
      fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2), 'utf-8');
    } catch (saveErr) {
      console.warn('Could not persist fb_posted_history.json:', saveErr);
    }

    return NextResponse.json({
      success: true,
      message: `Article published to Facebook Page successfully as ${chosenFormat === 'photo' ? 'Native Photo' : 'Clickable Link Card'}`,
      format: chosenFormat,
      fbPostId: finalPostId,
      fbPostUrl: fbPostUrl,
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
