/**
 * Admin API: Audit Logs (OCSF)
 * GET /api/admin/audit - Get OCSF audit events with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryAuditEvents, getAuditStats } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // Get query parameters with bounds checking
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50));
    const classUid = searchParams.get('classUid');
    const severityId = searchParams.get('severityId');
    const statusId = searchParams.get('statusId');
    const actorUserId = searchParams.get('actorUserId') || undefined;
    const targetUserId = searchParams.get('targetUserId') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    // Query audit events
    const { events, total } = await queryAuditEvents({
      classUid: classUid ? parseInt(classUid) : undefined,
      severityId: severityId ? parseInt(severityId) : undefined,
      statusId: statusId ? parseInt(statusId) : undefined,
      actorUserId,
      targetUserId,
      resourceType,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      limit,
      offset: (page - 1) * limit,
    });

    return NextResponse.json({
      logs: events,
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
