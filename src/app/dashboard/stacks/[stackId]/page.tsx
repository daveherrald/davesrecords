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
import AlbumDetail from '@/components/collection/AlbumDetail';
import type { Album } from '@/types/discogs';

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

interface EnrichedRecord extends StackRecord {
  album?: Album;
}

export default function StackManagePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const stackId = params.stackId as string;

  const [stack, setStack] = useState<Stack | null>(null);
  const [records, setRecords] = useState<EnrichedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Set<string>>(new Set());
  const [notesValues, setNotesValues] = useState<Record<string, string>>({});
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const recordsData = data.records;

        // Fetch album details for each record
        const enrichedRecords = await Promise.all(
          recordsData.map(async (record: StackRecord) => {
            try {
              const albumResponse = await fetch(`/api/release/${record.releaseId}`);
              if (albumResponse.ok) {
                const albumData = await albumResponse.json();
                return {
                  ...record,
                  album: albumData,
                };
              }
            } catch (err) {
              console.error(`Failed to fetch album ${record.releaseId}:`, err);
            }
            return record;
          })
        );

        setRecords(enrichedRecords);

        // Initialize notes values
        const notesMap: Record<string, string> = {};
        enrichedRecords.forEach((record) => {
          notesMap[record.instanceId] = record.notes || '';
        });
        setNotesValues(notesMap);
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

  const handleEditNotes = (instanceId: string) => {
    setEditingNotes((prev) => new Set(prev).add(instanceId));
  };

  const handleSaveNotes = async (instanceId: string, releaseId: string) => {
    try {
      const response = await fetch(`/api/stack/${stackId}/records`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          releaseId,
          notes: notesValues[instanceId],
        }),
      });

      if (response.ok) {
        setRecords((prev) =>
          prev.map((r) =>
            r.instanceId === instanceId
              ? { ...r, notes: notesValues[instanceId] }
              : r
          )
        );
        setEditingNotes((prev) => {
          const next = new Set(prev);
          next.delete(instanceId);
          return next;
        });
      } else {
        alert('Failed to save notes');
      }
    } catch (error) {
      alert('Failed to save notes');
    }
  };

  const handleCancelEditNotes = (instanceId: string, originalNotes: string | null) => {
    setNotesValues((prev) => ({
      ...prev,
      [instanceId]: originalNotes || '',
    }));
    setEditingNotes((prev) => {
      const next = new Set(prev);
      next.delete(instanceId);
      return next;
    });
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
        <div className="mx-auto max-w-4xl py-8">
          <p className="text-white">Stack not found</p>
        </div>
      </div>
    );
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
              <div className="flex gap-2">
                <div className="flex gap-1 border border-neutral-700 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7 px-2"
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-7 px-2"
                  >
                    List
                  </Button>
                </div>
                <Link href={`/dashboard/stacks/${stackId}/add-records`}>
                  <Button>Add Records</Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <p>No records in this stack yet.</p>
                <p className="text-sm mt-2">Click "Add Records" to get started.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {records.map((record) => {
                  const isRemoving = removing.has(record.instanceId);
                  const canRemove = session?.user?.id === record.userId || isOwner;
                  const isEditingNote = editingNotes.has(record.instanceId);

                  return (
                    <div key={record.id} className="group relative">
                      <div
                        className="aspect-square relative bg-neutral-800 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => record.album && setSelectedAlbum(record.album.id)}
                      >
                        {record.album ? (
                          <>
                            <Image
                              src={record.album.thumbnail || record.album.coverImage || '/placeholder-album.png'}
                              alt={`${record.album.artist} - ${record.album.title}`}
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-xs font-semibold text-white line-clamp-1">
                                  {record.album.artist}
                                </p>
                                <p className="text-xs text-neutral-200 line-clamp-1">
                                  {record.album.title}
                                </p>
                                <p className="text-xs text-neutral-300">
                                  {record.album.year}
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-neutral-600">
                            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {canRemove && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecord(record.instanceId);
                          }}
                          disabled={isRemoving}
                        >
                          ×
                        </Button>
                      )}
                      {record.notes && !isEditingNote && (
                        <div className="mt-1 p-1 text-xs text-neutral-400 line-clamp-2">
                          {record.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((record) => {
                  const isRemoving = removing.has(record.instanceId);
                  const canRemove = session?.user?.id === record.userId || isOwner;
                  const isEditingNote = editingNotes.has(record.instanceId);

                  return (
                    <div
                      key={record.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors"
                    >
                      {record.album && (
                        <div
                          className="w-16 h-16 relative flex-shrink-0 rounded overflow-hidden cursor-pointer"
                          onClick={() => setSelectedAlbum(record.album!.id)}
                        >
                          <Image
                            src={record.album.thumbnail || record.album.coverImage || '/placeholder-album.png'}
                            alt={`${record.album.artist} - ${record.album.title}`}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {record.album ? (
                          <>
                            <p className="text-white font-medium truncate">
                              {record.album.title}
                            </p>
                            <p className="text-sm text-neutral-400 truncate">
                              {record.album.artist}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {record.album.year} • {record.album.format}
                            </p>
                          </>
                        ) : (
                          <p className="text-white text-sm">Release ID: {record.releaseId}</p>
                        )}
                        <p className="text-xs text-neutral-500 mt-1">
                          Added by {record.user.displayName || 'Unknown'} on{' '}
                          {new Date(record.addedAt).toLocaleDateString()}
                        </p>
                        {isEditingNote ? (
                          <div className="mt-2 space-y-2">
                            <Input
                              value={notesValues[record.instanceId] || ''}
                              onChange={(e) =>
                                setNotesValues((prev) => ({
                                  ...prev,
                                  [record.instanceId]: e.target.value,
                                }))
                              }
                              placeholder="Add notes about this record..."
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(record.instanceId, record.releaseId)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelEditNotes(record.instanceId, record.notes)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {record.notes ? (
                              <p className="text-sm text-neutral-300">{record.notes}</p>
                            ) : (
                              <p className="text-xs text-neutral-500 italic">No notes</p>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs mt-1 h-6 px-2"
                              onClick={() => handleEditNotes(record.instanceId)}
                            >
                              Edit notes
                            </Button>
                          </div>
                        )}
                      </div>
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRecord(record.instanceId)}
                          disabled={isRemoving}
                          className="text-red-400 hover:text-red-300"
                        >
                          {isRemoving ? 'Removing...' : 'Remove'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Album Detail Modal */}
        {selectedAlbum && (
          <AlbumDetail
            albumId={selectedAlbum}
            onClose={() => setSelectedAlbum(null)}
          />
        )}

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
