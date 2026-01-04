/**
 * Admin API: Role Management
 * PATCH /api/admin/users/[userId]/role - Promote/demote user role
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  logUserAccess,
  actorFromSession,
  endpointFromRequest,
  OCSF_ACTIVITY,
  OCSF_STATUS,
  OCSF_SEVERITY,
} from '@/lib/audit';
import { UserRole } from '@prisma/client';

/**
 * PATCH - Update user role (promote to ADMIN or demote to USER)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin();
    const { userId } = await params;
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Log role change (User Access Management: Assign/Revoke Privileges)
    const isPromotion = role === 'ADMIN';
    try {
      await logUserAccess(
        isPromotion
          ? OCSF_ACTIVITY.USER_ACCESS_MANAGEMENT.ASSIGN_PRIVILEGES
          : OCSF_ACTIVITY.USER_ACCESS_MANAGEMENT.REVOKE_PRIVILEGES,
        isPromotion
          ? `Admin promoted ${user.email || user.name} to ADMIN`
          : `Admin demoted ${user.email || user.name} to USER`,
        {
          userId,
          email: user.email,
          name: user.name,
        },
        [role],
        {
          actor: actorFromSession(session),
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
          severityId: isPromotion ? OCSF_SEVERITY.HIGH : OCSF_SEVERITY.MEDIUM,
          rawData: { previousRole: user.role, newRole: role },
        }
      );
    } catch (logError) {
      console.error('Failed to log role change (non-fatal):', logError);
    }

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
