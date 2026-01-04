/**
 * OCSF Event Builders
 * Factory functions for creating OCSF-compliant events
 */

import {
  OCSF_CLASS,
  OCSF_CATEGORY,
  OCSF_SEVERITY,
  OCSF_STATUS,
  OcsfActor,
  OcsfEndpoint,
  OcsfResource,
  OcsfUser,
  OcsfMetadata,
  OcsfAuthenticationEvent,
  OcsfAccountChangeEvent,
  OcsfUserAccessEvent,
  OcsfEntityManagementEvent,
  OcsfApiActivityEvent,
  OcsfStatusId,
  OcsfSeverityId,
  OcsfApi,
} from '@/types/ocsf';

// Product version - should match package.json
const PRODUCT_VERSION = '0.1.0';

/**
 * Create standard OCSF metadata
 */
function createMetadata(): OcsfMetadata {
  return {
    version: '1.0.0',
    product: {
      name: 'DavesRecords',
      vendor: 'DavesRecords',
      version: PRODUCT_VERSION,
    },
    profiles: ['cloud'],
    uid: crypto.randomUUID(),
    originalTime: new Date().toISOString(),
  };
}

/**
 * Calculate type_uid from class_uid and activity_id
 * Formula: class_uid * 100 + activity_id
 */
function calculateTypeUid(classUid: number, activityId: number): number {
  return classUid * 100 + activityId;
}

// =============================================================================
// Base Event Parameters
// =============================================================================

interface BaseEventParams {
  message: string;
  severityId?: OcsfSeverityId;
  statusId?: OcsfStatusId;
  statusCode?: string;
  statusDetail?: string;
  actor?: OcsfActor;
  srcEndpoint?: OcsfEndpoint;
  rawData?: Record<string, unknown>;
}

// =============================================================================
// Authentication Event Builder (3002)
// =============================================================================

const AUTHENTICATION_ACTIVITY_NAMES: Record<number, string> = {
  0: 'Unknown',
  1: 'Logon',
  2: 'Logoff',
  3: 'Authentication Ticket',
  4: 'Service Ticket',
  99: 'Other',
};

export interface AuthenticationEventParams extends BaseEventParams {
  activityId: number;
  user?: OcsfUser;
  authProtocol?: string;
  isRemote?: boolean;
  service?: string;
}

export function createAuthenticationEvent(
  params: AuthenticationEventParams
): OcsfAuthenticationEvent {
  return {
    classUid: OCSF_CLASS.AUTHENTICATION,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: params.activityId,
    typeUid: calculateTypeUid(OCSF_CLASS.AUTHENTICATION, params.activityId),
    severityId: params.severityId ?? OCSF_SEVERITY.INFORMATIONAL,
    time: new Date(),
    message: params.message,
    className: 'Authentication',
    activityName: AUTHENTICATION_ACTIVITY_NAMES[params.activityId] || 'Unknown',
    categoryName: 'Identity & Access Management',
    statusId: params.statusId ?? OCSF_STATUS.SUCCESS,
    statusCode: params.statusCode,
    statusDetail: params.statusDetail,
    actor: params.actor,
    srcEndpoint: params.srcEndpoint,
    targetUser: params.user,
    metadata: createMetadata(),
    authProtocol: params.authProtocol,
    isRemote: params.isRemote,
    service: params.service,
    rawData: params.rawData,
  };
}

// =============================================================================
// Account Change Event Builder (3001)
// =============================================================================

const ACCOUNT_CHANGE_ACTIVITY_NAMES: Record<number, string> = {
  0: 'Unknown',
  1: 'Create',
  2: 'Enable',
  3: 'Password Change',
  4: 'Password Reset',
  5: 'Disable',
  6: 'Delete',
  7: 'Attach Policy',
  8: 'Detach Policy',
  9: 'Lock',
  99: 'Other',
};

export interface AccountChangeEventParams extends BaseEventParams {
  activityId: number;
  user: OcsfUser;
  userResult?: OcsfUser;
}

export function createAccountChangeEvent(
  params: AccountChangeEventParams
): OcsfAccountChangeEvent {
  return {
    classUid: OCSF_CLASS.ACCOUNT_CHANGE,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: params.activityId,
    typeUid: calculateTypeUid(OCSF_CLASS.ACCOUNT_CHANGE, params.activityId),
    severityId: params.severityId ?? OCSF_SEVERITY.INFORMATIONAL,
    time: new Date(),
    message: params.message,
    className: 'Account Change',
    activityName: ACCOUNT_CHANGE_ACTIVITY_NAMES[params.activityId] || 'Unknown',
    categoryName: 'Identity & Access Management',
    statusId: params.statusId ?? OCSF_STATUS.SUCCESS,
    statusCode: params.statusCode,
    statusDetail: params.statusDetail,
    actor: params.actor,
    srcEndpoint: params.srcEndpoint,
    targetUser: params.user,
    userResult: params.userResult,
    metadata: createMetadata(),
    rawData: params.rawData,
  };
}

// =============================================================================
// User Access Management Event Builder (3005)
// =============================================================================

const USER_ACCESS_ACTIVITY_NAMES: Record<number, string> = {
  0: 'Unknown',
  1: 'Assign Privileges',
  2: 'Revoke Privileges',
  99: 'Other',
};

export interface UserAccessEventParams extends BaseEventParams {
  activityId: number;
  user: OcsfUser;
  privileges: string[];
}

export function createUserAccessEvent(
  params: UserAccessEventParams
): OcsfUserAccessEvent {
  return {
    classUid: OCSF_CLASS.USER_ACCESS_MANAGEMENT,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: params.activityId,
    typeUid: calculateTypeUid(OCSF_CLASS.USER_ACCESS_MANAGEMENT, params.activityId),
    severityId: params.severityId ?? OCSF_SEVERITY.INFORMATIONAL,
    time: new Date(),
    message: params.message,
    className: 'User Access Management',
    activityName: USER_ACCESS_ACTIVITY_NAMES[params.activityId] || 'Unknown',
    categoryName: 'Identity & Access Management',
    statusId: params.statusId ?? OCSF_STATUS.SUCCESS,
    statusCode: params.statusCode,
    statusDetail: params.statusDetail,
    actor: params.actor,
    srcEndpoint: params.srcEndpoint,
    targetUser: params.user,
    privileges: params.privileges,
    metadata: createMetadata(),
    rawData: params.rawData,
  };
}

// =============================================================================
// Entity Management Event Builder (3004)
// =============================================================================

const ENTITY_MANAGEMENT_ACTIVITY_NAMES: Record<number, string> = {
  0: 'Unknown',
  1: 'Create',
  2: 'Read',
  3: 'Update',
  4: 'Delete',
  99: 'Other',
};

export interface EntityManagementEventParams extends BaseEventParams {
  activityId: number;
  entity: OcsfResource;
  entityResult?: OcsfResource;
}

export function createEntityManagementEvent(
  params: EntityManagementEventParams
): OcsfEntityManagementEvent {
  return {
    classUid: OCSF_CLASS.ENTITY_MANAGEMENT,
    categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT,
    activityId: params.activityId,
    typeUid: calculateTypeUid(OCSF_CLASS.ENTITY_MANAGEMENT, params.activityId),
    severityId: params.severityId ?? OCSF_SEVERITY.INFORMATIONAL,
    time: new Date(),
    message: params.message,
    className: 'Entity Management',
    activityName: ENTITY_MANAGEMENT_ACTIVITY_NAMES[params.activityId] || 'Unknown',
    categoryName: 'Identity & Access Management',
    statusId: params.statusId ?? OCSF_STATUS.SUCCESS,
    statusCode: params.statusCode,
    statusDetail: params.statusDetail,
    actor: params.actor,
    srcEndpoint: params.srcEndpoint,
    resource: params.entity,
    entityResult: params.entityResult,
    metadata: createMetadata(),
    rawData: params.rawData,
  };
}

// =============================================================================
// API Activity Event Builder (6003)
// =============================================================================

const API_ACTIVITY_NAMES: Record<number, string> = {
  0: 'Unknown',
  1: 'Create',
  2: 'Read',
  3: 'Update',
  4: 'Delete',
  99: 'Other',
};

export interface ApiActivityEventParams extends BaseEventParams {
  activityId: number;
  api: OcsfApi;
  resources?: OcsfResource[];
}

export function createApiActivityEvent(
  params: ApiActivityEventParams
): OcsfApiActivityEvent {
  return {
    classUid: OCSF_CLASS.API_ACTIVITY,
    categoryUid: OCSF_CATEGORY.APPLICATION_ACTIVITY,
    activityId: params.activityId,
    typeUid: calculateTypeUid(OCSF_CLASS.API_ACTIVITY, params.activityId),
    severityId: params.severityId ?? OCSF_SEVERITY.INFORMATIONAL,
    time: new Date(),
    message: params.message,
    className: 'API Activity',
    activityName: API_ACTIVITY_NAMES[params.activityId] || 'Unknown',
    categoryName: 'Application Activity',
    statusId: params.statusId ?? OCSF_STATUS.SUCCESS,
    statusCode: params.statusCode,
    statusDetail: params.statusDetail,
    actor: params.actor,
    srcEndpoint: params.srcEndpoint,
    api: params.api,
    resources: params.resources,
    metadata: createMetadata(),
    rawData: params.rawData,
  };
}
