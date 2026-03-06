import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/media/:id — redirect to media file URL
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

    // filePath is now a Vercel Blob URL — redirect to it
    return NextResponse.redirect(media.filePath, 302);
  } catch (err) {
    console.error('Media serve error:', err);
    return NextResponse.json({ error: 'Failed to serve media' }, { status: 500 });
  }
}
