import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
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

    // Validate brand
    const brand = await prisma.brand.findUnique({ where: { token: brandToken } });
    if (!brand) return NextResponse.json({ error: 'Invalid brand token' }, { status: 404 });

    // Validate file
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed. Use JPEG, PNG, WebP, GIF, MP4, MOV, or WebM.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 100MB.' }, { status: 400 });
    }

    // Save file
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = path.resolve('uploads', brand.id);
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';

    const upload = await prisma.mediaUpload.create({
      data: {
        brandId: brand.id,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        filePath,
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
