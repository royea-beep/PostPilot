import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/brands/public?token=xxx — public brand info for client page
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const brand = await prisma.brand.findUnique({
    where: { token },
    select: {
      name: true,
      language: true,
      industry: true,
      socialConnections: {
        where: { status: { in: ['ACTIVE', 'CONNECTED'] } },
        select: { platform: true },
      },
    },
  });

  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  return NextResponse.json({
    name: brand.name,
    language: brand.language,
    connectedPlatforms: brand.socialConnections.map(c => c.platform),
  });
}
