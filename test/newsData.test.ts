import { ARTICLES_DATA, MARKET_DATA, FACT_CHECK_DATA, OPINION_DATA, INITIAL_POLL } from '../data/newsData';

function runTests() {
  console.log('Running US Hot News Data Integrity Tests...');

  // Test 1: Articles count and lead story
  if (!ARTICLES_DATA || ARTICLES_DATA.length === 0) {
    throw new Error('Test Failed: ARTICLES_DATA is empty');
  }
  const leadStory = ARTICLES_DATA.find(a => a.isLeadStory);
  if (!leadStory) {
    throw new Error('Test Failed: No lead story specified');
  }
  console.log(`✓ Lead story verified: "${leadStory.title.substring(0, 40)}..."`);

  // Test 2: Required article fields
  ARTICLES_DATA.forEach((article, idx) => {
    if (!article.id || !article.title || !article.summary || !article.content.length) {
      throw new Error(`Test Failed: Article at index ${idx} missing required fields`);
    }
    if (!article.imageUrl.startsWith('https://')) {
      throw new Error(`Test Failed: Article ${article.id} has invalid imageUrl`);
    }
  });
  console.log(`✓ All ${ARTICLES_DATA.length} articles have required fields and valid image URLs`);

  // Test 3: Market Data check
  if (!MARKET_DATA || MARKET_DATA.length < 4) {
    throw new Error('Test Failed: Insufficient market data items');
  }
  console.log(`✓ Market data contains ${MARKET_DATA.length} US index indicators`);

  // Test 4: Fact Check Desk
  if (!FACT_CHECK_DATA || FACT_CHECK_DATA.length === 0) {
    throw new Error('Test Failed: Fact check data empty');
  }
  console.log(`✓ Fact check desk contains ${FACT_CHECK_DATA.length} verified claims`);

  // Test 5: Poll question
  if (!INITIAL_POLL || INITIAL_POLL.options.length < 2) {
    throw new Error('Test Failed: Initial poll needs at least 2 options');
  }
  console.log(`✓ Initial poll "${INITIAL_POLL.question.substring(0, 35)}..." has ${INITIAL_POLL.options.length} options`);

  console.log('\nALL TESTS PASSED SUCCESSFULLY! (5/5)');
}

runTests();
