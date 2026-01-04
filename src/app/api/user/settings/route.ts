import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  logAccountChange,
  actorFromSession,
  endpointFromRequest,
  OCSF_ACTIVITY,
  OCSF_STATUS,
} from '@/lib/audit';

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
    const { displayName, bio, publicSlug, defaultSort, itemsPerPage, isPublic, albumCountDisplay } = body;

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
        albumCountDisplay: albumCountDisplay || 'PUBLIC_ONLY',
      },
    });

    // Log settings update
    try {
      await logAccountChange(
        OCSF_ACTIVITY.ACCOUNT_CHANGE.OTHER,
        'User updated profile settings',
        {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
        {
          actor: actorFromSession(session),
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
          rawData: {
            changes: {
              displayName,
              bio: bio ? '[set]' : '[cleared]',
              publicSlug,
              defaultSort,
              itemsPerPage,
              isPublic,
              albumCountDisplay,
            },
          },
        }
      );
    } catch (logError) {
      console.error('Failed to log settings update (non-fatal):', logError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
