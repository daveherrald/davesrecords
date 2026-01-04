'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// OCSF Event from the new audit system
interface AuditEvent {
  id: string;
  classUid: number;
  categoryUid: number;
  activityId: number;
  typeUid: number;
  severityId: number;
  className: string;
  activityName: string;
  categoryName: string;
  message: string;
  statusId: number;
  statusCode: string | null;
  statusDetail: string | null;
  time: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  actorRole: string | null;
  targetUserId: string | null;
  targetEmail: string | null;
  targetName: string | null;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  resourceData: Record<string, unknown> | null;
  srcIpAddress: string | null;
  srcUserAgent: string | null;
  apiOperation: string | null;
  apiEndpoint: string | null;
  metadata: Record<string, unknown> | null;
  rawData: Record<string, unknown> | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// OCSF Class options
const CLASS_OPTIONS = [
  { value: 'ALL', label: 'All Classes' },
  { value: '3002', label: 'Authentication (3002)' },
  { value: '3001', label: 'Account Change (3001)' },
  { value: '3005', label: 'User Access Management (3005)' },
  { value: '3004', label: 'Entity Management (3004)' },
  { value: '6003', label: 'API Activity (6003)' },
];

// OCSF Severity options
const SEVERITY_OPTIONS = [
  { value: 'ALL', label: 'All Severities' },
  { value: '1', label: 'Informational' },
  { value: '2', label: 'Low' },
  { value: '3', label: 'Medium' },
  { value: '4', label: 'High' },
  { value: '5', label: 'Critical' },
];

// OCSF Status options
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: '1', label: 'Success' },
  { value: '2', label: 'Failure' },
];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(selectedClass !== 'ALL' && { classUid: selectedClass }),
          ...(selectedSeverity !== 'ALL' && { severityId: selectedSeverity }),
          ...(selectedStatus !== 'ALL' && { statusId: selectedStatus }),
        });

        const response = await fetch(`/api/admin/audit?${params}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }

        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [pagination.page, selectedClass, selectedSeverity, selectedStatus]);

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getClassColor = (classUid: number) => {
    switch (classUid) {
      case 3002: // Authentication
        return 'bg-blue-500/20 text-blue-400';
      case 3001: // Account Change
        return 'bg-purple-500/20 text-purple-400';
      case 3005: // User Access Management
        return 'bg-orange-500/20 text-orange-400';
      case 3004: // Entity Management
        return 'bg-cyan-500/20 text-cyan-400';
      case 6003: // API Activity
        return 'bg-neutral-500/20 text-neutral-400';
      default:
        return 'bg-neutral-700/20 text-neutral-400';
    }
  };

  const getSeverityColor = (severityId: number) => {
    switch (severityId) {
      case 1:
        return 'text-blue-400'; // Informational
      case 2:
        return 'text-green-400'; // Low
      case 3:
        return 'text-yellow-400'; // Medium
      case 4:
        return 'text-orange-400'; // High
      case 5:
        return 'text-red-400'; // Critical
      case 6:
        return 'text-red-600'; // Fatal
      default:
        return 'text-neutral-400';
    }
  };

  const getSeverityLabel = (severityId: number) => {
    switch (severityId) {
      case 1:
        return 'Info';
      case 2:
        return 'Low';
      case 3:
        return 'Medium';
      case 4:
        return 'High';
      case 5:
        return 'Critical';
      case 6:
        return 'Fatal';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (statusId: number) => {
    switch (statusId) {
      case 1:
        return { icon: '\u2713', color: 'text-green-400' }; // Success checkmark
      case 2:
        return { icon: '\u2717', color: 'text-red-400' }; // Failure X
      default:
        return { icon: '?', color: 'text-neutral-400' }; // Unknown
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Audit Log</h1>
        <p className="mt-2 text-neutral-400">OCSF-compliant security event log</p>
      </div>

      {/* Filters */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Event Class</label>
              <select
                value={selectedClass}
                onChange={(e) => handleFilterChange(setSelectedClass)(e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                {CLASS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => handleFilterChange(setSelectedSeverity)(e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => handleFilterChange(setSelectedStatus)(e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-neutral-700" />
          ))}
        </div>
      ) : error ? (
        <Card className="bg-red-500/10 border-red-500/50">
          <CardContent className="pt-6">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardContent className="pt-6">
            <p className="text-center text-neutral-400">No audit events found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map((log) => {
              const status = getStatusIcon(log.statusId);
              return (
                <Card key={log.id} className="bg-neutral-800/50 border-neutral-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Status indicator */}
                          <span className={`text-lg ${status.color}`}>{status.icon}</span>
                          {/* Class badge */}
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getClassColor(log.classUid)}`}>
                            {log.className}
                          </span>
                          {/* Activity name */}
                          <span className="text-xs text-neutral-300">{log.activityName}</span>
                          {/* Severity */}
                          <span className={`text-xs font-medium ${getSeverityColor(log.severityId)}`}>
                            {getSeverityLabel(log.severityId)}
                          </span>
                          {/* Timestamp */}
                          <span className="text-xs text-neutral-500">{new Date(log.time).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-white mb-2">{log.message}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-neutral-400">
                          {log.actorUserId && (
                            <div>
                              <span className="font-medium">Actor:</span>{' '}
                              <Link href={`/admin/users/${log.actorUserId}`} className="text-blue-400 hover:text-blue-300">
                                {log.actorName || log.actorEmail || 'Unknown'}
                              </Link>
                              {log.actorRole && <span className="text-neutral-500"> ({log.actorRole})</span>}
                            </div>
                          )}
                          {log.targetUserId && (
                            <div>
                              <span className="font-medium">Target:</span>{' '}
                              <Link
                                href={`/admin/users/${log.targetUserId}`}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                {log.targetName || log.targetEmail || 'Unknown'}
                              </Link>
                            </div>
                          )}
                          {log.resourceType && (
                            <div>
                              <span className="font-medium">Resource:</span> {log.resourceType}
                              {log.resourceId && <span className="text-neutral-500"> ({log.resourceId})</span>}
                            </div>
                          )}
                          {log.srcIpAddress && (
                            <div>
                              <span className="font-medium">IP:</span> {log.srcIpAddress}
                            </div>
                          )}
                          {log.apiEndpoint && (
                            <div>
                              <span className="font-medium">API:</span>{' '}
                              <span className="text-cyan-400">
                                {log.apiOperation} {log.apiEndpoint}
                              </span>
                            </div>
                          )}
                        </div>
                        {log.statusDetail && (
                          <p className="mt-2 text-xs text-red-400">Error: {log.statusDetail}</p>
                        )}
                        {/* Expandable metadata */}
                        {(log.rawData || log.metadata) && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-300">
                              View metadata
                            </summary>
                            <pre className="mt-2 rounded-lg bg-neutral-900 p-3 text-xs text-neutral-300 overflow-x-auto">
                              {JSON.stringify(log.rawData || log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 text-sm text-neutral-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
