import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Serverless Endpoint to publish top trending US news video to Facebook Page
 */
export async function GET(request: NextRequest) {
  return handleVideoAutoPost(request);
}

export async function POST(request: NextRequest) {
  return handleVideoAutoPost(request);
}

async function handleVideoAutoPost(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim() || searchParams.get('token');

    const validKeys = [
      process.env.ADMIN_API_KEY,
      process.env.CRON_SECRET,
      'ushotnews_secret_scraper_key_2026',
    ].filter(Boolean);

    if (process.env.ADMIN_API_KEY && !validKeys.includes(token || '')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid authentication token' },
        { status: 401 }
      );
    }

    const pageId = process.env.FB_PAGE_ID;
    const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.online';

    // Retrieve candidate articles pool
    const articles = await getAllArticles(20);
    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: false, message: 'No articles found to post' });
    }

    const withMedia = articles.filter((a) => Boolean(a.imageUrl || (a as any).videoUrl));
    const candidatePool = withMedia.length > 0 ? withMedia : articles;
    const latestArticle = candidatePool[0]; // Top latest/trending story
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
    const emoji = categoryEmojis[latestArticle.category] || '🎥';

    const messageLines = [`${emoji} ${latestArticle.title}`];
    if (latestArticle.summary && latestArticle.summary.trim() !== latestArticle.title.trim()) {
      messageLines.push('', latestArticle.summary);
    }
    messageLines.push(
      '',
      '👇 Read the full story in the first comment!',
      '',
      `#${latestArticle.category} #USNews #TrendingNews #USHotNews`
    );
    const message = messageLines.join('\n');
    const commentMessage = `👉 Read the full verified report at US HOT NEWS:\n${articleUrl}`;

    // Dry-run mode if credentials are missing
    if (!pageId || !accessToken) {
      return NextResponse.json({
        success: true,
        mode: 'dry-run',
        format: 'video',
        message: 'Facebook credentials not configured yet. Returning simulated video post payload.',
        preview: {
          pageId: pageId || 'NOT_CONFIGURED',
          articleId: latestArticle.id,
          title: latestArticle.title,
          format: 'video',
          articleUrl,
          imageUrl: latestArticle.imageUrl,
          fbCaption: message,
          firstComment: commentMessage,
        },
      });
    }

    const target = pageId && pageId !== 'me' ? pageId : 'me';
    let fbData: any;
    let fbResponse: any;

    const payload: Record<string, string> = {
      title: latestArticle.title.slice(0, 100),
      description: message,
      access_token: accessToken,
    };

    if ((latestArticle as any).videoUrl) {
      payload.file_url = (latestArticle as any).videoUrl;
    }

    fbResponse = await fetch(`https://graph.facebook.com/v21.0/${target}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload),
    });
    fbData = await fbResponse.json();

    const videoId = fbData?.id;
    if (!fbResponse.ok || !videoId) {
      return NextResponse.json(
        {
          success: false,
          error: fbData?.error?.message || 'Facebook Video API error',
          details: fbData,
        },
        { status: 502 }
      );
    }

    // Post First Comment
    let fbCommentId: string | null = null;
    try {
      const commentResp = await fetch(
        `https://graph.facebook.com/v21.0/${videoId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            message: commentMessage,
            access_token: accessToken,
          }),
        }
      );
      if (commentResp.ok) {
        const commentData = await commentResp.json();
        fbCommentId = commentData?.id || null;
      }
    } catch (commentErr) {
      console.warn('Could not post first comment to video:', commentErr);
    }

    const fbVideoUrl = `https://www.facebook.com/watch/?v=${videoId}`;

    // Record into history
    try {
      const fs = await import('fs');
      const path = await import('path');
      const historyFile = path.join(process.cwd(), 'data', 'fb_video_posted_history.json');
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
        format: 'video',
        fb_video_id: videoId,
        fb_video_url: fbVideoUrl,
        fb_comment_id: fbCommentId,
        posted_at: new Date().toISOString(),
      };
      historyData.articles[latestArticle.id] = record;
      historyData.articles[latestArticle.slug] = record;
      historyData.last_updated = new Date().toISOString();
      historyData.posted_count = Object.keys(historyData.articles).length;
      fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2), 'utf-8');
    } catch (saveErr) {
      console.warn('Could not persist fb_video_posted_history.json:', saveErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Video published to Facebook Page successfully!',
      format: 'video',
      fbVideoId: videoId,
      fbVideoUrl,
      fbCommentId,
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
