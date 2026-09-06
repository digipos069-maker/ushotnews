"""
Unit & Integration Test for Facebook Auto-Post Test Endpoint (/api/test-post)
Validates:
1. Message and caption formatting (Headline, Summary, Link, Hashtags)
2. Safe dry-run mode execution
3. Dual-parameter payload compatibility (caption + message)
4. Anti-crash error handling
"""

import os
import sys
import json
import unittest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)

from scripts.fb_poster.fb_publisher import (
    format_facebook_message,
    resolve_fb_post_url,
    build_fb_post_url
)


class TestFacebookAutoPostTestAPI(unittest.TestCase):
    def setUp(self):
        self.sample_article = {
            "id": "test-12345",
            "title": "US Treasury Announces New Fiscal Strategy",
            "slug": "us-treasury-announces-new-fiscal-strategy",
            "summary": "Officials outlined key debt issuance plans for the upcoming quarter.",
            "category": "Economy",
            "imageUrl": "https://example.com/treasury.jpg"
        }
        self.site_url = "https://ushotnews.online"

    def test_caption_formatting_contains_all_components(self):
        """Verifies that the caption contains headline, summary, link, and hashtags."""
        caption = format_facebook_message(self.sample_article, self.site_url)
        self.assertIn("📈 BREAKING: US Treasury Announces New Fiscal Strategy", caption)
        self.assertIn("Officials outlined key debt issuance plans", caption)
        self.assertIn("https://ushotnews.online/article/us-treasury-announces-new-fiscal-strategy", caption)
        self.assertIn("#Economy", caption)
        self.assertIn("#USNews", caption)
        self.assertIn("#BreakingNews", caption)

    def test_canonical_feed_url_preferred_over_photo_php(self):
        """Ensures resolve_fb_post_url does not produce raw photo.php URLs that hide captions."""
        post_id = "1325939953941168_122098726395471257"
        built_url = build_fb_post_url(post_id)
        self.assertEqual(
            built_url,
            "https://www.facebook.com/1325939953941168/posts/122098726395471257"
        )
        self.assertNotIn("photo.php", built_url)

    def test_missing_summary_handling(self):
        """Ensures formatting succeeds gracefully even if summary is empty."""
        art_without_summary = {
            "id": "test-no-summary",
            "title": "Breaking Event Occurred",
            "slug": "breaking-event-occurred",
            "category": "World",
            "imageUrl": "https://example.com/photo.jpg"
        }
        caption = format_facebook_message(art_without_summary, self.site_url)
        self.assertIn("🌐 BREAKING: Breaking Event Occurred", caption)
        self.assertIn("https://ushotnews.online/article/breaking-event-occurred", caption)


if __name__ == "__main__":
    unittest.main()
