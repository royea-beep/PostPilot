import { NextRequest, NextResponse } from 'next/server';
import { generateCaptions } from '@/lib/ai-captions';
import { ftableCaptionLimiter, applyRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/ftable/caption
 * Server-to-server: ftable auto-post-social can call this to get one AI caption.
 * Auth: x-api-key must match POSTPILOT_FTABLE_API_KEY.
 * Body: { topic: string, platform?: string, language?: string }
 * Returns: { caption: string, hashtags?: string[] }
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
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const platform = typeof body.platform === 'string' ? body.platform : 'telegram';
    const language = (body.language === 'en' ? 'en' : 'he') as 'he' | 'en';

    if (!topic) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
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
      caption: option.caption,
      hashtags: option.hashtags,
    });
  } catch (err) {
    console.error('ftable caption error:', err);
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 });
  }
}
