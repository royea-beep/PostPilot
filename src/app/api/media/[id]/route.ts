import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/media/:id — serve media file from DB
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Missing media ID' }, { status: 400 });
    }

    const media = await prisma.mediaUpload.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    if (!media.fileData) {
      return NextResponse.json({ error: 'File data not available' }, { status: 404 });
    }

    const buffer = Buffer.from(media.fileData, 'base64');

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Media serve error:', err);
    return NextResponse.json({ error: 'Failed to serve media' }, { status: 500 });
  }
}
