/**
 * Admin API: Audit Logs
 * GET /api/admin/audit - Get audit logs with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AdminAction } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const adminId = searchParams.get('adminId') || undefined;
    const targetUserId = searchParams.get('targetUserId') || undefined;
    const action = searchParams.get('action') as AdminAction | null;

    // Build where clause
    const where = {
      ...(adminId && { adminId }),
      ...(targetUserId && { targetUserId }),
      ...(action && { action }),
    };

    // Get total count
    const total = await prisma.adminAuditLog.count({ where });

    // Get audit logs
    const logs = await prisma.adminAuditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            publicSlug: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            publicSlug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Audit logs error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
