import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles, getArticleBySlug } from '@/lib/articles';
import { buildFbPostUrl, getSharedPosts } from '@/lib/shareHistory';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Test API endpoint for Facebook Auto-Publisher
 * Supports:
 * - GET /api/test-post?mode=dry-run (or ?dry_run=true) -> Safe simulation without publishing
 * - GET /api/test-post?mode=live (or ?live=true) -> Real live test publish to Facebook
 * - Optional: &slug=<slug> -> Test with specific article
 * - Optional: &format=photo -> Force photo format
 */
export async function GET(request: NextRequest) {
  return handleTestPost(request);
}

export async function POST(request: NextRequest) {
  return handleTestPost(request);
}

async function handleTestPost(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let body: any = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    // Determine mode: default to dry-run unless live=true or mode=live is explicitly provided
    const modeParam = searchParams.get('mode') || body.mode;
    const isLive =
      modeParam === 'live' ||
      searchParams.get('live') === 'true' ||
      body.live === true ||
      searchParams.get('dry_run') === 'false' ||
      body.dry_run === false;
    const mode: 'dry-run' | 'live' = isLive ? 'live' : 'dry-run';

    const slugParam = searchParams.get('slug') || body.slug;
    const requestedFormat = searchParams.get('format') || body.format || 'photo';

    // Credentials resolution & sanitization
    const rawPageId =
      searchParams.get('page_id') ||
      body.page_id ||
      process.env.FB_PAGE_ID ||
      process.env.PAGE_ID;

    const pageId = rawPageId
      ? String(rawPageId).trim().replace(/^["']|["']$/g, '')
      : null;

    const rawToken =
      searchParams.get('access_token') ||
      body.access_token ||
      process.env.FB_PAGE_ACCESS_TOKEN ||
      process.env.PAGE_ACCESS_TOKEN;

    const accessToken = rawToken
      ? String(rawToken).trim().replace(/^["']|["']$/g, '').replace(/\r|\n/g, '')
      : null;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ushotnews.online').replace(/\/$/, '');

    // Check for masked tokens from logs (e.g. EAAhpZCq...6PuO)
    if (accessToken && accessToken.includes('...')) {
      return NextResponse.json(
        {
          success: false,
          mode,
          error:
            "The token you entered contains '...' which means it was copied from a masked log (like GitHub Actions output) instead of the actual full token. Please copy the complete, unmasked token (~200-300 characters long).",
          diagnostics: {
            token_length: accessToken.length,
            contains_ellipsis: true,
          },
        },
        { status: 400 }
      );
    }

    // Step 1: Facebook Credential Diagnostics
    const credentialsConfigured = Boolean(pageId && accessToken);
    let tokenVerification: {
      valid: boolean;
      name?: string;
      id?: string;
      error?: string;
      help?: string;
    } = { valid: false };

    if (accessToken) {
      try {
        const verifyResp = await fetch(
          `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
          { cache: 'no-store' }
        );
        const verifyData = await verifyResp.json();
        if (verifyResp.ok && verifyData.id) {
          tokenVerification = {
            valid: true,
            name: verifyData.name,
            id: verifyData.id,
          };
        } else {
          const errMsg = verifyData.error?.message || 'Token check failed';
          let helpNotice = '';
          if (errMsg.includes('could not be decrypted')) {
            helpNotice =
              "Facebook cannot decrypt this token. This happens when: (1) The token was truncated or missing characters, (2) The Meta App Secret was reset, or (3) A masked token was pasted. Please test your token at https://developers.facebook.com/tools/debug/accesstoken/";
          }
          tokenVerification = {
            valid: false,
            error: errMsg,
            help: helpNotice || undefined,
          };
        }
      } catch (err: any) {
        tokenVerification = {
          valid: false,
          error: err.message || 'Could not connect to Facebook Graph API',
        };
      }
    }

    // Step 2: Article Selection
    let selectedArticle: any = null;
    if (slugParam) {
      selectedArticle = await getArticleBySlug(slugParam);
      if (!selectedArticle) {
        return NextResponse.json(
          {
            success: false,
            error: `Article with slug '${slugParam}' not found.`,
            mode,
          },
          { status: 404 }
        );
      }
    } else {
      const articles = await getAllArticles(8);
      if (!articles || articles.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No articles found in database or feeds to test.',
            mode,
          },
          { status: 404 }
        );
      }

      // Check against history to prefer unposted articles
      const sharedPosts = getSharedPosts();
      const postedSlugs = new Set(sharedPosts.map((p) => p.slug));

      const unpostedArticles = articles.filter((a) => !postedSlugs.has(a.slug));
      const pool = unpostedArticles.length > 0 ? unpostedArticles : articles;
      
      // In photo mode, prefer articles with images
      const withImages = pool.filter((a) => Boolean(a.imageUrl));
      const finalPool = withImages.length > 0 ? withImages : pool;

      const randomIndex = Math.floor(Math.random() * finalPool.length);
      selectedArticle = finalPool[randomIndex];
    }

    // Step 3: Build the Facebook Message & Caption
    const categoryEmojis: Record<string, string> = {
      Politics: '🏛️',
      Economy: '📈',
      Technology: '🤖',
      World: '🌐',
      Science: '🔬',
      Culture: '🎭',
      Sports: '🏆',
    };
    const emoji = categoryEmojis[selectedArticle.category] || '🚨';
    const articleUrl = `${siteUrl}/article/${selectedArticle.slug}`;

    const formattedMessage = [
      `${emoji} BREAKING: ${selectedArticle.title}`,
      '',
      selectedArticle.summary || '',
      '',
      '👉 Read the full verified report at US HOT NEWS:',
      articleUrl,
      '',
      `#${selectedArticle.category || 'News'} #USNews #BreakingNews #USHotNews`,
    ].join('\n');

    const previewPayload = {
      article_id: selectedArticle.id,
      title: selectedArticle.title,
      category: selectedArticle.category,
      slug: selectedArticle.slug,
      article_url: articleUrl,
      image_url: selectedArticle.imageUrl || null,
      format: requestedFormat,
      caption: formattedMessage,
    };

    // Step 4: Handle Dry-Run Mode
    if (mode === 'dry-run') {
      return NextResponse.json({
        success: true,
        mode: 'dry-run',
        message:
          'Simulated Facebook post preview. No changes were made to Facebook or history file. Set ?mode=live to publish for real.',
        diagnostics: {
          credentials_configured: credentialsConfigured,
          page_id: pageId ? `${String(pageId).slice(0, 4)}...${String(pageId).slice(-4)}` : null,
          token_configured: Boolean(accessToken),
          token_length: accessToken ? accessToken.length : 0,
          token_verification: tokenVerification,
        },
        payload: previewPayload,
      });
    }

    // Step 5: Handle Live Mode (Publish to Facebook)
    if (!credentialsConfigured) {
      return NextResponse.json(
        {
          success: false,
          mode: 'live',
          error:
            'Facebook credentials not configured. Please set FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN in environment variables, or pass them in the request.',
          diagnostics: {
            credentials_configured: false,
            token_verification: tokenVerification,
          },
          payload: previewPayload,
        },
        { status: 400 }
      );
    }

    if (!selectedArticle.imageUrl && requestedFormat === 'photo') {
      return NextResponse.json(
        {
          success: false,
          mode: 'live',
          error: 'The selected article has no image URL. Cannot publish in photo format.',
          payload: previewPayload,
        },
        { status: 400 }
      );
    }

    const target = pageId && pageId !== 'me' ? pageId : 'me';
    let fbData: any = null;
    let finalPostId: string | null = null;
    let publishMethod = '';

    // Method 1: Feed Post with Attached Photo (Guaranteed Text & Photo)
    try {
      const uploadResp = await fetch(`https://graph.facebook.com/v21.0/${target}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          url: selectedArticle.imageUrl,
          published: 'false',
          access_token: accessToken!,
        }),
      });
      const uploadData = await uploadResp.json();

      if (uploadResp.ok && uploadData.id) {
        const feedResp = await fetch(`https://graph.facebook.com/v21.0/${target}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            message: formattedMessage,
            attached_media: JSON.stringify([{ media_fbid: String(uploadData.id) }]),
            access_token: accessToken!,
          }),
        });
        const feedData = await feedResp.json();
        if (feedResp.ok && feedData.id) {
          fbData = feedData;
          finalPostId = feedData.id;
          publishMethod = 'feed_attached_photo';
        }
      }
    } catch {
      // Fallback to direct upload
    }

    // Method 2: Direct Photo Upload Fallback (passes both caption and message)
    if (!finalPostId) {
      const directResp = await fetch(`https://graph.facebook.com/v21.0/${target}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          url: selectedArticle.imageUrl,
          caption: formattedMessage,
          message: formattedMessage,
          access_token: accessToken!,
        }),
      });
      fbData = await directResp.json();

      if ((!directResp.ok || (!fbData.post_id && !fbData.id)) && target !== 'me') {
        // Fallback to /me/photos
        const meResp = await fetch(`https://graph.facebook.com/v21.0/me/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            url: selectedArticle.imageUrl,
            caption: formattedMessage,
            message: formattedMessage,
            access_token: accessToken!,
          }),
        });
        fbData = await meResp.json();
      }

      finalPostId = fbData?.post_id || fbData?.id;
      publishMethod = 'direct_photo_fallback';
    }

    if (!finalPostId) {
      return NextResponse.json(
        {
          success: false,
          mode: 'live',
          error: fbData?.error?.message || 'Facebook publish failed',
          facebook_error: fbData?.error,
          payload: previewPayload,
        },
        { status: 502 }
      );
    }

    // Step 6: Construct Canonical Post URL
    let fbPostUrl = buildFbPostUrl(finalPostId);
    if (!fbPostUrl && target !== 'me') {
      fbPostUrl = `https://www.facebook.com/${target}/posts/${finalPostId}`;
    }

    // Query Graph API permalink if available (ignore photo.php)
    try {
      const permalinkResp = await fetch(
        `https://graph.facebook.com/v21.0/${finalPostId}?fields=permalink_url&access_token=${accessToken}`
      );
      if (permalinkResp.ok) {
        const pData = await permalinkResp.json();
        if (pData?.permalink_url && !pData.permalink_url.includes('photo.php')) {
          fbPostUrl = pData.permalink_url;
        }
      }
    } catch {
      // Keep constructed URL
    }

    // Step 7: Record into data/fb_posted_history.json
    try {
      const historyFile = path.join(process.cwd(), 'data', 'fb_posted_history.json');
      let historyData: any = {
        last_updated: new Date().toISOString(),
        posted_count: 0,
        articles: {},
      };

      if (fs.existsSync(historyFile)) {
        const raw = fs.readFileSync(historyFile, 'utf-8');
        if (raw.trim()) {
          historyData = JSON.parse(raw);
        }
      }

      if (!historyData.articles) {
        historyData.articles = {};
      }

      const postRecord = {
        title: selectedArticle.title,
        slug: selectedArticle.slug,
        url: articleUrl,
        article_url: articleUrl,
        format: requestedFormat,
        fb_post_id: finalPostId,
        fb_post_url: fbPostUrl,
        posted_at: new Date().toISOString(),
        published_method: publishMethod,
      };

      const artIdKey = selectedArticle.id || `scraped-${selectedArticle.slug.slice(0, 10)}`;
      historyData.articles[artIdKey] = postRecord;
      historyData.articles[selectedArticle.slug] = postRecord;
      historyData.last_updated = new Date().toISOString();
      historyData.posted_count = Object.keys(historyData.articles).length;

      fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2), 'utf-8');
    } catch (saveErr: any) {
      console.warn('Could not record test post to history file:', saveErr.message);
    }

    return NextResponse.json({
      success: true,
      mode: 'live',
      message: '🎉 Article successfully published to Facebook Page!',
      publish_method: publishMethod,
      fb_post_id: finalPostId,
      fb_post_url: fbPostUrl,
      diagnostics: {
        credentials_configured: true,
        token_verification: tokenVerification,
      },
      article: previewPayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error during test post execution',
      },
      { status: 500 }
    );
  }
}
