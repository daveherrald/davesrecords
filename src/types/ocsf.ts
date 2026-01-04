/**
 * OCSF (Open Cybersecurity Schema Framework) Type Definitions
 * Based on OCSF v1.0.0 specification
 * Reference: https://schema.ocsf.io/
 */

// =============================================================================
// OCSF Constants
// =============================================================================

/**
 * OCSF Event Class UIDs
 */
export const OCSF_CLASS = {
  ACCOUNT_CHANGE: 3001,
  AUTHENTICATION: 3002,
  ENTITY_MANAGEMENT: 3004,
  USER_ACCESS_MANAGEMENT: 3005,
  API_ACTIVITY: 6003,
} as const;

/**
 * OCSF Category UIDs
 */
export const OCSF_CATEGORY = {
  IDENTITY_ACCESS_MANAGEMENT: 3,
  APPLICATION_ACTIVITY: 6,
} as const;

/**
 * OCSF Severity Levels
 */
export const OCSF_SEVERITY = {
  UNKNOWN: 0,
  INFORMATIONAL: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  CRITICAL: 5,
  FATAL: 6,
  OTHER: 99,
} as const;

/**
 * OCSF Status IDs
 */
export const OCSF_STATUS = {
  UNKNOWN: 0,
  SUCCESS: 1,
  FAILURE: 2,
  OTHER: 99,
} as const;

/**
 * Activity IDs per event class
 */
export const OCSF_ACTIVITY = {
  AUTHENTICATION: {
    UNKNOWN: 0,
    LOGON: 1,
    LOGOFF: 2,
    AUTHENTICATION_TICKET: 3,
    SERVICE_TICKET: 4,
    OTHER: 99,
  },
  ACCOUNT_CHANGE: {
    UNKNOWN: 0,
    CREATE: 1,
    ENABLE: 2,
    PASSWORD_CHANGE: 3,
    PASSWORD_RESET: 4,
    DISABLE: 5,
    DELETE: 6,
    ATTACH_POLICY: 7,
    DETACH_POLICY: 8,
    LOCK: 9,
    OTHER: 99,
  },
  USER_ACCESS_MANAGEMENT: {
    UNKNOWN: 0,
    ASSIGN_PRIVILEGES: 1,
    REVOKE_PRIVILEGES: 2,
    OTHER: 99,
  },
  ENTITY_MANAGEMENT: {
    UNKNOWN: 0,
    CREATE: 1,
    READ: 2,
    UPDATE: 3,
    DELETE: 4,
    OTHER: 99,
  },
  API_ACTIVITY: {
    UNKNOWN: 0,
    CREATE: 1,
    READ: 2,
    UPDATE: 3,
    DELETE: 4,
    OTHER: 99,
  },
} as const;

// =============================================================================
// Type Utilities
// =============================================================================

export type OcsfClassUid = (typeof OCSF_CLASS)[keyof typeof OCSF_CLASS];
export type OcsfCategoryUid = (typeof OCSF_CATEGORY)[keyof typeof OCSF_CATEGORY];
export type OcsfSeverityId = (typeof OCSF_SEVERITY)[keyof typeof OCSF_SEVERITY];
export type OcsfStatusId = (typeof OCSF_STATUS)[keyof typeof OCSF_STATUS];

// =============================================================================
// OCSF Objects
// =============================================================================

/**
 * Actor object - who performed the action
 */
export interface OcsfActor {
  userId?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  sessionId?: string;
}

/**
 * Endpoint object - device/network info
 */
export interface OcsfEndpoint {
  ip?: string | null;
  hostname?: string;
  userAgent?: string | null;
  port?: number;
  type?: string;
}

/**
 * Resource/Entity being acted upon
 */
export interface OcsfResource {
  type: string;
  id?: string;
  name?: string;
  data?: Record<string, unknown>;
}

/**
 * User object - target of action
 */
export interface OcsfUser {
  userId?: string;
  email?: string | null;
  name?: string | null;
}

/**
 * API details
 */
export interface OcsfApi {
  operation: string; // HTTP method
  endpoint: string; // API path
  request?: Record<string, unknown>;
  response?: {
    statusCode?: number;
    data?: Record<string, unknown>;
  };
}

/**
 * Metadata object
 */
export interface OcsfMetadata {
  version: string; // OCSF version (1.0.0)
  product: {
    name: string;
    vendor: string;
    version: string;
  };
  profiles?: string[];
  uid?: string; // Unique event ID
  originalTime?: string; // ISO timestamp
}

// =============================================================================
// Base Event Interface
// =============================================================================

/**
 * Base OCSF Event - common fields for all event classes
 */
export interface OcsfBaseEvent {
  classUid: OcsfClassUid;
  categoryUid: OcsfCategoryUid;
  activityId: number;
  typeUid: number;
  severityId: OcsfSeverityId;
  time: Date;
  message: string;

  className: string;
  activityName: string;
  categoryName: string;

  statusId: OcsfStatusId;
  statusCode?: string;
  statusDetail?: string;

  actor?: OcsfActor;
  srcEndpoint?: OcsfEndpoint;
  dstEndpoint?: OcsfEndpoint;

  resource?: OcsfResource;
  targetUser?: OcsfUser;

  api?: OcsfApi;
  metadata: OcsfMetadata;

  rawData?: Record<string, unknown>;
  unmapped?: Record<string, unknown>;
}

// =============================================================================
// Event Class Interfaces
// =============================================================================

/**
 * Authentication Event (3002)
 * User login/credential verification
 */
export interface OcsfAuthenticationEvent extends OcsfBaseEvent {
  classUid: typeof OCSF_CLASS.AUTHENTICATION;
  categoryUid: typeof OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT;
  authProtocol?: string; // "OAuth2", "SAML", etc.
  isRemote?: boolean;
  service?: string;
}

/**
 * Account Change Event (3001)
 * Account modifications (create, delete, enable, disable, etc.)
 */
export interface OcsfAccountChangeEvent extends OcsfBaseEvent {
  classUid: typeof OCSF_CLASS.ACCOUNT_CHANGE;
  categoryUid: typeof OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT;
  userResult?: OcsfUser; // State after change
}

/**
 * User Access Management Event (3005)
 * Privilege assignments and revocations
 */
export interface OcsfUserAccessEvent extends OcsfBaseEvent {
  classUid: typeof OCSF_CLASS.USER_ACCESS_MANAGEMENT;
  categoryUid: typeof OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT;
  privileges: string[]; // List of privileges assigned/revoked
}

/**
 * Entity Management Event (3004)
 * Identity entity changes (connections, settings, etc.)
 */
export interface OcsfEntityManagementEvent extends OcsfBaseEvent {
  classUid: typeof OCSF_CLASS.ENTITY_MANAGEMENT;
  categoryUid: typeof OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT;
  entityResult?: OcsfResource; // Entity state after change
}

/**
 * API Activity Event (6003)
 * API endpoint interactions
 */
export interface OcsfApiActivityEvent extends OcsfBaseEvent {
  classUid: typeof OCSF_CLASS.API_ACTIVITY;
  categoryUid: typeof OCSF_CATEGORY.APPLICATION_ACTIVITY;
  httpRequest?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
  };
  resources?: OcsfResource[];
}

/**
 * Union type for all OCSF events
 */
export type OcsfEvent =
  | OcsfAuthenticationEvent
  | OcsfAccountChangeEvent
  | OcsfUserAccessEvent
  | OcsfEntityManagementEvent
  | OcsfApiActivityEvent;

// =============================================================================
// Helper Types for Database Storage
// =============================================================================

/**
 * Flattened event for database storage
 * Matches the AuditEvent Prisma model
 */
export interface OcsfEventRecord {
  classUid: number;
  categoryUid: number;
  activityId: number;
  typeUid: number;
  severityId: number;
  time: Date;
  message: string;
  className: string;
  activityName: string;
  categoryName: string;
  statusId: number;
  statusCode?: string | null;
  statusDetail?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  srcIpAddress?: string | null;
  srcUserAgent?: string | null;
  srcEndpoint?: Record<string, unknown> | null;
  dstEndpoint?: Record<string, unknown> | null;
  resourceType?: string | null;
  resourceId?: string | null;
  resourceName?: string | null;
  resourceData?: Record<string, unknown> | null;
  targetUserId?: string | null;
  targetEmail?: string | null;
  targetName?: string | null;
  apiOperation?: string | null;
  apiEndpoint?: string | null;
  apiRequest?: Record<string, unknown> | null;
  apiResponse?: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  rawData?: Record<string, unknown> | null;
  unmapped?: Record<string, unknown> | null;
}
