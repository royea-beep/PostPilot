import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCaptions } from '@/lib/ai-captions';
import { emitServerEvent } from '@/lib/learning';

// POST /api/drafts — generate 3 AI caption options (public, uses brand token)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandToken, mediaId, format, platforms, customPrompt } = body;

    if (!brandToken || !mediaId || !format || !platforms?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate brand
    const brand = await prisma.brand.findUnique({
      where: { token: brandToken },
      include: { styleProfile: true },
    });
    if (!brand) return NextResponse.json({ error: 'Invalid brand token' }, { status: 404 });

    // Validate media
    const media = await prisma.mediaUpload.findFirst({
      where: { id: mediaId, brandId: brand.id },
    });
    if (!media) return NextResponse.json({ error: 'Media not found' }, { status: 404 });

    // Generate AI captions
    const result = await generateCaptions({
      format,
      platforms,
      mediaType: media.mediaType as 'photo' | 'video',
      brandName: brand.name,
      industry: brand.industry,
      language: brand.language,
      styleProfile: brand.styleProfile,
      customPrompt,
    });

    // Save drafts
    const drafts = await Promise.all(
      result.options.map((opt, i) =>
        prisma.postDraft.create({
          data: {
            brandId: brand.id,
            mediaId: media.id,
            caption: opt.caption,
            hashtags: JSON.stringify(opt.hashtags),
            format,
            platforms: JSON.stringify(platforms),
            optionIndex: i + 1,
          },
        })
      )
    );

    // Record style event for generation (tracks AI inputs/outputs)
    await prisma.styleEvent.create({
      data: {
        brandId: brand.id,
        eventType: 'GENERATION',
        contentItemId: media.id,
        generatedCaptions: JSON.stringify(result.options.map((o) => o.caption)),
        source: result.aiUsage ? 'ai' : 'template',
      },
    }).catch(() => {}); // Non-blocking

    // Learning hook: postGenerated
    for (const p of platforms) {
      emitServerEvent('post_generated', 'content', result.options[0]?.caption?.length ?? 0, {
        platform: p,
        style: format,
      });
    }

    return NextResponse.json({
      drafts: drafts.map((d, i) => ({
        id: d.id,
        caption: d.caption,
        hashtags: result.options[i].hashtags,
        style: result.options[i].style,
        format: d.format,
        optionIndex: d.optionIndex,
      })),
      aiUsage: result.aiUsage,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Drafts error:', err);
    return NextResponse.json({ error: 'Failed to generate captions' }, { status: 500 });
  }
}
