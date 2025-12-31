import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/user/settings
 * Update user settings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, bio, publicSlug, defaultSort, itemsPerPage, isPublic } = body;

    // Validate public slug uniqueness if it changed
    if (publicSlug && publicSlug !== session.user.publicSlug) {
      const existing = await prisma.user.findUnique({
        where: { publicSlug },
      });

      if (existing && existing.id !== session.user.id) {
        return NextResponse.json(
          { error: 'This URL slug is already taken' },
          { status: 400 }
        );
      }
    }

    // Update user settings
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: displayName || null,
        bio: bio || null,
        publicSlug: publicSlug || session.user.publicSlug,
        defaultSort: defaultSort || 'artist',
        itemsPerPage: itemsPerPage || 50,
        isPublic: isPublic !== undefined ? isPublic : true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
