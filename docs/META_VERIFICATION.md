# Meta Business Verification Guide for PostPilot

## What is Meta Business Verification?

Meta Business Verification is the process by which Meta (Facebook/Instagram) confirms that your business is legitimate. It is **required** before your app can request advanced permissions like publishing posts on behalf of users, reading page engagement metrics, and managing Instagram content.

Without verification, PostPilot can only operate in "development mode" with limited access (up to 5 test users, no live publishing).

---

## Required Permissions (Scopes)

PostPilot needs the following permissions to function fully:

| Permission | Purpose |
|-----------|---------|
| `pages_manage_posts` | Publish posts to Facebook Pages on behalf of users |
| `instagram_content_publish` | Publish photos/videos/carousels to Instagram Business accounts |
| `pages_read_engagement` | Read likes, comments, shares for analytics |

Additional permissions that may be useful later:
- `instagram_basic` — Read Instagram profile info and media
- `pages_show_list` — List pages the user manages
- `business_management` — Access Business Manager assets

---

## Step-by-Step Application Process

### 1. Create a Meta Business Account
- Go to [Meta Business Manager](https://business.facebook.com/settings)
- Click "Create Account" if you don't have one
- Fill in business name, your name, and business email

### 2. Add Your Business Details
- Navigate to **Business Settings > Business Info**
- Fill in:
  - Legal business name
  - Address
  - Phone number
  - Website (use your PostPilot domain)
  - Business type

### 3. Submit Verification Documents
Meta requires **two documents**:

**Document 1 — Business Identity** (one of):
- Business license / registration certificate
- Tax registration document
- Formation documents (articles of incorporation)
- Utility bill with business name and address

**Document 2 — Phone/Address Verification** (one of):
- Utility bill (electric, water, internet)
- Bank statement
- Business phone bill

> **Important:** Documents must show the same business name and address you entered in Business Info.

### 4. Create Your App in Meta Developer Portal
- Go to [Meta for Developers](https://developers.facebook.com)
- Create a new app → select "Business" type
- Link it to your Business Manager account
- Add "Facebook Login" and "Instagram Graph API" products

### 5. Request Permissions via App Review
- In the App Dashboard, go to **App Review > Permissions and Features**
- Request each permission listed above
- For each permission, you must provide:
  - A description of how the permission will be used
  - A screencast/video demonstrating the feature
  - Step-by-step instructions for reviewers to test

### 6. Submit for App Review
- Ensure your app has a Privacy Policy URL
- Ensure your app has a valid Terms of Service URL
- Set your app to "Live" mode
- Submit for review

---

## What to Say in "Explain Your App" Section

Use this template:

> PostPilot is a social media management tool that helps small businesses and content creators manage their social media presence. Users upload media content, and our AI generates optimized captions tailored to each platform. Users review, edit, and approve captions before publishing.
>
> **pages_manage_posts**: We publish user-approved posts directly to their Facebook Pages. Users explicitly select which Page to publish to and review all content before it goes live.
>
> **instagram_content_publish**: We publish user-approved photos and videos to their Instagram Business accounts. Users review and approve all content before publishing.
>
> **pages_read_engagement**: We read engagement metrics (likes, comments, shares) on published posts to help users understand their content performance and optimize future posts.

---

## Expected Timeline

| Stage | Duration |
|-------|----------|
| Business Verification submission | 1-3 business days to receive verification request |
| Document review | 2-7 business days |
| App Review (permissions) | 2-5 business days per permission |
| **Total estimated** | **2-4 weeks** |

---

## Tips to Get Approved Faster

1. **Use a real business entity** — Sole proprietor is fine, but have proper documentation
2. **Make your app look professional** — Meta reviewers will visit your URLs
3. **Record clear screencasts** — Show the exact flow: upload → generate → review → publish
4. **Privacy Policy must be real** — Include data handling, third-party APIs, deletion rights
5. **Don't request permissions you don't use** — Only request what PostPilot actually needs
6. **Respond to Meta quickly** — If they ask follow-up questions, reply within 24 hours
7. **Test everything in Development mode first** — Make sure the flow works with test users before requesting live access
8. **Use the official Graph API Explorer** to verify your token scopes work correctly
9. **Ensure your redirect URIs exactly match** what's configured in the app settings

---

## Current Status

PostPilot is currently in **Development Mode**. Once Meta Business Verification and App Review are approved, direct publishing will be enabled automatically for all users.

Track status at: [Meta Business Manager](https://business.facebook.com/settings) > Security Center > Verification
