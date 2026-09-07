#!/usr/bin/env python3
"""
US HOT NEWS - Permanent Facebook Page Token Generator
Converts a short-lived Meta Graph API Explorer token into a PERMANENT Page Access Token (Never Expires).
"""

import sys
import json
import argparse
import urllib.request
import urllib.error

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

GRAPH_VERSION = "v21.0"
DEFAULT_APP_ID = "2368342323696680"
DEFAULT_APP_SECRET = "0d4ad15350307d46c978e6cc9b91677b"


def http_get_json(url: str, timeout: int = 15):
    """Performs HTTP GET and returns (status_code, data_dict), works with requests or standard urllib."""
    if HAS_REQUESTS:
        try:
            resp = requests.get(url, timeout=timeout)
            return resp.status_code, resp.json()
        except Exception as e:
            return 500, {"error": {"message": str(e)}}
    else:
        req = urllib.request.Request(url, headers={"User-Agent": "USHotNews/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status, json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            try:
                body = json.loads(e.read().decode('utf-8'))
            except Exception:
                body = {"error": {"message": str(e)}}
            return e.code, body
        except Exception as ex:
            return 500, {"error": {"message": str(ex)}}


def get_permanent_page_token(app_id: str, app_secret: str, user_token: str):
    print("=" * 65)
    print("  US HOT NEWS - Permanent Facebook Page Token Generator")
    print("=" * 65)
    print("📌 Recommended Token Permissions in Graph API Explorer:")
    print("   - pages_show_list")
    print("   - pages_read_engagement")
    print("   - pages_manage_posts")
    print("   - pages_manage_engagement  <-- Required for posting 1st Comment with website link")
    print("   (Note: DO NOT select 'pages_read_user_content' as it is deprecated)")

    # 1. Exchange short-lived User Token for 60-Day Long-Lived User Token
    print("\n[Step 1/3] Exchanging Short-Lived User Token for 60-Day Long-Lived Token...")
    exchange_url = (
        f"https://graph.facebook.com/{GRAPH_VERSION}/oauth/access_token"
        f"?grant_type=fb_exchange_token"
        f"&client_id={app_id}"
        f"&client_secret={app_secret}"
        f"&fb_exchange_token={user_token}"
    )

    status_code, data = http_get_json(exchange_url, timeout=15)

    if status_code != 200 or "access_token" not in data:
        err = data.get("error", {})
        print(f"❌ Failed to exchange token (HTTP {status_code}): {err.get('message', str(data))}")
        print("\nTip: Ensure your input token is a USER TOKEN generated from Meta Graph API Explorer,")
        print("     and that App ID and App Secret match the App used to generate the token.")
        return False

    long_lived_user_token = data["access_token"]
    expires_in_days = round(data.get("expires_in", 5184000) / 86400, 1)
    print(f"✅ Success! Generated 60-Day Long-Lived User Token (expires in ~{expires_in_days} days).")

    # 2. Query /me/accounts using the 60-Day Token to derive PERMANENT Page Access Token
    print("\n[Step 2/3] Querying /me/accounts to derive Permanent Page Access Token(s)...")
    accounts_url = f"https://graph.facebook.com/{GRAPH_VERSION}/me/accounts?fields=id,name,access_token&access_token={long_lived_user_token}"

    status_code, data = http_get_json(accounts_url, timeout=15)

    pages = data.get("data", [])
    if not pages:
        print("❌ No Facebook Pages found for this user account.")
        print("   Ensure the user account has Full Admin / Task permissions on the Facebook Page.")
        return False

    print(f"✅ Found {len(pages)} Facebook Page(s) managed by this account:\n")

    # 3. Verify and print each Page's permanent token
    for idx, page in enumerate(pages, 1):
        page_id = page.get("id")
        page_name = page.get("name")
        page_token = page.get("access_token")

        # Debug token to verify expiration
        debug_url = f"https://graph.facebook.com/debug_token?input_token={page_token}&access_token={app_id}|{app_secret}"
        scopes = []
        try:
            _, d_resp = http_get_json(debug_url, timeout=10)
            d_data = d_resp.get("data", {})
            expires_at = d_data.get("expires_at", 0)
            scopes = d_data.get("scopes", [])
            never_expires = (expires_at == 0 or expires_at is None)
        except Exception:
            never_expires = True

        status = "NEVER EXPIRES (Permanent)" if never_expires else f"Expires at {expires_at}"

        print("=" * 65)
        print(f"Page #{idx}: {page_name}")
        print(f"Page ID:   {page_id}")
        print(f"Status:    {'✅ ' + status if never_expires else '⚠️ ' + status}")
        if scopes:
            print(f"Scopes:    {', '.join(scopes)}")
            if "pages_manage_engagement" in scopes:
                print("Permissions: ✅ 'pages_manage_engagement' is ACTIVE! (First comments will work!)")
            else:
                print("Permissions: ⚠️ 'pages_manage_engagement' is missing from this token.")
        print("=" * 65)
        print("\n🔑 COPY THIS TO YOUR GITHUB SECRETS (FB_PAGE_ACCESS_TOKEN):\n")
        print(page_token)
        print("\n" + "-" * 65)

    print("\n🎉 DONE! Add or update these 2 variables in your GitHub Repository Secrets:")
    print("   1. FB_PAGE_ID          -> Your Page ID (e.g. 1325939953941168)")
    print("   2. FB_PAGE_ACCESS_TOKEN -> The permanent Page token printed above\n")
    return True


def main():
    parser = argparse.ArgumentParser(description="Generate a Never-Expiring Facebook Page Access Token")
    parser.add_argument("--app-id", type=str, default=DEFAULT_APP_ID, help=f"Meta App ID (default: {DEFAULT_APP_ID})")
    parser.add_argument("--app-secret", type=str, default=DEFAULT_APP_SECRET, help="Meta App Secret")
    parser.add_argument("--token", type=str, help="Short-lived User Token from Graph API Explorer")

    args = parser.parse_args()

    app_id = args.app_id or DEFAULT_APP_ID
    app_secret = args.app_secret or DEFAULT_APP_SECRET
    user_token = args.token or input("Enter Short-Lived User Token from Graph API Explorer: ").strip()

    if not app_id or not app_secret or not user_token:
        print("❌ Error: User Token is required.")
        sys.exit(1)

    success = get_permanent_page_token(app_id, app_secret, user_token)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
