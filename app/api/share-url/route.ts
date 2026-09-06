import { NextResponse } from 'next/server';
import { getSharedPosts } from '@/lib/shareHistory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Returns all published Facebook posts with their links, titles, and timestamps.
 */
export async function GET() {
  try {
    const posts = getSharedPosts();
    return NextResponse.json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error while retrieving shared posts',
      },
      { status: 500 }
    );
  }
}
