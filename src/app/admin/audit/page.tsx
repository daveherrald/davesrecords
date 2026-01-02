'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  description: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string | null;
    publicSlug: string | null;
  };
  targetUser: {
    id: string;
    name: string | null;
    email: string | null;
    publicSlug: string | null;
  } | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(selectedAction !== 'ALL' && { action: selectedAction }),
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
  }, [pagination.page, selectedAction]);

  const handleActionFilter = (value: string) => {
    setSelectedAction(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'USER_PROMOTE':
        return 'bg-blue-500/20 text-blue-400';
      case 'USER_DEMOTE':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'USER_BAN':
        return 'bg-red-500/20 text-red-400';
      case 'USER_UNBAN':
        return 'bg-green-500/20 text-green-400';
      case 'USER_DELETE':
        return 'bg-red-600/20 text-red-500';
      case 'USER_EDIT':
        return 'bg-neutral-600/20 text-neutral-300';
      default:
        return 'bg-neutral-700/20 text-neutral-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Audit Log</h1>
        <p className="mt-2 text-neutral-400">Complete history of administrative actions</p>
      </div>

      {/* Filters */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-400">Filter by Action:</label>
            <select
              value={selectedAction}
              onChange={(e) => handleActionFilter(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            >
              <option value="ALL">All Actions</option>
              <option value="USER_PROMOTE">User Promote</option>
              <option value="USER_DEMOTE">User Demote</option>
              <option value="USER_BAN">User Ban</option>
              <option value="USER_UNBAN">User Unban</option>
              <option value="USER_DELETE">User Delete</option>
              <option value="USER_EDIT">User Edit</option>
              <option value="SETTINGS_VIEW">Settings View</option>
              <option value="ANALYTICS_VIEW">Analytics View</option>
            </select>
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
            <p className="text-center text-neutral-400">No audit logs found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id} className="bg-neutral-800/50 border-neutral-700">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-neutral-400">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-white mb-2">{log.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-neutral-400">
                        <div>
                          <span className="font-medium">Admin:</span>{' '}
                          <Link
                            href={`/admin/users/${log.admin.id}`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {log.admin.name || log.admin.email}
                          </Link>
                        </div>
                        {log.targetUser && (
                          <div>
                            <span className="font-medium">Target:</span>{' '}
                            <Link
                              href={`/admin/users/${log.targetUser.id}`}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              {log.targetUser.name || log.targetUser.email}
                            </Link>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Resource:</span> {log.resource}
                        </div>
                        {log.ipAddress && (
                          <div>
                            <span className="font-medium">IP:</span> {log.ipAddress}
                          </div>
                        )}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-300">
                            View metadata
                          </summary>
                          <pre className="mt-2 rounded-lg bg-neutral-900 p-3 text-xs text-neutral-300 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
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
