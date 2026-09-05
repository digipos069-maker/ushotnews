import { Pool, neon } from '@neondatabase/serverless';
import { Article } from '@/types/news';

const databaseUrl = process.env.DATABASE_URL;

/**
 * Returns a Neon SQL execution client if DATABASE_URL is configured.
 */
export function getDbClient() {
  if (!databaseUrl || databaseUrl.trim() === '') {
    return null;
  }
  return neon(databaseUrl);
}

/**
 * Ensures the PostgreSQL schema is initialized with proper indexes and unique constraints.
 */
export async function initDatabaseSchema() {
  const sql = getDbClient();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        guid VARCHAR(500) UNIQUE NOT NULL,
        title TEXT NOT NULL,
        kicker VARCHAR(100),
        summary TEXT NOT NULL,
        content JSONB NOT NULL DEFAULT '[]'::jsonb,
        category VARCHAR(50) NOT NULL,
        image_url TEXT,
        image_caption TEXT,
        author_name VARCHAR(100) DEFAULT 'US News Desk',
        author_role VARCHAR(100) DEFAULT 'Staff Reporter',
        author_avatar TEXT,
        published_at VARCHAR(100),
        read_time_minutes INTEGER DEFAULT 4,
        is_breaking BOOLEAN DEFAULT FALSE,
        is_lead_story BOOLEAN DEFAULT FALSE,
        is_hot BOOLEAN DEFAULT FALSE,
        view_count INTEGER DEFAULT 1200,
        reactions JSONB DEFAULT '{"likes": 0, "insightful": 0, "shocked": 0}'::jsonb,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create index on category and published date for high-speed queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
    `;

    return true;
  } catch (error) {
    console.error('Error initializing PostgreSQL schema:', error);
    return false;
  }
}
