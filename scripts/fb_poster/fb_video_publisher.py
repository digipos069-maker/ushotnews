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

GOOGLE_TRENDS_US_RSS = "https://trends.google.com/trending/rss?geo=US"
GOOGLE_NEWS_TOP_US_RSS = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"

# Direct Live US News Video Feeds
US_VIDEO_FEEDS = [
    {
        "source": "CBS News Video",
        "url": "https://www.cbsnews.com/latest/rss/video",
        "category": "Politics"
    },
    {
        "source": "CNN US Video",
        "url": "http://rss.cnn.com/rss/cnn_freevideo.rss",
        "category": "Politics"
    },
    {
        "source": "Fox News Video",
        "url": "https://moxie.foxnews.com/google-publisher/video.xml",
        "category": "Politics"
    },
    {
        "source": "NBC News Video",
        "url": "https://feeds.nbcnews.com/nbcnews/public/video",
        "category": "Politics"
    }
]


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


def fetch_trending_videos_from_web() -> List[Dict[str, Any]]:
    """
    Discovers trending US news videos directly from live US Video Feeds.
    """
    video_candidates = []
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    for feed in US_VIDEO_FEEDS:
        url = feed["url"]
        source = feed["source"]
        default_cat = feed["category"]

        try:
            entries = []
            if HAS_FEEDPARSER:
                parsed = feedparser.parse(url, request_headers=headers)
                entries = parsed.entries
            elif HAS_REQUESTS:
                resp = requests.get(url, headers=headers, timeout=10)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.content)
                    for it in root.findall(".//item"):
                        title = it.findtext("title", "")
                        link = it.findtext("link", "")
                        desc = it.findtext("description", "")
                        guid = it.findtext("guid", link)
                        entries.append({"title": title, "link": link, "description": desc, "id": guid})

            for e in entries[:6]:
                raw_title = e.get("title", "")
                raw_desc = e.get("description", e.get("summary", ""))
                guid = e.get("id", e.get("link", ""))

                title = re.sub(r"<[^>]+>", "", raw_title).strip()
                summary = re.sub(r"<[^>]+>", "", raw_desc).strip()
                if not title or len(title) < 15:
                    continue

                # Extract video URL
                video_url = None
                if hasattr(e, "media_content") and e.media_content:
                    for mc in e.media_content:
                        m_url = mc.get("url", "")
                        if "video" in mc.get("type", "") or m_url.endswith((".mp4", ".mov", ".m4v")):
                            video_url = m_url
                            break
                    if not video_url and e.media_content:
                        video_url = e.media_content[0].get("url")

                if hasattr(e, "enclosures") and e.enclosures:
                    for enc in e.enclosures:
                        e_url = enc.get("href", "")
                        if "video" in enc.get("type", "") or e_url.endswith((".mp4", ".mov", ".m4v")):
                            video_url = e_url
                            break

                if not video_url and ("/video" in guid.lower() or "youtube.com" in guid.lower()):
                    video_url = guid

                if video_url:
                    video_candidates.append({
                        "title": title,
                        "summary": summary if summary else title,
                        "video_url": video_url,
                        "source": source,
                        "category": default_cat,
                        "guid": guid,
                    })
        except Exception as e:
            logger.debug(f"Feed {source} query notice: {e}")

    # Also check local scraped backup for video items
    if not video_candidates and os.path.exists(LOCAL_SCRAPED_FILE):
        try:
            with open(LOCAL_SCRAPED_FILE, "r", encoding="utf-8") as f:
                articles = json.load(f)
                if isinstance(articles, list):
                    for a in articles:
                        v_url = a.get("videoUrl")
                        guid = str(a.get("guid") or "")
                        if not v_url and ("/video" in guid.lower() or "youtube.com" in guid.lower()):
                            v_url = guid
                        if v_url:
                            video_candidates.append({
                                "title": a.get("title"),
                                "summary": a.get("summary"),
                                "video_url": v_url,
                                "source": "US News Wire",
                                "category": a.get("category", "Politics"),
                                "guid": a.get("guid", a.get("id")),
                            })
        except Exception:
            pass

    return video_candidates


def calculate_trending_score(item: Dict[str, Any], trending_signals: Set[str]) -> float:
    """Calculates trending relevance score."""
    score = 20.0
    text = f"{item.get('title', '')} {item.get('summary', '')}".lower()

    if trending_signals:
        matches = sum(1 for term in trending_signals if len(term) > 3 and term in text)
        score += min(matches * 10.0, 50.0)

    category_weights = {"Politics": 18.0, "Economy": 18.0, "Technology": 16.0, "Culture": 14.0}
    score += category_weights.get(item.get("category", "Politics"), 10.0)
    return round(score, 2)


def format_facebook_video_caption(video_item: Dict[str, Any]) -> str:
    """Formats video caption without URL and without BREAKING."""
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

    clean_url = video_url.split("?")[0].lower()

    # Direct MP4 Download
    if clean_url.endswith((".mp4", ".mov", ".m4v", ".webm")):
        try:
            logger.info(f"Downloading direct MP4 news video: {video_url[:80]}...")
            resp = requests.get(video_url, stream=True, timeout=35, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200:
                with open(output_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=65536):
                        if chunk:
                            f.write(chunk)
                if os.path.exists(output_path) and os.path.getsize(output_path) > 5000:
                    logger.info(f"✅ Real news video downloaded: {os.path.getsize(output_path) // 1024} KB")
                    return True
        except Exception as e:
            logger.warning(f"Direct download attempt notice: {e}")

    # yt-dlp Video Extraction
    try:
        try:
            import yt_dlp
            has_module = True
        except ImportError:
            has_module = False

        if has_module:
            logger.info(f"Extracting video with yt-dlp from: {video_url[:80]}...")
            ydl_opts = {
                'format': 'best[ext=mp4]/best',
                'outtmpl': output_path,
                'quiet': True,
                'no_warnings': True,
                'max_filesize': 100 * 1024 * 1024,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
            if os.path.exists(output_path) and os.path.getsize(output_path) > 5000:
                logger.info(f"✅ Downloaded real video via yt-dlp: {os.path.getsize(output_path) // 1024} KB")
                return True
        elif shutil.which("yt-dlp"):
            cmd = ["yt-dlp", "-f", "best[ext=mp4]/best", "-o", output_path, "--max-filesize", "100M", video_url]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
            if res.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 5000:
                return True
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
    if not HAS_REQUESTS:
        return {"success": False, "error": "Missing 'requests' library"}

    target = page_id if page_id and page_id != "me" else "me"
    endpoint = f"https://graph.facebook.com/{graph_version}/{target}/videos"

    payload: Dict[str, Any] = {
        "title": title[:100],
        "description": caption,
        "access_token": access_token
    }

    files = None
    file_handle = None

    try:
        if video_file_path and os.path.exists(video_file_path):
            file_handle = open(video_file_path, "rb")
            files = {"source": (os.path.basename(video_file_path), file_handle, "video/mp4")}
            logger.info(f"Uploading news video file ({os.path.getsize(video_file_path) // 1024} KB) to Facebook...")
            response = requests.post(endpoint, data=payload, files=files, timeout=90)
        elif video_url:
            payload["file_url"] = video_url
            logger.info(f"Uploading remote video URL to Facebook: {video_url[:60]}...")
            response = requests.post(endpoint, data=payload, timeout=50)
        else:
            return {"success": False, "error": "No valid video file or URL available"}

        data = response.json()

        # Fallback to /me/videos if target global ID rejected
        if response.status_code != 200 and target != "me" and ("global id" in str(data).lower() or data.get("error", {}).get("code") == 100):
            fb_endpoint = f"https://graph.facebook.com/{graph_version}/me/videos"
            if file_handle:
                file_handle.seek(0)
            response = requests.post(fb_endpoint, data=payload, files=files, timeout=90)
            data = response.json()

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


def post_comment_to_facebook_post(
    post_id: str,
    access_token: str,
    comment_text: str,
    graph_version: str = FB_GRAPH_VERSION
) -> Dict[str, Any]:
    """Posts first comment on Facebook video with website link."""
    if not HAS_REQUESTS or not post_id or not access_token or not comment_text:
        return {"success": False, "error": "Missing parameters"}

    endpoint = f"https://graph.facebook.com/{graph_version}/{post_id}/comments"
    payload = {"message": comment_text, "access_token": access_token}

    try:
        response = requests.post(endpoint, data=payload, timeout=20)
        data = response.json()
        if response.status_code == 200 and "id" in data:
            comment_id = data["id"]
            logger.info(f"💬 Successfully added first comment with link! Comment ID: {comment_id}")
            return {"success": True, "comment_id": comment_id}
        else:
            err = data.get("error", {})
            err_msg = err.get("message", response.text)
            logger.warning(f"⚠️ Could not add first comment to video: {err_msg}")
            return {"success": False, "error": err_msg, "response": data}
    except Exception as e:
        logger.warning(f"⚠️ Exception adding comment: {e}")
        return {"success": False, "error": str(e)}


def run_video_publisher(
    page_id: Optional[str] = None,
    access_token: Optional[str] = None,
    site_url: str = DEFAULT_SITE_URL,
    api_url: str = DEFAULT_API_URL,
    max_posts_per_run: int = 1,
    cleanup_days: int = 3,
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

    history = load_video_history()
    history, pruned_count = cleanup_old_video_history(history, max_age_days=cleanup_days)
    if pruned_count > 0:
        save_video_history(history)

    posted_map = history.get("articles", {})

    # Step 1: Research Google Trends
    trending_signals = fetch_trending_signals_us()

    # Step 2: Discover live trending news videos
    video_candidates = fetch_trending_videos_from_web()
    logger.info(f"Discovered {len(video_candidates)} candidate trending news videos.")

    # Filter unposted videos
    unposted = []
    for v in video_candidates:
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
    to_publish = unposted[:max_posts_per_run]

    # Step 3: Pick up the latest published news story URL from the website for First Comment
    latest_site_article = get_latest_website_article(api_url, site_url)
    first_comment_text = format_first_comment_with_website_link(latest_site_article)

    successful_posts = 0

    for idx, item in enumerate(to_publish, 1):
        v_id = item["_id"]
        title = item["title"]
        video_url = item["video_url"]
        score = item.get("_trending_score", 0)
        caption = format_facebook_video_caption(item)

        logger.info(f"[{idx}/{len(to_publish)}] Selected #1 Trending Video: '{title}' (Trending Score: {score}/100)")
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

        # Step 4: Download real video file
        temp_video_path = None
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
            temp_video_path = tf.name

        downloaded = download_actual_news_video(video_url, temp_video_path)
        upload_path = temp_video_path if downloaded else None

        # Step 5: Upload real video to Facebook
        result = post_video_to_facebook(
            page_id=page_id,
            access_token=access_token,
            video_file_path=upload_path,
            video_url=video_url if not upload_path else None,
            title=title,
            caption=caption
        )

        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
            except Exception:
                pass

        if result.get("success"):
            successful_posts += 1
            video_id = result.get("video_id")
            fb_video_url = result.get("video_url") or build_fb_video_url(video_id, page_id)

            # Step 6: Post First Comment containing the website news URL
            comment_result = post_comment_to_facebook_post(
                post_id=video_id,
                access_token=access_token,
                comment_text=first_comment_text
            )
            comment_id = comment_result.get("comment_id")

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
            logger.error(f"Failed to post video {v_id}: {result.get('error')}")

    logger.info(f"Video publisher finished. Successfully posted {successful_posts} video(s).")
    return 0 if (successful_posts > 0 or not to_publish or dry_run) else 1


def main():
    parser = argparse.ArgumentParser(description="US HOT NEWS Top Trending US Real Video Auto-Publisher")
    parser.add_argument("--dry-run", action="store_true", help="Simulate video discovery, ranking & post preview without calling Facebook API")
    parser.add_argument("--limit", type=int, default=1, help="Max videos to post per run (default: 1)")
    parser.add_argument("--page-id", type=str, default=None, help="Facebook Page ID (or set FB_PAGE_ID env var)")
    parser.add_argument("--access-token", type=str, default=None, help="Facebook Page Access Token (or set FB_PAGE_ACCESS_TOKEN)")
    parser.add_argument("--site-url", type=str, default=DEFAULT_SITE_URL, help="Website base URL")
    parser.add_argument("--api-url", type=str, default=DEFAULT_API_URL, help="News API endpoint")
    parser.add_argument("--cleanup-days", type=int, default=3, help="Max days to retain video history before auto-clearing (default: 3)")

    args = parser.parse_args()

    exit_code = run_video_publisher(
        page_id=args.page_id,
        access_token=args.access_token,
        site_url=args.site_url,
        api_url=args.api_url,
        max_posts_per_run=args.limit,
        cleanup_days=args.cleanup_days,
        dry_run=args.dry_run
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
