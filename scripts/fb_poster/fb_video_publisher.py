#!/usr/bin/env python3
"""
US HOT NEWS - Top Trending US Real Video Auto-Publisher
1. Researches and finds real-time Top Trending US News Videos directly from web video feeds (CBS, CNN, Fox, NBC, Google Trends, YouTube).
2. Downloads the actual video file (.mp4).
3. Posts the video directly to Facebook Page (standalone Facebook Video).
4. Picks up the latest published news story URL from the US HOT NEWS website and posts it as the First Comment.
"""

import os
import sys
import re
import json
import time
import shutil
import tempfile
import argparse
import logging
import subprocess
import email.utils
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional, Set, Tuple

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    import feedparser
    HAS_FEEDPARSER = True
except ImportError:
    HAS_FEEDPARSER = False

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("FB_Video_Publisher")

# Defaults and Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
VIDEO_HISTORY_FILE = os.path.join(PROJECT_ROOT, "data", "fb_video_posted_history.json")
LOCAL_SCRAPED_FILE = os.path.join(PROJECT_ROOT, "data", "scraped_articles.json")

DEFAULT_SITE_URL = os.environ.get("NEXT_PUBLIC_SITE_URL", "https://ushotnews.online")
DEFAULT_API_URL = os.environ.get("NEXT_API_URL", f"{DEFAULT_SITE_URL}/api/articles")
FB_GRAPH_VERSION = os.environ.get("FB_GRAPH_VERSION", "v21.0")
MAX_VIDEO_BYTES = 75 * 1024 * 1024  # 75 MB max limit for single-request Facebook video uploads

GOOGLE_TRENDS_US_RSS = "https://trends.google.com/trending/rss?geo=US"
GOOGLE_NEWS_TOP_US_RSS = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"

# Top Live US News Video & Media Feeds (Prioritizing US Politics, White House, Congress, Economy & National News)
US_VIDEO_FEEDS = [
    # Top US News YouTube Feeds (Instant updates, verified US journalism)
    {
        "source": "AP (Associated Press) US News",
        "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC52X5wxOL_EZ56xnRx4P0IA",
        "category": "Politics"
    },
    {
        "source": "PBS NewsHour Daily Segments",
        "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC6ZFN9Tx6xh-skXCuRHCDpQ",
        "category": "Politics"
    },
    {
        "source": "NBC News US",
        "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCeY0bbntWzzVIaj2z3QigXg",
        "category": "Politics"
    },
    {
        "source": "ABC News US",
        "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCBi2mrWuNuyYy4gbM6fU18Q",
        "category": "Politics"
    },
    {
        "source": "CBS News US",
        "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC8p1vwvWtl6T73JiExfWs1g",
        "category": "Politics"
    },
    {
        "source": "C-SPAN US Politics & Congress",
        "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCb--64Gl51jIEVE-GLDAVTg",
        "category": "Politics"
    },
    {
        "source": "Fox News US",
        "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCXIJgqnII2ZOINSWNOGFThA",
        "category": "Politics"
    },
    {
        "source": "Reuters US News",
        "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UChqUTb7kYRX8-EiaN3XFrSQ",
        "category": "Economy"
    },
    # Direct Media Feeds
    {
        "source": "CBS News Video RSS",
        "url": "https://www.cbsnews.com/latest/rss/video",
        "category": "Politics"
    },
    {
        "source": "Fox News Media RSS",
        "url": "https://moxie.foxnews.com/google-publisher/video.xml",
        "category": "Politics"
    },
    {
        "source": "NBC News Video RSS",
        "url": "https://feeds.nbcnews.com/nbcnews/public/video",
        "category": "Politics"
    },
    {
        "source": "Yahoo News Video RSS",
        "url": "https://www.yahoo.com/news/rss/videos",
        "category": "Politics"
    }
]

# Keywords that indicate space/astronomy is genuinely trending in the US
SPACE_TRENDING_KEYWORDS = {
    "nasa", "spacex", "artemis", "moon", "mars", "rocket", "launch",
    "astronaut", "satellite", "orbit", "telescope", "space station",
    "iss", "starship", "falcon"
}


def parse_date_to_datetime(date_str: Optional[Any]) -> Optional[datetime]:
    """Parses various date strings (ISO, RFC 2822, etc.) into UTC datetime."""
    if not date_str:
        return None
    if isinstance(date_str, datetime):
        return date_str if date_str.tzinfo else date_str.replace(tzinfo=timezone.utc)

    raw = str(date_str).strip()
    # Try ISO formats (e.g. 2026-09-07T04:12:00Z or 2026-09-07T04:12:00+00:00)
    try:
        clean = raw.replace("Z", "+00:00")
        return datetime.fromisoformat(clean)
    except Exception:
        pass

    # Try RFC 2822 / 822 format (standard RSS: "Mon, 07 Sep 2026 04:13:00 GMT")
    try:
        dt = email.utils.parsedate_to_datetime(raw)
        return dt.astimezone(timezone.utc)
    except Exception:
        pass

    return None


def is_within_max_age(dt: Optional[datetime], max_hours: int = 48) -> bool:
    """Checks if datetime is within the last max_hours (strict freshness filter)."""
    if not dt:
        return False
    now = datetime.now(timezone.utc)
    age_seconds = (now - dt).total_seconds()
    return 0 <= age_seconds <= (max_hours * 3600)


def is_space_trending_in_us(trending_signals: Optional[Set[str]]) -> bool:
    """Checks if any space/astronomy terms are actively trending in US Google Trends."""
    if not trending_signals:
        return False
    signals_lower = {s.lower() for s in trending_signals}
    for kw in SPACE_TRENDING_KEYWORDS:
        if kw in signals_lower:
            return True
        for sig in signals_lower:
            if kw in sig:
                return True
    return False


def build_fb_video_url(video_id: str, page_id: Optional[str] = None) -> str:
    """Constructs the canonical Facebook video URL."""
    if not video_id:
        return ""
    v_id = str(video_id).strip()
    if "_" in v_id:
        p_id, s_id = v_id.split("_", 1)
        return f"https://www.facebook.com/{p_id}/videos/{s_id}"
    elif page_id and str(page_id).strip() != "me":
        return f"https://www.facebook.com/{str(page_id).strip()}/videos/{v_id}"
    return f"https://www.facebook.com/watch/?v={v_id}"


def verify_facebook_token(page_id: str, access_token: str, graph_version: str = FB_GRAPH_VERSION) -> str:
    """
    Validates the Facebook access token before attempting video upload.
    Returns the connected identity ID.
    """
    if not HAS_REQUESTS:
        return page_id

    try:
        masked_token = access_token[:8] + "..." + access_token[-4:] if len(access_token) > 15 else "***"
        logger.info(f"Checking credentials (Target Page ID: {page_id}, Token: {masked_token}, Length: {len(access_token)})")

        url = f"https://graph.facebook.com/{graph_version}/me?fields=id,name&access_token={access_token}"
        resp = requests.get(url, timeout=15)
        data = resp.json()

        if resp.status_code == 200 and "id" in data:
            token_id = str(data.get("id"))
            token_name = data.get("name")
            logger.info(f"✅ Token Verified! Connected Identity: '{token_name}' (ID: {token_id})")
            check_token_permissions(access_token, graph_version)
            if token_id == str(page_id):
                logger.info(f"✅ Token belongs directly to Page '{token_name}'!")
            else:
                logger.info(f"ℹ️ Connected identity is '{token_name}' (ID: {token_id}). Exchanging for Page Access Token...")
            return token_id
        else:
            err = data.get("error", {})
            logger.warning(f"⚠️ Pre-check Notice ({resp.status_code}): {err.get('message')}")
    except Exception as e:
        logger.warning(f"Could not connect to Facebook pre-check endpoint: {e}")

    return page_id or "me"


def check_token_permissions(access_token: str, graph_version: str = FB_GRAPH_VERSION) -> Set[str]:
    """Checks granted permissions on the Facebook access token."""
    granted: Set[str] = set()
    if not HAS_REQUESTS or not access_token:
        return granted
    try:
        url = f"https://graph.facebook.com/{graph_version}/me/permissions?access_token={access_token}"
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            for p in data.get("data", []):
                if p.get("status") == "granted":
                    granted.add(p.get("permission"))
            logger.info(f"🔑 Token Granted Permissions: {', '.join(sorted(granted)) if granted else 'None'}")
            if "pages_manage_engagement" not in granted:
                logger.warning(
                    "⚠️ Notice: 'pages_manage_engagement' permission is NOT granted on this token.\n"
                    "   (Meta requires 'pages_manage_engagement' to post comments. If missing, the publisher\n"
                    "   will automatically place the website link directly into the video caption)."
                )
    except Exception as e:
        logger.debug(f"Permission check notice: {e}")
    return granted


def resolve_page_credentials(page_id: str, access_token: str, graph_version: str = FB_GRAPH_VERSION) -> tuple:
    """
    If the user passed a User Access Token (personal account), queries /me/accounts
    to automatically exchange it for the official Page Access Token and Page ID.
    """
    if not HAS_REQUESTS:
        return page_id, access_token

    try:
        url = f"https://graph.facebook.com/{graph_version}/me/accounts?fields=id,name,access_token&access_token={access_token}"
        resp = requests.get(url, timeout=15)
        data = resp.json()

        if resp.status_code == 200 and "data" in data and len(data["data"]) > 0:
            pages = data["data"]
            logger.info(f"📋 Found {len(pages)} Facebook Page(s) managed by this account:")
            matched = None
            for p in pages:
                p_id = str(p.get("id"))
                p_name = p.get("name")
                logger.info(f"   -> Page: '{p_name}' (ID: {p_id})")
                if page_id and (page_id == p_id or page_id == "me" or p_id in str(page_id) or str(page_id) in p_id):
                    matched = p

            if not matched:
                matched = pages[0]

            selected_id = str(matched.get("id"))
            selected_name = matched.get("name")
            page_token = matched.get("access_token")
            logger.info(f"🎯 Auto-selected Page: '{selected_name}' (ID: {selected_id})")
            if page_token:
                logger.info("🔑 Successfully exchanged User Token for official PAGE Access Token!")
                return selected_id, page_token
        elif resp.status_code == 200:
            logger.info("ℹ️ /me/accounts returned no pages. Proceeding with configured token directly.")
    except Exception as e:
        logger.warning(f"Notice: /me/accounts query: {e}")

    return page_id, access_token


def load_video_history(file_path: str = VIDEO_HISTORY_FILE) -> Dict[str, Any]:
    """Loads previously published video history."""
    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict) and "articles" in data:
                    return data
    except Exception as e:
        logger.warning(f"Could not load video history from {file_path}: {e}")

    return {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "posted_count": 0,
        "articles": {}
    }


def save_video_history(history: Dict[str, Any], file_path: str = VIDEO_HISTORY_FILE) -> bool:
    """Saves video history back to disk."""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        history["last_updated"] = datetime.now(timezone.utc).isoformat()
        history["posted_count"] = len(history.get("articles", {}))
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Failed to save video history to {file_path}: {e}")
        return False


def cleanup_old_video_history(history: Dict[str, Any], max_age_days: int = 3) -> Tuple[Dict[str, Any], int]:
    """Cleans up records older than max_age_days."""
    articles = history.get("articles", {})
    now = datetime.now(timezone.utc)
    max_age_seconds = max_age_days * 86400

    kept = {}
    pruned_count = 0

    for key, item in articles.items():
        posted_at_str = item.get("posted_at") if isinstance(item, dict) else None
        if not posted_at_str:
            kept[key] = item
            continue

        try:
            posted_at = datetime.fromisoformat(posted_at_str.replace("Z", "+00:00"))
            age_seconds = (now - posted_at).total_seconds()
            if age_seconds <= max_age_seconds:
                kept[key] = item
            else:
                pruned_count += 1
        except Exception:
            kept[key] = item

    if pruned_count > 0:
        logger.info(f"🧹 Auto-cleared {pruned_count} video record(s) older than {max_age_days} days from history.")

    history["articles"] = kept
    history["posted_count"] = len(kept)
    history["last_cleaned_at"] = now.isoformat()
    return history, pruned_count


def fetch_trending_signals_us() -> Set[str]:
    """Fetches real-time US Google Trends keywords."""
    trending_terms: Set[str] = set()
    if not HAS_REQUESTS:
        return trending_terms

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    try:
        logger.info("🔍 Researching real-time Google Trends US...")
        resp = requests.get(GOOGLE_TRENDS_US_RSS, headers=headers, timeout=10)
        if resp.status_code == 200:
            root = ET.fromstring(resp.content)
            for item in root.findall(".//item"):
                title = item.find("title")
                if title is not None and title.text:
                    words = re.findall(r"\b[A-Za-z0-9'-]{3,}\b", title.text.lower())
                    trending_terms.update(words)
                    trending_terms.add(title.text.lower().strip())
    except Exception as e:
        logger.debug(f"Google Trends notice: {e}")

    return trending_terms


def get_latest_website_article(api_url: str = DEFAULT_API_URL, site_url: str = DEFAULT_SITE_URL) -> Dict[str, str]:
    """
    Picks up the latest published news article URL from the US HOT NEWS website
    to attach into the first comment of the Facebook video post.
    """
    clean_site = site_url.rstrip("/")

    # Try REST API first
    if HAS_REQUESTS:
        try:
            resp = requests.get(f"{api_url}?limit=1", timeout=10, headers={"User-Agent": "USHotNews/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                articles = data.get("articles", [])
                if articles:
                    slug = articles[0].get("slug", "")
                    title = articles[0].get("title", "")
                    if slug:
                        return {
                            "title": title,
                            "slug": slug,
                            "url": f"{clean_site}/article/{slug}"
                        }
        except Exception:
            pass

    # Try local scraped file backup
    if os.path.exists(LOCAL_SCRAPED_FILE):
        try:
            with open(LOCAL_SCRAPED_FILE, "r", encoding="utf-8") as f:
                articles = json.load(f)
                if isinstance(articles, list) and articles:
                    slug = articles[0].get("slug", "")
                    title = articles[0].get("title", "")
                    if slug:
                        return {
                            "title": title,
                            "slug": slug,
                            "url": f"{clean_site}/article/{slug}"
                        }
        except Exception:
            pass

    # Fallback to home site URL
    return {
        "title": "US HOT NEWS - Latest Verified US News",
        "slug": "",
        "url": clean_site
    }


def fetch_dvids_us_news_videos(max_age_hours: int = 48) -> List[Dict[str, Any]]:
    """
    Fetches official US Defense & National News videos from DVIDS (Defense Visual Information Distribution Service).
    All videos are hosted directly on CloudFront CDN as pure .mp4 files with zero bot protection or IP blocking.
    Only videos published within the last max_age_hours are accepted.
    """
    candidates = []
    if not HAS_REQUESTS:
        return candidates

    url = "https://www.dvidshub.net/rss/video"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) USHotNews/1.0"}
    try:
        resp = requests.get(url, headers=headers, timeout=12)
        if resp.status_code == 200:
            root = ET.fromstring(resp.content)
            items = root.findall(".//item")
            for it in items[:15]:
                title = it.findtext("title", "").strip()
                link = it.findtext("link", "").strip()
                desc = it.findtext("description", "").strip()
                guid = it.findtext("guid", link)
                pub_date = it.findtext("pubDate", "")

                if not link or not title or len(title) < 10:
                    continue

                pub_dt = parse_date_to_datetime(pub_date)
                if pub_dt and not is_within_max_age(pub_dt, max_hours=max_age_hours):
                    continue

                clean_title = re.sub(r"<[^>]+>", "", title).strip()
                clean_desc = re.sub(r"<[^>]+>", "", desc).strip()

                try:
                    p_resp = requests.get(link, headers=headers, timeout=8)
                    if p_resp.status_code == 200:
                        html = p_resp.text
                        mp4_matches = re.findall(r'https?://d34w7g4gy10iej\.cloudfront\.net/video/[^\s"\'<>]+\.mp4', html)
                        if not mp4_matches:
                            mp4_matches = re.findall(r'https?://[^\s"\'<>]+\.mp4[^\s"\'<>]*', html)

                        if mp4_matches:
                            direct_mp4 = mp4_matches[0]
                            candidates.append({
                                "title": clean_title,
                                "summary": clean_desc if clean_desc else clean_title,
                                "video_url": direct_mp4,
                                "is_direct_mp4": True,
                                "source": "DVIDS US National Media",
                                "category": "Politics",
                                "guid": f"dvids-{guid}",
                                "published_at": pub_dt.isoformat() if pub_dt else None,
                            })
                except Exception as ex:
                    logger.debug(f"DVIDS page scrape notice for {link}: {ex}")
    except Exception as e:
        logger.debug(f"DVIDS RSS fetch notice: {e}")

    return candidates


def fetch_nasa_us_news_videos(trending_signals: Optional[Set[str]] = None, max_age_hours: int = 48) -> List[Dict[str, Any]]:
    """
    Fetches US Space & Tech news videos from NASA Image and Video Library ONLY IF
    space topics are actively trending in the USA right now (Google Trends US),
    AND the video was published within the last 48 hours.
    """
    candidates = []
    if not HAS_REQUESTS:
        return candidates

    # User rule: Only fetch NASA videos if space topics are actively trending in USA
    if not is_space_trending_in_us(trending_signals):
        logger.info("ℹ️ No space/NASA keywords currently trending in US Google Trends. Skipping NASA to prioritize US breaking & political news.")
        return candidates

    logger.info("🚀 Space topic detected in US Google Trends! Querying NASA video library for matching recent releases...")
    import urllib.parse

    # Extract which space terms matched
    matched_queries = []
    if trending_signals:
        signals_lower = {s.lower() for s in trending_signals}
        for kw in SPACE_TRENDING_KEYWORDS:
            if kw in signals_lower or any(kw in sig for sig in signals_lower):
                matched_queries.append(kw)

    queries = matched_queries[:2] if matched_queries else ["launch"]
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) USHotNews/1.0"}

    for q in queries:
        try:
            url = f"https://images-api.nasa.gov/search?q={q}&media_type=video"
            resp = requests.get(url, headers=headers, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("collection", {}).get("items", [])
                for it in items[:6]:
                    meta_list = it.get("data", [{}])
                    if not meta_list:
                        continue
                    meta = meta_list[0]
                    title = (meta.get("title") or "").strip()
                    desc = (meta.get("description") or "").strip()
                    nasa_id = meta.get("nasa_id", "")
                    href = it.get("href")
                    date_created = meta.get("date_created")

                    if not href or not title or len(title) < 10:
                        continue

                    # Strict date check: reject archival or old videos!
                    pub_dt = parse_date_to_datetime(date_created)
                    if pub_dt and not is_within_max_age(pub_dt, max_hours=max_age_hours):
                        continue

                    clean_title = re.sub(r"<[^>]+>", "", title).strip()
                    clean_desc = re.sub(r"<[^>]+>", "", desc).strip()

                    try:
                        coll_url = urllib.parse.quote(href, safe=':/?&=')
                        c_resp = requests.get(coll_url, headers=headers, timeout=8)
                        if c_resp.status_code == 200:
                            files = c_resp.json()
                            if isinstance(files, list):
                                mobile = [f for f in files if isinstance(f, str) and "~mobile.mp4" in f.lower()]
                                medium = [f for f in files if isinstance(f, str) and "~medium.mp4" in f.lower()]
                                small_mp4 = [
                                    f for f in files
                                    if isinstance(f, str)
                                    and f.lower().endswith(".mp4")
                                    and "~orig" not in f.lower()
                                    and "orig.mp4" not in f.lower()
                                    and "~large" not in f.lower()
                                    and "1080p" not in f.lower()
                                    and "2160p" not in f.lower()
                                ]
                                selected_url = mobile[0] if mobile else (medium[0] if medium else (small_mp4[0] if small_mp4 else None))

                                if selected_url:
                                    encoded_mp4 = urllib.parse.quote(selected_url, safe=':/?&=')
                                    candidates.append({
                                        "title": clean_title,
                                        "summary": clean_desc[:300] if clean_desc else clean_title,
                                        "video_url": encoded_mp4,
                                        "is_direct_mp4": True,
                                        "source": "NASA US Tech & Science",
                                        "category": "Technology",
                                        "guid": f"nasa-{nasa_id or clean_title}",
                                        "published_at": pub_dt.isoformat() if pub_dt else None,
                                    })
                    except Exception as ex:
                        logger.debug(f"NASA collection parse notice: {ex}")
        except Exception as e:
            logger.debug(f"NASA API query notice: {e}")

    return candidates


def fetch_trending_videos_from_web(trending_signals: Optional[Set[str]] = None, max_age_hours: int = 48) -> List[Dict[str, Any]]:
    """
    Discovers trending US news videos directly from live US Video Feeds (AP, PBS, NBC, CBS, Fox, Reuters),
    DVIDS, and optionally NASA (only when space topics are trending in the US).
    Enforces strict publication date freshness (last 48h only).
    """
    video_candidates = []
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) USHotNews/1.0"}

    # 1. Query live mainstream US news video feeds (Top US journalistic networks)
    for feed in US_VIDEO_FEEDS:
        url = feed["url"]
        source = feed["source"]
        default_cat = feed["category"]

        try:
            entries = []
            if HAS_FEEDPARSER:
                parsed = feedparser.parse(url, request_headers=headers)
                for entry in parsed.entries:
                    entries.append({
                        "title": getattr(entry, "title", ""),
                        "link": getattr(entry, "link", ""),
                        "description": getattr(entry, "description", getattr(entry, "summary", "")),
                        "id": getattr(entry, "id", getattr(entry, "link", "")),
                        "published": getattr(entry, "published", getattr(entry, "updated", "")),
                        "enclosures": getattr(entry, "enclosures", []),
                        "media_content": getattr(entry, "media_content", [])
                    })
            elif HAS_REQUESTS:
                resp = requests.get(url, headers=headers, timeout=10)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.content)
                    # Check for Atom entry elements (e.g. YouTube feeds)
                    atom_entries = root.findall(".//{http://www.w3.org/2005/Atom}entry")
                    if not atom_entries:
                        atom_entries = root.findall(".//entry")

                    if atom_entries:
                        for entry in atom_entries:
                            e_title = entry.findtext("{http://www.w3.org/2005/Atom}title", entry.findtext("title", ""))
                            e_link = ""
                            for l_elem in entry.findall("{http://www.w3.org/2005/Atom}link"):
                                if l_elem.get("href"):
                                    e_link = l_elem.get("href")
                                    break
                            if not e_link:
                                for l_elem in entry.findall("link"):
                                    if l_elem.get("href"):
                                        e_link = l_elem.get("href")
                                        break
                            if not e_link:
                                e_link = entry.findtext("link", "")

                            pub_val = (
                                entry.findtext("{http://www.w3.org/2005/Atom}published")
                                or entry.findtext("{http://www.w3.org/2005/Atom}updated")
                                or entry.findtext("published")
                                or entry.findtext("updated")
                                or ""
                            )
                            desc_val = (
                                entry.findtext(".//{http://search.yahoo.com/mrss/}description")
                                or entry.findtext("summary")
                                or ""
                            )
                            guid_val = entry.findtext("{http://www.w3.org/2005/Atom}id", entry.findtext("id", e_link))
                            entries.append({
                                "title": e_title,
                                "link": e_link,
                                "description": desc_val,
                                "id": guid_val,
                                "published": pub_val,
                                "enclosures": []
                            })
                    else:
                        for it in root.findall(".//item"):
                            enc_tag = it.find("enclosure")
                            enc_url = enc_tag.get("url") or enc_tag.get("href") or "" if enc_tag is not None else ""
                            enc_type = enc_tag.get("type") or "" if enc_tag is not None else ""
                            entries.append({
                                "title": it.findtext("title", ""),
                                "link": it.findtext("link", ""),
                                "description": it.findtext("description", ""),
                                "id": it.findtext("guid", it.findtext("link", "")),
                                "published": it.findtext("pubDate", ""),
                                "enclosures": [{"href": enc_url, "type": enc_type}] if enc_url else []
                            })

            for e in entries[:10]:
                raw_title = e.get("title", "")
                raw_desc = e.get("description", e.get("summary", ""))
                guid = e.get("id", e.get("link", ""))
                pub_raw = e.get("published") or e.get("pubDate") or e.get("updated")

                title = re.sub(r"<[^>]+>", "", raw_title).strip()
                summary = re.sub(r"<[^>]+>", "", raw_desc).strip()
                if not title or len(title) < 15:
                    continue

                # Strict Freshness Check
                pub_dt = parse_date_to_datetime(pub_raw)
                if pub_dt and not is_within_max_age(pub_dt, max_hours=max_age_hours):
                    continue

                # Extract video URL
                video_url = None

                # Check enclosures
                enclosures = e.get("enclosures", []) if isinstance(e, dict) else (getattr(e, "enclosures", []) or [])
                for enc in enclosures:
                    e_url = enc.get("href") or enc.get("url") or ""
                    clean_enc = e_url.split("?")[0].lower()
                    if clean_enc.endswith((".mp4", ".mov", ".m4v", ".webm")) or "video" in enc.get("type", "").lower() or ".mp4" in e_url.lower():
                        video_url = e_url
                        break

                # Check media_content
                if not video_url:
                    media_content = e.get("media_content", []) if isinstance(e, dict) else (getattr(e, "media_content", []) or [])
                    for mc in media_content:
                        m_url = mc.get("url", "")
                        clean_mc = m_url.split("?")[0].lower()
                        if clean_mc.endswith((".mp4", ".mov", ".m4v", ".webm")) or "video" in mc.get("type", "").lower() or ".mp4" in m_url.lower():
                            video_url = m_url
                            break

                if not video_url and ("/video" in guid.lower() or ".mp4" in guid.lower() or "youtube.com/watch" in guid.lower()):
                    video_url = guid

                if not video_url and e.get("link"):
                    link = e.get("link", "")
                    if "/video" in link.lower() or ".mp4" in link.lower() or "youtube.com/watch" in link.lower() or "youtu.be/" in link.lower():
                        video_url = link

                if video_url:
                    is_direct_mp4 = (
                        video_url.lower().split("?")[0].endswith((".mp4", ".mov", ".m4v", ".webm"))
                        or ".mp4" in video_url.lower()
                    )

                    video_candidates.append({
                        "title": title,
                        "summary": summary if summary else title,
                        "video_url": video_url,
                        "is_direct_mp4": is_direct_mp4,
                        "source": source,
                        "category": default_cat,
                        "guid": guid or video_url,
                        "published_at": pub_dt.isoformat() if pub_dt else None,
                    })
        except Exception as e:
            logger.debug(f"Feed {source} query notice: {e}")

    # 2. Fetch official US Defense & National News videos from DVIDS (CloudFront direct MP4, fresh only)
    dvids_candidates = fetch_dvids_us_news_videos(max_age_hours=max_age_hours)
    if dvids_candidates:
        video_candidates.extend(dvids_candidates)
        logger.info(f"Discovered {len(dvids_candidates)} fresh direct MP4 news videos from DVIDS National Hub.")

    # 3. Fetch US Space & Tech news videos from NASA (ONLY IF space is trending in US Google Trends)
    nasa_candidates = fetch_nasa_us_news_videos(trending_signals=trending_signals, max_age_hours=max_age_hours)
    if nasa_candidates:
        video_candidates.extend(nasa_candidates)
        logger.info(f"Discovered {len(nasa_candidates)} trending NASA videos matching today's US topics.")

    # 4. Also check local scraped backup for fresh video items
    if os.path.exists(LOCAL_SCRAPED_FILE):
        try:
            with open(LOCAL_SCRAPED_FILE, "r", encoding="utf-8") as f:
                articles = json.load(f)
                if isinstance(articles, list):
                    for a in articles:
                        v_url = a.get("videoUrl")
                        guid = str(a.get("guid") or "")
                        if not v_url and ("/video" in guid.lower()):
                            v_url = guid
                        if v_url:
                            pub_dt = parse_date_to_datetime(a.get("publishedAt"))
                            if pub_dt and not is_within_max_age(pub_dt, max_hours=max_age_hours):
                                continue
                            is_direct_mp4 = str(v_url).lower().split("?")[0].endswith((".mp4", ".mov", ".m4v", ".webm"))
                            video_candidates.append({
                                "title": a.get("title"),
                                "summary": a.get("summary"),
                                "video_url": v_url,
                                "is_direct_mp4": is_direct_mp4,
                                "source": "US News Wire",
                                "category": a.get("category", "Politics"),
                                "guid": a.get("guid", a.get("id")),
                                "published_at": pub_dt.isoformat() if pub_dt else None,
                            })
        except Exception:
            pass

    return video_candidates


def calculate_trending_score(item: Dict[str, Any], trending_signals: Set[str]) -> float:
    """Calculates trending relevance score prioritizing real-time US news and Google Trends."""
    score = 20.0
    text = f"{item.get('title', '')} {item.get('summary', '')}".lower()

    # Google Trends US match (highest value)
    if trending_signals:
        matches = sum(1 for term in trending_signals if len(term) > 3 and term in text)
        score += min(matches * 15.0, 50.0)

    # Core US News category weights (Politics and Economy take top priority)
    category_weights = {
        "Politics": 25.0,
        "Economy": 22.0,
        "National": 20.0,
        "Technology": 12.0,
        "World": 12.0,
        "Culture": 10.0,
        "Sports": 10.0
    }
    score += category_weights.get(item.get("category", "Politics"), 10.0)

    # Freshness Bonus: Extra points for being fresh off the wire
    pub_dt = parse_date_to_datetime(item.get("published_at"))
    if pub_dt:
        age_hours = (datetime.now(timezone.utc) - pub_dt).total_seconds() / 3600
        if age_hours <= 12:
            score += 20.0
        elif age_hours <= 24:
            score += 10.0

    # Slight bonus for direct MP4 reliability (5 points instead of 25)
    if item.get("is_direct_mp4"):
        score += 5.0

    return round(score, 2)


def format_facebook_video_caption(video_item: Dict[str, Any]) -> str:
    """Formats clean video caption without URL."""
    title = (video_item.get("title") or "").strip()
    summary = (video_item.get("summary") or "").strip()
    category = (video_item.get("category") or "News").strip().replace(" ", "")

    category_emojis = {
        "Politics": "🏛️",
        "Economy": "📈",
        "Technology": "🤖",
        "World": "🌐",
        "Science": "🔬",
        "Culture": "🎭",
        "Sports": "🏆"
    }
    emoji = category_emojis.get(category, "🎥")

    lines = [f"{emoji} {title}"]
    if summary and summary.strip() != title.strip():
        lines.extend(["", f"{summary}"])

    lines.extend([
        "",
        "👇 Read the full story & latest updates in the first comment!",
        "",
        f"#{category} #USNews #TrendingNews #USHotNews"
    ])

    return "\n".join(lines)


def format_first_comment_with_website_link(website_article: Dict[str, str]) -> str:
    """
    Constructs the First Comment pointing to the latest published news story on US HOT NEWS.
    """
    article_url = website_article.get("url", DEFAULT_SITE_URL)
    return f"👉 Read the full verified report & latest US news updates at US HOT NEWS:\n{article_url}"


def download_actual_news_video(video_url: str, output_path: str) -> bool:
    """Downloads actual video file (.mp4) via HTTP stream or yt-dlp."""
    if not video_url:
        return False

    # Normalize YouTube URL if present
    yt_match = re.search(r"(?:v=|/v/|youtu\.be/|/embed/|/shorts/)([a-zA-Z0-9_-]{11})", video_url)
    if yt_match:
        video_url = f"https://www.youtube.com/watch?v={yt_match.group(1)}"

    clean_url = video_url.split("?")[0].lower()

    # Check for optional cookies file or YT_COOKIES environment variable
    cookie_file = None
    if os.environ.get("YT_COOKIES"):
        raw_cookie = os.environ["YT_COOKIES"].strip()
        if raw_cookie:
            # Auto-detect Base64 encoded cookies
            import base64
            try:
                decoded = base64.b64decode(raw_cookie).decode("utf-8")
                if "youtube.com" in decoded or "\t" in decoded:
                    raw_cookie = decoded
            except Exception:
                pass

            # Auto-repair space-separated lines if GitHub Secrets converted tabs to spaces
            cleaned_lines = []
            for line in raw_cookie.splitlines():
                line = line.strip()
                if not line:
                    continue
                if line.startswith("#"):
                    cleaned_lines.append(line)
                    continue
                if "\t" in line:
                    cleaned_lines.append(line)
                else:
                    parts = re.split(r"\s+", line)
                    if len(parts) >= 7:
                        cleaned_lines.append("\t".join(parts[:7]))
                    else:
                        cleaned_lines.append(line)

            raw_cookie = "\n".join(cleaned_lines)
            if not raw_cookie.startswith("# Netscape") and not raw_cookie.startswith("# HTTP Cookie"):
                raw_cookie = "# Netscape HTTP Cookie File\n" + raw_cookie

            try:
                with open("cookies.txt", "w", encoding="utf-8") as cf:
                    cf.write(raw_cookie + "\n")
                cookie_file = "cookies.txt"
            except Exception:
                pass
    elif os.path.exists("cookies.txt") and os.path.getsize("cookies.txt") > 10:
        cookie_file = "cookies.txt"

    # Direct MP4 Download (Direct file, 100% reliable, no bot challenges)
    if clean_url.endswith((".mp4", ".mov", ".m4v", ".webm")):
        try:
            logger.info(f"Downloading direct MP4 news video: {video_url[:80]}...")
            session = requests.Session()
            session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) USHotNews/1.0"})
            resp = session.get(video_url, stream=True, timeout=60, allow_redirects=True)
            if resp.status_code == 200:
                content_len = resp.headers.get("Content-Length")
                if content_len and content_len.isdigit():
                    total_bytes = int(content_len)
                    if total_bytes > MAX_VIDEO_BYTES:
                        logger.warning(
                            f"⚠️ Video file too large ({total_bytes // (1024 * 1024)} MB > "
                            f"{MAX_VIDEO_BYTES // (1024 * 1024)} MB limit). Skipping candidate."
                        )
                        return False

                downloaded = 0
                with open(output_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=65536):
                        if chunk:
                            downloaded += len(chunk)
                            if downloaded > MAX_VIDEO_BYTES:
                                logger.warning(
                                    f"⚠️ Download exceeded maximum size ({MAX_VIDEO_BYTES // (1024 * 1024)} MB). "
                                    f"Aborting download to avoid Facebook upload failure."
                                )
                                f.close()
                                if os.path.exists(output_path):
                                    os.remove(output_path)
                                return False
                            f.write(chunk)

                if os.path.exists(output_path) and 5000 < os.path.getsize(output_path) <= MAX_VIDEO_BYTES:
                    logger.info(f"✅ Real news video downloaded: {os.path.getsize(output_path) // 1024} KB")
                    return True
            else:
                logger.warning(f"Direct MP4 download returned HTTP {resp.status_code}")
        except Exception as e:
            logger.warning(f"Direct download attempt notice: {e}")
            if os.path.exists(output_path):
                try:
                    os.remove(output_path)
                except Exception:
                    pass

    # Multi-strategy yt-dlp video extraction
    try:
        try:
            import yt_dlp
            has_module = True
        except ImportError:
            has_module = False

        base_opts = {
            'format': 'best[ext=mp4][height<=720]/best[height<=720]/best',
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'max_filesize': MAX_VIDEO_BYTES,
            'socket_timeout': 30,
        }

        has_valid_cookie = bool(cookie_file and os.path.exists(cookie_file) and os.path.getsize(cookie_file) > 10)
        strategies = []

        # Strategy 1: TV and Embedded clients with cookies (bypasses browser JS reload challenges)
        if has_valid_cookie:
            strategies.append({
                "name": "Authenticated (TV & Embedded Client)",
                "use_cookie": True,
                "clients": ["tv", "web_embedded", "android"],
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            })
            # Strategy 2: Web client with cookies
            strategies.append({
                "name": "Authenticated (Standard Web Client)",
                "use_cookie": True,
                "clients": ["web", "mweb"],
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            })

        # Strategy 3: Mobile and TV rotation fallback (unauthenticated)
        strategies.append({
            "name": "Direct Client Rotation (TV / iOS / Android)",
            "use_cookie": False,
            "clients": ["tv", "ios", "android", "mweb"],
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
        })

        for strat in strategies:
            try:
                opts = dict(base_opts)
                if strat["use_cookie"] and cookie_file:
                    opts["cookiefile"] = cookie_file
                if strat.get("clients"):
                    opts["extractor_args"] = {"youtube": {"player_client": strat["clients"]}}
                if strat.get("user_agent"):
                    opts["http_headers"] = {"User-Agent": strat["user_agent"]}

                if has_module:
                    logger.info(f"Extracting video ({strat['name']}) from: {video_url[:75]}...")
                    with yt_dlp.YoutubeDL(opts) as ydl:
                        ydl.download([video_url])
                    if os.path.exists(output_path) and 5000 < os.path.getsize(output_path) <= MAX_VIDEO_BYTES:
                        logger.info(f"✅ Real news video downloaded via yt-dlp ({strat['name']}): {os.path.getsize(output_path) // 1024} KB")
                        return True
                elif shutil.which("yt-dlp"):
                    cmd = [
                        "yt-dlp",
                        "-f", "best[ext=mp4][height<=720]/best[height<=720]/best",
                        "-o", output_path,
                        "--max-filesize", f"{MAX_VIDEO_BYTES // (1024 * 1024)}M",
                    ]
                    if strat["use_cookie"] and cookie_file:
                        cmd.extend(["--cookies", cookie_file])
                    if strat.get("clients"):
                        cmd.extend(["--extractor-args", f"youtube:player_client={','.join(strat['clients'])}"])
                    cmd.append(video_url)
                    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
                    if res.returncode == 0 and os.path.exists(output_path) and 5000 < os.path.getsize(output_path) <= MAX_VIDEO_BYTES:
                        logger.info(f"✅ Real news video downloaded via yt-dlp CLI ({strat['name']}): {os.path.getsize(output_path) // 1024} KB")
                        return True
            except Exception as ex:
                logger.debug(f"Strategy '{strat['name']}' attempt notice: {ex}")
                if os.path.exists(output_path):
                    try:
                        os.remove(output_path)
                    except Exception:
                        pass
    except Exception as e:
        logger.warning(f"yt-dlp extraction notice: {e}")

    return False


def post_video_to_facebook(
    page_id: str,
    access_token: str,
    video_file_path: Optional[str] = None,
    video_url: Optional[str] = None,
    title: str = "",
    caption: str = "",
    graph_version: str = FB_GRAPH_VERSION
) -> Dict[str, Any]:
    """Uploads video to Facebook Page /{target}/videos."""
    if video_file_path and os.path.exists(video_file_path):
        file_size = os.path.getsize(video_file_path)
        if file_size > MAX_VIDEO_BYTES:
            logger.warning(
                f"⚠️ Video file size ({file_size // (1024 * 1024)} MB) exceeds maximum upload limit "
                f"({MAX_VIDEO_BYTES // (1024 * 1024)} MB). Skipping Facebook upload."
            )
            return {
                "success": False,
                "error": f"Video file size ({file_size // (1024 * 1024)} MB) exceeds {MAX_VIDEO_BYTES // (1024 * 1024)} MB limit"
            }

    if not HAS_REQUESTS:
        return {"success": False, "error": "Missing 'requests' library"}

    target = page_id if page_id and page_id != "me" else "me"
    endpoint = f"https://graph.facebook.com/{graph_version}/{target}/videos"

    payload: Dict[str, Any] = {
        "title": title[:100],
        "description": caption,
        "published": "true",
        "access_token": access_token
    }

    files = None
    file_handle = None

    try:
        if video_file_path and os.path.exists(video_file_path):
            file_size = os.path.getsize(video_file_path)
            file_handle = open(video_file_path, "rb")
            files = {"source": (os.path.basename(video_file_path), file_handle, "video/mp4")}
            logger.info(f"Uploading news video file ({file_size // 1024} KB) to Facebook Page ({target})...")
            response = requests.post(endpoint, data=payload, files=files, timeout=120)
        elif video_url:
            # Only direct media files should ever be passed as file_url
            clean_url = video_url.split("?")[0].lower()
            if clean_url.endswith((".mp4", ".mov", ".m4v", ".webm")):
                payload["file_url"] = video_url
                logger.info(f"Uploading direct video URL to Facebook Page ({target}): {video_url[:60]}...")
                response = requests.post(endpoint, data=payload, timeout=60)
            else:
                return {"success": False, "error": "file_url must be a direct .mp4/.mov media stream, not a web page"}
        else:
            return {"success": False, "error": "No valid video file or URL available"}

        try:
            data = response.json()
        except Exception:
            data = {"error": {"message": f"Non-JSON response from Facebook (HTTP {response.status_code}): {response.text[:200]}"}}

        # Fallback to /me/videos if target global ID rejected
        if response.status_code != 200 and target != "me" and ("global id" in str(data).lower() or data.get("error", {}).get("code") == 100):
            fb_endpoint = f"https://graph.facebook.com/{graph_version}/me/videos"
            if file_handle:
                file_handle.seek(0)
            response = requests.post(fb_endpoint, data=payload, files=files, timeout=120)
            try:
                data = response.json()
            except Exception:
                data = {"error": {"message": f"Non-JSON response from Facebook (HTTP {response.status_code}): {response.text[:200]}"}}

        if response.status_code == 200 and "id" in data:
            video_id = data["id"]
            video_url_out = build_fb_video_url(video_id, page_id)
            logger.info(f"🎉 Successfully published Video to Facebook! Video ID: {video_id}")
            logger.info(f"🔗 Facebook Video Link: {video_url_out}")
            return {"success": True, "video_id": video_id, "video_url": video_url_out}
        else:
            err = data.get("error", {})
            err_msg = err.get("message", response.text)
            logger.error(f"❌ Facebook Video API Error (HTTP {response.status_code}): {err_msg}")
            return {"success": False, "error": err_msg, "response": data}
    except Exception as e:
        logger.error(f"Exception during Facebook video upload: {e}")
        return {"success": False, "error": str(e)}
    finally:
        if file_handle:
            try:
                file_handle.close()
            except Exception:
                pass


def wait_for_video_ready(
    video_id: str,
    access_token: str,
    max_wait_seconds: int = 60,
    poll_interval: int = 5,
    graph_version: str = FB_GRAPH_VERSION
) -> bool:
    """
    Polls Facebook Graph API GET /{video_id}?fields=status until video_status is 'ready'.
    Facebook requires the video to be fully encoded and processed before it can receive comments.
    """
    if not HAS_REQUESTS or not video_id or not access_token:
        return True

    endpoint = f"https://graph.facebook.com/{graph_version}/{video_id}?fields=status&access_token={access_token}"
    start_time = time.time()
    logger.info(f"⏳ Waiting for Facebook to process video {video_id} before posting first comment...")

    while time.time() - start_time < max_wait_seconds:
        try:
            resp = requests.get(endpoint, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                status_obj = data.get("status", {})
                v_status = status_obj.get("video_status")
                logger.info(f"Video {video_id} processing status on Facebook: '{v_status}'")
                if v_status == "ready":
                    logger.info(f"✅ Video {video_id} is ready for comments!")
                    return True
                elif v_status == "error":
                    logger.warning(f"⚠️ Video {video_id} processing failed on Facebook side.")
                    return False
            else:
                logger.debug(f"Status check notice (HTTP {resp.status_code}): {resp.text[:100]}")
        except Exception as e:
            logger.debug(f"Status check exception: {e}")

        time.sleep(poll_interval)

    logger.warning(f"⚠️ Video processing wait reached timeout ({max_wait_seconds}s). Attempting comment anyway...")
    return False


def post_comment_to_facebook_post(
    post_id: str,
    access_token: str,
    comment_text: str,
    page_id: Optional[str] = None,
    graph_version: str = FB_GRAPH_VERSION,
    wait_ready: bool = True
) -> Dict[str, Any]:
    """Posts first comment on Facebook video with website link, waiting for processing if needed."""
    if not HAS_REQUESTS or not post_id or not access_token or not comment_text:
        return {"success": False, "error": "Missing parameters"}

    if wait_ready:
        wait_for_video_ready(post_id, access_token, max_wait_seconds=60, poll_interval=5, graph_version=graph_version)

    # Candidate targets: primary is post_id, secondary is page_id_post_id
    targets = [post_id]
    if page_id and page_id != "me" and "_" not in post_id and page_id not in post_id:
        targets.append(f"{page_id}_{post_id}")

    last_err = "Unknown error"
    last_data = {}

    for target in targets:
        endpoint = f"https://graph.facebook.com/{graph_version}/{target}/comments"
        payload = {"message": comment_text, "access_token": access_token}

        # Try up to 3 attempts with 5s backoff
        for attempt in range(1, 4):
            try:
                response = requests.post(endpoint, data=payload, timeout=20)
                data = response.json()
                if response.status_code == 200 and "id" in data:
                    comment_id = data["id"]
                    logger.info(f"💬 Successfully added first comment with link! Comment ID: {comment_id} (Target: {target})")
                    return {"success": True, "comment_id": comment_id}
                else:
                    err = data.get("error", {})
                    last_err = err.get("message", response.text)
                    err_code = err.get("code")
                    last_data = data
                    logger.warning(f"⚠️ Comment attempt {attempt} for target {target} failed: {last_err}")
                    # If Meta returns permission error (Code 200), don't retry in a loop
                    if err_code == 200 or "permission" in last_err.lower() or "pages_manage_engagement" in last_err.lower():
                        break
                    if "processing" in last_err.lower() or "not ready" in last_err.lower() or err_code == 100:
                        time.sleep(5)
            except Exception as e:
                last_err = str(e)
                logger.warning(f"⚠️ Exception adding comment on attempt {attempt}: {e}")
                time.sleep(5)

    logger.error(f"❌ Failed to add first comment to video {post_id}: {last_err}")
    return {"success": False, "error": last_err, "response": last_data}


def update_video_description(
    video_id: str,
    access_token: str,
    new_description: str,
    graph_version: str = FB_GRAPH_VERSION
) -> bool:
    """
    Updates the video description via POST /{video_id} on Facebook.
    Used as an automatic fallback when comment permissions (pages_manage_engagement)
    are not granted by Meta, ensuring the website link is never omitted.
    """
    if not HAS_REQUESTS or not video_id or not access_token:
        return False

    endpoint = f"https://graph.facebook.com/{graph_version}/{video_id}"
    payload = {"description": new_description, "access_token": access_token}

    try:
        resp = requests.post(endpoint, data=payload, timeout=20)
        data = resp.json()
        if resp.status_code == 200 and data.get("success", True):
            logger.info(f"🔗 Successfully attached website news link directly into video {video_id} caption!")
            return True
        else:
            logger.warning(f"Could not update video description (HTTP {resp.status_code}): {resp.text[:120]}")
    except Exception as e:
        logger.warning(f"Exception updating video description: {e}")

    return False


def run_video_publisher(
    page_id: Optional[str] = None,
    access_token: Optional[str] = None,
    site_url: str = DEFAULT_SITE_URL,
    api_url: str = DEFAULT_API_URL,
    max_posts_per_run: int = 1,
    cleanup_days: int = 3,
    pool_size: int = 50,
    dry_run: bool = False
) -> int:
    """
    Top Trending US Real Video Publisher:
    - Finds live trending US news videos.
    - Downloads video file (.mp4).
    - Uploads video to Facebook.
    - Picks up latest news story URL from website for First Comment.
    """
    page_id = page_id or os.environ.get("FB_PAGE_ID", "").strip()
    access_token = access_token or os.environ.get("FB_PAGE_ACCESS_TOKEN", "").strip()

    if not dry_run and (not page_id or not access_token):
        logger.error("Missing required credentials: FB_PAGE_ID or FB_PAGE_ACCESS_TOKEN.")
        logger.info("Run with --dry-run to simulate without credentials.")
        return 1

    if not dry_run:
        # Step 1: Pre-flight identity check
        verify_facebook_token(page_id, access_token)
        # Step 2: Auto-exchange User Token for Page Access Token if managed pages exist
        page_id, access_token = resolve_page_credentials(page_id, access_token)

    history = load_video_history()
    history, pruned_count = cleanup_old_video_history(history, max_age_days=cleanup_days)
    if pruned_count > 0:
        save_video_history(history)

    posted_map = history.get("articles", {})

    # Check for previously posted videos missing first comment and backfill them
    if not dry_run:
        for h_key, h_item in posted_map.items():
            if isinstance(h_item, dict) and h_item.get("fb_video_id") and not h_item.get("fb_comment_id"):
                miss_vid = h_item.get("fb_video_id")
                miss_target_url = h_item.get("attached_website_url") or get_latest_website_article(api_url, site_url)["url"]
                miss_comment_text = format_first_comment_with_website_link({"url": miss_target_url})
                logger.info(f"🔄 Backfilling missing first comment for previously published video (ID: {miss_vid})...")
                c_res = post_comment_to_facebook_post(
                    post_id=miss_vid,
                    access_token=access_token,
                    comment_text=miss_comment_text,
                    page_id=page_id,
                    wait_ready=False  # Already published in a prior run
                )
                if c_res.get("success"):
                    h_item["fb_comment_id"] = c_res.get("comment_id")
                    save_video_history(history)
                    logger.info(f"✅ Successfully backfilled first comment for video {miss_vid}!")
                else:
                    logger.warning(f"⚠️ Could not backfill comment for video {miss_vid}: {c_res.get('error')}")

    # Step 1: Research Google Trends
    trending_signals = fetch_trending_signals_us()

    # Step 2: Discover live trending news videos
    video_candidates = fetch_trending_videos_from_web(trending_signals=trending_signals)
    logger.info(f"Discovered {len(video_candidates)} candidate trending news videos.")

    # Filter unposted videos
    unposted = []
    for v in video_candidates[:pool_size]:
        v_id = str(v.get("guid") or v.get("video_url") or v.get("title"))
        if v_id not in posted_map and v.get("video_url") not in posted_map:
            v["_trending_score"] = calculate_trending_score(v, trending_signals)
            v["_id"] = v_id
            unposted.append(v)

    if not unposted:
        logger.info("No unposted trending videos found in current cycle. Will check again in next run.")
        return 0

    # Sort by trending score
    unposted.sort(key=lambda x: x.get("_trending_score", 0), reverse=True)

    # Step 3: Pick up the latest published news story URL from the website for First Comment
    latest_site_article = get_latest_website_article(api_url, site_url)
    first_comment_text = format_first_comment_with_website_link(latest_site_article)

    successful_posts = 0
    max_candidate_attempts = min(len(unposted), max_posts_per_run * 15)
    attempt_idx = 0
    youtube_failures = 0
    max_consecutive_yt_failures = 2

    for item in unposted:
        if successful_posts >= max_posts_per_run:
            break
        if attempt_idx >= max_candidate_attempts:
            break

        video_url = item["video_url"]
        is_youtube = any(yt_host in video_url.lower() for yt_host in ["youtube.com", "youtu.be"])

        # If YouTube bot detection is active on this runner, skip further YouTube candidates and prioritize direct MP4 sources
        if is_youtube and youtube_failures >= max_consecutive_yt_failures:
            logger.info(f"⏭️ Skipping YouTube candidate '{item['title'][:60]}' (YouTube bot challenge active on runner). Prioritizing direct MP4 US news sources.")
            continue

        attempt_idx += 1
        v_id = item["_id"]
        title = item["title"]
        score = item.get("_trending_score", 0)
        caption = format_facebook_video_caption(item)

        logger.info(f"[Attempt {attempt_idx}/{max_candidate_attempts}] Candidate Trending Video: '{title}' (Trending Score: {score}/100)")
        logger.info(f"🔗 Attached Website Story for 1st Comment: {latest_site_article['url']}")

        if dry_run:
            print("\n" + "=" * 65)
            print(f"[DRY-RUN MODE] Top Trending US Real News Video Details:")
            print(f"Trending Score:     {score} / 100")
            print(f"Video Title:        {title}")
            print(f"Video Source URL:   {video_url}")
            print(f"Website Link Target:{latest_site_article['url']}")
            print("-" * 45)
            print("Facebook Video Caption (Post Body):")
            print(caption)
            print("-" * 45)
            print("First Comment (Website News URL):")
            print(first_comment_text)
            print("=" * 65 + "\n")
            successful_posts += 1
            continue

        # Step 4: Download real video file with retry
        temp_video_path = None
        downloaded = False
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
            temp_video_path = tf.name

        for dl_attempt in range(1, 3):
            downloaded = download_actual_news_video(video_url, temp_video_path)
            if downloaded:
                break
            logger.warning(f"⚠️ Video download attempt {dl_attempt} failed for '{title}'. Retrying...")
            time.sleep(2)

        if is_youtube:
            if downloaded:
                youtube_failures = 0
            else:
                youtube_failures += 1
                if youtube_failures >= max_consecutive_yt_failures:
                    logger.warning("⚠️ YouTube bot challenge active on this runner. Circuit breaker activated: immediately prioritizing direct MP4 US news sources (DVIDS, etc.) for remaining candidates.")

        upload_path = temp_video_path if downloaded else None

        # Guard: If video was not downloaded, DO NOT call Facebook API with web URL!
        if not upload_path:
            logger.warning(f"⚠️ Could not download real video file for '{title}'. Skipping candidate to avoid Facebook API error.")
            if temp_video_path and os.path.exists(temp_video_path):
                try:
                    os.remove(temp_video_path)
                except Exception:
                    pass
            continue

        # Step 5: Upload real video to Facebook with retry
        result = {"success": False}
        for post_attempt in range(1, 3):
            result = post_video_to_facebook(
                page_id=page_id,
                access_token=access_token,
                video_file_path=upload_path,
                title=title,
                caption=caption
            )
            if result.get("success"):
                break
            logger.warning(f"⚠️ Facebook upload attempt {post_attempt} failed: {result.get('error')}. Retrying...")
            time.sleep(5)

        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
            except Exception:
                pass

        if result.get("success"):
            successful_posts += 1
            video_id = result.get("video_id")
            fb_video_url = result.get("video_url") or build_fb_video_url(video_id, page_id)

            # Step 6: Post First Comment containing the website news URL (waits for Facebook video processing)
            comment_result = post_comment_to_facebook_post(
                post_id=video_id,
                access_token=access_token,
                comment_text=first_comment_text,
                page_id=page_id,
                wait_ready=True
            )
            comment_id = comment_result.get("comment_id")
            if not comment_id:
                logger.warning(f"⚠️ Could not post first comment to video {video_id}: {comment_result.get('error')}")

            # Step 7: Record into history
            posted_map[v_id] = {
                "title": title,
                "video_url": video_url,
                "attached_website_url": latest_site_article["url"],
                "trending_score": score,
                "format": "video",
                "fb_video_id": video_id,
                "fb_video_url": fb_video_url,
                "fb_comment_id": comment_id,
                "posted_at": datetime.now(timezone.utc).isoformat()
            }
            save_video_history(history)
            logger.info(f"✅ Successfully published real news video for '{title}'!")
        else:
            logger.error(f"❌ Could not publish candidate '{title}'. Moving to next trending candidate...")

    logger.info(f"Video publisher finished. Successfully posted {successful_posts} video(s).")
    if successful_posts == 0 and not dry_run:
        logger.error("No candidate videos were successfully published in this run.")
        return 1
    return 0


def main():
    parser = argparse.ArgumentParser(description="US HOT NEWS Top Trending US Real Video Auto-Publisher")
    parser.add_argument("--dry-run", action="store_true", help="Simulate video discovery, ranking & post preview without calling Facebook API")
    parser.add_argument("--limit", type=int, default=1, help="Max videos to post per run (default: 1)")
    parser.add_argument("--page-id", type=str, default=None, help="Facebook Page ID (or set FB_PAGE_ID env var)")
    parser.add_argument("--access-token", type=str, default=None, help="Facebook Page Access Token (or set FB_PAGE_ACCESS_TOKEN)")
    parser.add_argument("--site-url", type=str, default=DEFAULT_SITE_URL, help="Website base URL")
    parser.add_argument("--api-url", type=str, default=DEFAULT_API_URL, help="News API endpoint")
    parser.add_argument("--cleanup-days", type=int, default=3, help="Max days to retain video history before auto-clearing (default: 3)")
    parser.add_argument("--pool-size", type=int, default=50, help="Candidate pool size of latest video items (default: 50)")

    args, unknown = parser.parse_known_args()

    exit_code = run_video_publisher(
        page_id=args.page_id,
        access_token=args.access_token,
        site_url=args.site_url,
        api_url=args.api_url,
        max_posts_per_run=args.limit,
        cleanup_days=args.cleanup_days,
        pool_size=args.pool_size,
        dry_run=args.dry_run
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
