#!/usr/bin/env python3
"""
Unit and integration tests for US HOT NEWS Top Trending Facebook Video Auto-Publisher.
"""

import os
import sys
import json
import unittest
from datetime import datetime, timezone, timedelta

# Add project root to sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
sys.path.insert(0, PROJECT_ROOT)

from scripts.fb_poster.fb_video_publisher import (
    build_fb_video_url,
    verify_facebook_token,
    resolve_page_credentials,
    load_video_history,
    save_video_history,
    cleanup_old_video_history,
    calculate_trending_score,
    format_facebook_video_caption,
    format_first_comment_with_website_link,
    get_latest_website_article,
    post_comment_to_facebook_post,
    wait_for_video_ready,
    run_video_publisher
)

class TestFacebookVideoPublisher(unittest.TestCase):

    def setUp(self):
        self.test_history_file = os.path.join(PROJECT_ROOT, "test", "temp_video_history.json")
        if os.path.exists(self.test_history_file):
            os.remove(self.test_history_file)

    def tearDown(self):
        if os.path.exists(self.test_history_file):
            os.remove(self.test_history_file)

    def test_trending_score_calculation(self):
        """Verify trending score prioritizes matching keywords and high-impact categories."""
        trending_terms = {"trump", "election", "fed", "nvidia"}

        hot_video = {
            "title": "Trump and Fed Officials React to Market Shifts",
            "summary": "Key economic developments unfolded in Washington today.",
            "category": "Politics"
        }

        low_video = {
            "title": "Local Garden Club Holds Annual Spring Plant Exchange",
            "summary": "Members exchanged tomato seedlings.",
            "category": "Lifestyle"
        }

        hot_score = calculate_trending_score(hot_video, trending_terms)
        low_score = calculate_trending_score(low_video, trending_terms)

        self.assertGreater(hot_score, 45.0)
        self.assertLess(low_score, 35.0)
        self.assertGreater(hot_score, low_score)

    def test_format_facebook_video_caption(self):
        """Verify video caption contains headline, summary, first comment pointer, hashtags, and no URL or BREAKING."""
        sample_video = {
            "title": "Nvidia Unveils Next-Gen AI Chip Architecture at Tech Summit",
            "summary": "The chipmaker unveiled major performance leaps during the annual keynote.",
            "category": "Technology"
        }
        caption = format_facebook_video_caption(sample_video)

        self.assertIn("🤖 Nvidia Unveils Next-Gen AI Chip Architecture at Tech Summit", caption)
        self.assertNotIn("BREAKING", caption)
        self.assertNotIn("https://", caption)
        self.assertNotIn("http://", caption)
        self.assertIn("👇 Read the full story & latest updates in the first comment!", caption)
        self.assertIn("#Technology", caption)
        self.assertIn("#TrendingNews", caption)
        self.assertIn("#USHotNews", caption)

    def test_format_first_comment_with_website_link(self):
        """Verify first comment contains direct link to the latest published news story on website."""
        site_article = {
            "title": "Federal Reserve Holds Interest Rates Steady",
            "slug": "fed-holds-interest-rates-steady",
            "url": "https://ushotnews.online/article/fed-holds-interest-rates-steady"
        }
        comment = format_first_comment_with_website_link(site_article)
        self.assertEqual(
            comment,
            "👉 Read the full verified report & latest US news updates at US HOT NEWS:\nhttps://ushotnews.online/article/fed-holds-interest-rates-steady"
        )

    def test_build_fb_video_url(self):
        """Verify canonical Facebook video URLs are constructed properly."""
        url1 = build_fb_video_url("1234567890", page_id="1325939953941168")
        self.assertEqual(url1, "https://www.facebook.com/1325939953941168/videos/1234567890")

        url2 = build_fb_video_url("99887766")
        self.assertEqual(url2, "https://www.facebook.com/watch/?v=99887766")

    def test_video_history_crud_and_cleanup(self):
        """Verify video history file creation, saving, and age pruning."""
        now = datetime.now(timezone.utc)
        history = {
            "articles": {
                "old-video": {
                    "title": "Old News 5 Days Ago",
                    "posted_at": (now - timedelta(days=5)).isoformat()
                },
                "fresh-video": {
                    "title": "Fresh Trending News",
                    "posted_at": (now - timedelta(hours=3)).isoformat()
                }
            }
        }
        save_video_history(history, self.test_history_file)
        loaded = load_video_history(self.test_history_file)
        self.assertIn("old-video", loaded["articles"])
        self.assertIn("fresh-video", loaded["articles"])

        cleaned, pruned = cleanup_old_video_history(loaded, max_age_days=3)
        self.assertEqual(pruned, 1)
        self.assertNotIn("old-video", cleaned["articles"])
        self.assertIn("fresh-video", cleaned["articles"])

    def test_verify_facebook_token_fallback(self):
        """Verify fallback behavior when network or offline."""
        pid = verify_facebook_token("1325939953941168", "EAABxxxxxxx")
        self.assertTrue(pid)

    def test_resolve_page_credentials_fallback(self):
        """Verify resolve page credentials returns tuple."""
        pid, token = resolve_page_credentials("1325939953941168", "EAABxxxxxxx")
        self.assertEqual(pid, "1325939953941168")
        self.assertEqual(token, "EAABxxxxxxx")

    def test_post_comment_validation(self):
        """Verify comment function handles missing or invalid arguments safely."""
        res = post_comment_to_facebook_post("", "", "", wait_ready=False)
        self.assertFalse(res.get("success"))
        self.assertIn("Missing", res.get("error"))

    def test_dry_run_execution(self):
        """Verify video publisher runs smoothly in dry-run mode."""
        exit_code = run_video_publisher(
            site_url="https://ushotnews.online",
            max_posts_per_run=1,
            dry_run=True
        )
        self.assertEqual(exit_code, 0)

if __name__ == "__main__":
    unittest.main()
