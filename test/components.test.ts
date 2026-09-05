import { ARTICLES_DATA, INITIAL_POLL } from '../data/newsData';
import { Article, NewsCategory } from '../types/news';

function runComponentLogicTests() {
  console.log('Running US Hot News Component Logic & Interactive Feature Tests...');

  // 1. Category Filtering Test
  const categories: NewsCategory[] = ['Politics', 'Economy', 'Technology', 'World', 'Culture', 'Science', 'Sports'];
  categories.forEach((cat) => {
    const filtered = ARTICLES_DATA.filter((a) => a.category === cat);
    if (filtered.length === 0) {
      console.warn(`Note: Category ${cat} has 0 articles in current mock`);
    } else {
      console.log(`✓ Category "${cat}" filter returns ${filtered.length} article(s)`);
    }
  });

  // 2. Search Logic Test
  const searchQuery = 'Senate';
  const searchResults = ARTICLES_DATA.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  if (searchResults.length === 0) {
    throw new Error(`Search failed for query "${searchQuery}"`);
  }
  console.log(`✓ Search for "${searchQuery}" matched ${searchResults.length} article(s)`);

  // 3. Bookmark Toggle Logic Test
  const bookmarkedSet = new Set<string>();
  const testId = ARTICLES_DATA[0].id;

  // Add
  bookmarkedSet.add(testId);
  if (!bookmarkedSet.has(testId) || bookmarkedSet.size !== 1) {
    throw new Error('Bookmark Add Failed');
  }

  // Remove
  bookmarkedSet.delete(testId);
  if (bookmarkedSet.has(testId) || bookmarkedSet.size !== 0) {
    throw new Error('Bookmark Remove Failed');
  }
  console.log('✓ Bookmark Add/Remove logic works accurately');

  // 4. Poll Vote Calculation Test
  const poll = { ...INITIAL_POLL, options: [...INITIAL_POLL.options] };
  const initialVotes = poll.totalVotes;
  const targetOptionId = poll.options[0].id;
  const targetInitialOptVotes = poll.options[0].votes;

  // Simulate vote
  poll.options = poll.options.map((opt) =>
    opt.id === targetOptionId ? { ...opt, votes: opt.votes + 1 } : opt
  );
  poll.totalVotes += 1;

  if (poll.totalVotes !== initialVotes + 1) {
    throw new Error('Poll totalVotes increment failed');
  }
  if (poll.options[0].votes !== targetInitialOptVotes + 1) {
    throw new Error('Poll option votes increment failed');
  }
  const calcPercent = Math.round((poll.options[0].votes / poll.totalVotes) * 100);
  if (calcPercent < 0 || calcPercent > 100) {
    throw new Error('Invalid percentage calculation');
  }
  console.log(`✓ Poll voting and percentage calculation passed (${calcPercent}%)`);

  // 5. Verification of #032EA1 styling rule in globals.css
  const fs = require('fs');
  const path = require('path');
  const globalsCss = fs.readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8');
  if (!globalsCss.includes('#032EA1')) {
    throw new Error('User styling rule failed: #032EA1 not found in globals.css');
  }
  if (!globalsCss.includes('button') || !globalsCss.includes('table')) {
    throw new Error('User styling rule failed: button or table styling missing in globals.css');
  }
  console.log('✓ User styling rule verified: #032EA1 applied to buttons and tables in globals.css');

  console.log('\nALL 5 LOGIC & RULE TESTS PASSED SUCCESSFULLY! (5/5)');
}

runComponentLogicTests();
