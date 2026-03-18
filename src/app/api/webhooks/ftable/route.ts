import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCaptions } from '@/lib/ai-captions';

/**
 * POST /api/webhooks/ftable
 *
 * Receives episode-scheduled events from ftable-editor dashboard.
 * Auth: X-FTable-Secret must match FTABLE_WEBHOOK_SECRET env var.
 *
 * Body:
 * {
 *   event:            "episode_scheduled"
 *   tournament:       string          — e.g. "AGAME Full 27.01.26"
 *   episode:          number
 *   title:            string          — Hebrew episode title
 *   youtube_url:      string
 *   youtube_video_id: string
 *   publish_at:       string          — ISO 8601 UTC
 *   thumbnail_url?:   string | null
 *   players?:         string[]
 *   shorts?:          string[]
 *   brand_token?:     string          — PostPilot brand token (optional)
 * }
 *
 * Returns:
 * { ok: true, posts_created: number, captions: { short, medium, long, hashtags } }
 */

interface WebhookBody {
  event:            string;
  tournament:       string;
  episode:          number;
  title:            string;
  youtube_url:      string;
  youtube_video_id: string;
  publish_at:       string;
  thumbnail_url?:   string | null;
  players?:         string[];
  shorts?:          string[];
  brand_token?:     string;
}

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────
  const secret         = req.headers.get('x-ftable-secret');
  const expectedSecret = process.env.FTABLE_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = (await req.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.event !== 'episode_scheduled') {
    // Silently accept unknown events — forward-compat
    return NextResponse.json({ ok: true, posts_created: 0, skipped: true });
  }

  const { tournament, episode, title, youtube_url, youtube_video_id, publish_at, thumbnail_url, players, brand_token } = body;

  if (!title || !youtube_video_id || !publish_at) {
    return NextResponse.json({ error: 'Missing required fields: title, youtube_video_id, publish_at' }, { status: 400 });
  }

  // ── Find brand ───────────────────────────────────────────────────────
  const brand = brand_token
    ? await prisma.brand.findUnique({ where: { token: brand_token }, include: { socialConnections: true } })
    : await prisma.brand.findFirst({
        where: { name: { contains: 'Feature Table' } },
        include: { socialConnections: true },
        orderBy: { createdAt: 'asc' },
      });

  if (!brand) {
    // Return 200 so ftable-editor shows a friendly message, not an error
    return NextResponse.json(
      {
        ok: false,
        posts_created: 0,
        note: 'No brand found. Create a "Feature Table" brand at postpilot.ftable.co.il, then pass brand_token in the webhook payload.',
        setup_url: 'https://postpilot.ftable.co.il/register',
      },
      { status: 200 },
    );
  }

  // Active connections for Instagram + Facebook only (TikTok manual for now)
  const activeConnections = brand.socialConnections.filter(
    (c) => c.status === 'ACTIVE' || c.status === 'CONNECTED',
  ).filter((c) => ['instagram', 'facebook'].includes(c.platform));

  // ── Generate Hebrew captions ─────────────────────────────────────────
  let captions = { short: '', medium: '', long: '', hashtags: [] as string[] };

  const playersStr = Array.isArray(players) ? players.join(', ') : '';
  const basePrompt = [
    `טורניר: ${tournament}`,
    episode > 0 ? `פרק ${episode}` : '',
    `כותרת: ${title}`,
    playersStr ? `שחקנים: ${playersStr}` : '',
    youtube_url ? `קישור: ${youtube_url}` : '',
    'לאחר הטורניר — שתף את הפרק שהועלה',
  ].filter(Boolean).join('\n');

  try {
    const [shortRes, mediumRes, longRes] = await Promise.all([
      generateCaptions({
        format: 'story', platforms: ['instagram'], mediaType: 'video',
        brandName: 'Feature Table', industry: 'Israeli filmed poker league',
        language: 'he', styleProfile: null,
        customPrompt: `${basePrompt}\n\nכתוב רק 1-2 שורות קצרות עם אימוג׳ים — מתאים ל-Stories.`,
      }),
      generateCaptions({
        format: 'reel', platforms: ['instagram'], mediaType: 'video',
        brandName: 'Feature Table', industry: 'Israeli filmed poker league',
        language: 'he', styleProfile: null,
        customPrompt: `${basePrompt}\n\nכתוב 3-5 שורות עם האשטגים — מתאים ל-Instagram Feed.`,
      }),
      generateCaptions({
        format: 'post', platforms: ['facebook'], mediaType: 'video',
        brandName: 'Feature Table', industry: 'Israeli filmed poker league',
        language: 'he', styleProfile: null,
        customPrompt: `${basePrompt}\n\nכתוב פוסט מלא עם הקשר, תיאור הפרק, קישור וקריאה לפעולה — מתאים לפייסבוק.`,
      }),
    ]);
    captions = {
      short:    shortRes.options[0]?.caption  ?? '',
      medium:   mediumRes.options[0]?.caption ?? '',
      long:     longRes.options[0]?.caption   ?? '',
      hashtags: mediumRes.options[0]?.hashtags ?? ['פוקר', 'FeatureTable'],
    };
  } catch {
    // Caption generation failed — proceed with empty captions, posts still created
    captions.medium = `${title} — צפו עכשיו ביוטיוב! ${youtube_url}`;
  }

  // ── Create MediaUpload placeholder ───────────────────────────────────
  // fileData stores the YouTube thumbnail URL (Phase 2 will fetch + base64 encode it)
  const thumbUrl = thumbnail_url ?? `https://img.youtube.com/vi/${youtube_video_id}/maxresdefault.jpg`;

  const media = await prisma.mediaUpload.create({
    data: {
      brandId:   brand.id,
      filename:  `youtube_${youtube_video_id}.jpg`,
      mimeType:  'image/jpeg',
      sizeBytes: 0,                 // unknown — placeholder
      filePath:  thumbUrl,          // YouTube thumbnail public URL
      fileData:  thumbUrl,          // also stored here for publish service compatibility
      mediaType: 'photo',
    },
  });

  // ── Parse scheduled time ──────────────────────────────────────────────
  const publishAt   = new Date(publish_at);
  const feedAt      = new Date(publishAt.getTime() - 30 * 60 * 1000);   // 30 min before
  const storyAt     = new Date(publishAt.getTime() - 60 * 60 * 1000);   // 1 hour before

  // ── Create PostDraft ─────────────────────────────────────────────────
  const draft = await prisma.postDraft.create({
    data: {
      brandId:      brand.id,
      mediaId:      media.id,
      caption:      captions.medium || captions.short,
      hashtags:     JSON.stringify(captions.hashtags),
      format:       'post',
      platforms:    JSON.stringify(activeConnections.map((c) => c.platform)),
      optionIndex:  1,
      selected:     true,
      chosenAt:     new Date(),
    },
  });

  // ── Create scheduled Posts per connection ────────────────────────────
  let postsCreated = 0;

  for (const conn of activeConnections) {
    const isInstagram = conn.platform === 'instagram';
    const caption     = isInstagram ? captions.medium  : captions.long || captions.medium;
    const schedAt     = isInstagram ? feedAt            : feedAt;          // both 30 min before

    await prisma.post.create({
      data: {
        brandId:      brand.id,
        mediaId:      media.id,
        draftId:      draft.id,
        connectionId: conn.id,
        caption:      caption || draft.caption,
        hashtags:     JSON.stringify(captions.hashtags),
        format:       'post',
        platform:     conn.platform,
        status:       'SCHEDULED',
        scheduledFor: schedAt,
      },
    });
    postsCreated++;

    // Also create an Instagram Story 1h before (Instagram only)
    if (isInstagram) {
      await prisma.post.create({
        data: {
          brandId:      brand.id,
          mediaId:      media.id,
          draftId:      draft.id,
          connectionId: conn.id,
          caption:      captions.short || caption,
          hashtags:     JSON.stringify(captions.hashtags),
          format:       'story',
          platform:     'instagram',
          status:       'SCHEDULED',
          scheduledFor: storyAt,
        },
      });
      postsCreated++;
    }
  }

  return NextResponse.json({ ok: true, posts_created: postsCreated, captions });
}
