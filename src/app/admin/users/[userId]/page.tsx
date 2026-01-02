'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  email: string | null;
  name: string | null;
  publicSlug: string | null;
  displayName: string | null;
  bio: string | null;
  isPublic: boolean;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  bannedAt: string | null;
  bannedReason: string | null;
  bannedBy: string | null;
  createdAt: string;
  updatedAt: string;
  hasDiscogsConnection: boolean;
  discogsConnection: {
    discogsUsername: string;
    discogsId: string;
    connectedAt: string;
  } | null;
  actionCounts: {
    performed: number;
    received: number;
    sessions: number;
  };
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Action states
  const [banReason, setBanReason] = useState('');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${userId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user');
        }

        const data = await response.json();
        setUser(data);

        // Populate edit form
        setDisplayName(data.displayName || '');
        setBio(data.bio || '');
        setPublicSlug(data.publicSlug || '');
        setIsPublic(data.isPublic);
      } catch (err) {
        console.error('Error fetching user:', err);
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(`${errorMsg} (User ID: ${userId})`);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleSaveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName,
          bio,
          publicSlug,
          isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      alert('User settings updated successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async () => {
    if (!user || !confirm(`Promote ${user.email} to ADMIN?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: 'ADMIN' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to promote user');
      }

      const data = await response.json();
      setUser(data.user);
      alert('User promoted to ADMIN');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to promote user');
    }
  };

  const handleDemote = async () => {
    if (!user || !confirm(`Demote ${user.email} to USER?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: 'USER' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to demote user');
      }

      const data = await response.json();
      setUser(data.user);
      alert('User demoted to USER');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to demote user');
    }
  };

  const handleBan = async () => {
    if (!user || !banReason.trim()) {
      alert('Please provide a ban reason');
      return;
    }

    if (!confirm(`Ban ${user.email}? All sessions will be terminated.`)) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: banReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to ban user');
      }

      const data = await response.json();
      setUser(data.user);
      setBanReason('');
      alert('User banned successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to ban user');
    }
  };

  const handleUnban = async () => {
    if (!user || !confirm(`Unban ${user.email}?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unban user');
      }

      const data = await response.json();
      setUser(data.user);
      alert('User unbanned successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unban user');
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (deleteConfirmEmail !== user.email) {
      alert('Email confirmation does not match');
      return;
    }

    if (
      !confirm(
        `PERMANENTLY DELETE ${user.email}? This action cannot be undone. All user data will be lost.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      alert('User deleted successfully');
      router.push('/admin/users');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-neutral-700" />
        <Skeleton className="h-64 w-full bg-neutral-700" />
        <Skeleton className="h-64 w-full bg-neutral-700" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <Card className="bg-red-500/10 border-red-500/50">
        <CardContent className="pt-6">
          <p className="text-red-400">{error || 'User not found'}</p>
          <Link href="/admin/users" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
            ← Back to Users
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/users" className="text-sm text-blue-400 hover:text-blue-300 mb-2 inline-block">
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-white">{user.displayName || user.name || 'Unnamed User'}</h1>
          <p className="mt-1 text-neutral-400">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              user.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-700 text-neutral-300'
            }`}
          >
            {user.role}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
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
      </div>

      {/* Ban Warning */}
      {user.status === 'BANNED' && (
        <Card className="bg-red-500/10 border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-400">User is Banned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-300">
              <strong>Reason:</strong> {user.bannedReason}
            </p>
            <p className="text-sm text-red-300 mt-1">
              <strong>Banned at:</strong> {user.bannedAt && new Date(user.bannedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* User Information */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-400">User ID:</span>
              <p className="text-white font-mono">{user.id}</p>
            </div>
            <div>
              <span className="text-neutral-400">Public Slug:</span>
              <p className="text-white">{user.publicSlug}</p>
            </div>
            <div>
              <span className="text-neutral-400">Created:</span>
              <p className="text-white">{new Date(user.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-neutral-400">Last Updated:</span>
              <p className="text-white">{new Date(user.updatedAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-neutral-400">Active Sessions:</span>
              <p className="text-white">{user.actionCounts.sessions}</p>
            </div>
            <div>
              <span className="text-neutral-400">Visibility:</span>
              <p className="text-white">{user.isPublic ? 'Public' : 'Private'}</p>
            </div>
          </div>

          {user.discogsConnection && (
            <div className="mt-4 pt-4 border-t border-neutral-700">
              <h4 className="text-sm font-medium text-white mb-2">Discogs Connection</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-400">Username:</span>
                  <p className="text-white">{user.discogsConnection.discogsUsername}</p>
                </div>
                <div>
                  <span className="text-neutral-400">Connected:</span>
                  <p className="text-white">
                    {new Date(user.discogsConnection.connectedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Settings */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Edit User Settings</CardTitle>
          <CardDescription className="text-neutral-400">Update user profile and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-400 mb-2 block">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-400 mb-2 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-400 mb-2 block">Public Slug</label>
            <Input
              value={publicSlug}
              onChange={(e) => setPublicSlug(e.target.value)}
              className="bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="isPublic" className="text-sm text-neutral-400">
              Make collection public
            </label>
          </div>
          <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-red-500/10 border-red-500/50">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription className="text-red-300">Irreversible administrative actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Management */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Role Management</h4>
            <div className="flex gap-2">
              {user.role === 'USER' ? (
                <Button onClick={handlePromote} variant="outline" className="border-blue-500 text-blue-400">
                  Promote to Admin
                </Button>
              ) : (
                <Button onClick={handleDemote} variant="outline" className="border-yellow-500 text-yellow-400">
                  Demote to User
                </Button>
              )}
            </div>
          </div>

          {/* Ban/Unban */}
          <div className="pt-4 border-t border-red-500/30">
            <h4 className="text-sm font-medium text-white mb-3">Ban User</h4>
            {user.status === 'BANNED' ? (
              <Button onClick={handleUnban} variant="outline" className="border-green-500 text-green-400">
                Unban User
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Ban reason..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="bg-neutral-900 border-red-500/50 text-white"
                />
                <Button onClick={handleBan} variant="outline" className="border-red-500 text-red-400">
                  Ban User
                </Button>
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="pt-4 border-t border-red-500/30">
            <h4 className="text-sm font-medium text-white mb-3">Delete User</h4>
            <p className="text-sm text-red-300 mb-3">
              This will permanently delete the user and all associated data. This action cannot be undone.
            </p>
            <Input
              placeholder={`Type "${user.email}" to confirm deletion`}
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              className="bg-neutral-900 border-red-500/50 text-white mb-3"
            />
            <Button
              onClick={handleDelete}
              disabled={deleteConfirmEmail !== user.email}
              variant="outline"
              className="border-red-600 text-red-500 disabled:opacity-50"
            >
              Permanently Delete User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
