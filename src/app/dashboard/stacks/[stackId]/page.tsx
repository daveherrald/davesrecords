'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';

interface Stack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  defaultSort: string;
  qrCodeUrl: string | null;
  curators: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      displayName: string | null;
      email: string | null;
    };
  }>;
  _count: {
    records: number;
  };
}

interface StackRecord {
  id: string;
  releaseId: string;
  instanceId: string;
  notes: string | null;
  addedAt: string;
  userId: string;
  user: {
    id: string;
    displayName: string | null;
  };
}

export default function StackManagePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const stackId = params.stackId as string;

  const [stack, setStack] = useState<Stack | null>(null);
  const [records, setRecords] = useState<StackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: '',
    isPublic: 'true',
    defaultSort: '',
  });

  useEffect(() => {
    fetchStack();
    fetchRecords();
  }, [stackId]);

  const fetchStack = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stack/${stackId}`);
      if (response.ok) {
        const data = await response.json();
        setStack(data.stack);
        setFormData({
          name: data.stack.name,
          slug: data.stack.slug,
          description: data.stack.description || '',
          type: data.stack.type,
          isPublic: data.stack.isPublic ? 'true' : 'false',
          defaultSort: data.stack.defaultSort,
        });
      } else {
        router.push('/dashboard/stacks');
      }
    } catch (error) {
      console.error('Failed to fetch stack:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/stack/${stackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isPublic: formData.isPublic === 'true',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStack(data.stack);
        setEditing(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update stack');
      }
    } catch (error) {
      alert('Failed to update stack');
    } finally {
      setSaving(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await fetch(`/api/stack/${stackId}/records`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
      }
    } catch (error) {
      console.error('Failed to fetch stack records:', error);
    }
  };

  const handleRemoveRecord = async (instanceId: string) => {
    setRemoving((prev) => new Set(prev).add(instanceId));

    try {
      const response = await fetch(
        `/api/stack/${stackId}/records?instanceId=${instanceId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setRecords((prev) => prev.filter((r) => r.instanceId !== instanceId));
        // Update count
        if (stack) {
          setStack({
            ...stack,
            _count: { records: stack._count.records - 1 },
          });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove record');
      }
    } catch (error) {
      alert('Failed to remove record');
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(instanceId);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${stack?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/stack/${stackId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/stacks');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete stack');
      }
    } catch (error) {
      alert('Failed to delete stack');
    }
  };

  const userRole = stack?.curators.find((c) => c.role === 'OWNER')?.role || 'CURATOR';
  const isOwner = userRole === 'OWNER';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-4xl py-8">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!stack) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        {/* Header */}
        <div>
          <Link href="/dashboard/stacks">
            <Button variant="ghost" className="text-neutral-300 hover:text-white mb-2">
              ← Back to Stacks
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">{stack.name}</h1>
              <p className="text-neutral-300 mt-2">
                {stack._count.records} records • {stack.curators.length} curator
                {stack.curators.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/s/${stack.slug}`} target="_blank">
                <Button variant="outline">
                  View Public Page
                </Button>
              </Link>
              <Link href={`/dashboard/stacks/${stackId}/qr`}>
                <Button variant="outline">
                  QR Code
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Stack Settings</CardTitle>
                <CardDescription>Manage your stack configuration</CardDescription>
              </div>
              {!editing && (
                <Button onClick={() => setEditing(true)} variant="outline">
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">URL Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '-')
                          .replace(/^-|-$/g, ''),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONAL">Personal</SelectItem>
                        <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                        <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Visibility</label>
                    <Select
                      value={formData.isPublic}
                      onValueChange={(value) =>
                        setFormData({ ...formData, isPublic: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Public</SelectItem>
                        <SelectItem value="false">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: stack.name,
                        slug: stack.slug,
                        description: stack.description || '',
                        type: stack.type,
                        isPublic: stack.isPublic ? 'true' : 'false',
                        defaultSort: stack.defaultSort,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-neutral-400">Public URL:</span>{' '}
                  <span className="text-white">/s/{stack.slug}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Type:</span>{' '}
                  <span className="text-white">{stack.type}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Visibility:</span>{' '}
                  <span className="text-white">{stack.isPublic ? 'Public' : 'Private'}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Default Sort:</span>{' '}
                  <span className="text-white">{stack.defaultSort}</span>
                </div>
                {stack.description && (
                  <div>
                    <span className="text-neutral-400">Description:</span>{' '}
                    <span className="text-white">{stack.description}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Records Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Records</CardTitle>
                <CardDescription>
                  Albums in this stack ({stack._count.records})
                </CardDescription>
              </div>
              <Link href={`/dashboard/stacks/${stackId}/add-records`}>
                <Button>Add Records</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <p>No records in this stack yet.</p>
                <p className="text-sm mt-2">Click "Add Records" to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.slice(0, 10).map((record) => {
                  const isRemoving = removing.has(record.instanceId);
                  const canRemove =
                    session?.user?.id === record.userId ||
                    isOwner;

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50"
                    >
                      <div className="flex-1">
                        <p className="text-white text-sm">Release ID: {record.releaseId}</p>
                        <p className="text-xs text-neutral-400">
                          Added by {record.user.displayName || 'Unknown'} on{' '}
                          {new Date(record.addedAt).toLocaleDateString()}
                        </p>
                        {record.notes && (
                          <p className="text-xs text-neutral-300 mt-1">{record.notes}</p>
                        )}
                      </div>
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRecord(record.instanceId)}
                          disabled={isRemoving}
                        >
                          {isRemoving ? 'Removing...' : 'Remove'}
                        </Button>
                      )}
                    </div>
                  );
                })}
                {records.length > 10 && (
                  <p className="text-center text-sm text-neutral-400 pt-4">
                    Showing 10 of {records.length} records
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Curators Card */}
        <Card>
          <CardHeader>
            <CardTitle>Curators</CardTitle>
            <CardDescription>People who can manage this stack</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stack.curators.map((curator) => (
                <div
                  key={curator.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50"
                >
                  <div>
                    <p className="font-medium text-white">
                      {curator.user.displayName || curator.user.email}
                    </p>
                    <p className="text-xs text-neutral-400">{curator.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isOwner && (
          <Card className="border-red-900/50">
            <CardHeader>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Stack
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
