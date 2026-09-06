#!/usr/bin/env python3
"""
Unit and integration tests for US HOT NEWS Facebook Auto-Publisher
Stored in test/ directory per project conventions.
"""

import os
import sys
import json
import unittest

# Add project root to sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
sys.path.insert(0, PROJECT_ROOT)
from datetime import datetime, timezone, timedelta

from scripts.fb_poster.fb_publisher import (
    load_posted_history,
    save_posted_history,
    cleanup_old_posted_history,
    format_facebook_message,
    post_native_photo_to_facebook,
    post_clickable_link_to_facebook,
    run_publisher
)

class TestFacebookPublisher(unittest.TestCase):

    def setUp(self):
        self.test_history_file = os.path.join(PROJECT_ROOT, "test", "temp_test_history.json")
        if os.path.exists(self.test_history_file):
            os.remove(self.test_history_file)

    def tearDown(self):
        if os.path.exists(self.test_history_file):
            os.remove(self.test_history_file)

    def test_history_load_and_save(self):
        """Verify history file creation, saving, and deduplication map loading."""
        initial = load_posted_history(self.test_history_file)
        self.assertIn("articles", initial)
        self.assertEqual(len(initial["articles"]), 0)

        initial["articles"]["test-slug-123"] = {
            "title": "Test Title",
            "url": "https://ushotnews.online/article/test-slug-123",
            "posted_at": "2026-09-06T10:00:00Z"
        }
        saved = save_posted_history(initial, self.test_history_file)
        self.assertTrue(saved)

        reloaded = load_posted_history(self.test_history_file)
        self.assertIn("test-slug-123", reloaded["articles"])
        self.assertEqual(reloaded["posted_count"], 1)

    def test_format_facebook_message(self):
        """Verify Facebook message formatting contains headline, link, and hashtags."""
        sample_article = {
            "title": "Federal Reserve Holds Interest Rates Steady",
            "summary": "Central bank signals potential cut later this year.",
            "category": "Economy",
            "slug": "fed-holds-interest-rates-steady"
        }
        msg = format_facebook_message(sample_article, "https://ushotnews.online")
        
        self.assertIn("Federal Reserve Holds Interest Rates Steady", msg)
        self.assertIn("https://ushotnews.online/article/fed-holds-interest-rates-steady", msg)
        self.assertIn("#Economy", msg)
        self.assertIn("#USHotNews", msg)

    def test_cleanup_old_posted_history(self):
        """Verify articles older than max_age_days (3 days) are cleared while newer ones are kept."""
        now = datetime.now(timezone.utc)
        history = {
            "articles": {
                "old-article-1": {
                    "title": "Old News 4 Days Ago",
                    "posted_at": (now - timedelta(days=4)).isoformat()
                },
                "old-article-2": {
                    "title": "Old News 5 Days Ago",
                    "posted_at": (now - timedelta(days=5)).isoformat()
                },
                "recent-article-1": {
                    "title": "Recent News 1 Day Ago",
                    "posted_at": (now - timedelta(days=1)).isoformat()
                },
                "brand-new-article": {
                    "title": "Fresh News 2 Hours Ago",
                    "posted_at": (now - timedelta(hours=2)).isoformat()
                }
            }
        }

        cleaned_history, pruned = cleanup_old_posted_history(history, max_age_days=3)
        self.assertEqual(pruned, 2)
        self.assertEqual(cleaned_history["posted_count"], 2)
        self.assertNotIn("old-article-1", cleaned_history["articles"])
        self.assertNotIn("old-article-2", cleaned_history["articles"])
        self.assertIn("recent-article-1", cleaned_history["articles"])
        self.assertIn("brand-new-article", cleaned_history["articles"])
        self.assertIn("last_cleaned_at", cleaned_history)

    def test_dry_run_execution(self):
        """Verify publisher runs in dry-run mode without credentials across different format options."""
        # Test default random format
        exit_code_random = run_publisher(
            site_url="https://ushotnews.online",
            max_posts_per_run=1,
            post_format="random",
            dry_run=True
        )
        self.assertEqual(exit_code_random, 0)

        # Test explicit photo format
        exit_code_photo = run_publisher(
            site_url="https://ushotnews.online",
            max_posts_per_run=1,
            post_format="photo",
            dry_run=True
        )
        self.assertEqual(exit_code_photo, 0)

        # Test explicit link_card format
        exit_code_link = run_publisher(
            site_url="https://ushotnews.online",
            max_posts_per_run=1,
            post_format="link_card",
            dry_run=True
        )
        self.assertEqual(exit_code_link, 0)

if __name__ == "__main__":
    unittest.main()
