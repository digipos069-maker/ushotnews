import { getAllArticles, getArticleBySlug, saveArticle } from '../lib/articles';
import { Article } from '../types/news';

async function runDbIntegrationTests() {
  console.log('Running Database Integration & Article Storage Tests...');

  // Test 1: Fetch all articles (fallback or DB)
  const articles = await getAllArticles();
  if (!articles || articles.length === 0) {
    throw new Error('Test Failed: getAllArticles returned empty array');
  }
  console.log(`✓ getAllArticles loaded ${articles.length} articles successfully`);

  // Test 2: Fetch by slug
  const firstArticle = articles[0];
  const fetched = await getArticleBySlug(firstArticle.slug);
  if (!fetched || fetched.slug !== firstArticle.slug) {
    throw new Error(`Test Failed: getArticleBySlug failed for ${firstArticle.slug}`);
  }
  console.log(`✓ getArticleBySlug accurately resolved "${fetched.slug}"`);

  // Test 3: Save article (deduplication & persistence test)
  const testArticle: Article = {
    id: `test-persist-${Date.now()}`,
    slug: `test-breaking-us-economic-growth-${Date.now()}`,
    title: 'Test Breaking US Economic Growth Report',
    kicker: 'TEST WIRE',
    summary: 'A test economic indicator report verifying persistence pipeline.',
    content: ['Paragraph 1 of test report.', 'Paragraph 2 of test report.'],
    category: 'Economy',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Photo Caption Test',
    author: {
      name: 'Test Reporter',
      role: 'Staff Writer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
    },
    publishedAt: 'Just now',
    readTimeMinutes: 3,
    viewCount: 150,
    reactions: { likes: 5, insightful: 2, shocked: 0 },
    tags: ['Economy', 'Test']
  };

  const saveResult = await saveArticle(testArticle);
  if (!saveResult.success) {
    throw new Error(`Test Failed: saveArticle failed: ${saveResult.error}`);
  }
  console.log(`✓ saveArticle persisted new article "${testArticle.slug}"`);

  // Test 4: Verify the newly saved article is retrievable
  const reloaded = await getArticleBySlug(testArticle.slug);
  if (!reloaded) {
    throw new Error('Test Failed: Newly saved article could not be retrieved');
  }
  console.log(`✓ Verified persistence: Retrieved saved article "${reloaded.title}"`);

  console.log('\nALL 4 DATABASE INTEGRATION TESTS PASSED! (4/4)');
}

runDbIntegrationTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
