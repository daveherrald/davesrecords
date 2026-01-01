/**
 * Admin API: User List
 * GET /api/admin/users - List all users with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/admin/audit';
import { UserRole, UserStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await requireAdmin();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') as UserRole | null;
    const statusFilter = searchParams.get('status') as UserStatus | null;

    // Build where clause
    const where = {
      AND: [
        // Search filter
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
                { publicSlug: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {},
        // Role filter
        roleFilter ? { role: roleFilter } : {},
        // Status filter
        statusFilter ? { status: statusFilter } : {},
      ],
    };

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        publicSlug: true,
        displayName: true,
        role: true,
        status: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
        updatedAt: true,
        discogsConnection: {
          select: {
            discogsUsername: true,
          },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'SETTINGS_VIEW',
      resource: 'users',
      resourceId: 'list',
      description: `Viewed user list (page ${page})`,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        hasDiscogsConnection: !!user.discogsConnection,
        discogsUsername: user.discogsConnection?.discogsUsername || null,
        sessionCount: user._count.sessions,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin user list error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
