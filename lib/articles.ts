import fs from 'fs';
import path from 'path';
import { Article } from '@/types/news';
import { ARTICLES_DATA } from '@/data/newsData';
import { getDbClient, initDatabaseSchema } from './db';

const SCRAPED_FILE = path.join(process.cwd(), 'data', 'scraped_articles.json');

/**
 * Formats a published timestamp or DB created_at into a clean relative time string (e.g., '14m ago', '2h ago').
 */
export function formatRelativeTime(dateStr?: string, createdAt?: string | Date): string {
  let dateObj: Date | null = null;

  if (dateStr && dateStr !== 'Just now' && dateStr !== 'Just in') {
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    }
  }

  if (!dateObj && createdAt) {
    const parsed = typeof createdAt === 'string' ? Date.parse(createdAt) : createdAt.getTime();
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    }
  }

  if (!dateObj) {
    return dateStr || 'Just now';
  }

  const diffSec = Math.max(0, Math.floor((Date.now() - dateObj.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Safely loads locally persisted scraped articles from JSON file
 */
function getLocalScrapedArticles(): Article[] {
  try {
    if (fs.existsSync(SCRAPED_FILE)) {
      const data = fs.readFileSync(SCRAPED_FILE, 'utf8');
      if (data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (error) {
    console.error('Error reading local scraped articles file:', error);
  }
  return [];
}

/**
 * Saves article to local JSON file as backup
 */
function saveLocalScrapedArticle(article: Article): boolean {
  try {
    const list = getLocalScrapedArticles();
    // Check if slug or id already exists
    const exists = list.some((a) => a.id === article.id || a.slug === article.slug);
    if (!exists) {
      list.unshift(article);
      fs.writeFileSync(SCRAPED_FILE, JSON.stringify(list, null, 2), 'utf8');
    }
    return true;
  } catch (error) {
    console.error('Error writing to local scraped articles file:', error);
    return false;
  }
}

/**
 * Fetches all articles (combining Cloud DB or local scraped with default editorial articles)
 */
export async function getAllArticles(limitCount: number = 200): Promise<Article[]> {
  const sql = getDbClient();

  if (sql) {
    try {
      await initDatabaseSchema();
      const rows = await sql`
        SELECT 
          id, slug, title, kicker, summary, content, category, 
          image_url, image_caption, author_name, author_role, author_avatar,
          published_at, created_at, read_time_minutes, is_breaking, is_lead_story, 
          is_hot, view_count, reactions, tags
        FROM articles 
        ORDER BY created_at DESC 
        LIMIT ${limitCount};
      `;

      if (rows && rows.length > 0) {
        const dbArticles: Article[] = rows.map((r: any) => {
          let safeContent = [];
          try {
            if (Array.isArray(r.content)) {
              safeContent = r.content;
            } else if (typeof r.content === 'string') {
              safeContent = JSON.parse(r.content || '[]');
            }
          } catch {
            safeContent = [r.summary || ''];
          }

          let safeTags = [];
          try {
            if (Array.isArray(r.tags)) {
              safeTags = r.tags;
            } else if (typeof r.tags === 'string') {
              safeTags = JSON.parse(r.tags || '[]');
            }
          } catch {
            safeTags = [];
          }

          let safeReactions = { likes: 12, insightful: 6, shocked: 1 };
          try {
            if (typeof r.reactions === 'object' && r.reactions !== null) {
              safeReactions = r.reactions;
            } else if (typeof r.reactions === 'string') {
              safeReactions = JSON.parse(r.reactions);
            }
          } catch {
            // Keep default
          }

          return {
            id: r.id,
            slug: r.slug,
            title: r.title,
            kicker: r.kicker || 'NEWS WIRE',
            summary: r.summary,
            content: safeContent,
            category: r.category as any,
            imageUrl: r.image_url || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
            imageCaption: r.image_caption || '',
            author: {
              name: r.author_name || 'US News Bureau',
              role: r.author_role || 'Correspondent',
              avatar: r.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
            },
            publishedAt: formatRelativeTime(r.published_at, r.created_at),
            readTimeMinutes: Number(r.read_time_minutes) || 4,
            isBreaking: Boolean(r.is_breaking),
            isLeadStory: Boolean(r.is_lead_story),
            isHot: Boolean(r.is_hot),
            viewCount: Number(r.view_count) || 1200,
            reactions: safeReactions,
            tags: safeTags,
          };
        });

        // If the database has records, return ONLY the real records from your database!
        return dbArticles;
      }
    } catch (error) {
      console.error('Database query failed, falling back to local dataset:', error);
    }
  }

  // Fallback (only used when database is not configured or completely empty):
  const localScraped = getLocalScrapedArticles();
  if (localScraped.length > 0) {
    return localScraped.map((art) => ({
      ...art,
      publishedAt: formatRelativeTime(art.publishedAt),
    }));
  }

  return ARTICLES_DATA;
}

/**
 * Retrieves a single article by slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const all = await getAllArticles();
  return all.find((a) => a.slug === slug) || null;
}

/**
 * Saves an incoming article to Cloud DB and/or local JSON
 */
export async function saveArticle(
  article: Article,
  guid?: string
): Promise<{ success: boolean; error?: string }> {
  const effectiveGuid = guid || `guid-${article.slug}-${article.id}`;
  const sql = getDbClient();

  // Always save to local JSON backup
  saveLocalScrapedArticle(article);

  if (sql) {
    try {
      await initDatabaseSchema();
      await sql`
        INSERT INTO articles (
          id, slug, guid, title, kicker, summary, content, category,
          image_url, image_caption, author_name, author_role, author_avatar,
          published_at, read_time_minutes, is_breaking, is_lead_story, is_hot,
          view_count, reactions, tags
        ) VALUES (
          ${article.id},
          ${article.slug},
          ${effectiveGuid},
          ${article.title},
          ${article.kicker},
          ${article.summary},
          ${JSON.stringify(article.content)}::jsonb,
          ${article.category},
          ${article.imageUrl},
          ${article.imageCaption || ''},
          ${article.author.name},
          ${article.author.role},
          ${article.author.avatar},
          ${article.publishedAt},
          ${article.readTimeMinutes},
          ${Boolean(article.isBreaking)},
          ${Boolean(article.isLeadStory)},
          ${Boolean(article.isHot)},
          ${article.viewCount},
          ${JSON.stringify(article.reactions)}::jsonb,
          ${JSON.stringify(article.tags)}::jsonb
        )
        ON CONFLICT (slug) DO UPDATE SET
          published_at = CASE 
            WHEN articles.published_at IS NULL OR articles.published_at = 'Just now' OR articles.published_at = 'Just in' 
            THEN EXCLUDED.published_at 
            ELSE articles.published_at 
          END;
      `;
      return { success: true };
    } catch (error: any) {
      console.error('Error inserting article into PostgreSQL:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}
