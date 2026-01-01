'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  email: string | null;
  name: string | null;
  publicSlug: string | null;
  displayName: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  hasDiscogsConnection: boolean;
  discogsUsername: string | null;
  sessionCount: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED' | 'SUSPENDED'>('ALL');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(search && { search }),
          ...(roleFilter !== 'ALL' && { role: roleFilter }),
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
        });

        const response = await fetch(`/api/admin/users?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [pagination.page, search, roleFilter, statusFilter]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value as 'ALL' | 'USER' | 'ADMIN');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as 'ALL' | 'ACTIVE' | 'BANNED' | 'SUSPENDED');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="mt-2 text-neutral-400">Manage user accounts and permissions</p>
      </div>

      {/* Filters */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-neutral-400 mb-2 block">Search</label>
              <Input
                placeholder="Search by name, email, or slug..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-400 mb-2 block">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                <option value="ALL">All Roles</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-400 mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="BANNED">Banned</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-neutral-700" />
          ))}
        </div>
      ) : error ? (
        <Card className="bg-red-500/10 border-red-500/50">
          <CardContent className="pt-6">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardContent className="pt-6">
            <p className="text-center text-neutral-400">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {users.map((user) => (
              <Link key={user.id} href={`/admin/users/${user.id}`}>
                <Card className="bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {user.displayName || user.name || 'Unnamed User'}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              user.role === 'ADMIN'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-neutral-700 text-neutral-300'
                            }`}
                          >
                            {user.role}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              user.status === 'ACTIVE'
                                ? 'bg-green-500/20 text-green-400'
                                : user.status === 'BANNED'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {user.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-400">{user.email}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-400">
                          <span>Slug: {user.publicSlug}</span>
                          {user.hasDiscogsConnection && (
                            <span className="text-green-400">
                              Discogs: {user.discogsUsername}
                            </span>
                          )}
                          <span>Sessions: {user.sessionCount}</span>
                          <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        {user.status === 'BANNED' && user.bannedReason && (
                          <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
                            <p className="text-sm text-red-400">
                              <strong>Banned:</strong> {user.bannedReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                >
                  Previous
                </button>
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
