/**
 * Admin API: User CRUD
 * GET /api/admin/users/[userId] - Get user details
 * PATCH /api/admin/users/[userId] - Update user settings
 * DELETE /api/admin/users/[userId] - Delete user permanently
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  logApiActivity,
  logAccountChange,
  actorFromSession,
  endpointFromRequest,
  OCSF_ACTIVITY,
  OCSF_STATUS,
  OCSF_SEVERITY,
} from '@/lib/audit';

/**
 * GET - Fetch user details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin();
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        displayName: true,
        bio: true,
        publicSlug: true,
        isPublic: true,
        defaultSort: true,
        itemsPerPage: true,
        role: true,
        status: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
        updatedAt: true,
        discogsConnection: {
          select: {
            id: true,
            discogsUsername: true,
            discogsId: true,
            name: true,
            isPrimary: true,
            connectedAt: true,
          },
        },
        _count: {
          select: {
            sessions: true,
            adminActions: true,
            receivedActions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log admin viewing user details (API Activity: Read)
    try {
      await logApiActivity(
        OCSF_ACTIVITY.API_ACTIVITY.READ,
        `Admin viewed user details for ${user.email || user.name}`,
        {
          operation: 'GET',
          endpoint: `/api/admin/users/${userId}`,
        },
        {
          actor: actorFromSession(session),
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
          resources: [{ type: 'User', id: userId, name: user.email || user.name || undefined }],
        }
      );
    } catch (logError) {
      // Non-fatal logging error
    }

    return NextResponse.json({
      ...user,
      hasDiscogsConnection: user.discogsConnection.length > 0,
      actionCounts: {
        performed: user._count.adminActions,
        received: user._count.receivedActions,
        sessions: user._count.sessions,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update user settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin();
    const { userId } = await params;
    const body = await request.json();

    // Validate that user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract allowed fields for update
    const { displayName, bio, publicSlug, isPublic, defaultSort, itemsPerPage } = body;

    // If updating publicSlug, check for uniqueness
    if (publicSlug && publicSlug !== existingUser.publicSlug) {
      const existingSlug = await prisma.user.findUnique({
        where: { publicSlug },
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: 'Public slug already in use' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(publicSlug !== undefined && { publicSlug }),
        ...(isPublic !== undefined && { isPublic }),
        ...(defaultSort !== undefined && { defaultSort }),
        ...(itemsPerPage !== undefined && { itemsPerPage }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        bio: true,
        publicSlug: true,
        isPublic: true,
        defaultSort: true,
        itemsPerPage: true,
        role: true,
        status: true,
        discogsConnection: {
          select: {
            id: true,
            discogsUsername: true,
            discogsId: true,
            name: true,
            isPrimary: true,
            connectedAt: true,
          },
        },
        _count: {
          select: {
            sessions: true,
            adminActions: true,
            receivedActions: true,
          },
        },
      },
    });

    // Log admin editing user (Account Change: Other)
    try {
      await logAccountChange(
        OCSF_ACTIVITY.ACCOUNT_CHANGE.OTHER,
        `Admin updated user settings for ${existingUser.email || existingUser.name}`,
        {
          userId,
          email: existingUser.email,
          name: existingUser.name,
        },
        {
          actor: actorFromSession(session),
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
          rawData: { changes: body },
        }
      );
    } catch (logError) {
      console.error('Failed to log user edit (non-fatal):', logError);
    }

    return NextResponse.json({
      ...updatedUser,
      hasDiscogsConnection: updatedUser.discogsConnection.length > 0,
      actionCounts: {
        performed: updatedUser._count.adminActions,
        received: updatedUser._count.receivedActions,
        sessions: updatedUser._count.sessions,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

/**
 * DELETE - Permanently delete user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin();
    const { userId } = await params;

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log user deletion (Account Change: Delete)
    try {
      await logAccountChange(
        OCSF_ACTIVITY.ACCOUNT_CHANGE.DELETE,
        `Admin permanently deleted user ${user.email || user.name}`,
        {
          userId,
          email: user.email,
          name: user.name,
        },
        {
          actor: actorFromSession(session),
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
          severityId: OCSF_SEVERITY.HIGH,
          rawData: {
            deletedUser: {
              email: user.email,
              name: user.name,
              publicSlug: user.publicSlug,
            },
          },
        }
      );
    } catch (logError) {
      console.error('Failed to log user deletion (non-fatal):', logError);
    }

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
