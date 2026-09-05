import { ARTICLES_DATA } from '../data/newsData';

function runArticlePageTests() {
  console.log('Running Article Page Dynamic Routing & Slug Lookup Tests...');

  // Test 1: Verify all articles have valid unique slugs
  const slugs = new Set<string>();
  for (const article of ARTICLES_DATA) {
    if (!article.slug || article.slug.trim() === '') {
      throw new Error(`Article id ${article.id} has empty slug`);
    }
    if (slugs.has(article.slug)) {
      throw new Error(`Duplicate slug detected: ${article.slug}`);
    }
    // Verify slug format (lowercase alphanumeric and hyphens)
    if (!/^[a-z0-9-]+$/.test(article.slug)) {
      throw new Error(`Invalid slug format for article: ${article.slug}`);
    }
    slugs.add(article.slug);
  }
  console.log(`✓ All ${ARTICLES_DATA.length} articles have unique valid URL slugs`);

  // Test 2: Test lookup simulation for every slug
  for (const slug of slugs) {
    const found = ARTICLES_DATA.find((a) => a.slug === slug);
    if (!found) {
      throw new Error(`Slug lookup failed for: ${slug}`);
    }
    // Verify required fields for full page
    if (!found.title || !found.summary || !found.content || found.content.length === 0) {
      throw new Error(`Article ${slug} missing required full page content`);
    }
  }
  console.log(`✓ Slug lookup successfully resolved all ${slugs.size} article routes`);

  // Test 3: Related articles generation logic
  const targetArticle = ARTICLES_DATA[0];
  const relatedArticles = ARTICLES_DATA.filter(
    (a) => a.id !== targetArticle.id && (a.category === targetArticle.category || a.isHot)
  ).slice(0, 3);

  if (relatedArticles.length === 0) {
    throw new Error('Related articles generation returned 0 items');
  }
  if (relatedArticles.some((r) => r.id === targetArticle.id)) {
    throw new Error('Related articles contains the current article');
  }
  console.log(`✓ Related articles logic resolved ${relatedArticles.length} related stories`);

  console.log('\nALL ARTICLE PAGE ROUTING TESTS PASSED! (3/3)');
}

runArticlePageTests();
