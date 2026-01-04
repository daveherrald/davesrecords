/**
 * OCSF Audit Logging - Main Entry Point
 *
 * This module provides OCSF-compliant audit logging for security investigations
 * and operational troubleshooting. Events are stored in PostgreSQL and optionally
 * exported to JSONL files for SIEM ingestion.
 *
 * Usage:
 *   import { logAuthentication, logAccountChange, OCSF_ACTIVITY } from '@/lib/audit';
 *
 *   await logAuthentication(OCSF_ACTIVITY.AUTHENTICATION.LOGON, 'User signed in', {
 *     actor: actorFromSession(session),
 *     srcEndpoint: endpointFromRequest(request),
 *   });
 */

// Re-export types
export * from '@/types/ocsf';

// Re-export builders
export {
  createAuthenticationEvent,
  createAccountChangeEvent,
  createUserAccessEvent,
  createEntityManagementEvent,
  createApiActivityEvent,
  type AuthenticationEventParams,
  type AccountChangeEventParams,
  type UserAccessEventParams,
  type EntityManagementEventParams,
  type ApiActivityEventParams,
} from './ocsf';

// Re-export writer functions
export {
  writeAuditEvent,
  queryAuditEvents,
  getAuditStats,
  getActorEvents,
  getTargetUserEvents,
  type AuditQueryParams,
} from './writer';

import { NextRequest } from 'next/server';
import {
  OCSF_ACTIVITY,
  OCSF_STATUS,
  OcsfActor,
  OcsfEndpoint,
  OcsfResource,
  OcsfUser,
  OcsfApi,
  OcsfStatusId,
  OcsfSeverityId,
} from '@/types/ocsf';
import {
  createAuthenticationEvent,
  createAccountChangeEvent,
  createUserAccessEvent,
  createEntityManagementEvent,
  createApiActivityEvent,
} from './ocsf';
import { writeAuditEvent } from './writer';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract actor information from a NextAuth session
 */
export function actorFromSession(session: {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    displayName?: string | null;
    role?: string;
  };
}): OcsfActor | undefined {
  if (!session?.user) return undefined;
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name || session.user.displayName,
    role: session.user.role,
  };
}

/**
 * Extract endpoint information from a Next.js request
 */
export function endpointFromRequest(request: NextRequest): OcsfEndpoint {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  return {
    ip: forwarded?.split(',')[0]?.trim() || realIp || undefined,
    userAgent: request.headers.get('user-agent'),
  };
}

// =============================================================================
// Convenience Logging Functions
// =============================================================================

interface LogOptions {
  actor?: OcsfActor;
  srcEndpoint?: OcsfEndpoint;
  statusId?: OcsfStatusId;
  statusCode?: string;
  statusDetail?: string;
  severityId?: OcsfSeverityId;
  rawData?: Record<string, unknown>;
}

/**
 * Log an authentication event (sign-in, sign-out, etc.)
 */
export async function logAuthentication(
  activityId: number,
  message: string,
  options: LogOptions & {
    user?: OcsfUser;
    authProtocol?: string;
    service?: string;
  } = {}
): Promise<string> {
  const event = createAuthenticationEvent({
    activityId,
    message,
    user: options.user,
    authProtocol: options.authProtocol,
    service: options.service,
    actor: options.actor,
    srcEndpoint: options.srcEndpoint,
    statusId: options.statusId,
    statusCode: options.statusCode,
    statusDetail: options.statusDetail,
    severityId: options.severityId,
    rawData: options.rawData,
  });
  return writeAuditEvent(event);
}

/**
 * Log an account change event (create, delete, ban, settings change, etc.)
 */
export async function logAccountChange(
  activityId: number,
  message: string,
  user: OcsfUser,
  options: LogOptions & {
    userResult?: OcsfUser;
  } = {}
): Promise<string> {
  const event = createAccountChangeEvent({
    activityId,
    message,
    user,
    userResult: options.userResult,
    actor: options.actor,
    srcEndpoint: options.srcEndpoint,
    statusId: options.statusId,
    statusCode: options.statusCode,
    statusDetail: options.statusDetail,
    severityId: options.severityId,
    rawData: options.rawData,
  });
  return writeAuditEvent(event);
}

/**
 * Log a user access management event (role/privilege changes)
 */
export async function logUserAccess(
  activityId: number,
  message: string,
  user: OcsfUser,
  privileges: string[],
  options: LogOptions = {}
): Promise<string> {
  const event = createUserAccessEvent({
    activityId,
    message,
    user,
    privileges,
    actor: options.actor,
    srcEndpoint: options.srcEndpoint,
    statusId: options.statusId,
    statusCode: options.statusCode,
    statusDetail: options.statusDetail,
    severityId: options.severityId,
    rawData: options.rawData,
  });
  return writeAuditEvent(event);
}

/**
 * Log an entity management event (CRUD operations on entities)
 */
export async function logEntityManagement(
  activityId: number,
  message: string,
  entity: OcsfResource,
  options: LogOptions & {
    entityResult?: OcsfResource;
  } = {}
): Promise<string> {
  const event = createEntityManagementEvent({
    activityId,
    message,
    entity,
    entityResult: options.entityResult,
    actor: options.actor,
    srcEndpoint: options.srcEndpoint,
    statusId: options.statusId,
    statusCode: options.statusCode,
    statusDetail: options.statusDetail,
    severityId: options.severityId,
    rawData: options.rawData,
  });
  return writeAuditEvent(event);
}

/**
 * Log an API activity event
 */
export async function logApiActivity(
  activityId: number,
  message: string,
  api: OcsfApi,
  options: LogOptions & {
    resources?: OcsfResource[];
  } = {}
): Promise<string> {
  const event = createApiActivityEvent({
    activityId,
    message,
    api,
    resources: options.resources,
    actor: options.actor,
    srcEndpoint: options.srcEndpoint,
    statusId: options.statusId,
    statusCode: options.statusCode,
    statusDetail: options.statusDetail,
    severityId: options.severityId,
    rawData: options.rawData,
  });
  return writeAuditEvent(event);
}

// Re-export activity constants for convenience
export { OCSF_ACTIVITY, OCSF_STATUS, OCSF_SEVERITY, OCSF_CLASS, OCSF_CATEGORY } from '@/types/ocsf';
