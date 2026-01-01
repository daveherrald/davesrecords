/**
 * Admin API: Ban/Unban User
 * POST /api/admin/users/[userId]/ban - Ban a user
 * DELETE /api/admin/users/[userId]/ban - Unban a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/admin/audit';

interface RouteParams {
  params: {
    userId: string;
  };
}

/**
 * POST - Ban a user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    const { userId } = params;
    const body = await request.json();
    const { reason } = body;

    // Prevent self-ban
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot ban your own account' },
        { status: 400 }
      );
    }

    // Validate that user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status === 'BANNED') {
      return NextResponse.json(
        { error: 'User is already banned' },
        { status: 400 }
      );
    }

    // Ban the user
    const bannedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'BANNED',
        bannedAt: new Date(),
        bannedReason: reason || 'No reason provided',
        bannedBy: session.user.id,
      },
    });

    // Delete all active sessions for the banned user
    await prisma.session.deleteMany({
      where: { userId },
    });

    await logAdminAction({
      adminId: session.user.id,
      action: 'USER_BAN',
      resource: 'user',
      resourceId: userId,
      targetUserId: userId,
      description: `Banned user ${user.email || user.name}`,
      metadata: { reason: reason || 'No reason provided' },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      user: bannedUser,
      message: 'User banned and sessions terminated',
    });
  } catch (error) {
    console.error('Ban user error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
  }
}

/**
 * DELETE - Unban a user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    const { userId } = params;

    // Validate that user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status !== 'BANNED') {
      return NextResponse.json(
        { error: 'User is not banned' },
        { status: 400 }
      );
    }

    // Unban the user
    const unbannedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        bannedAt: null,
        bannedReason: null,
        bannedBy: null,
      },
    });

    await logAdminAction({
      adminId: session.user.id,
      action: 'USER_UNBAN',
      resource: 'user',
      resourceId: userId,
      targetUserId: userId,
      description: `Unbanned user ${user.email || user.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      user: unbannedUser,
      message: 'User unbanned successfully',
    });
  } catch (error) {
    console.error('Unban user error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
  }
}
