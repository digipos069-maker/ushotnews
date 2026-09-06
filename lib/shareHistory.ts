import fs from 'fs';
import path from 'path';

export interface SharedPost {
  id: string;
  title: string;
  slug: string;
  url: string;
  article_url: string;
  format?: 'photo' | 'link_card' | string;
  fb_post_id: string;
  fb_post_url: string;
  posted_at: string;
}

/**
 * Builds canonical Facebook URL from post ID.
 * If ID is in format 'page_story', produces 'https://www.facebook.com/{page}/posts/{story}'.
 */
export function buildFbPostUrl(postId: string): string {
  if (!postId) return '';
  const cleanId = String(postId).trim();
  if (cleanId.includes('_')) {
    const [pageId, storyId] = cleanId.split('_');
    return `https://www.facebook.com/${pageId}/posts/${storyId}`;
  }
  return `https://www.facebook.com/${cleanId}`;
}

/**
 * Loads and deduplicates Facebook shared posts from data/fb_posted_history.json.
 * Safely handles missing files or read errors to prevent runtime crashes.
 */
export function getSharedPosts(): SharedPost[] {
  const historyFile = path.join(process.cwd(), 'data', 'fb_posted_history.json');
  try {
    if (!fs.existsSync(historyFile)) {
      return [];
    }
    const raw = fs.readFileSync(historyFile, 'utf-8');
    if (!raw.trim()) {
      return [];
    }
    const data = JSON.parse(raw);
    const articles = data?.articles || {};

    const seen = new Set<string>();
    const list: SharedPost[] = [];

    for (const key of Object.keys(articles)) {
      const item = articles[key];
      if (!item || typeof item !== 'object') continue;

      const postId = item.fb_post_id || '';
      const slug = item.slug || '';
      const dedupKey = postId ? `post_${postId}` : `slug_${slug}`;

      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const fbPostUrl = item.fb_post_url || buildFbPostUrl(postId);
      const articleUrl =
        item.article_url ||
        item.url ||
        (slug ? `https://ushotnews.online/article/${slug}` : '');

      list.push({
        id: key,
        title: item.title || 'Untitled Story',
        slug: slug,
        url: articleUrl,
        article_url: articleUrl,
        format: item.format || 'link_card',
        fb_post_id: postId,
        fb_post_url: fbPostUrl,
        posted_at: item.posted_at || new Date().toISOString(),
      });
    }

    // Sort newest first
    list.sort((a, b) => {
      const timeA = Date.parse(a.posted_at) || 0;
      const timeB = Date.parse(b.posted_at) || 0;
      return timeB - timeA;
    });

    return list;
  } catch (err) {
    console.error('Error loading shared posts history:', err);
    return [];
  }
}
