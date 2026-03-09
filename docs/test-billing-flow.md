# PostPilot — End-to-End Billing Test Flow

This document describes the full E2E flow to test registration, login, billing (FREE → PRO), and caption generation.

**Prerequisites:** PostPilot running (local or production). LemonSqueezy store in **Test Mode** for steps 5–6.

---

## 1. Register

**Endpoint:** `POST /api/auth/register`

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "YourSecurePassword1!",
  "name": "Test User",
  "businessName": "Test Co"
}
```

**Success:** `201` with `user`, `accessToken`, `refreshToken`. Save `accessToken` for step 3 onward.

---

## 2. Login (get JWT)

**Endpoint:** `POST /api/auth/login`

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "YourSecurePassword1!"
}
```

**Success:** `200` with `user`, `accessToken`, `refreshToken`. Use `accessToken` as `Authorization: Bearer <accessToken>` for authenticated requests.

---

## 3. GET /api/billing (expect FREE)

**Endpoint:** `GET /api/billing`  
**Headers:** `Authorization: Bearer <accessToken>`

**Success:** `200` with:
- `plan`: `"FREE"`
- `subscriptionStatus`, `currentPeriodEnd`, `postsThisMonth`, `brandsCount`, `limits`

---

## 4. POST /api/billing/checkout (start PRO checkout)

**Endpoint:** `POST /api/billing/checkout`  
**Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`  
**Body (JSON):**
```json
{
  "plan": "PRO"
}
```

**Success:** `200` with `{ "url": "https://..." }`. Open `url` in browser to complete checkout in LemonSqueezy (use Test Mode).

---

## 5. Complete checkout in LemonSqueezy Test Mode

- Use LemonSqueezy test card (e.g. **4242 4242 4242 4242**).
- Complete payment. You will be redirected to `NEXT_PUBLIC_APP_URL/dashboard?upgraded=true`.
- In production the redirect is e.g. https://postpilot-app-nine.vercel.app/dashboard?upgraded=true

---

## 6. Webhook → plan PRO

LemonSqueezy sends `subscription_created` to `POST /api/billing/webhook`.  
The handler (HMAC-SHA256 with `LEMONSQUEEZY_WEBHOOK_SECRET`):

- Validates `x-signature`; returns `400` if invalid.
- Updates user: `plan` = PRO, `subscriptionStatus` = ACTIVE, `currentPeriodEnd` from `renews_at`.

Ensure webhook URL in LemonSqueezy dashboard is:  
`https://postpilot-app-nine.vercel.app/api/billing/webhook` (or your production domain).

---

## 7. GET /api/billing (confirm PRO)

**Endpoint:** `GET /api/billing`  
**Headers:** `Authorization: Bearer <accessToken>`

**Success:** `200` with `plan: "PRO"`, `subscriptionStatus: "ACTIVE"`, and PRO limits (e.g. brands, posts).

---

## 8. Create brand within PRO limits

Create a brand via the app (Dashboard → Add brand) or via the brands API. PRO plan allows multiple brands per plan limits.

---

## 9. Generate captions — POST /api/drafts

**Endpoint:** `POST /api/drafts`  
**Headers:** `Content-Type: application/json`  
**Body (JSON):** (uses brand token; no JWT required for this public endpoint)
```json
{
  "brandToken": "<brand.token>",
  "mediaId": "<media.id>",
  "format": "post",
  "platforms": ["instagram", "facebook"],
  "customPrompt": ""
}
```

**Success:** `200` with `drafts` array (e.g. 3 caption options).  
Ensure the brand’s owner is on PRO so usage counts within PRO limits.

---

## Quick checklist

| Step | Action | Expected |
|------|--------|----------|
| 1 | Register | 201, JWT |
| 2 | Login | 200, JWT |
| 3 | GET /api/billing | FREE |
| 4 | POST /api/billing/checkout plan=PRO | 200, checkout URL |
| 5 | Complete checkout (LS test) | Redirect to dashboard |
| 6 | Webhook subscription_created | User plan → PRO |
| 7 | GET /api/billing | PRO, ACTIVE |
| 8 | Create brand | Within PRO limits |
| 9 | POST /api/drafts | 200, 3 drafts |
