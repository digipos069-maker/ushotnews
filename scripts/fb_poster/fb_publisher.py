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


def fetch_articles_from_api(api_url: str, limit: int = 30) -> List[Dict[str, Any]]:
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


def get_latest_articles(api_url: str, limit: int = 30) -> List[Dict[str, Any]]:
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


def verify_facebook_token(page_id: str, access_token: str, graph_version: str = FB_GRAPH_VERSION) -> Optional[str]:
    """
    Validates the Facebook access token before attempting to post.
    Returns the target Page ID to use, or None if the token is completely invalid.
    """
    if not HAS_REQUESTS:
        return page_id

    try:
        masked_token = access_token[:8] + "..." + access_token[-4:] if len(access_token) > 15 else "***"
        logger.info(f"Validating Facebook credentials (Page ID: {page_id}, Token: {masked_token}, Length: {len(access_token)})")

        url = f"https://graph.facebook.com/{graph_version}/me?fields=id,name,category&access_token={access_token}"
        resp = requests.get(url, timeout=15)
        data = resp.json()

        if resp.status_code != 200:
            error_data = data.get("error", {})
            logger.error(f"❌ Facebook Token Validation FAILED (HTTP {resp.status_code}):")
            logger.error(f"   Message: {error_data.get('message')}")
            logger.error(f"   Code: {error_data.get('code')}, Subcode: {error_data.get('error_subcode')}, Type: {error_data.get('type')}")
            if error_data.get("code") == 190:
                logger.error("   👉 ACTION REQUIRED: Your access token is EXPIRED or INVALID. Please generate a fresh Page Access Token.")
            return None

        token_id = str(data.get("id"))
        token_name = data.get("name")
        is_page = "category" in data

        logger.info(f"✅ Token Verified! Identity: '{token_name}' (ID: {token_id})")

        if is_page:
            logger.info(f"✅ Token Type: PAGE ACCESS TOKEN (Page: {token_name})")
            if token_id != str(page_id):
                logger.warning(f"⚠️ Notice: Configured FB_PAGE_ID ({page_id}) differs from Token Page ID ({token_id}). Using Token Page ID ({token_id}).")
                return token_id
            return page_id
        else:
            logger.warning("⚠️ CAUTION: Connected identity is a USER PROFILE, NOT a Facebook Page!")
            logger.warning("   Facebook requires a PAGE Access Token with 'pages_manage_posts' permission.")
            logger.warning("   In Meta Graph API Explorer: Open the 'User or Page' dropdown and select your PAGE, not your personal name.")
            return page_id
    except Exception as e:
        logger.warning(f"Could not connect to Facebook verification endpoint: {e}")
        return page_id


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

    endpoint = f"https://graph.facebook.com/{graph_version}/{page_id}/feed"
    payload = {
        "link": article_url,
        "message": message,
        "access_token": access_token
    }

    try:
        response = requests.post(endpoint, data=payload, timeout=25)
        data = response.json()

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


def run_publisher(
    page_id: Optional[str] = None,
    access_token: Optional[str] = None,
    site_url: str = DEFAULT_SITE_URL,
    api_url: str = DEFAULT_API_URL,
    max_posts_per_run: int = 2,
    dry_run: bool = False
) -> int:
    """
    Main orchestration loop:
    1. Loads previously posted history.
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
        verified_page_id = verify_facebook_token(page_id, access_token)
        if not verified_page_id:
            logger.error("Aborting run due to invalid Facebook credentials. See details above.")
            return 1
        page_id = verified_page_id

    history = load_posted_history()
    posted_map = history.get("articles", {})

    articles = get_latest_articles(api_url)
    if not articles:
        logger.warning("No articles found to process.")
        return 0

    # Identify unposted articles
    unposted: List[Dict[str, Any]] = []
    for art in articles:
        art_id = str(art.get("id") or art.get("slug"))
        slug = art.get("slug")
        if not slug:
            continue
        if art_id not in posted_map and slug not in posted_map:
            unposted.append(art)

    logger.info(f"Found {len(unposted)} new unposted articles out of {len(articles)} total.")

    if not unposted:
        logger.info("All articles are already published to Facebook. Nothing to do.")
        return 0

    # Limit to max_posts_per_run to protect page health and comply with rate limits
    to_publish = unposted[:max_posts_per_run]
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

    args = parser.parse_args()

    exit_code = run_publisher(
        page_id=args.page_id,
        access_token=args.access_token,
        site_url=args.site_url,
        api_url=args.api_url,
        max_posts_per_run=args.limit,
        dry_run=args.dry_run
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
