/**
 * Admin API: User CRUD
 * GET /api/admin/users/[userId] - Get user details
 * PATCH /api/admin/users/[userId] - Update user settings
 * DELETE /api/admin/users/[userId] - Delete user permanently
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/admin/audit';

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
      include: {
        discogsConnection: {
          select: {
            discogsUsername: true,
            discogsId: true,
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

    // Try to log the action, but don't fail if it errors
    try {
      await logAdminAction({
        adminId: session.user.id,
        action: 'SETTINGS_VIEW',
        resource: 'user',
        resourceId: userId,
        targetUserId: userId,
        description: `Viewed user details for ${user.email || user.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (logError) {
      console.error('Failed to log admin action (non-fatal):', logError);
    }

    return NextResponse.json({
      ...user,
      hasDiscogsConnection: !!user.discogsConnection,
      actionCounts: {
        performed: user._count.adminActions,
        received: user._count.receivedActions,
        sessions: user._count.sessions,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);

    // Log the full error details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

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
      include: {
        discogsConnection: {
          select: {
            discogsUsername: true,
            discogsId: true,
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

    await logAdminAction({
      adminId: session.user.id,
      action: 'USER_EDIT',
      resource: 'user',
      resourceId: userId,
      targetUserId: userId,
      description: `Updated user settings for ${existingUser.email || existingUser.name}`,
      metadata: { changes: body },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      ...updatedUser,
      hasDiscogsConnection: !!updatedUser.discogsConnection,
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

    await logAdminAction({
      adminId: session.user.id,
      action: 'USER_DELETE',
      resource: 'user',
      resourceId: userId,
      description: `Permanently deleted user ${user.email || user.name}`,
      metadata: {
        deletedUser: {
          email: user.email,
          name: user.name,
          publicSlug: user.publicSlug,
        },
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
