/**
 * Admin audit logging utilities
 */

import { prisma } from '@/lib/db';
import { AdminAction } from '@prisma/client';

export interface LogAdminActionParams {
  adminId: string;
  action: AdminAction;
  resource: string;
  resourceId: string;
  targetUserId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      targetUserId: params.targetUserId,
      description: params.description,
      metadata: params.metadata as any,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

/**
 * Get recent admin actions performed by a specific admin
 */
export async function getAdminActions(adminId: string, limit: number = 50) {
  return prisma.adminAuditLog.findMany({
    where: { adminId },
    include: {
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
    take: limit,
  });
}

/**
 * Get all actions performed on a specific user
 */
export async function getUserActions(userId: string, limit: number = 50) {
  return prisma.adminAuditLog.findMany({
    where: { targetUserId: userId },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get all recent admin actions across the system
 */
export async function getAllAdminActions(limit: number = 100) {
  return prisma.adminAuditLog.findMany({
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
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
    take: limit,
  });
}

/**
 * Get admin action counts by type
 */
export async function getActionCounts(startDate?: Date, endDate?: Date) {
  const where = {
    ...(startDate && endDate && {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }),
  };

  const counts = await prisma.adminAuditLog.groupBy({
    by: ['action'],
    where,
    _count: {
      action: true,
    },
  });

  return counts.map((count) => ({
    action: count.action,
    count: count._count.action,
  }));
}
