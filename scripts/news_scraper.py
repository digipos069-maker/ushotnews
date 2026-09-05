#!/usr/bin/env python3
"""
US Hot News - Automated News Scraper & Auto-Publishing Engine
Fetches, deduplicates, classifies, and publishes real-time US news
from CNBC, NPR, Yahoo Finance, and Politico directly to Next.js / PostgreSQL.
"""

import os
import sys
import re
import json
import time
import argparse
import hashlib
from difflib import SequenceMatcher
from datetime import datetime
from typing import Dict, List, Optional, Any
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

# Safe UTF-8 encoding for Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Attempt imports for optional external libraries; fall back to standard library if needed
try:
    import feedparser
    HAS_FEEDPARSER = True
except ImportError:
    HAS_FEEDPARSER = False

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# Configuration & Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
SCRAPED_JSON_PATH = os.path.join(PROJECT_ROOT, "data", "scraped_articles.json")
API_ENDPOINT = os.environ.get("NEXT_API_URL", "http://localhost:3000/api/articles")
ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY", "ushotnews_secret_scraper_key_2026")

# Supported Top US News RSS Feeds
US_NEWS_FEEDS = [
    {
        "source": "CNBC Top News",
        "url": "https://www.cnbc.com/id/100003114/device/rss/rss.html",
        "default_category": "Economy"
    },
    {
        "source": "CNBC Economy",
        "url": "https://www.cnbc.com/id/20910258/device/rss/rss.html",
        "default_category": "Economy"
    },
    {
        "source": "CNBC Tech",
        "url": "https://www.cnbc.com/id/19854910/device/rss/rss.html",
        "default_category": "Technology"
    },
    {
        "source": "NPR National News",
        "url": "https://feeds.npr.org/1001/rss.xml",
        "default_category": "Politics"
    },
    {
        "source": "Yahoo Finance US",
        "url": "https://finance.yahoo.com/news/rssindex",
        "default_category": "Economy"
    },
    {
        "source": "Politico Politics",
        "url": "https://rss.politico.com/politics-news.xml",
        "default_category": "Politics"
    }
]

# Category Classification Keyword Dictionary
CATEGORY_KEYWORDS = {
    "Politics": [
        "senate", "congress", "house", "bill", "vote", "white house", "president",
        "biden", "trump", "supreme court", "justice", "capitol", "election", "bipartisan",
        "democrat", "republican", "gop", "legislation", "lawmaker", "pentagon"
    ],
    "Economy": [
        "fed", "federal reserve", "inflation", "cpi", "interest rate", "gdp", "jobs",
        "unemployment", "treasury", "wall street", "dow", "s&p", "nasdaq", "yield",
        "recession", "bank", "housing", "mortgage", "oil", "consumer spending", "earnings"
    ],
    "Technology": [
        "ai", "artificial intelligence", "chip", "semiconductor", "nvidia", "apple",
        "google", "microsoft", "meta", "software", "cyber", "quantum", "startup",
        "algorithm", "robot", "cloud", "silicon valley", "hardware"
    ],
    "Science": [
        "nasa", "space", "lunar", "orbit", "mars", "artemis", "telescope", "climate",
        "physics", "astronomy", "medical", "biotech", "energy", "renewable", "cancer"
    ],
    "Sports": [
        "nfl", "nba", "mlb", "nhl", "championship", "champion", "champions", "tournament",
        "coach", "playoffs", "quarterback", "super bowl", "baseball", "basketball",
        "olympics", "series", "world series", "manager", "stadium", "athlete"
    ],
    "World": [
        "nato", "united nations", "treaty", "allied", "foreign", "ukraine", "taiwan",
        "china", "europe", "middle east", "ambassador", "diplomacy", "sanctions"
    ],
    "Culture": [
        "broadway", "hollywood", "film", "music", "oscar", "grammy", "museum", "art",
        "festival", "theater", "celebrity", "author", "book"
    ]
}

# High quality fallback editorial imagery by category
CATEGORY_IMAGES = {
    "Politics": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    "Economy": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    "Technology": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "Science": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    "Sports": "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=1200&q=80",
    "World": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    "Culture": "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80"
}


def clean_html_text(raw_text: str) -> str:
    """Removes HTML tags and cleans up whitespace."""
    if not raw_text:
        return ""
    clean = re.sub(r"<[^>]+>", "", raw_text)
    clean = re.sub(r"&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;", " ", clean)
    return " ".join(clean.split()).strip()


def generate_slug(title: str) -> str:
    """Creates a clean, human-readable URL slug."""
    clean_title = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[-\s]+", "-", clean_title).strip("-")
    return slug[:90]


def classify_category(title: str, summary: str, source_default: str = "Politics") -> str:
    """
    Classifies an article into a verified category using keyword frequency scoring.
    """
    combined_text = f"{title} {summary}".lower()
    scores: Dict[str, int] = {cat: 0 for cat in CATEGORY_KEYWORDS}

    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            # Word boundary matching
            matches = len(re.findall(r"\b" + re.escape(kw) + r"\b", combined_text))
            scores[category] += matches

    best_category = max(scores, key=scores.get)
    if scores[best_category] > 0:
        return best_category

    return source_default if source_default in CATEGORY_KEYWORDS else "Politics"


def is_title_similar(title1: str, title2: str, threshold: float = 0.80) -> bool:
    """
    Checks if two titles are semantically identical (Jaccard & SequenceMatcher).
    """
    norm1 = re.sub(r"[^\w\s]", "", title1.lower()).strip()
    norm2 = re.sub(r"[^\w\s]", "", title2.lower()).strip()
    ratio = SequenceMatcher(None, norm1, norm2).ratio()
    return ratio >= threshold


class NewsScraperEngine:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.existing_articles: List[Dict[str, Any]] = self.load_existing_articles()
        self.seen_slugs = {a.get("slug") for a in self.existing_articles if a.get("slug")}
        self.seen_guids = {a.get("guid") for a in self.existing_articles if a.get("guid")}
        self.recent_titles = [a.get("title", "") for a in self.existing_articles[:50]]

    def load_existing_articles(self) -> List[Dict[str, Any]]:
        """Loads articles from local JSON storage."""
        if os.path.exists(SCRAPED_JSON_PATH):
            try:
                with open(SCRAPED_JSON_PATH, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        data = json.loads(content)
                        if isinstance(data, list):
                            return data
            except Exception as e:
                print(f"[WARN] Failed to read {SCRAPED_JSON_PATH}: {e}")
        return []

    def save_to_local_json(self, article: Dict[str, Any]) -> bool:
        """Appends newly scraped article to local JSON store."""
        try:
            self.existing_articles.insert(0, article)
            os.makedirs(os.path.dirname(SCRAPED_JSON_PATH), exist_ok=True)
            with open(SCRAPED_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(self.existing_articles, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"[ERROR] Failed to write local JSON: {e}")
            return False

    def is_duplicate(self, title: str, guid: str, slug: str) -> bool:
        """3-Layer deduplication check."""
        # Layer 1: GUID check
        if guid and guid in self.seen_guids:
            return True

        # Layer 2: Slug check
        if slug in self.seen_slugs:
            return True

        # Layer 3: Fuzzy title similarity check against recent articles
        for recent_title in self.recent_titles:
            if is_title_similar(title, recent_title, threshold=0.80):
                return True

        return False

    def fetch_feed_entries(self, feed_info: Dict[str, str]) -> List[Dict[str, Any]]:
        """Parses an RSS feed safely using feedparser or built-in ElementTree."""
        url = feed_info["url"]
        source_name = feed_info["source"]
        default_category = feed_info.get("default_category", "Politics")
        articles = []

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        }

        try:
            if HAS_FEEDPARSER:
                feed = feedparser.parse(url, request_headers=headers)
                entries = feed.entries
            else:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as response:
                    tree = ET.fromstring(response.read())
                    entries = []
                    for item in tree.findall(".//item"):
                        title = item.findtext("title", "")
                        link = item.findtext("link", "")
                        desc = item.findtext("description", "")
                        guid = item.findtext("guid", link)
                        entries.append({"title": title, "link": link, "description": desc, "id": guid})

            for entry in entries[:8]:  # Top 8 entries per feed
                raw_title = entry.get("title", "")
                raw_summary = entry.get("description", entry.get("summary", ""))
                guid = entry.get("id", entry.get("link", ""))

                title = clean_html_text(raw_title)
                summary = clean_html_text(raw_summary)

                if not title or len(title) < 15:
                    continue

                slug = generate_slug(title)

                # Check duplicate
                if self.is_duplicate(title, guid, slug):
                    continue

                # Category classification
                category = classify_category(title, summary, default_category)

                # Build article payload
                article_id = f"scraped-{hashlib.md5(title.encode('utf-8')).hexdigest()[:10]}"
                read_time = max(2, min(8, len(summary.split()) // 40 + 3))

                # Image extraction or category fallback
                image_url = CATEGORY_IMAGES.get(category, CATEGORY_IMAGES["Politics"])
                if hasattr(entry, "media_content") and entry.media_content:
                    image_url = entry.media_content[0].get("url", image_url)
                elif hasattr(entry, "enclosures") and entry.enclosures:
                    image_url = entry.enclosures[0].get("href", image_url)

                content_paragraphs = [
                    summary if summary else f"WASHINGTON — In a developing report from the {category} desk, officials and industry leaders addressed the latest developments.",
                    f"Market analysts and regional observers note that the announcement carries significant implications for domestic policy, consumer sentiment, and ongoing economic projections.",
                    f"Additional reporting and official statements will be incorporated as further briefings are scheduled from the {source_name} newsroom."
                ]

                article = {
                    "id": article_id,
                    "slug": slug,
                    "guid": guid,
                    "title": title,
                    "kicker": f"{source_name.upper()} EXCLUSIVE",
                    "summary": summary if summary else title,
                    "content": content_paragraphs,
                    "category": category,
                    "imageUrl": image_url,
                    "imageCaption": f"{title[:60]}... Reported by {source_name}.",
                    "author": {
                        "name": f"{source_name} Wire",
                        "role": "National Correspondent",
                        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
                    },
                    "publishedAt": "Just now",
                    "readTimeMinutes": read_time,
                    "isBreaking": True if len(articles) == 0 else False,
                    "isLeadStory": False,
                    "isHot": True,
                    "viewCount": 850,
                    "reactions": {"likes": 18, "insightful": 9, "shocked": 2},
                    "tags": [category, source_name.replace(" ", ""), "USNews"]
                }

                articles.append(article)
                # Register in local cache to prevent duplicates within this batch
                self.seen_slugs.add(slug)
                if guid:
                    self.seen_guids.add(guid)
                self.recent_titles.insert(0, title)

        except Exception as e:
            print(f"[WARN] Error fetching feed {source_name} ({url}): {e}")

        return articles

    def publish_article(self, article: Dict[str, Any]) -> bool:
        """Publishes article via Next.js API route or falls back to local JSON store."""
        if self.dry_run:
            print(f"[DRY RUN] Would publish: [{article['category']}] {article['title']}")
            return True

        published_via_api = False

        # Attempt API POST if server is reachable
        try:
            data_bytes = json.dumps(article).encode("utf-8")
            req = urllib.request.Request(
                API_ENDPOINT,
                data=data_bytes,
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": ADMIN_API_KEY
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status in (200, 201):
                    published_via_api = True
        except Exception:
            # API endpoint may not be active if Next dev server is not running
            pass

        # Always persist to local JSON store as backup
        saved_locally = self.save_to_local_json(article)

        if published_via_api:
            print(f"[OK: API]   [{article['category']}] {article['title'][:65]}...")
        elif saved_locally:
            print(f"[OK: LOCAL] [{article['category']}] {article['title'][:65]}...")

        return published_via_api or saved_locally

    def run_cycle(self) -> int:
        """Runs a complete scraping cycle across all feeds."""
        print(f"\n=======================================================")
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting US Hot News Scraping Cycle")
        print(f"=======================================================")

        total_scraped = 0
        for feed in US_NEWS_FEEDS:
            entries = self.fetch_feed_entries(feed)
            for article in entries:
                if self.publish_article(article):
                    total_scraped += 1

        print(f"Finished cycle. Total new articles ingested: {total_scraped}\n")
        return total_scraped


def main():
    parser = argparse.ArgumentParser(description="US Hot News Scraper & Publisher")
    parser.add_argument("--run-once", action="store_true", help="Run once and exit")
    parser.add_argument("--interval", type=int, default=15, help="Interval in minutes between runs (default: 15)")
    parser.add_argument("--dry-run", action="store_true", help="Parse and classify without saving")

    args = parser.parse_args()
    engine = NewsScraperEngine(dry_run=args.dry_run)

    if args.run_once:
        engine.run_cycle()
        sys.exit(0)

    print(f"Starting US Hot News Scraper Daemon (Interval: {args.interval} minutes)...")
    while True:
        try:
            engine.run_cycle()
            time.sleep(args.interval * 60)
        except KeyboardInterrupt:
            print("\nScraper stopped by user.")
            break
        except Exception as e:
            print(f"[ERROR] Cycle encountered error: {e}")
            time.sleep(60)


if __name__ == "__main__":
    main()
