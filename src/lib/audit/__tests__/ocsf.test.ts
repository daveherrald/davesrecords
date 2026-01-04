import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAuthenticationEvent,
  createAccountChangeEvent,
  createUserAccessEvent,
  createEntityManagementEvent,
  createApiActivityEvent,
} from '@/lib/audit/ocsf';
import {
  OCSF_CLASS,
  OCSF_CATEGORY,
  OCSF_SEVERITY,
  OCSF_STATUS,
  OCSF_ACTIVITY,
} from '@/types/ocsf';

describe('OCSF Event Builders', () => {
  beforeEach(() => {
    // Mock crypto.randomUUID for deterministic tests
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid-1234-5678-9abc-def012345678');
  });

  describe('createAuthenticationEvent', () => {
    it('creates valid authentication event with required fields', () => {
      const event = createAuthenticationEvent({
        activityId: OCSF_ACTIVITY.AUTHENTICATION.LOGON,
        message: 'User signed in via Google',
      });

      expect(event).toMatchObject({
        classUid: OCSF_CLASS.AUTHENTICATION, // 3002
        categoryUid: OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT, // 3
        activityId: 1,
        typeUid: 300201, // 3002 * 100 + 1
        className: 'Authentication',
        activityName: 'Logon',
        categoryName: 'Identity & Access Management',
        message: 'User signed in via Google',
        severityId: OCSF_SEVERITY.INFORMATIONAL,
        statusId: OCSF_STATUS.SUCCESS,
      });
      expect(event.time).toBeInstanceOf(Date);
      expect(event.metadata.uid).toBe('test-uuid-1234-5678-9abc-def012345678');
      expect(event.metadata.product.name).toBe('DavesRecords');
    });

    it('calculates correct typeUid for different activities', () => {
      const logon = createAuthenticationEvent({
        activityId: OCSF_ACTIVITY.AUTHENTICATION.LOGON,
        message: 'logon',
      });
      const logoff = createAuthenticationEvent({
        activityId: OCSF_ACTIVITY.AUTHENTICATION.LOGOFF,
        message: 'logoff',
      });

      expect(logon.typeUid).toBe(300201); // 3002 * 100 + 1
      expect(logoff.typeUid).toBe(300202); // 3002 * 100 + 2
    });

    it('includes actor when provided', () => {
      const event = createAuthenticationEvent({
        activityId: 1,
        message: 'test',
        actor: {
          userId: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });

      expect(event.actor).toEqual({
        userId: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });

    it('includes srcEndpoint when provided', () => {
      const event = createAuthenticationEvent({
        activityId: 1,
        message: 'test',
        srcEndpoint: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });

      expect(event.srcEndpoint).toEqual({
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('includes targetUser when provided', () => {
      const event = createAuthenticationEvent({
        activityId: 1,
        message: 'test',
        user: {
          userId: 'user-123',
          email: 'user@example.com',
        },
      });

      expect(event.targetUser).toEqual({
        userId: 'user-123',
        email: 'user@example.com',
      });
    });

    it('includes authentication-specific fields', () => {
      const event = createAuthenticationEvent({
        activityId: 1,
        message: 'test',
        authProtocol: 'OAuth2',
        isRemote: true,
        service: 'google',
      });

      expect(event.authProtocol).toBe('OAuth2');
      expect(event.isRemote).toBe(true);
      expect(event.service).toBe('google');
    });

    it('uses custom severity and status when provided', () => {
      const event = createAuthenticationEvent({
        activityId: 1,
        message: 'Failed login attempt',
        severityId: OCSF_SEVERITY.MEDIUM,
        statusId: OCSF_STATUS.FAILURE,
        statusCode: '401',
        statusDetail: 'Invalid credentials',
      });

      expect(event.severityId).toBe(OCSF_SEVERITY.MEDIUM);
      expect(event.statusId).toBe(OCSF_STATUS.FAILURE);
      expect(event.statusCode).toBe('401');
      expect(event.statusDetail).toBe('Invalid credentials');
    });

    it('maps activity IDs to correct names', () => {
      const activities = [
        { id: 0, name: 'Unknown' },
        { id: 1, name: 'Logon' },
        { id: 2, name: 'Logoff' },
        { id: 99, name: 'Other' },
      ];

      for (const { id, name } of activities) {
        const event = createAuthenticationEvent({ activityId: id, message: 'test' });
        expect(event.activityName).toBe(name);
      }
    });

    it('includes metadata with correct structure', () => {
      const event = createAuthenticationEvent({ activityId: 1, message: 'test' });

      expect(event.metadata).toMatchObject({
        version: '1.0.0',
        product: {
          name: 'DavesRecords',
          vendor: 'DavesRecords',
          version: expect.any(String),
        },
        profiles: ['cloud'],
        uid: expect.any(String),
        originalTime: expect.any(String),
      });
    });
  });

  describe('createAccountChangeEvent', () => {
    it('creates account creation event', () => {
      const event = createAccountChangeEvent({
        activityId: OCSF_ACTIVITY.ACCOUNT_CHANGE.CREATE,
        message: 'New user account created',
        user: { userId: 'new-user', email: 'new@example.com' },
      });

      expect(event.classUid).toBe(OCSF_CLASS.ACCOUNT_CHANGE); // 3001
      expect(event.typeUid).toBe(300101); // 3001 * 100 + 1
      expect(event.activityName).toBe('Create');
      expect(event.targetUser).toEqual({ userId: 'new-user', email: 'new@example.com' });
    });

    it('creates account disable event (ban)', () => {
      const event = createAccountChangeEvent({
        activityId: OCSF_ACTIVITY.ACCOUNT_CHANGE.DISABLE,
        message: 'User banned',
        user: { userId: 'user-1', email: 'user@example.com' },
        statusDetail: 'Violation of terms',
      });

      expect(event.activityId).toBe(5);
      expect(event.typeUid).toBe(300105); // 3001 * 100 + 5
      expect(event.activityName).toBe('Disable');
      expect(event.statusDetail).toBe('Violation of terms');
    });

    it('includes userResult for state changes', () => {
      const event = createAccountChangeEvent({
        activityId: OCSF_ACTIVITY.ACCOUNT_CHANGE.DISABLE,
        message: 'User status changed',
        user: { userId: 'user-1' },
        userResult: { userId: 'user-1', name: 'Updated Name' },
      });

      expect(event.userResult).toEqual({ userId: 'user-1', name: 'Updated Name' });
    });

    it('maps activity IDs to correct names', () => {
      const activities = [
        { id: 1, name: 'Create' },
        { id: 5, name: 'Disable' },
        { id: 6, name: 'Delete' },
        { id: 9, name: 'Lock' },
      ];

      for (const { id, name } of activities) {
        const event = createAccountChangeEvent({
          activityId: id,
          message: 'test',
          user: { userId: 'test' },
        });
        expect(event.activityName).toBe(name);
      }
    });
  });

  describe('createUserAccessEvent', () => {
    it('creates privilege assignment event', () => {
      const event = createUserAccessEvent({
        activityId: OCSF_ACTIVITY.USER_ACCESS_MANAGEMENT.ASSIGN_PRIVILEGES,
        message: 'User promoted to admin',
        user: { userId: 'user-1', email: 'user@example.com' },
        privileges: ['ADMIN'],
      });

      expect(event.classUid).toBe(OCSF_CLASS.USER_ACCESS_MANAGEMENT); // 3005
      expect(event.typeUid).toBe(300501); // 3005 * 100 + 1
      expect(event.activityName).toBe('Assign Privileges');
      expect(event.privileges).toEqual(['ADMIN']);
    });

    it('creates privilege revocation event', () => {
      const event = createUserAccessEvent({
        activityId: OCSF_ACTIVITY.USER_ACCESS_MANAGEMENT.REVOKE_PRIVILEGES,
        message: 'Admin privileges revoked',
        user: { userId: 'user-1' },
        privileges: ['ADMIN'],
      });

      expect(event.typeUid).toBe(300502); // 3005 * 100 + 2
      expect(event.activityName).toBe('Revoke Privileges');
    });

    it('handles multiple privileges', () => {
      const event = createUserAccessEvent({
        activityId: 1,
        message: 'Multiple privileges assigned',
        user: { userId: 'user-1' },
        privileges: ['READ', 'WRITE', 'DELETE'],
      });

      expect(event.privileges).toEqual(['READ', 'WRITE', 'DELETE']);
    });
  });

  describe('createEntityManagementEvent', () => {
    it('creates entity create event', () => {
      const event = createEntityManagementEvent({
        activityId: OCSF_ACTIVITY.ENTITY_MANAGEMENT.CREATE,
        message: 'Discogs connection created',
        entity: {
          type: 'DiscogsConnection',
          id: 'conn-123',
          name: 'Main Account',
        },
      });

      expect(event.classUid).toBe(OCSF_CLASS.ENTITY_MANAGEMENT); // 3004
      expect(event.typeUid).toBe(300401); // 3004 * 100 + 1
      expect(event.activityName).toBe('Create');
      expect(event.resource).toEqual({
        type: 'DiscogsConnection',
        id: 'conn-123',
        name: 'Main Account',
      });
    });

    it('creates entity update event', () => {
      const event = createEntityManagementEvent({
        activityId: OCSF_ACTIVITY.ENTITY_MANAGEMENT.UPDATE,
        message: 'User settings updated',
        entity: {
          type: 'UserSettings',
          id: 'settings-123',
        },
      });

      expect(event.typeUid).toBe(300403); // 3004 * 100 + 3
      expect(event.activityName).toBe('Update');
    });

    it('creates entity delete event', () => {
      const event = createEntityManagementEvent({
        activityId: OCSF_ACTIVITY.ENTITY_MANAGEMENT.DELETE,
        message: 'Discogs connection removed',
        entity: {
          type: 'DiscogsConnection',
          id: 'conn-456',
        },
      });

      expect(event.typeUid).toBe(300404); // 3004 * 100 + 4
      expect(event.activityName).toBe('Delete');
    });

    it('includes entityResult when provided', () => {
      const event = createEntityManagementEvent({
        activityId: 3,
        message: 'Entity updated',
        entity: { type: 'User', id: 'user-1' },
        entityResult: { type: 'User', id: 'user-1', name: 'Updated' },
      });

      expect(event.entityResult).toEqual({ type: 'User', id: 'user-1', name: 'Updated' });
    });

    it('handles entity with data', () => {
      const event = createEntityManagementEvent({
        activityId: 1,
        message: 'Stack created',
        entity: {
          type: 'Stack',
          id: 'stack-123',
          name: 'Living Room',
          data: { location: 'Home', recordCount: 50 },
        },
      });

      expect(event.resource?.data).toEqual({ location: 'Home', recordCount: 50 });
    });
  });

  describe('createApiActivityEvent', () => {
    it('creates API activity event for GET request', () => {
      const event = createApiActivityEvent({
        activityId: OCSF_ACTIVITY.API_ACTIVITY.READ,
        message: 'Collection fetched',
        api: {
          operation: 'GET',
          endpoint: '/api/collection/test-user',
          response: { statusCode: 200 },
        },
      });

      expect(event.classUid).toBe(OCSF_CLASS.API_ACTIVITY); // 6003
      expect(event.categoryUid).toBe(OCSF_CATEGORY.APPLICATION_ACTIVITY); // 6
      expect(event.typeUid).toBe(600302); // 6003 * 100 + 2
      expect(event.activityName).toBe('Read');
      expect(event.api.operation).toBe('GET');
      expect(event.api.endpoint).toBe('/api/collection/test-user');
    });

    it('creates API activity event for POST request', () => {
      const event = createApiActivityEvent({
        activityId: OCSF_ACTIVITY.API_ACTIVITY.CREATE,
        message: 'Settings updated',
        api: {
          operation: 'POST',
          endpoint: '/api/user/settings',
          request: { displayName: 'New Name' },
          response: { statusCode: 200 },
        },
      });

      expect(event.typeUid).toBe(600301); // 6003 * 100 + 1
      expect(event.activityName).toBe('Create');
      expect(event.api.request).toEqual({ displayName: 'New Name' });
    });

    it('creates API activity event for DELETE request', () => {
      const event = createApiActivityEvent({
        activityId: OCSF_ACTIVITY.API_ACTIVITY.DELETE,
        message: 'Album excluded',
        api: {
          operation: 'DELETE',
          endpoint: '/api/user/excluded-albums/123',
          response: { statusCode: 204 },
        },
      });

      expect(event.typeUid).toBe(600304); // 6003 * 100 + 4
      expect(event.activityName).toBe('Delete');
    });

    it('includes resources when provided', () => {
      const event = createApiActivityEvent({
        activityId: 2,
        message: 'Multiple albums fetched',
        api: { operation: 'GET', endpoint: '/api/collection/test' },
        resources: [
          { type: 'Album', id: '123', name: 'Abbey Road' },
          { type: 'Album', id: '456', name: 'Kind of Blue' },
        ],
      });

      expect(event.resources).toHaveLength(2);
      expect(event.resources?.[0]).toEqual({
        type: 'Album',
        id: '123',
        name: 'Abbey Road',
      });
    });

    it('handles failed API requests', () => {
      const event = createApiActivityEvent({
        activityId: 2,
        message: 'Collection not found',
        severityId: OCSF_SEVERITY.LOW,
        statusId: OCSF_STATUS.FAILURE,
        statusCode: '404',
        api: {
          operation: 'GET',
          endpoint: '/api/collection/nonexistent',
          response: { statusCode: 404 },
        },
      });

      expect(event.severityId).toBe(OCSF_SEVERITY.LOW);
      expect(event.statusId).toBe(OCSF_STATUS.FAILURE);
      expect(event.statusCode).toBe('404');
    });
  });

  describe('typeUid calculation', () => {
    it('follows OCSF formula: class_uid * 100 + activity_id', () => {
      const testCases = [
        { classUid: OCSF_CLASS.AUTHENTICATION, activityId: 1, expected: 300201 },
        { classUid: OCSF_CLASS.AUTHENTICATION, activityId: 2, expected: 300202 },
        { classUid: OCSF_CLASS.ACCOUNT_CHANGE, activityId: 1, expected: 300101 },
        { classUid: OCSF_CLASS.ACCOUNT_CHANGE, activityId: 5, expected: 300105 },
        { classUid: OCSF_CLASS.USER_ACCESS_MANAGEMENT, activityId: 1, expected: 300501 },
        { classUid: OCSF_CLASS.ENTITY_MANAGEMENT, activityId: 1, expected: 300401 },
        { classUid: OCSF_CLASS.API_ACTIVITY, activityId: 2, expected: 600302 },
      ];

      for (const { classUid, activityId, expected } of testCases) {
        expect(classUid * 100 + activityId).toBe(expected);
      }
    });
  });

  describe('rawData passthrough', () => {
    it('includes rawData in all event types', () => {
      const rawData = { custom: 'data', nested: { value: 123 } };

      const authEvent = createAuthenticationEvent({
        activityId: 1,
        message: 'test',
        rawData,
      });
      expect(authEvent.rawData).toEqual(rawData);

      const accountEvent = createAccountChangeEvent({
        activityId: 1,
        message: 'test',
        user: { userId: 'test' },
        rawData,
      });
      expect(accountEvent.rawData).toEqual(rawData);

      const accessEvent = createUserAccessEvent({
        activityId: 1,
        message: 'test',
        user: { userId: 'test' },
        privileges: [],
        rawData,
      });
      expect(accessEvent.rawData).toEqual(rawData);

      const entityEvent = createEntityManagementEvent({
        activityId: 1,
        message: 'test',
        entity: { type: 'Test' },
        rawData,
      });
      expect(entityEvent.rawData).toEqual(rawData);

      const apiEvent = createApiActivityEvent({
        activityId: 1,
        message: 'test',
        api: { operation: 'GET', endpoint: '/test' },
        rawData,
      });
      expect(apiEvent.rawData).toEqual(rawData);
    });
  });
});

describe('OCSF Constants', () => {
  describe('OCSF_CLASS', () => {
    it('has correct class UIDs', () => {
      expect(OCSF_CLASS.ACCOUNT_CHANGE).toBe(3001);
      expect(OCSF_CLASS.AUTHENTICATION).toBe(3002);
      expect(OCSF_CLASS.ENTITY_MANAGEMENT).toBe(3004);
      expect(OCSF_CLASS.USER_ACCESS_MANAGEMENT).toBe(3005);
      expect(OCSF_CLASS.API_ACTIVITY).toBe(6003);
    });
  });

  describe('OCSF_CATEGORY', () => {
    it('has correct category UIDs', () => {
      expect(OCSF_CATEGORY.IDENTITY_ACCESS_MANAGEMENT).toBe(3);
      expect(OCSF_CATEGORY.APPLICATION_ACTIVITY).toBe(6);
    });
  });

  describe('OCSF_SEVERITY', () => {
    it('has correct severity IDs', () => {
      expect(OCSF_SEVERITY.UNKNOWN).toBe(0);
      expect(OCSF_SEVERITY.INFORMATIONAL).toBe(1);
      expect(OCSF_SEVERITY.LOW).toBe(2);
      expect(OCSF_SEVERITY.MEDIUM).toBe(3);
      expect(OCSF_SEVERITY.HIGH).toBe(4);
      expect(OCSF_SEVERITY.CRITICAL).toBe(5);
      expect(OCSF_SEVERITY.FATAL).toBe(6);
      expect(OCSF_SEVERITY.OTHER).toBe(99);
    });
  });

  describe('OCSF_STATUS', () => {
    it('has correct status IDs', () => {
      expect(OCSF_STATUS.UNKNOWN).toBe(0);
      expect(OCSF_STATUS.SUCCESS).toBe(1);
      expect(OCSF_STATUS.FAILURE).toBe(2);
      expect(OCSF_STATUS.OTHER).toBe(99);
    });
  });

  describe('OCSF_ACTIVITY', () => {
    it('has correct authentication activity IDs', () => {
      expect(OCSF_ACTIVITY.AUTHENTICATION.LOGON).toBe(1);
      expect(OCSF_ACTIVITY.AUTHENTICATION.LOGOFF).toBe(2);
    });

    it('has correct account change activity IDs', () => {
      expect(OCSF_ACTIVITY.ACCOUNT_CHANGE.CREATE).toBe(1);
      expect(OCSF_ACTIVITY.ACCOUNT_CHANGE.DISABLE).toBe(5);
      expect(OCSF_ACTIVITY.ACCOUNT_CHANGE.DELETE).toBe(6);
    });

    it('has correct user access activity IDs', () => {
      expect(OCSF_ACTIVITY.USER_ACCESS_MANAGEMENT.ASSIGN_PRIVILEGES).toBe(1);
      expect(OCSF_ACTIVITY.USER_ACCESS_MANAGEMENT.REVOKE_PRIVILEGES).toBe(2);
    });

    it('has correct entity management activity IDs', () => {
      expect(OCSF_ACTIVITY.ENTITY_MANAGEMENT.CREATE).toBe(1);
      expect(OCSF_ACTIVITY.ENTITY_MANAGEMENT.READ).toBe(2);
      expect(OCSF_ACTIVITY.ENTITY_MANAGEMENT.UPDATE).toBe(3);
      expect(OCSF_ACTIVITY.ENTITY_MANAGEMENT.DELETE).toBe(4);
    });

    it('has correct API activity IDs', () => {
      expect(OCSF_ACTIVITY.API_ACTIVITY.CREATE).toBe(1);
      expect(OCSF_ACTIVITY.API_ACTIVITY.READ).toBe(2);
      expect(OCSF_ACTIVITY.API_ACTIVITY.UPDATE).toBe(3);
      expect(OCSF_ACTIVITY.API_ACTIVITY.DELETE).toBe(4);
    });
  });
});
