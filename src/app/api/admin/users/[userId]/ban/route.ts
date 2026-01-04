/**
 * Admin API: Ban/Unban User
 * POST /api/admin/users/[userId]/ban - Ban a user
 * DELETE /api/admin/users/[userId]/ban - Unban a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  logAccountChange,
  actorFromSession,
  endpointFromRequest,
  OCSF_ACTIVITY,
  OCSF_STATUS,
  OCSF_SEVERITY,
} from '@/lib/audit';

/**
 * POST - Ban a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin();
    const { userId } = await params;
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
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        bannedAt: true,
        bannedReason: true,
      },
    });

    // Delete all active sessions for the banned user
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Log user ban (Account Change: Disable)
    try {
      await logAccountChange(
        OCSF_ACTIVITY.ACCOUNT_CHANGE.DISABLE,
        `Admin banned user ${user.email || user.name}`,
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
          rawData: { reason: reason || 'No reason provided' },
        }
      );
    } catch (logError) {
      console.error('Failed to log user ban (non-fatal):', logError);
    }

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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin();
    const { userId } = await params;

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
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    // Log user unban (Account Change: Enable)
    try {
      await logAccountChange(
        OCSF_ACTIVITY.ACCOUNT_CHANGE.ENABLE,
        `Admin unbanned user ${user.email || user.name}`,
        {
          userId,
          email: user.email,
          name: user.name,
        },
        {
          actor: actorFromSession(session),
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
        }
      );
    } catch (logError) {
      console.error('Failed to log user unban (non-fatal):', logError);
    }

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
