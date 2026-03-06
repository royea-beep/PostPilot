import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for DB storage
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
]);

// POST /api/upload — upload media file (public, uses brand token)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const brandToken = formData.get('brandToken') as string | null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!brandToken) return NextResponse.json({ error: 'Missing brand token' }, { status: 400 });

    const brand = await prisma.brand.findUnique({ where: { token: brandToken } });
    if (!brand) return NextResponse.json({ error: 'Invalid brand token' }, { status: 404 });

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed. Use JPEG, PNG, WebP, GIF, MP4, MOV, or WebM.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';

    const upload = await prisma.mediaUpload.create({
      data: {
        brandId: brand.id,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        filePath: `db://${file.name}`,
        fileData: base64,
        mediaType,
      },
    });

    return NextResponse.json({
      id: upload.id,
      filename: upload.filename,
      mediaType: upload.mediaType,
      sizeBytes: upload.sizeBytes,
    }, { status: 201 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
