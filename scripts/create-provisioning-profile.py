#!/usr/bin/env python3
"""
Create a new App Store provisioning profile for il.co.ftable.postpilot
via the App Store Connect API, then update the GitHub secret.

Usage:
  py -3.11 scripts/create-provisioning-profile.py

Requires:
  pip install pyjwt requests cryptography
"""

import jwt
import time
import requests
import base64
import subprocess
import sys
import json

# ── Config ──────────────────────────────────────────────────────────────
API_KEY_ID = "6WF8UY7742"
ISSUER_ID = "686f97b8-3f8a-40b7-a6cd-5293a3168439"
# Using 9Soccer ASC API key (confirmed working — runs daily TestFlight)
P8_PATH = r"C:\Projects\_KEYS\9soccer\AuthKey_6WF8UY7742_ASC-API.p8"
BUNDLE_ID = "il.co.ftable.postpilot"
PROFILE_NAME = "PostPilot AppStore Distribution"
TEAM_ID = "3K9KJNGL9U"
GITHUB_REPO = "royea-beep/PostPilot"
BASE = "https://api.appstoreconnect.apple.com/v1"

# ── Generate JWT ────────────────────────────────────────────────────────
def make_token():
    with open(P8_PATH, "r") as f:
        private_key = f.read()
    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 1200,  # 20 minutes
        "aud": "appstoreconnect-v1",
    }
    return jwt.encode(payload, private_key, algorithm="ES256", headers={"kid": API_KEY_ID})

TOKEN = make_token()
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

def api_get(path, params=None):
    r = requests.get(f"{BASE}{path}", headers=HEADERS, params=params)
    if r.status_code != 200:
        print(f"GET {path} -> {r.status_code}")
        print(r.text[:500])
        sys.exit(1)
    return r.json()

def api_post(path, data):
    r = requests.post(f"{BASE}{path}", headers=HEADERS, json=data)
    if r.status_code not in (200, 201):
        print(f"POST {path} -> {r.status_code}")
        print(r.text[:1000])
        sys.exit(1)
    return r.json()

# ── Step 1: Find or register bundle ID ─────────────────────────────────
print(f"[1/5] Looking up bundle ID: {BUNDLE_ID}")
resp = api_get("/bundleIds", {"filter[identifier]": BUNDLE_ID})
bundle_ids = resp.get("data", [])

if bundle_ids:
    bundle_id_resource = bundle_ids[0]["id"]
    print(f"  Found: {bundle_id_resource}")
else:
    print(f"  Not found. Registering...")
    resp = api_post("/bundleIds", {
        "data": {
            "type": "bundleIds",
            "attributes": {
                "identifier": BUNDLE_ID,
                "name": "PostPilot",
                "platform": "IOS",
            }
        }
    })
    bundle_id_resource = resp["data"]["id"]
    print(f"  Registered: {bundle_id_resource}")

# ── Step 2: Find distribution certificate ──────────────────────────────
print("[2/5] Finding Apple Distribution certificate...")
resp = api_get("/certificates", {"filter[certificateType]": "DISTRIBUTION"})
certs = resp.get("data", [])

if not certs:
    # Try IOS_DISTRIBUTION type
    resp = api_get("/certificates", {"filter[certificateType]": "IOS_DISTRIBUTION"})
    certs = resp.get("data", [])

if not certs:
    print("  ERROR: No distribution certificate found!")
    print("  Available certificates:")
    all_certs = api_get("/certificates")
    for c in all_certs.get("data", []):
        print(f"    - {c['attributes']['certificateType']}: {c['attributes']['name']} (id={c['id']})")
    sys.exit(1)

cert_id = certs[0]["id"]
print(f"  Found: {certs[0]['attributes']['name']} (id={cert_id})")

# ── Step 3: Delete old profiles with same name (cleanup) ───────────────
print(f"[3/5] Checking for existing profiles named '{PROFILE_NAME}'...")
resp = api_get("/profiles", {"filter[name]": PROFILE_NAME})
for p in resp.get("data", []):
    pid = p["id"]
    print(f"  Deleting old profile: {pid}")
    requests.delete(f"{BASE}/profiles/{pid}", headers=HEADERS)

# ── Step 4: Create new provisioning profile ────────────────────────────
print("[4/5] Creating new provisioning profile...")
resp = api_post("/profiles", {
    "data": {
        "type": "profiles",
        "attributes": {
            "name": PROFILE_NAME,
            "profileType": "IOS_APP_STORE",
        },
        "relationships": {
            "bundleId": {
                "data": {
                    "type": "bundleIds",
                    "id": bundle_id_resource,
                }
            },
            "certificates": {
                "data": [
                    {"type": "certificates", "id": cert_id}
                ]
            },
        }
    }
})

profile_data = resp["data"]
profile_content_b64 = profile_data["attributes"]["profileContent"]
profile_uuid = profile_data["attributes"]["uuid"]
print(f"  Created! UUID: {profile_uuid}")

# ── Step 5: Update GitHub secrets ──────────────────────────────────────
print("[5/5] Updating provisioning profile GitHub secrets...")

# The API returns profile content as base64 already
# Decode it first, then re-encode to match what the workflow expects
profile_bytes = base64.b64decode(profile_content_b64)

# Save locally too
local_path = r"C:\Projects\PostPilot\PostPilot_AppStore.mobileprovision"
with open(local_path, "wb") as f:
    f.write(profile_bytes)
print(f"  Saved locally: {local_path}")

# Re-encode for GitHub secret (base64, no newlines)
profile_b64_clean = base64.b64encode(profile_bytes).decode("ascii")

# Set both secret names (workflow checks both)
success = True
for secret_name in ["PROVISIONING_PROFILE_BASE64", "IOS_PROVISIONING_PROFILE_BASE64"]:
    result = subprocess.run(
        ["gh", "secret", "set", secret_name,
         "--repo", GITHUB_REPO, "--body", profile_b64_clean],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print(f"  OK: {secret_name} updated")
    else:
        print(f"  FAILED: {secret_name}: {result.stderr}")
        success = False

if not success:
    # Write to file as fallback
    b64_path = r"C:\Projects\PostPilot\profile_base64.txt"
    with open(b64_path, "w") as f:
        f.write(profile_b64_clean)
    print(f"\n  Fallback: base64 saved to {b64_path}")
    print(f"  Run manually:")
    print(f"    gh secret set PROVISIONING_PROFILE_BASE64 --repo {GITHUB_REPO} < {b64_path}")
    print(f"    gh secret set IOS_PROVISIONING_PROFILE_BASE64 --repo {GITHUB_REPO} < {b64_path}")

print("\nDone! New provisioning profile created for il.co.ftable.postpilot")
print(f"  Profile UUID: {profile_uuid}")
print(f"  Local file:   {local_path}")
print("\nNext: re-trigger the TestFlight workflow:")
print(f"  gh workflow run ios-testflight.yml --repo {GITHUB_REPO} --ref main")
