import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCaptions } from '@/lib/ai-captions';

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
    const options = await generateCaptions({
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
      options.map((opt, i) =>
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

    return NextResponse.json(
      drafts.map((d, i) => ({
        id: d.id,
        caption: d.caption,
        hashtags: options[i].hashtags,
        style: options[i].style,
        format: d.format,
        optionIndex: d.optionIndex,
      }))
    );
  } catch (err) {
    console.error('Drafts error:', err);
    return NextResponse.json({ error: 'Failed to generate captions' }, { status: 500 });
  }
}
