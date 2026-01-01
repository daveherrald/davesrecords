/**
 * Admin API: Role Management
 * PATCH /api/admin/users/[userId]/role - Promote/demote user role
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/admin/audit';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    userId: string;
  };
}

/**
 * PATCH - Update user role (promote to ADMIN or demote to USER)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    const { userId } = params;
    const body = await request.json();
    const { role } = body as { role: UserRole };

    // Validate role
    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be USER or ADMIN' },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (userId === session.user.id && role === 'USER') {
      return NextResponse.json(
        { error: 'Cannot demote your own account' },
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

    if (user.role === role) {
      return NextResponse.json(
        { error: `User is already a ${role}` },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    const action = role === 'ADMIN' ? 'USER_PROMOTE' : 'USER_DEMOTE';
    const description =
      role === 'ADMIN'
        ? `Promoted ${user.email || user.name} to ADMIN`
        : `Demoted ${user.email || user.name} to USER`;

    await logAdminAction({
      adminId: session.user.id,
      action,
      resource: 'user',
      resourceId: userId,
      targetUserId: userId,
      description,
      metadata: { previousRole: user.role, newRole: role },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error('Update role error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
