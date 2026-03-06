import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { analyzeAndUpdateStyleProfile } from '@/lib/style-engine';

// POST /api/brands/:id/analyze — analyze posting style for a brand
export const POST = withAuth(async (req: NextRequest, userId: string) => {
  // Extract brand ID from the URL pathname
  const segments = req.nextUrl.pathname.split('/');
  // URL: /api/brands/<id>/analyze -> segments: ['', 'api', 'brands', '<id>', 'analyze']
  const brandId = segments[3];

  if (!brandId) {
    return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
  }

  try {
    // Verify the brand exists and belongs to the authenticated user
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true, userId: true },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (brand.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run the style analysis
    await analyzeAndUpdateStyleProfile(brandId);

    // Return the updated style profile
    const styleProfile = await prisma.styleProfile.findUnique({
      where: { brandId },
    });

    return NextResponse.json(styleProfile);
  } catch (err) {
    console.error('Style analysis error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
