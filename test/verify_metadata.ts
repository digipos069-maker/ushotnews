import { getArticleBySlug } from '../lib/articles';
import { generateMetadata } from '../app/article/[slug]/page';

async function testMetadata() {
  console.log('Testing getArticleBySlug and generateMetadata...');
  const testSlug = 'capitol-hill-ai-regulatory-framework';
  const article = await getArticleBySlug(testSlug);
  
  if (!article) {
    console.error('FAILED: Article not found for slug:', testSlug);
    process.exit(1);
  }
  console.log('Found article:', article.title);

  const testSlug2 = 'how-to-save-money-on-gas-and-big-savings-on-diesel-labor-day-weekend';
  const article2 = await getArticleBySlug(testSlug2);
  if (!article2) {
    console.error('FAILED: Scraped article not found for slug:', testSlug2);
    process.exit(1);
  }
  console.log('Found scraped article:', article2.title);

  const metadata = await generateMetadata({ params: Promise.resolve({ slug: testSlug }) });
  console.log('Generated metadata:');
  console.log('- Title:', metadata.title);
  console.log('- Description:', metadata.description);
  console.log('- Canonical:', metadata.alternates?.canonical);
  console.log('- OG Title:', metadata.openGraph?.title);
  console.log('- OG URL:', metadata.openGraph?.url);
  console.log('- OG Images:', metadata.openGraph && 'images' in metadata.openGraph ? metadata.openGraph.images : null);
  console.log('- Twitter Card:', metadata.twitter && 'card' in metadata.twitter ? metadata.twitter.card : null);

  const ogImages = metadata.openGraph && 'images' in metadata.openGraph ? (metadata.openGraph.images as any[]) : [];
  if (!ogImages || ogImages.length === 0) {
    console.error('FAILED: No Open Graph images generated');
    process.exit(1);
  }

  const firstImage = ogImages[0];
  if (!firstImage.url.startsWith('https://')) {
    console.error('FAILED: Open Graph image URL is not HTTPS:', firstImage.url);
    process.exit(1);
  }

  if (firstImage.width !== 1200 || firstImage.height !== 630) {
    console.error('FAILED: Open Graph image dimensions are not 1200x630:', firstImage);
    process.exit(1);
  }

  console.log('\nSUCCESS: All Facebook Open Graph metadata checks passed!');
}

testMetadata().catch((err) => {
  console.error('Test threw error:', err);
  process.exit(1);
});
