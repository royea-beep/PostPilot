# Verify ftable caption API

Use this to confirm `POST /api/ftable/caption` is deployed and protected.

## 1. Without API key (expect 401)

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST https://YOUR_POSTPILOT_URL/api/ftable/caption \
  -H "Content-Type: application/json" \
  -d "{\"topic\":\"test post\"}"
```

Expected: **401** (Unauthorized). If you get 200, the route is not checking the key.

## 2. With API key (expect 200 + JSON)

```bash
curl -s -X POST https://YOUR_POSTPILOT_URL/api/ftable/caption \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_POSTPILOT_FTABLE_API_KEY" \
  -d "{\"topic\":\"test post\",\"platform\":\"telegram\",\"language\":\"he\"}"
```

Expected: **200** and body like `{"caption":"...","hashtags":[...]}`.

## 3. Rate limit (optional)

Send 31+ requests in a short time without key. After the limit (30 per 15 min per IP), you should get **429** and a `Retry-After` header.

---

Replace `YOUR_POSTPILOT_URL` with your deployed URL (e.g. Vercel). Replace `YOUR_POSTPILOT_FTABLE_API_KEY` with the value in your host env (and in ftable’s Supabase Edge secrets as `POSTPILOT_API_KEY`).
