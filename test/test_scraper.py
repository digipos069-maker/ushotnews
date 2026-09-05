#!/usr/bin/env python3
"""
Unit tests for the US Hot News Python Scraper & Deduplication Engine.
Stored in test/ directory per project requirements.
"""

import sys
import os

# Safe UTF-8 encoding for Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add scripts directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from news_scraper import (
    clean_html_text,
    generate_slug,
    classify_category,
    is_title_similar,
    NewsScraperEngine
)

def run_scraper_tests():
    print("Running Python News Scraper & Deduplication Engine Tests...")

    # Test 1: HTML Text Cleaning
    raw = "<p>WASHINGTON &amp; NEW YORK &mdash; Inflation data shows <b>cooling</b> prices.</p>"
    cleaned = clean_html_text(raw)
    assert "<" not in cleaned and ">" not in cleaned, "HTML tag stripping failed"
    assert "Inflation data shows cooling prices" in cleaned, "Clean text content mismatch"
    print("[PASS] Test 1: HTML text cleaning and entity decoding")

    # Test 2: Slug Generation
    title = "Senate Passes $1.2 Trillion Bipartisan Infrastructure Bill!"
    slug = generate_slug(title)
    assert slug == "senate-passes-12-trillion-bipartisan-infrastructure-bill", f"Unexpected slug: {slug}"
    print(f"[PASS] Test 2: Slug generation verified ('{slug}')")

    # Test 3: Category Classification Engine
    test_cases = [
        ("Federal Reserve signals benchmark interest rate cut as CPI inflation cools", "Economy"),
        ("Nvidia and tech giants unveil next-generation artificial intelligence chip architecture", "Technology"),
        ("Supreme Court agrees to hear presidential immunity appeal", "Politics"),
        ("NASA spacecraft successfully establishes laser telemetry downlink from lunar orbit", "Science"),
        ("World Series champion manager agrees to 5-year extension", "Sports"),
        ("NATO allies launch coordinated maritime freedom of navigation patrol", "World")
    ]
    for headline, expected_cat in test_cases:
        detected = classify_category(headline, headline)
        assert detected == expected_cat, f"Category mismatch for '{headline}': got '{detected}', expected '{expected_cat}'"
        print(f"  * Classified: '{headline[:45]}...' -> {detected}")
    print("[PASS] Test 3: Category classification engine accuracy (6/6)")

    # Test 4: Semantic Title Similarity Deduplication
    t1 = "Senate votes 68-32 to pass landmark AI regulatory framework"
    t2 = "Senate votes 68 to 32 to pass landmark AI regulatory framework"
    t3 = "Wall Street rallies as Treasury yields drop to 3-month lows"

    assert is_title_similar(t1, t2, threshold=0.80) is True, "Similar titles failed duplicate detection"
    assert is_title_similar(t1, t3, threshold=0.80) is False, "Different titles incorrectly marked as duplicate"
    print("[PASS] Test 4: 3-Layer Title Similarity Deduplication")

    # Test 5: Scraper Engine Dry-Run
    engine = NewsScraperEngine(dry_run=True)
    sample_article = {
        "id": "test-101",
        "slug": "test-sample-headline",
        "title": "Test Sample Headline",
        "category": "Economy"
    }
    published = engine.publish_article(sample_article)
    assert published is True, "Dry-run publishing failed"
    print("[PASS] Test 5: Scraper Engine execution and dry-run dispatch")

    print("\nALL 5 PYTHON SCRAPER TESTS PASSED SUCCESSFULLY! (5/5)")

if __name__ == "__main__":
    run_scraper_tests()
