/**
 * Migration script to convert legacy AdminAuditLog records to OCSF-compliant AuditEvent records
 *
 * Run with: npx tsx scripts/migrate-audit-logs.ts
 */

import { PrismaClient, AdminAction, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// OCSF Constants
const OCSF_CLASS = {
  ACCOUNT_CHANGE: 3001,
  AUTHENTICATION: 3002,
  ENTITY_MANAGEMENT: 3004,
  USER_ACCESS_MANAGEMENT: 3005,
  API_ACTIVITY: 6003,
} as const;

const OCSF_CATEGORY = {
  IDENTITY_ACCESS_MANAGEMENT: 3,
  APPLICATION_ACTIVITY: 6,
} as const;

const OCSF_SEVERITY = {
  INFORMATIONAL: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
} as const;

const OCSF_ACTIVITY = {
  ACCOUNT_CHANGE: {
    ENABLE: 2,
    DISABLE: 5,
    DELETE: 6,
    OTHER: 99,
  },
  USER_ACCESS_MANAGEMENT: {
    ASSIGN_PRIVILEGES: 1,
    REVOKE_PRIVILEGES: 2,
  },
  API_ACTIVITY: {
    READ: 2,
  },
} as const;

// Mapping from AdminAction to OCSF
interface OcsfMapping {
  classUid: number;
  categoryUid: number;
  activityId: number;
  className: string;
  activityName: string;
  categoryName: string;
  severityId: number;
}

const ADMIN_ACTION_MAPPING: Record<AdminAction, OcsfMapping> = {
  USER_PROMOTE: {
    classUid: OCSF_CLASS.USER_ACCESS_MANAGEMENT,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: OCSF_ACTIVITY.USER_ACCESS_MANAGEMENT.ASSIGN_PRIVILEGES,
    className: 'User Access Management',
    activityName: 'Assign Privileges',
    categoryName: 'Identity & Access Management',
    severityId: OCSF_SEVERITY.HIGH,
  },
  USER_DEMOTE: {
    classUid: OCSF_CLASS.USER_ACCESS_MANAGEMENT,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: OCSF_ACTIVITY.USER_ACCESS_MANAGEMENT.REVOKE_PRIVILEGES,
    className: 'User Access Management',
    activityName: 'Revoke Privileges',
    categoryName: 'Identity & Access Management',
    severityId: OCSF_SEVERITY.MEDIUM,
  },
  USER_BAN: {
    classUid: OCSF_CLASS.ACCOUNT_CHANGE,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: OCSF_ACTIVITY.ACCOUNT_CHANGE.DISABLE,
    className: 'Account Change',
    activityName: 'Disable',
    categoryName: 'Identity & Access Management',
    severityId: OCSF_SEVERITY.HIGH,
  },
  USER_UNBAN: {
    classUid: OCSF_CLASS.ACCOUNT_CHANGE,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: OCSF_ACTIVITY.ACCOUNT_CHANGE.ENABLE,
    className: 'Account Change',
    activityName: 'Enable',
    categoryName: 'Identity & Access Management',
    severityId: OCSF_SEVERITY.MEDIUM,
  },
  USER_SUSPEND: {
    classUid: OCSF_CLASS.ACCOUNT_CHANGE,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: OCSF_ACTIVITY.ACCOUNT_CHANGE.DISABLE,
    className: 'Account Change',
    activityName: 'Disable',
    categoryName: 'Identity & Access Management',
    severityId: OCSF_SEVERITY.MEDIUM,
  },
  USER_DELETE: {
    classUid: OCSF_CLASS.ACCOUNT_CHANGE,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: OCSF_ACTIVITY.ACCOUNT_CHANGE.DELETE,
    className: 'Account Change',
    activityName: 'Delete',
    categoryName: 'Identity & Access Management',
    severityId: OCSF_SEVERITY.HIGH,
  },
  USER_EDIT: {
    classUid: OCSF_CLASS.ACCOUNT_CHANGE,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: OCSF_ACTIVITY.ACCOUNT_CHANGE.OTHER,
    className: 'Account Change',
    activityName: 'Other',
    categoryName: 'Identity & Access Management',
    severityId: OCSF_SEVERITY.INFORMATIONAL,
  },
  SETTINGS_VIEW: {
    classUid: OCSF_CLASS.API_ACTIVITY,
    categoryUid: OCSF_CATEGORY.APPLICATION_ACTIVITY,
    activityId: OCSF_ACTIVITY.API_ACTIVITY.READ,
    className: 'API Activity',
    activityName: 'Read',
    categoryName: 'Application Activity',
    severityId: OCSF_SEVERITY.INFORMATIONAL,
  },
  ANALYTICS_VIEW: {
    classUid: OCSF_CLASS.API_ACTIVITY,
    categoryUid: OCSF_CATEGORY.APPLICATION_ACTIVITY,
    activityId: OCSF_ACTIVITY.API_ACTIVITY.READ,
    className: 'API Activity',
    activityName: 'Read',
    categoryName: 'Application Activity',
    severityId: OCSF_SEVERITY.INFORMATIONAL,
  },
};

async function migrateAdminAuditLogs() {
  console.log('Starting migration of AdminAuditLog to AuditEvent...');

  // Get all legacy audit logs
  const logs = await prisma.adminAuditLog.findMany({
    include: {
      admin: true,
      targetUser: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${logs.length} legacy audit logs to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const log of logs) {
    // Check if already migrated
    const existing = await prisma.auditMigration.findUnique({
      where: {
        legacyTable_legacyId: {
          legacyTable: 'AdminAuditLog',
          legacyId: log.id,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const mapping = ADMIN_ACTION_MAPPING[log.action];
    if (!mapping) {
      console.warn(`Unknown action: ${log.action}, skipping log ${log.id}`);
      skipped++;
      continue;
    }

    const typeUid = mapping.classUid * 100 + mapping.activityId;

    // Create OCSF event
    const event = await prisma.auditEvent.create({
      data: {
        classUid: mapping.classUid,
        categoryUid: mapping.categoryUid,
        activityId: mapping.activityId,
        typeUid,
        severityId: mapping.severityId,
        time: log.createdAt,
        message: log.description,
        className: mapping.className,
        activityName: mapping.activityName,
        categoryName: mapping.categoryName,
        statusId: 1, // Success (legacy logs don't track failures)
        actorUserId: log.adminId,
        actorEmail: log.admin?.email,
        actorName: log.admin?.name,
        actorRole: 'ADMIN',
        srcIpAddress: log.ipAddress,
        srcUserAgent: log.userAgent,
        resourceType: log.resource,
        resourceId: log.resourceId,
        targetUserId: log.targetUserId,
        targetEmail: log.targetUser?.email,
        targetName: log.targetUser?.name,
        metadata: {
          version: '1.0.0',
          product: { name: 'DavesRecords', vendor: 'DavesRecords', version: '0.1.0' },
          migrated: true,
          originalTable: 'AdminAuditLog',
          originalId: log.id,
          originalAction: log.action,
        },
        rawData: log.metadata ? (log.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    // Track migration
    await prisma.auditMigration.create({
      data: {
        legacyTable: 'AdminAuditLog',
        legacyId: log.id,
        newEventId: event.id,
      },
    });

    migrated++;

    if (migrated % 100 === 0) {
      console.log(`Migrated ${migrated} logs...`);
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`  - Migrated: ${migrated}`);
  console.log(`  - Skipped (already migrated or unknown action): ${skipped}`);
}

async function main() {
  try {
    await migrateAdminAuditLogs();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
