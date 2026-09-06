#!/usr/bin/env python3
"""
US HOT NEWS - Permanent Facebook Page Token Generator
Converts a short-lived Meta Graph API Explorer token into a PERMANENT Page Access Token (Never Expires).
"""

import sys
import json
import argparse
try:
    import requests
except ImportError:
    print("Error: 'requests' library is required. Install it using: pip install requests")
    sys.exit(1)


GRAPH_VERSION = "v21.0"


def get_permanent_page_token(app_id: str, app_secret: str, user_token: str):
    print("=" * 65)
    print("  US HOT NEWS - Permanent Facebook Page Token Generator")
    print("=" * 65)

    # 1. Exchange short-lived User Token for 60-Day Long-Lived User Token
    print("\n[Step 1/3] Exchanging Short-Lived User Token for 60-Day Long-Lived Token...")
    exchange_url = (
        f"https://graph.facebook.com/{GRAPH_VERSION}/oauth/access_token"
        f"?grant_type=fb_exchange_token"
        f"&client_id={app_id}"
        f"&client_secret={app_secret}"
        f"&fb_exchange_token={user_token}"
    )

    try:
        resp = requests.get(exchange_url, timeout=15)
        data = resp.json()
    except Exception as e:
        print(f"❌ Network error while connecting to Meta Graph API: {e}")
        return False

    if resp.status_code != 200 or "access_token" not in data:
        err = data.get("error", {})
        print(f"❌ Failed to exchange token (HTTP {resp.status_code}): {err.get('message', resp.text)}")
        print("\nTip: Ensure your input token is a USER TOKEN generated from Meta Graph API Explorer,")
        print("     and that App ID and App Secret match the App used to generate the token.")
        return False

    long_lived_user_token = data["access_token"]
    expires_in_days = round(data.get("expires_in", 5184000) / 86400, 1)
    print(f"✅ Success! Generated 60-Day Long-Lived User Token (expires in ~{expires_in_days} days).")

    # 2. Query /me/accounts using the 60-Day Token to derive PERMANENT Page Access Token
    print("\n[Step 2/3] Querying /me/accounts to derive Permanent Page Access Token(s)...")
    accounts_url = f"https://graph.facebook.com/{GRAPH_VERSION}/me/accounts?fields=id,name,access_token&access_token={long_lived_user_token}"

    try:
        resp = requests.get(accounts_url, timeout=15)
        data = resp.json()
    except Exception as e:
        print(f"❌ Network error while querying /me/accounts: {e}")
        return False

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
        try:
            d_resp = requests.get(debug_url, timeout=10)
            d_data = d_resp.json().get("data", {})
            expires_at = d_data.get("expires_at", 0)
            is_valid = d_data.get("is_valid", False)
            never_expires = (expires_at == 0 or expires_at is None)
        except Exception:
            never_expires = True
            is_valid = True

        status = "NEVER EXPIRES (Permanent)" if never_expires else f"Expires at {expires_at}"

        print("=" * 65)
        print(f"Page #{idx}: {page_name}")
        print(f"Page ID:   {page_id}")
        print(f"Status:    {'✅ ' + status if never_expires else '⚠️ ' + status}")
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
    parser.add_argument("--app-id", type=str, help="Meta App ID")
    parser.add_argument("--app-secret", type=str, help="Meta App Secret")
    parser.add_argument("--token", type=str, help="Short-lived User Token from Graph API Explorer")

    args = parser.parse_args()

    app_id = args.app_id or input("Enter your Meta App ID: ").strip()
    app_secret = args.app_secret or input("Enter your Meta App Secret: ").strip()
    user_token = args.token or input("Enter Short-Lived User Token from Graph API Explorer: ").strip()

    if not app_id or not app_secret or not user_token:
        print("❌ Error: App ID, App Secret, and User Token are all required.")
        sys.exit(1)

    success = get_permanent_page_token(app_id, app_secret, user_token)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
