import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// GET /api/media/:id — serve an uploaded media file
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

    const absolutePath = path.isAbsolute(media.filePath)
      ? media.filePath
      : path.resolve(media.filePath);

    let buffer: Buffer;
    try {
      buffer = await readFile(absolutePath);
    } catch {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Media serve error:', err);
    return NextResponse.json({ error: 'Failed to serve media' }, { status: 500 });
  }
}
