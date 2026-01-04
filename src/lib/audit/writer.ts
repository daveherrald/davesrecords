/**
 * Audit Event Writer
 * Handles dual storage: PostgreSQL + JSONL file export
 */

import { prisma } from '@/lib/db';
import { OcsfEvent } from '@/types/ocsf';
import * as fs from 'fs/promises';
import * as path from 'path';

// JSONL export configuration
const AUDIT_LOG_DIR = process.env.AUDIT_LOG_DIR || './logs/audit';
const ENABLE_JSONL = process.env.AUDIT_JSONL_ENABLED === 'true';

/**
 * Convert OCSF event to flattened database record
 */
function eventToDbRecord(event: OcsfEvent) {
  return {
    classUid: event.classUid,
    categoryUid: event.categoryUid,
    activityId: event.activityId,
    typeUid: event.typeUid,
    severityId: event.severityId,
    time: event.time,
    message: event.message,
    className: event.className,
    activityName: event.activityName,
    categoryName: event.categoryName,
    statusId: event.statusId,
    statusCode: event.statusCode,
    statusDetail: event.statusDetail,
    actorUserId: event.actor?.userId,
    actorEmail: event.actor?.email,
    actorName: event.actor?.name,
    actorRole: event.actor?.role,
    srcIpAddress: event.srcEndpoint?.ip,
    srcUserAgent: event.srcEndpoint?.userAgent,
    srcEndpoint: event.srcEndpoint ? JSON.parse(JSON.stringify(event.srcEndpoint)) : null,
    dstEndpoint: event.dstEndpoint ? JSON.parse(JSON.stringify(event.dstEndpoint)) : null,
    resourceType: event.resource?.type,
    resourceId: event.resource?.id,
    resourceName: event.resource?.name,
    resourceData: event.resource?.data ? JSON.parse(JSON.stringify(event.resource.data)) : null,
    targetUserId: event.targetUser?.userId,
    targetEmail: event.targetUser?.email,
    targetName: event.targetUser?.name,
    apiOperation: event.api?.operation,
    apiEndpoint: event.api?.endpoint,
    apiRequest: event.api?.request ? JSON.parse(JSON.stringify(event.api.request)) : null,
    apiResponse: event.api?.response ? JSON.parse(JSON.stringify(event.api.response)) : null,
    metadata: JSON.parse(JSON.stringify(event.metadata)),
    rawData: event.rawData ? JSON.parse(JSON.stringify(event.rawData)) : null,
    unmapped: event.unmapped ? JSON.parse(JSON.stringify(event.unmapped)) : null,
  };
}

/**
 * Write event to JSONL file
 * Files are named by date: audit-YYYY-MM-DD.jsonl
 */
async function writeToJsonl(event: OcsfEvent): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const filename = `audit-${date}.jsonl`;
  const filepath = path.join(AUDIT_LOG_DIR, filename);

  // Ensure directory exists
  await fs.mkdir(AUDIT_LOG_DIR, { recursive: true });

  // Append event as JSON line
  const line = JSON.stringify(event) + '\n';
  await fs.appendFile(filepath, line, 'utf-8');
}

/**
 * Write OCSF event to both PostgreSQL and JSONL
 * Returns the database record ID
 */
export async function writeAuditEvent(event: OcsfEvent): Promise<string> {
  const dbRecord = eventToDbRecord(event);

  // Write to PostgreSQL
  const saved = await prisma.auditEvent.create({ data: dbRecord });

  // Write to JSONL (non-blocking, fire-and-forget with error logging)
  if (ENABLE_JSONL) {
    writeToJsonl(event).catch((err) => {
      console.error('Failed to write audit event to JSONL:', err);
    });
  }

  return saved.id;
}

// =============================================================================
// Query Functions
// =============================================================================

export interface AuditQueryParams {
  classUid?: number;
  categoryUid?: number;
  activityId?: number;
  severityId?: number;
  statusId?: number;
  actorUserId?: string;
  targetUserId?: string;
  resourceType?: string;
  resourceId?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Query audit events with OCSF-aware filtering
 */
export async function queryAuditEvents(params: AuditQueryParams) {
  const where: Record<string, unknown> = {};

  if (params.classUid !== undefined) where.classUid = params.classUid;
  if (params.categoryUid !== undefined) where.categoryUid = params.categoryUid;
  if (params.activityId !== undefined) where.activityId = params.activityId;
  if (params.severityId !== undefined) where.severityId = params.severityId;
  if (params.statusId !== undefined) where.statusId = params.statusId;
  if (params.actorUserId) where.actorUserId = params.actorUserId;
  if (params.targetUserId) where.targetUserId = params.targetUserId;
  if (params.resourceType) where.resourceType = params.resourceType;
  if (params.resourceId) where.resourceId = params.resourceId;

  if (params.startTime || params.endTime) {
    const timeFilter: Record<string, Date> = {};
    if (params.startTime) timeFilter.gte = params.startTime;
    if (params.endTime) timeFilter.lte = params.endTime;
    where.time = timeFilter;
  }

  const [events, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { time: 'desc' },
      take: params.limit || 50,
      skip: params.offset || 0,
    }),
    prisma.auditEvent.count({ where }),
  ]);

  return { events, total };
}

/**
 * Get audit event statistics
 */
export async function getAuditStats(startTime?: Date, endTime?: Date) {
  const where: Record<string, unknown> = {};
  if (startTime || endTime) {
    const timeFilter: Record<string, Date> = {};
    if (startTime) timeFilter.gte = startTime;
    if (endTime) timeFilter.lte = endTime;
    where.time = timeFilter;
  }

  const [byClass, byStatus, bySeverity, total] = await Promise.all([
    prisma.auditEvent.groupBy({
      by: ['classUid', 'className'],
      where,
      _count: { classUid: true },
    }),
    prisma.auditEvent.groupBy({
      by: ['statusId'],
      where,
      _count: { statusId: true },
    }),
    prisma.auditEvent.groupBy({
      by: ['severityId'],
      where,
      _count: { severityId: true },
    }),
    prisma.auditEvent.count({ where }),
  ]);

  return { byClass, byStatus, bySeverity, total };
}

/**
 * Get recent audit events for a specific actor
 */
export async function getActorEvents(actorUserId: string, limit: number = 50) {
  return prisma.auditEvent.findMany({
    where: { actorUserId },
    orderBy: { time: 'desc' },
    take: limit,
  });
}

/**
 * Get recent audit events targeting a specific user
 */
export async function getTargetUserEvents(targetUserId: string, limit: number = 50) {
  return prisma.auditEvent.findMany({
    where: { targetUserId },
    orderBy: { time: 'desc' },
    take: limit,
  });
}
