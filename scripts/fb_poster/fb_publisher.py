#!/usr/bin/env python3
"""
US HOT NEWS - Automated Facebook Page Publisher
Automates sharing latest news articles as Clickable Link Cards to a Facebook Page.
Works with GitHub Actions, Vercel triggers, or standalone scheduled execution.
"""

import os
import sys
import json
import time
import random
import argparse
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

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

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("FB_Publisher")

# Defaults and Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
HISTORY_FILE = os.path.join(PROJECT_ROOT, "data", "fb_posted_history.json")
LOCAL_SCRAPED_FILE = os.path.join(PROJECT_ROOT, "data", "scraped_articles.json")

DEFAULT_SITE_URL = os.environ.get("NEXT_PUBLIC_SITE_URL", "https://ushotnews.online")
DEFAULT_API_URL = os.environ.get("NEXT_API_URL", f"{DEFAULT_SITE_URL}/api/articles")
FB_GRAPH_VERSION = os.environ.get("FB_GRAPH_VERSION", "v21.0")


def load_posted_history(file_path: str = HISTORY_FILE) -> Dict[str, Any]:
    """Loads the history of previously published articles."""
    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict) and "articles" in data:
                    return data
    except Exception as e:
        logger.warning(f"Could not load posted history from {file_path}: {e}")

    return {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "posted_count": 0,
        "articles": {}
    }


def save_posted_history(history: Dict[str, Any], file_path: str = HISTORY_FILE) -> bool:
    """Saves the updated posting history back to disk."""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        history["last_updated"] = datetime.now(timezone.utc).isoformat()
        history["posted_count"] = len(history.get("articles", {}))
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Failed to save posted history to {file_path}: {e}")
        return False


def cleanup_old_posted_history(history: Dict[str, Any], max_age_days: int = 3) -> tuple:
    """
    Automatically clears article records from fb_posted_history.json that were
    posted more than `max_age_days` (default: 3 days / 72 hours) ago.
    """
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
        logger.info(f"🧹 Auto-cleared {pruned_count} record(s) older than {max_age_days} days from fb_posted_history.json.")

    history["articles"] = kept
    history["posted_count"] = len(kept)
    history["last_cleaned_at"] = now.isoformat()
    return history, pruned_count


def fetch_articles_from_api(api_url: str, limit: int = 8) -> List[Dict[str, Any]]:
    """Fetches latest articles from the US HOT NEWS REST API."""
    if not HAS_REQUESTS:
        logger.warning("'requests' library is not available, falling back to local files.")
        return []

    try:
        logger.info(f"Fetching latest articles from {api_url}?limit={limit}...")
        resp = requests.get(
            f"{api_url}?limit={limit}",
            timeout=15,
            headers={"User-Agent": "USHotNews-FBPublisher/1.0"}
        )
        if resp.status_code == 200:
            data = resp.json()
            articles = data.get("articles", [])
            logger.info(f"Successfully retrieved {len(articles)} articles from API.")
            return articles
        else:
            logger.warning(f"API request failed with status code {resp.status_code}: {resp.text[:150]}")
    except Exception as e:
        logger.error(f"Error connecting to API {api_url}: {e}")

    return []


def fetch_articles_from_local(file_path: str = LOCAL_SCRAPED_FILE) -> List[Dict[str, Any]]:
    """Fallback to read locally scraped articles file."""
    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                articles = json.load(f)
                if isinstance(articles, list):
                    logger.info(f"Loaded {len(articles)} articles from local file {file_path}.")
                    return articles
    except Exception as e:
        logger.error(f"Failed to read local articles file {file_path}: {e}")

    return []


def get_latest_articles(api_url: str, limit: int = 8) -> List[Dict[str, Any]]:
    """Retrieves articles trying API first, then local JSON backup."""
    articles = fetch_articles_from_api(api_url, limit)
    if not articles:
        articles = fetch_articles_from_local()
    return articles


def format_facebook_message(article: Dict[str, Any], site_url: str) -> str:
    """
    Formats an engaging post message for Facebook with headline, summary,
    direct call-to-action link, and desk hashtags.
    """
    title = (article.get("title") or "").strip()
    summary = (article.get("summary") or "").strip()
    category = (article.get("category") or "News").strip().replace(" ", "")
    slug = (article.get("slug") or "").strip()
    article_url = f"{site_url.rstrip('/')}/article/{slug}"

    # Category specific emoji tag
    category_emojis = {
        "Politics": "🏛️",
        "Economy": "📈",
        "Technology": "🤖",
        "World": "🌐",
        "Science": "🔬",
        "Culture": "🎭",
        "Sports": "🏆"
    }
    emoji = category_emojis.get(category, "🚨")

    lines = [
        f"{emoji} BREAKING: {title}",
        "",
        f"{summary}",
        "",
        f"👉 Read the full verified report at US HOT NEWS:",
        f"{article_url}",
        "",
        f"#{category} #USNews #BreakingNews #USHotNews"
    ]

    return "\n".join(lines)


def verify_facebook_token(page_id: str, access_token: str, graph_version: str = FB_GRAPH_VERSION) -> str:
    """
    Validates the Facebook access token before attempting to post.
    Returns the target Page ID to use.
    """
    if not HAS_REQUESTS:
        return page_id

    try:
        masked_token = access_token[:8] + "..." + access_token[-4:] if len(access_token) > 15 else "***"
        logger.info(f"Checking credentials (Target Page ID: {page_id}, Token: {masked_token}, Length: {len(access_token)})")

        # Use standard fields id,name (supported by all token types)
        url = f"https://graph.facebook.com/{graph_version}/me?fields=id,name&access_token={access_token}"
        resp = requests.get(url, timeout=15)
        data = resp.json()

        if resp.status_code == 200 and "id" in data:
            token_id = str(data.get("id"))
            token_name = data.get("name")
            logger.info(f"✅ Token Verified! Connected Identity: '{token_name}' (ID: {token_id})")
            if token_id == str(page_id):
                logger.info(f"✅ Token belongs directly to Page '{token_name}'!")
            else:
                logger.info(f"ℹ️ Switching target to App-Scoped ID ({token_id}) instead of global ID ({page_id}) to comply with Facebook Graph API.")
            return token_id
        else:
            err = data.get("error", {})
            logger.warning(f"⚠️ Pre-check Notice ({resp.status_code}): {err.get('message')}")
    except Exception as e:
        logger.warning(f"Could not connect to Facebook pre-check endpoint: {e}")

    return page_id or "me"


def post_clickable_link_to_facebook(
    page_id: str,
    access_token: str,
    article_url: str,
    message: str,
    graph_version: str = FB_GRAPH_VERSION
) -> Dict[str, Any]:
    """
    Posts a Clickable Link Card to Facebook Page via Meta Graph API /feed endpoint.
    Facebook parses the article's Open Graph tags (og:image, og:title, og:description)
    and renders a large, interactive link card.
    """
    if not HAS_REQUESTS:
        return {"success": False, "error": "Missing 'requests' python library"}

    target = page_id if page_id and page_id != "me" else "me"
    endpoint = f"https://graph.facebook.com/{graph_version}/{target}/feed"
    payload = {
        "link": article_url,
        "message": message,
        "access_token": access_token
    }

    try:
        response = requests.post(endpoint, data=payload, timeout=25)
        data = response.json()

        # If Facebook returns "global id is not allowed", automatically fallback to /me/feed
        if response.status_code != 200 and target != "me" and ("global id" in str(data).lower() or data.get("error", {}).get("code") == 100):
            logger.warning(f"Target '{target}' rejected as global ID. Automatically falling back to '/me/feed'...")
            fallback_endpoint = f"https://graph.facebook.com/{graph_version}/me/feed"
            fallback_resp = requests.post(fallback_endpoint, data=payload, timeout=25)
            fallback_data = fallback_resp.json()
            if fallback_resp.status_code == 200 and "id" in fallback_data:
                logger.info(f"🎉 Successfully posted to Facebook Page via /me/feed! Post ID: {fallback_data['id']}")
                return {"success": True, "post_id": fallback_data["id"]}
            # Update to fallback response if it still failed
            response = fallback_resp
            data = fallback_data

        if response.status_code == 200 and "id" in data:
            logger.info(f"🎉 Successfully posted to Facebook Page! Post ID: {data['id']}")
            return {"success": True, "post_id": data["id"]}
        else:
            err = data.get("error", {})
            err_msg = err.get("message", response.text)
            err_code = err.get("code")
            err_subcode = err.get("error_subcode")
            logger.error(f"❌ Facebook Graph API Error (HTTP {response.status_code}): {err_msg}")
            logger.error(f"   Error Code: {err_code}, Subcode: {err_subcode}, Type: {err.get('type')}")
            return {"success": False, "error": err_msg, "response": data}
    except Exception as e:
        logger.error(f"Exception while posting to Facebook Graph API: {e}")
        return {"success": False, "error": str(e)}


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
            logger.info(f"📋 Found {len(pages)} Facebook Page(s) managed by this user:")
            matched = None
            for p in pages:
                p_id = str(p.get("id"))
                p_name = p.get("name")
                logger.info(f"   -> Page: '{p_name}' (ID: {p_id})")
                if page_id and (page_id == p_id or page_id == "me" or p_id in page_id or page_id in p_id):
                    matched = p

            if not matched:
                matched = pages[0]

            logger.info(f"🎯 Auto-selected Page: '{matched.get('name')}' (ID: {matched.get('id')})")
            page_token = matched.get("access_token")
            if page_token:
                logger.info("🔑 Successfully exchanged User Token for official PAGE Access Token!")
                return str(matched.get("id")), page_token
        elif resp.status_code == 200:
            logger.info("ℹ️ /me/accounts returned no pages. Proceeding with configured token directly.")
    except Exception as e:
        logger.warning(f"Notice: /me/accounts query: {e}")

    return page_id, access_token


def run_publisher(
    page_id: Optional[str] = None,
    access_token: Optional[str] = None,
    site_url: str = DEFAULT_SITE_URL,
    api_url: str = DEFAULT_API_URL,
    max_posts_per_run: int = 2,
    cleanup_days: int = 3,
    dry_run: bool = False
) -> int:
    """
    Main orchestration loop:
    1. Loads previously posted history and auto-clears entries older than 3 days.
    2. Fetches latest news articles.
    3. Filters out already posted articles.
    4. Posts up to max_posts_per_run as Clickable Link Cards.
    5. Updates and saves posting history.
    """
    page_id = page_id or os.environ.get("FB_PAGE_ID", "").strip()
    access_token = access_token or os.environ.get("FB_PAGE_ACCESS_TOKEN", "").strip()

    if not dry_run and (not page_id or not access_token):
        logger.error("Missing required credentials: FB_PAGE_ID or FB_PAGE_ACCESS_TOKEN.")
        logger.info("Run with --dry-run to test article formatting and pipeline without Facebook credentials.")
        return 1

    if not dry_run:
        # Step 1: Pre-flight identity check
        verify_facebook_token(page_id, access_token)
        # Step 2: Auto-exchange User Token for Page Access Token if managed pages exist
        page_id, access_token = resolve_page_credentials(page_id, access_token)

    history = load_posted_history()
    # Auto-clean history: purge any record posted more than `cleanup_days` (3 days) ago
    history, pruned_count = cleanup_old_posted_history(history, max_age_days=cleanup_days)
    if pruned_count > 0:
        save_posted_history(history)

    posted_map = history.get("articles", {})

    # Fetch the latest 8 articles as the active candidate pool
    pool_size = 8
    articles = get_latest_articles(api_url, limit=pool_size)
    if not articles:
        logger.warning("No articles found to process.")
        return 0

    candidate_pool = articles[:pool_size]

    # Identify unposted articles within this 8-article candidate pool
    unposted: List[Dict[str, Any]] = []
    for art in candidate_pool:
        art_id = str(art.get("id") or art.get("slug"))
        slug = art.get("slug")
        if not slug:
            continue
        if art_id not in posted_map and slug not in posted_map:
            unposted.append(art)

    logger.info(f"Inspected top {len(candidate_pool)} latest articles. Found {len(unposted)} unposted in this pool.")

    if not unposted:
        logger.info("All 8 latest articles are already published to Facebook. Nothing to do.")
        return 0

    # Randomly select from the unposted articles in the top-8 pool
    sample_size = min(len(unposted), max_posts_per_run)
    to_publish = random.sample(unposted, sample_size)
    logger.info(f"🎲 Randomly selected {len(to_publish)} story from {len(unposted)} unposted candidates in top 8 pool.")
    successful_posts = 0

    for idx, article in enumerate(to_publish, 1):
        art_id = str(article.get("id") or article.get("slug"))
        slug = article["slug"]
        article_url = f"{site_url.rstrip('/')}/article/{slug}"
        message = format_facebook_message(article, site_url)

        logger.info(f"[{idx}/{len(to_publish)}] Preparing post for: '{article.get('title')}'")

        if dry_run:
            print("\n" + "=" * 60)
            print("[DRY-RUN MODE] Post Details:")
            print(f"Article ID:  {art_id}")
            print(f"Target URL:  {article_url}")
            print(f"Image URL:   {article.get('imageUrl')}")
            print("Facebook Message:")
            print("-" * 40)
            print(message)
            print("=" * 60 + "\n")
            successful_posts += 1
            continue

        result = post_clickable_link_to_facebook(
            page_id=page_id,
            access_token=access_token,
            article_url=article_url,
            message=message
        )

        if result.get("success"):
            successful_posts += 1
            posted_map[art_id] = {
                "title": article.get("title"),
                "slug": slug,
                "url": article_url,
                "fb_post_id": result.get("post_id"),
                "posted_at": datetime.now(timezone.utc).isoformat()
            }
            posted_map[slug] = posted_map[art_id] # Also index by slug for deduplication
            save_posted_history(history)
            # Brief delay between consecutive posts if multiple
            if idx < len(to_publish):
                time.sleep(5)
        else:
            logger.error(f"Failed to post article {slug}: {result.get('error')}")

    if to_publish and successful_posts == 0 and not dry_run:
        logger.error(f"Posting run finished with 0 successes out of {len(to_publish)} attempts. Check errors above.")
        return 1

    logger.info(f"Posting run completed. Successfully published {successful_posts} articles.")
    return 0


def main():
    parser = argparse.ArgumentParser(description="US HOT NEWS Facebook Page Auto-Publisher")
    parser.add_argument("--dry-run", action="store_true", help="Simulate execution without calling Facebook API")
    parser.add_argument("--limit", type=int, default=2, help="Max articles to post per run (default: 2)")
    parser.add_argument("--page-id", type=str, default=None, help="Facebook Page ID (or set FB_PAGE_ID env var)")
    parser.add_argument("--access-token", type=str, default=None, help="Facebook Page Access Token (or set FB_PAGE_ACCESS_TOKEN)")
    parser.add_argument("--site-url", type=str, default=DEFAULT_SITE_URL, help="Site base URL")
    parser.add_argument("--api-url", type=str, default=DEFAULT_API_URL, help="News API endpoint")
    parser.add_argument("--cleanup-days", type=int, default=3, help="Max days to retain history before auto-clearing (default: 3)")

    args = parser.parse_args()

    exit_code = run_publisher(
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
