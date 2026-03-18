import { NextRequest, NextResponse } from 'next/server';
import { generateCaptions } from '@/lib/ai-captions';
import { ftableCaptionLimiter, applyRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/ftable/caption
 * Server-to-server: ftable auto-post-social can call this to get AI captions.
 * Auth: x-api-key must match POSTPILOT_FTABLE_API_KEY.
 *
 * New format (poker episodes):
 *   Body: { tournament, episode?, title, players?, youtube_url?, platform?, timing? }
 *   Returns: { short, medium, long, hashtags }
 *
 * Legacy format (still supported):
 *   Body: { topic, platform?, language? }
 *   Returns: { caption, hashtags }
 */
export async function POST(req: NextRequest) {
  const rateLimitResponse = await applyRateLimit(ftableCaptionLimiter, req);
  if (rateLimitResponse) return rateLimitResponse;

  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const expectedKey = process.env.POSTPILOT_FTABLE_API_KEY;
  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // ─── New poker-episode format ─────────────────────────────────────
    if (body.tournament || body.title) {
      const tournament = String(body.tournament  ?? '').trim();
      const episode    = Number(body.episode     ?? 0);
      const title      = String(body.title       ?? '').trim();
      const players    = Array.isArray(body.players)
        ? (body.players as string[]).join(', ')
        : '';
      const youtubeUrl = typeof body.youtube_url === 'string' ? body.youtube_url : '';
      const platform   = typeof body.platform    === 'string' ? body.platform    : 'instagram';
      const timing     = typeof body.timing      === 'string' ? body.timing      : 'after';

      if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 });

      const timingContext: Record<string, string> = {
        before: 'לפני הטורניר — צור הכרזה שמעוררת ציפייה',
        during: 'במהלך הטורניר — עדכון חי מהמשחק',
        after:  'לאחר הטורניר — שתף את הפרק שהועלה',
      };

      const contextNote = timingContext[timing] ?? timingContext['after'];
      const lines = [
        tournament && `טורניר: ${tournament}`,
        episode > 0 && `פרק ${episode}`,
        `כותרת: ${title}`,
        players && `שחקנים: ${players}`,
        youtubeUrl && `קישור: ${youtubeUrl}`,
        `פלטפורמה: ${platform}`,
        contextNote,
      ].filter(Boolean) as string[];
      const customPrompt = lines.join('\n');

      // Three parallel calls — one per length variant
      const [shortRes, mediumRes, longRes] = await Promise.all([
        generateCaptions({
          format: 'story',
          platforms: ['instagram'],
          mediaType: 'video',
          brandName: 'Feature Table',
          industry: 'Israeli filmed poker league',
          language: 'he',
          styleProfile: null,
          customPrompt: `${customPrompt}\n\nכתוב רק 1-2 שורות קצרות עם אימוג׳ים — מתאים ל-Stories ו-TikTok.`,
        }),
        generateCaptions({
          format: 'reel',
          platforms: ['instagram'],
          mediaType: 'video',
          brandName: 'Feature Table',
          industry: 'Israeli filmed poker league',
          language: 'he',
          styleProfile: null,
          customPrompt: `${customPrompt}\n\nכתוב 3-5 שורות עם האשטגים — מתאים לפוסט Instagram Feed.`,
        }),
        generateCaptions({
          format: 'post',
          platforms: ['facebook'],
          mediaType: 'video',
          brandName: 'Feature Table',
          industry: 'Israeli filmed poker league',
          language: 'he',
          styleProfile: null,
          customPrompt: `${customPrompt}\n\nכתוב פוסט מלא עם הקשר, תיאור הפרק, קישור וקריאה לפעולה — מתאים לפייסבוק.`,
        }),
      ]);

      const shortCaption  = shortRes.options[0];
      const mediumCaption = mediumRes.options[0];
      const longCaption   = longRes.options[0];
      const hashtags      = mediumCaption?.hashtags ?? shortCaption?.hashtags ?? ['פוקר', 'FeatureTable'];

      return NextResponse.json({
        short:  shortCaption?.caption  ?? '',
        medium: mediumCaption?.caption ?? '',
        long:   longCaption?.caption   ?? '',
        hashtags,
      });
    }

    // ─── Legacy format ────────────────────────────────────────────────
    const topic    = typeof body.topic    === 'string' ? body.topic.trim() : '';
    const platform = typeof body.platform === 'string' ? body.platform     : 'telegram';
    const language = (body.language === 'en' ? 'en' : 'he') as 'he' | 'en';

    if (!topic) {
      return NextResponse.json({ error: 'Missing topic or tournament' }, { status: 400 });
    }

    const result = await generateCaptions({
      format: 'post',
      platforms: [platform],
      mediaType: 'photo',
      brandName: 'Feature Table',
      industry: 'Israeli filmed poker league',
      language,
      styleProfile: null,
      customPrompt: `Use this as the content to turn into a single social caption. Keep all facts, links, and key info. Post topic:\n\n${topic}`,
    });

    const option = result.options[0];
    if (!option) {
      return NextResponse.json({ error: 'No caption generated' }, { status: 500 });
    }

    return NextResponse.json({
      caption:  option.caption,
      hashtags: option.hashtags,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('ftable caption error:', err);
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 });
  }
}
