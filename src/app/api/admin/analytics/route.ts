/**
 * Admin API: Analytics Overview
 * GET /api/admin/analytics - Get system analytics and stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getOverviewStats } from '@/lib/admin/analytics';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();

    // Get overview statistics
    const stats = await getOverviewStats();

    await logAdminAction({
      adminId: session.user.id,
      action: 'ANALYTICS_VIEW',
      resource: 'analytics',
      resourceId: 'overview',
      description: 'Viewed analytics overview',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Analytics error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
